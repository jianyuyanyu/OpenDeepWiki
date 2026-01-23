using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Repositories;

namespace OpenDeepWiki.Services.Wiki;

/// <summary>
/// Interface for Wiki generation operations.
/// Uses AI agents to generate catalog structures and document content.
/// </summary>
public interface IWikiGenerator
{
    /// <summary>
    /// Generates the wiki catalog structure for a repository.
    /// Uses AI to analyze the repository and create a hierarchical catalog.
    /// </summary>
    /// <param name="workspace">The prepared repository workspace.</param>
    /// <param name="branchLanguage">The branch language to generate catalog for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task GenerateCatalogAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates document content for all catalog items.
    /// Uses AI to create Markdown content for each wiki page.
    /// </summary>
    /// <param name="workspace">The prepared repository workspace.</param>
    /// <param name="branchLanguage">The branch language to generate documents for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task GenerateDocumentsAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs incremental update of wiki content based on changed files.
    /// Only regenerates documents affected by the changes.
    /// </summary>
    /// <param name="workspace">The prepared repository workspace.</param>
    /// <param name="branchLanguage">The branch language to update.</param>
    /// <param name="changedFiles">Array of relative file paths that changed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task IncrementalUpdateAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        string[] changedFiles,
        CancellationToken cancellationToken = default);
}
