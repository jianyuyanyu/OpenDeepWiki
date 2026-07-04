using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Admin;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Admin;

public class AdminMcpProviderServiceTests
{
    [Fact]
    public async Task GetProvidersAsync_ShouldReturnGlobalMcpServerUrl()
    {
        await using var context = CreateContext();
        context.McpProviders.Add(new McpProvider
        {
            Id = Guid.NewGuid().ToString(),
            Name = "OpenDeepWiki Global MCP",
            Description = "Global MCP",
            ServerUrl = "/api/mcp/{owner}/{repo}",
            TransportType = "streamable_http",
            RequiresApiKey = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
        var service = new AdminMcpProviderService(context, NullLogger<AdminMcpProviderService>.Instance);

        var providers = await service.GetProvidersAsync();

        var provider = Assert.Single(providers);
        Assert.Equal("/api/mcp", provider.ServerUrl);
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
