using System.ComponentModel;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Agents.Tools;

/// <summary>
/// AI Tool for writing and editing document content.
/// Provides methods for AI agents to create and modify wiki documents.
/// </summary>
public class DocTool
{
    private readonly IContext _context;
    private readonly string _branchLanguageId;

    /// <summary>
    /// Initializes a new instance of DocTool with the specified context and branch language.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="branchLanguageId">The branch language ID to operate on.</param>
    public DocTool(IContext context, string branchLanguageId)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _branchLanguageId = branchLanguageId ?? throw new ArgumentNullException(nameof(branchLanguageId));
    }

    /// <summary>
    /// Writes document content for a specified catalog path.
    /// Creates a new document and associates it with the catalog item.
    /// </summary>
    /// <param name="catalogPath">The catalog item path, e.g., "1-overview".</param>
    /// <param name="content">The Markdown content for the document.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [Description("为指定目录项写入文档内容")]
    public async Task WriteAsync(
        [Description("目录项路径，如 '1-overview'")] 
        string catalogPath,
        [Description("Markdown 格式的文档内容")] 
        string content,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(catalogPath))
        {
            throw new ArgumentException("Catalog path cannot be empty.", nameof(catalogPath));
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Content cannot be empty.", nameof(content));
        }

        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null)
        {
            throw new InvalidOperationException($"Catalog item with path '{catalogPath}' not found.");
        }

        // Check if document already exists
        if (!string.IsNullOrEmpty(catalog.DocFileId))
        {
            var existingDoc = await _context.DocFiles
                .FirstOrDefaultAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);

            if (existingDoc != null)
            {
                // Update existing document
                existingDoc.Content = content;
                existingDoc.UpdateTimestamp();
                await _context.SaveChangesAsync(cancellationToken);
                return;
            }
        }

        // Create new document
        var docFile = new DocFile
        {
            Id = Guid.NewGuid().ToString(),
            BranchLanguageId = _branchLanguageId,
            Content = content
        };

        _context.DocFiles.Add(docFile);

        // Associate with catalog item
        catalog.DocFileId = docFile.Id;
        catalog.UpdateTimestamp();

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Edits existing document content by replacing specified text.
    /// </summary>
    /// <param name="catalogPath">The catalog item path.</param>
    /// <param name="oldContent">The content to be replaced.</param>
    /// <param name="newContent">The new content to replace with.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [Description("编辑指定目录项的文档内容")]
    public async Task EditAsync(
        [Description("目录项路径")] 
        string catalogPath,
        [Description("要替换的原始内容")] 
        string oldContent,
        [Description("新的内容")] 
        string newContent,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(catalogPath))
        {
            throw new ArgumentException("Catalog path cannot be empty.", nameof(catalogPath));
        }

        if (string.IsNullOrWhiteSpace(oldContent))
        {
            throw new ArgumentException("Old content cannot be empty.", nameof(oldContent));
        }

        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null)
        {
            throw new InvalidOperationException($"Catalog item with path '{catalogPath}' not found.");
        }

        if (string.IsNullOrEmpty(catalog.DocFileId))
        {
            throw new InvalidOperationException($"No document associated with catalog item '{catalogPath}'.");
        }

        // Find the document
        var docFile = await _context.DocFiles
            .FirstOrDefaultAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);

        if (docFile == null)
        {
            throw new InvalidOperationException($"Document not found for catalog item '{catalogPath}'.");
        }

        // Check if old content exists in the document
        if (!docFile.Content.Contains(oldContent))
        {
            throw new InvalidOperationException($"The specified content to replace was not found in the document.");
        }

        // Replace content
        docFile.Content = docFile.Content.Replace(oldContent, newContent);
        docFile.UpdateTimestamp();

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Reads the document content for a specified catalog path.
    /// </summary>
    /// <param name="catalogPath">The catalog item path.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The document content or null if not found.</returns>
    [Description("读取指定目录项的文档内容")]
    public async Task<string?> ReadAsync(
        [Description("目录项路径")] 
        string catalogPath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(catalogPath))
        {
            throw new ArgumentException("Catalog path cannot be empty.", nameof(catalogPath));
        }

        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null || string.IsNullOrEmpty(catalog.DocFileId))
        {
            return null;
        }

        // Find the document
        var docFile = await _context.DocFiles
            .FirstOrDefaultAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);

        return docFile?.Content;
    }

    /// <summary>
    /// Checks if a document exists for the specified catalog path.
    /// </summary>
    /// <param name="catalogPath">The catalog item path.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if a document exists, false otherwise.</returns>
    [Description("检查指定目录项是否有关联的文档")]
    public async Task<bool> ExistsAsync(
        [Description("目录项路径")] 
        string catalogPath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(catalogPath))
        {
            return false;
        }

        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null || string.IsNullOrEmpty(catalog.DocFileId))
        {
            return false;
        }

        return await _context.DocFiles
            .AnyAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);
    }
}
