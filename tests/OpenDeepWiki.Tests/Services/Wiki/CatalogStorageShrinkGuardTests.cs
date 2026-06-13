using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

/// <summary>
/// Regression tests for the destructive-replacement guard in CatalogStorage.SetCatalogAsync.
/// A populated catalog must not be silently replaced by a drastically smaller one
/// (e.g. an incremental-update agent rewriting the whole catalog from a partial view),
/// while initial generation (empty storage) and comparable replacements stay allowed.
/// </summary>
public class CatalogStorageShrinkGuardTests : IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private class TestDbContext : MasterDbContext
    {
        public TestDbContext(DbContextOptions<TestDbContext> options)
            : base(options)
        {
        }
    }

    private readonly TestDbContext _context;
    private readonly string _branchLanguageId;

    public CatalogStorageShrinkGuardTests()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TestDbContext(options);
        _context.Database.EnsureCreated();

        _branchLanguageId = Guid.NewGuid().ToString();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private static string CatalogJsonWithRootItems(int count)
    {
        var root = new CatalogRoot();
        for (var i = 1; i <= count; i++)
        {
            root.Items.Add(new CatalogItem
            {
                Title = $"Section {i}",
                Path = $"{i}-section",
                Order = i
            });
        }

        return JsonSerializer.Serialize(root, JsonOptions);
    }

    private Task<int> LiveCatalogCountAsync()
    {
        return _context.DocCatalogs
            .CountAsync(c => c.BranchLanguageId == _branchLanguageId && !c.IsDeleted);
    }

    [Fact]
    public async Task SetCatalogAsync_EmptyStorage_AllowsInitialWrite()
    {
        var storage = new CatalogStorage(_context, _branchLanguageId);

        await storage.SetCatalogAsync(CatalogJsonWithRootItems(3));

        Assert.Equal(3, await LiveCatalogCountAsync());
    }

    [Fact]
    public async Task SetCatalogAsync_PopulatedCatalog_RefusesDrasticShrink()
    {
        var storage = new CatalogStorage(_context, _branchLanguageId);
        await storage.SetCatalogAsync(CatalogJsonWithRootItems(12));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => storage.SetCatalogAsync(CatalogJsonWithRootItems(3)));

        // The original catalog must survive the rejected replacement.
        Assert.Equal(12, await LiveCatalogCountAsync());
    }

    [Fact]
    public async Task SetCatalogAsync_PopulatedCatalog_AllowsComparableReplacement()
    {
        var storage = new CatalogStorage(_context, _branchLanguageId);
        await storage.SetCatalogAsync(CatalogJsonWithRootItems(12));

        await storage.SetCatalogAsync(CatalogJsonWithRootItems(10));

        Assert.Equal(10, await LiveCatalogCountAsync());
    }

    [Fact]
    public async Task SetCatalogAsync_SmallCatalog_AllowsRewrite()
    {
        var storage = new CatalogStorage(_context, _branchLanguageId);
        await storage.SetCatalogAsync(CatalogJsonWithRootItems(5));

        await storage.SetCatalogAsync(CatalogJsonWithRootItems(1));

        Assert.Equal(1, await LiveCatalogCountAsync());
    }
}
