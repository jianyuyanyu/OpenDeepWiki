using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Wiki;

namespace OpenDeepWiki.Services.Repositories;

/// <summary>
/// Background worker that processes pending repositories.
/// Polls for pending repositories and generates wiki content using AI.
/// </summary>
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
        var repositoryAnalyzer = scope.ServiceProvider.GetService<IRepositoryAnalyzer>();
        var wikiGenerator = scope.ServiceProvider.GetService<IWikiGenerator>();

        if (context is null)
        {
            logger.LogWarning("IContext is not registered, skip repository processing.");
            return;
        }

        if (repositoryAnalyzer is null)
        {
            logger.LogWarning("IRepositoryAnalyzer is not registered, skip repository processing.");
            return;
        }

        if (wikiGenerator is null)
        {
            logger.LogWarning("IWikiGenerator is not registered, skip repository processing.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            // Get the oldest pending repository (ordered by creation time)
            var repository = await context.Repositories
                .OrderBy(item => item.CreatedAt)
                .FirstOrDefaultAsync(item => item.Status == RepositoryStatus.Pending, stoppingToken);

            if (repository is null)
            {
                break;
            }

            // Transition to Processing status
            repository.Status = RepositoryStatus.Processing;
            repository.UpdateTimestamp();
            context.Repositories.Update(repository);
            await context.SaveChangesAsync(stoppingToken);

            logger.LogInformation(
                "Processing repository {RepositoryId}: {Org}/{Repo}",
                repository.Id, repository.OrgName, repository.RepoName);

            try
            {
                await ProcessRepositoryAsync(
                    repository, 
                    context, 
                    repositoryAnalyzer, 
                    wikiGenerator, 
                    stoppingToken);

                // Transition to Completed status
                repository.Status = RepositoryStatus.Completed;
                logger.LogInformation(
                    "Repository processing completed for {RepositoryId}",
                    repository.Id);
            }
            catch (Exception ex)
            {
                // Transition to Failed status
                repository.Status = RepositoryStatus.Failed;
                logger.LogError(ex, 
                    "Repository processing failed for {RepositoryId}: {Org}/{Repo}",
                    repository.Id, repository.OrgName, repository.RepoName);
            }

            repository.UpdateTimestamp();
            await context.SaveChangesAsync(stoppingToken);
        }
    }

    /// <summary>
    /// Processes a single repository: prepares workspace, generates wiki content.
    /// </summary>
    private async Task ProcessRepositoryAsync(
        Repository repository,
        IContext context,
        IRepositoryAnalyzer repositoryAnalyzer,
        IWikiGenerator wikiGenerator,
        CancellationToken stoppingToken)
    {
        // Get all branches for this repository
        var branches = await context.RepositoryBranches
            .Where(b => b.RepositoryId == repository.Id)
            .ToListAsync(stoppingToken);

        if (branches.Count == 0)
        {
            logger.LogWarning(
                "No branches found for repository {RepositoryId}, skipping",
                repository.Id);
            return;
        }

        foreach (var branch in branches)
        {
            stoppingToken.ThrowIfCancellationRequested();

            await ProcessBranchAsync(
                repository,
                branch,
                context,
                repositoryAnalyzer,
                wikiGenerator,
                stoppingToken);
        }
    }

    /// <summary>
    /// Processes a single branch: prepares workspace, generates wiki for each language.
    /// </summary>
    private async Task ProcessBranchAsync(
        Repository repository,
        RepositoryBranch branch,
        IContext context,
        IRepositoryAnalyzer repositoryAnalyzer,
        IWikiGenerator wikiGenerator,
        CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Processing branch {BranchName} for repository {Org}/{Repo}",
            branch.BranchName, repository.OrgName, repository.RepoName);

        // Prepare workspace with previous commit ID for incremental updates
        var workspace = await repositoryAnalyzer.PrepareWorkspaceAsync(
            repository,
            branch.BranchName,
            branch.LastCommitId,
            stoppingToken);

        try
        {
            // Get all languages for this branch
            var languages = await context.BranchLanguages
                .Where(l => l.RepositoryBranchId == branch.Id)
                .ToListAsync(stoppingToken);

            if (languages.Count == 0)
            {
                logger.LogWarning(
                    "No languages found for branch {BranchId}, skipping",
                    branch.Id);
                return;
            }

            // Check if this is an incremental update
            var isIncremental = workspace.IsIncremental && 
                                workspace.PreviousCommitId != workspace.CommitId;

            string[]? changedFiles = null;
            if (isIncremental)
            {
                changedFiles = await repositoryAnalyzer.GetChangedFilesAsync(
                    workspace,
                    workspace.PreviousCommitId,
                    workspace.CommitId,
                    stoppingToken);

                logger.LogInformation(
                    "Incremental update: {Count} files changed between {OldCommit} and {NewCommit}",
                    changedFiles.Length,
                    workspace.PreviousCommitId,
                    workspace.CommitId);
            }

            foreach (var language in languages)
            {
                stoppingToken.ThrowIfCancellationRequested();

                await ProcessLanguageAsync(
                    workspace,
                    language,
                    wikiGenerator,
                    isIncremental,
                    changedFiles,
                    stoppingToken);
            }

            // Update branch with new commit ID after successful processing
            branch.LastCommitId = workspace.CommitId;
            branch.LastProcessedAt = DateTime.UtcNow;
            context.RepositoryBranches.Update(branch);
            await context.SaveChangesAsync(stoppingToken);

            logger.LogInformation(
                "Branch {BranchName} processed successfully. Commit ID: {CommitId}",
                branch.BranchName, workspace.CommitId);
        }
        finally
        {
            // Cleanup workspace
            await repositoryAnalyzer.CleanupWorkspaceAsync(workspace, stoppingToken);
        }
    }

    /// <summary>
    /// Processes a single language: generates or updates wiki content.
    /// </summary>
    private async Task ProcessLanguageAsync(
        RepositoryWorkspace workspace,
        BranchLanguage language,
        IWikiGenerator wikiGenerator,
        bool isIncremental,
        string[]? changedFiles,
        CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Processing language {LanguageCode} for {Org}/{Repo}",
            language.LanguageCode, workspace.Organization, workspace.RepositoryName);

        if (isIncremental && changedFiles != null && changedFiles.Length > 0)
        {
            // Incremental update: only update affected documents
            await wikiGenerator.IncrementalUpdateAsync(
                workspace,
                language,
                changedFiles,
                stoppingToken);
        }
        else
        {
            // Full generation: generate catalog and all documents
            await wikiGenerator.GenerateCatalogAsync(workspace, language, stoppingToken);
            await wikiGenerator.GenerateDocumentsAsync(workspace, language, stoppingToken);
        }

        logger.LogInformation(
            "Language {LanguageCode} processing completed",
            language.LanguageCode);
    }
}
