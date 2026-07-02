using System.Reflection;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Infrastructure;
using Xunit;

namespace OpenDeepWiki.Tests.Infrastructure;

public class DbInitializerMcpProviderTests
{
    [Fact]
    public async Task InitializeMcpProvidersAsync_WhenExistingProviderHasUserSettings_PreservesThem()
    {
        await using var context = CreateContext();
        var provider = new McpProvider
        {
            Id = Guid.NewGuid().ToString(),
            Name = "OpenDeepWiki Global MCP",
            Description = "User customized global MCP",
            ServerUrl = "/api/mcp/{owner}/{repo}",
            TransportType = "streamable_http",
            RequiresApiKey = true,
            SystemApiKey = "configured-key",
            AllowedTools = """["custom_tool"]""",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };
        context.McpProviders.Add(provider);
        await context.SaveChangesAsync();

        await InvokeInitializeMcpProvidersAsync(context);

        var saved = await context.McpProviders.SingleAsync(item => item.Id == provider.Id);
        Assert.Equal("/api/mcp", saved.ServerUrl);
        Assert.False(saved.IsActive);
        Assert.True(saved.RequiresApiKey);
        Assert.Equal("configured-key", saved.SystemApiKey);
        Assert.Equal("""["custom_tool"]""", saved.AllowedTools);
    }

    [Fact]
    public async Task InitializeMcpProvidersAsync_WhenDefaultProviderWasDeleted_DoesNotRecreateIt()
    {
        await using var context = CreateContext();
        context.McpProviders.Add(new McpProvider
        {
            Id = Guid.NewGuid().ToString(),
            Name = "OpenDeepWiki Global MCP",
            ServerUrl = "/api/mcp/{owner}/{repo}",
            TransportType = "streamable_http",
            IsActive = false,
            IsDeleted = true,
            CreatedAt = DateTime.UtcNow
        });
        context.McpProviders.Add(new McpProvider
        {
            Id = Guid.NewGuid().ToString(),
            Name = "YoudaoHW_Code_WIKI",
            ServerUrl = "/api/mcp",
            TransportType = "streamable_http",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        await InvokeInitializeMcpProvidersAsync(context);

        var providers = await context.McpProviders.OrderBy(item => item.Name).ToListAsync();
        Assert.Equal(2, providers.Count);
        Assert.Contains(providers, item => item.Name == "OpenDeepWiki Global MCP" && item.IsDeleted);
        Assert.Contains(providers, item => item.Name == "YoudaoHW_Code_WIKI" && item.ServerUrl == "/api/mcp");
    }

    private static async Task InvokeInitializeMcpProvidersAsync(IContext context)
    {
        var method = typeof(DbInitializer).GetMethod(
            "InitializeMcpProvidersAsync",
            BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        var task = (Task?)method.Invoke(null, [context]);
        Assert.NotNull(task);
        await task;
    }

    private static TestDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new TestDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options)
        : MasterDbContext(options);
}
