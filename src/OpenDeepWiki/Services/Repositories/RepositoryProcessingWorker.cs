using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Services.Repositories;

public class RepositoryProcessingWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<RepositoryProcessingWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Repository processing loop failed.");
            }

            await Task.Delay(PollingInterval, stoppingToken);
        }
    }

    private async Task ProcessPendingAsync(CancellationToken stoppingToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetService<IContext>();

        if (context is null)
        {
            logger.LogWarning("IContext is not registered, skip repository processing.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var repository = await context.Repositories
                .OrderBy(item => item.CreatedAt)
                .FirstOrDefaultAsync(item => item.Status == RepositoryStatus.Pending, stoppingToken);

            if (repository is null)
            {
                break;
            }

            repository.Status = RepositoryStatus.Processing;
            repository.UpdateTimestamp();
            context.Repositories.Update(repository);
            await context.SaveChangesAsync(stoppingToken);

            try
            {
                await AnalyzeRepositoryAsync(repository, stoppingToken);
                await GenerateWikiAsync(repository, stoppingToken);

                repository.Status = RepositoryStatus.Completed;
            }
            catch (Exception ex)
            {
                repository.Status = RepositoryStatus.Failed;
                logger.LogError(ex, "Repository processing failed for {RepositoryId}.", repository.Id);
            }

            repository.UpdateTimestamp();
            await context.SaveChangesAsync(stoppingToken);
        }
    }

    private static Task AnalyzeRepositoryAsync(Repository repository, CancellationToken stoppingToken)
    {
        return Task.CompletedTask;
    }

    private static Task GenerateWikiAsync(Repository repository, CancellationToken stoppingToken)
    {
        return Task.CompletedTask;
    }
}
