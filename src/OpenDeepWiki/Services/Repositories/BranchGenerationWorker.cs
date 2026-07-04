using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Services.Repositories;

public sealed class BranchGenerationWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<BranchGenerationWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Branch generation worker started. Polling interval: {PollingInterval}s", PollingInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingTasksAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Branch generation polling failed");
            }

            await Task.Delay(PollingInterval, stoppingToken);
        }
    }

    private async Task ProcessPendingTasksAsync(CancellationToken stoppingToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IContext>();
        var branchProcessor = scope.ServiceProvider.GetRequiredService<IRepositoryBranchProcessor>();
        var lockService = scope.ServiceProvider.GetRequiredService<IRepositoryGenerationLockService>();
        var processingLogService = scope.ServiceProvider.GetService<IProcessingLogService>();

        var pendingTasks = await context.BranchGenerationTasks
            .Where(item => !item.IsDeleted && item.Status == BranchGenerationTaskStatus.Pending)
            .OrderByDescending(item => item.Priority)
            .ThenBy(item => item.CreatedAt)
            .Take(10)
            .ToListAsync(stoppingToken);

        foreach (var task in pendingTasks)
        {
            stoppingToken.ThrowIfCancellationRequested();
            await ProcessTaskAsync(context, branchProcessor, lockService, processingLogService, task, stoppingToken);
        }
    }

    private async Task ProcessTaskAsync(
        IContext context,
        IRepositoryBranchProcessor branchProcessor,
        IRepositoryGenerationLockService lockService,
        IProcessingLogService? processingLogService,
        BranchGenerationTask task,
        CancellationToken stoppingToken)
    {
        var lockAcquired = await lockService.TryAcquireAsync(
            context,
            task.RepositoryId,
            RepositoryGenerationLockOwnerType.BranchTask,
            task.Id,
            RepositoryGenerationLockScope.Branch,
            stoppingToken);

        if (!lockAcquired)
        {
            logger.LogInformation(
                "Branch generation task is blocked by repository lock. TaskId: {TaskId}, RepositoryId: {RepositoryId}",
                task.Id, task.RepositoryId);
            return;
        }

        try
        {
            var repository = await context.Repositories
                .FirstOrDefaultAsync(item => item.Id == task.RepositoryId && !item.IsDeleted, stoppingToken);
            var branch = await context.RepositoryBranches
                .FirstOrDefaultAsync(item => item.Id == task.BranchId && item.RepositoryId == task.RepositoryId && !item.IsDeleted, stoppingToken);

            if (repository is null || branch is null)
            {
                throw new InvalidOperationException($"Repository or branch not found. RepositoryId: {task.RepositoryId}, BranchId: {task.BranchId}");
            }

            task.Status = BranchGenerationTaskStatus.Processing;
            task.StartedAt = DateTime.UtcNow;
            task.CompletedAt = null;
            task.ErrorMessage = null;
            task.UpdateTimestamp();

            branch.GenerationStatus = BranchGenerationTaskStatus.Processing;
            branch.LastGenerationTaskId = task.Id;
            branch.LastGenerationError = null;
            branch.LastGenerationStartedAt = task.StartedAt;
            branch.LastGenerationCompletedAt = null;
            branch.UpdateTimestamp();

            await context.SaveChangesAsync(stoppingToken);

            if (processingLogService is not null)
            {
                await processingLogService.LogAsync(
                    task.RepositoryId,
                    task.BranchId,
                    task.Id,
                    ProcessingStep.Workspace,
                    $"Starting branch full generation: {branch.BranchName}",
                    cancellationToken: stoppingToken);
            }

            var targetCommitId = await branchProcessor.ProcessBranchAsync(
                context,
                repository,
                branch,
                task.Id,
                forceFullGeneration: true,
                stoppingToken);

            task.TargetCommitId = targetCommitId;
            task.Status = BranchGenerationTaskStatus.Completed;
            task.CompletedAt = DateTime.UtcNow;
            task.UpdateTimestamp();

            branch.GenerationStatus = BranchGenerationTaskStatus.Completed;
            branch.LastGenerationTaskId = task.Id;
            branch.LastGenerationError = null;
            branch.LastGenerationCompletedAt = task.CompletedAt;
            branch.UpdateTimestamp();

            await context.SaveChangesAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Branch generation task failed. TaskId: {TaskId}", task.Id);

            task.Status = BranchGenerationTaskStatus.Failed;
            task.ErrorMessage = ex.Message;
            task.CompletedAt = DateTime.UtcNow;
            task.RetryCount++;
            task.UpdateTimestamp();

            var branch = await context.RepositoryBranches
                .FirstOrDefaultAsync(item => item.Id == task.BranchId && !item.IsDeleted, CancellationToken.None);

            if (branch is not null)
            {
                branch.GenerationStatus = BranchGenerationTaskStatus.Failed;
                branch.LastGenerationTaskId = task.Id;
                branch.LastGenerationError = ex.Message;
                branch.LastGenerationCompletedAt = task.CompletedAt;
                branch.UpdateTimestamp();
            }

            if (processingLogService is not null)
            {
                await processingLogService.LogAsync(
                    task.RepositoryId,
                    task.BranchId,
                    task.Id,
                    ProcessingStep.Content,
                    $"Branch generation failed: {ex.Message}",
                    cancellationToken: CancellationToken.None);
            }

            await context.SaveChangesAsync(CancellationToken.None);
        }
        finally
        {
            await lockService.ReleaseAsync(
                context,
                task.RepositoryId,
                RepositoryGenerationLockOwnerType.BranchTask,
                task.Id,
                CancellationToken.None);
        }
    }
}
