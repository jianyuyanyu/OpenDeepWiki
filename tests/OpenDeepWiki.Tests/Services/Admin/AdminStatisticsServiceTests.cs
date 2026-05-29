using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.AI;
using OpenDeepWiki.Services.Admin;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Admin;

public class AdminStatisticsServiceTests
{
    [Fact]
    public async Task GetTokenUsageStatisticsAsync_AggregatesStoredSnapshotCosts()
    {
        await using var context = CreateContext();
        var recordedAt = DateTime.UtcNow;

        var first = new TokenUsage
        {
            Id = Guid.NewGuid().ToString(),
            InputTokens = 1_000_000,
            OutputTokens = 500_000,
            CachedInputTokens = 200_000,
            CacheCreationInputTokens = 300_000,
            RecordedAt = recordedAt,
            CreatedAt = recordedAt
        };
        AiUsageAccounting.ApplyModelAccounting(
            first,
            new AiUsageModelAccounting(
                "provider-a",
                "Provider A",
                "DeepSeekOpenAI",
                "model-a",
                "Model A",
                2m,
                8m,
                0.5m,
                3m));

        var second = new TokenUsage
        {
            Id = Guid.NewGuid().ToString(),
            InputTokens = 500_000,
            OutputTokens = 250_000,
            CachedInputTokens = 100_000,
            CacheCreationInputTokens = 0,
            RecordedAt = recordedAt,
            CreatedAt = recordedAt
        };
        AiUsageAccounting.ApplyModelAccounting(
            second,
            new AiUsageModelAccounting(
                "provider-b",
                "Provider B",
                "OpenAI",
                "model-b",
                "Model B",
                1m,
                2m,
                0.25m,
                null));

        context.TokenUsages.AddRange(first, second);
        await context.SaveChangesAsync();

        var service = new AdminStatisticsService(context);
        var stats = await service.GetTokenUsageStatisticsAsync(1);

        var daily = Assert.Single(stats.DailyUsages);
        Assert.Equal(1_500_000, daily.InputTokens);
        Assert.Equal(750_000, daily.OutputTokens);
        Assert.Equal(300_000, daily.CachedInputTokens);
        Assert.Equal(300_000, daily.CacheCreationInputTokens);
        Assert.Equal(2.425m, daily.InputCost);
        Assert.Equal(4.5m, daily.OutputCost);
        Assert.Equal(6.925m, daily.TotalCost);
        Assert.Equal(daily.InputCost, stats.TotalInputCost);
        Assert.Equal(daily.TotalCost, stats.TotalCost);
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
