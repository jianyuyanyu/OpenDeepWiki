using System.ComponentModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
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
    private readonly string _catalogPath;

    /// <summary>
    /// Initializes a new instance of DocTool with the specified context, branch language, and catalog path.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="branchLanguageId">The branch language ID to operate on.</param>
    /// <param name="catalogPath">The catalog item path this tool operates on.</param>
    public DocTool(IContext context, string branchLanguageId, string catalogPath)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _branchLanguageId = branchLanguageId ?? throw new ArgumentNullException(nameof(branchLanguageId));
        _catalogPath = catalogPath ?? throw new ArgumentNullException(nameof(catalogPath));
    }

    /// <summary>
    /// Writes document content for the catalog path specified in constructor.
    /// Creates a new document and associates it with the catalog item.
    /// </summary>
    /// <param name="content">The Markdown content for the document.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [Description(@"Writes document content for the current catalog item.

Usage:
- Creates a new document or updates existing one
- Content should be in Markdown format
- The catalog item must exist before writing content

Example:
content: '# Overview\n\nThis is the overview section...'")]
    public async Task WriteAsync(
        [Description("Document content in Markdown format")] 
        string content,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Content cannot be empty.", nameof(content));
        }

        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == _catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null)
        {
            throw new InvalidOperationException($"Catalog item with path '{_catalogPath}' not found.");
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
    /// <param name="oldContent">The content to be replaced.</param>
    /// <param name="newContent">The new content to replace with.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [Description(@"Edits existing document content by replacing specified text.

Usage:
- Performs exact string replacement in the document
- oldContent must exist in the document (exact match required)
- Use ReadAsync first to see current content
- For large changes, consider using WriteAsync instead

Example:
oldContent: '## Old Section'
newContent: '## New Section\n\nUpdated content here'")]
    public async Task EditAsync(
        [Description("Exact text to find and replace (must exist in document)")] 
        string oldContent,
        [Description("New text to replace the old content with")] 
        string newContent,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(oldContent))
        {
            throw new ArgumentException("Old content cannot be empty.", nameof(oldContent));
        }

        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == _catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null)
        {
            throw new InvalidOperationException($"Catalog item with path '{_catalogPath}' not found.");
        }

        if (string.IsNullOrEmpty(catalog.DocFileId))
        {
            throw new InvalidOperationException($"No document associated with catalog item '{_catalogPath}'.");
        }

        // Find the document
        var docFile = await _context.DocFiles
            .FirstOrDefaultAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);

        if (docFile == null)
        {
            throw new InvalidOperationException($"Document not found for catalog item '{_catalogPath}'.");
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
    /// Reads the document content for the catalog path specified in constructor.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The document content or null if not found.</returns>
    [Description(@"Reads the document content for the current catalog item.

Returns:
- The Markdown content of the document
- null if no document exists for the path

Usage:
- Use before EditAsync to see current content
- Use to verify document was written correctly")]
    public async Task<string?> ReadAsync(
        CancellationToken cancellationToken = default)
    {
        // Find the catalog item
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == _catalogPath && 
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
    /// Checks if a document exists for the catalog path specified in constructor.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if a document exists, false otherwise.</returns>
    [Description(@"Checks if a document exists for the current catalog item.

Returns:
- true if document exists and is not deleted
- false if no document or catalog item not found

Usage:
- Quick check before writing to avoid overwriting
- Verify document creation was successful")]
    public async Task<bool> ExistsAsync(
        CancellationToken cancellationToken = default)
    {
        var catalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == _branchLanguageId && 
                                      c.Path == _catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (catalog == null || string.IsNullOrEmpty(catalog.DocFileId))
        {
            return false;
        }

        return await _context.DocFiles
            .AnyAsync(d => d.Id == catalog.DocFileId && !d.IsDeleted, cancellationToken);
    }

    /// <summary>
    /// Gets the list of AI tools provided by this DocTool.
    /// </summary>
    /// <returns>List of AITool instances for document operations.</returns>
    public List<AITool> GetTools()
    {
        return new List<AITool>
        {
            AIFunctionFactory.Create(WriteAsync, new AIFunctionFactoryOptions
            {
                Name = "WriteDoc"
            }),
            AIFunctionFactory.Create(EditAsync, new AIFunctionFactoryOptions
            {
                Name = "EditDoc"
            }),
            AIFunctionFactory.Create(ReadAsync, new AIFunctionFactoryOptions
            {
                Name = "ReadDoc"
            }),
            AIFunctionFactory.Create(ExistsAsync, new AIFunctionFactoryOptions
            {
                Name = "DocExists"
            })
        };
    }
}
