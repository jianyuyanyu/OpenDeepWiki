using Microsoft.Extensions.AI;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.AI;
using Xunit;

namespace OpenDeepWiki.Tests.Services.AI;

public class AiUsageAccountingTests
{
    [Fact]
    public void Accumulator_AddsUsageAcrossAgentLoopResponses()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            Contents =
            [
                new UsageContent(new UsageDetails
                {
                    InputTokenCount = 100,
                    OutputTokenCount = 20,
                    CachedInputTokenCount = 40
                })
            ]
        });
        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-2",
            Contents =
            [
                new UsageContent(new UsageDetails
                {
                    InputTokenCount = 50,
                    OutputTokenCount = 10,
                    CachedInputTokenCount = 10
                })
            ]
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(150, snapshot.InputTokens);
        Assert.Equal(30, snapshot.OutputTokens);
        Assert.Equal(50, snapshot.CachedInputTokens);
        Assert.Equal(180, snapshot.TotalTokens);
    }

    [Fact]
    public void Accumulator_UsesLatestCumulativeUsageForSameResponse()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            Contents =
            [
                new UsageContent(new UsageDetails
                {
                    InputTokenCount = 100,
                    OutputTokenCount = 5,
                    CachedInputTokenCount = 25
                })
            ]
        });
        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            Contents =
            [
                new UsageContent(new UsageDetails
                {
                    InputTokenCount = 100,
                    OutputTokenCount = 25,
                    CachedInputTokenCount = 80
                })
            ]
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(100, snapshot.InputTokens);
        Assert.Equal(25, snapshot.OutputTokens);
        Assert.Equal(80, snapshot.CachedInputTokens);
        Assert.Equal(0.8d, snapshot.InputCacheHitRate);
    }

    [Fact]
    public void Accumulator_ReadsCachedTokensFromOpenAICompatibleRawUsage()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            RawRepresentation = """
                {
                  "id": "response-1",
                  "usage": {
                    "prompt_tokens": 200,
                    "completion_tokens": 30,
                    "prompt_tokens_details": {
                      "cached_tokens": 128
                    }
                  }
                }
                """
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(200, snapshot.InputTokens);
        Assert.Equal(30, snapshot.OutputTokens);
        Assert.Equal(128, snapshot.CachedInputTokens);
    }

    [Fact]
    public void Accumulator_IgnoresNullOpenAICompatibleRawUsage()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            RawRepresentation = """
                {
                  "id": "response-1",
                  "usage": null,
                  "choices": []
                }
                """
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(0, snapshot.InputTokens);
        Assert.Equal(0, snapshot.OutputTokens);
        Assert.Equal(0, snapshot.CachedInputTokens);
        Assert.Equal(0, snapshot.CacheCreationInputTokens);
    }

    [Fact]
    public void Accumulator_IgnoresNullOpenAICompatibleTokenDetails()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            RawRepresentation = """
                {
                  "id": "response-1",
                  "usage": {
                    "prompt_tokens": 42,
                    "completion_tokens": 8,
                    "prompt_tokens_details": null
                  }
                }
                """
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(42, snapshot.InputTokens);
        Assert.Equal(8, snapshot.OutputTokens);
        Assert.Equal(0, snapshot.CachedInputTokens);
        Assert.Equal(0, snapshot.CacheCreationInputTokens);
    }

    [Fact]
    public void Accumulator_ReadsCacheCreationTokensFromAnthropicStyleRawUsage()
    {
        var accumulator = new AiUsageAccumulator();

        accumulator.Add(new ChatResponseUpdate
        {
            ResponseId = "response-1",
            RawRepresentation = """
                {
                  "id": "response-1",
                  "usage": {
                    "input_tokens": 120,
                    "cache_creation_input_tokens": 40,
                    "cache_read_input_tokens": 80,
                    "output_tokens": 30
                  }
                }
                """
        });

        var snapshot = accumulator.Snapshot;

        Assert.Equal(240, snapshot.InputTokens);
        Assert.Equal(30, snapshot.OutputTokens);
        Assert.Equal(80, snapshot.CachedInputTokens);
        Assert.Equal(40, snapshot.CacheCreationInputTokens);
    }

    [Fact]
    public void ApplyModelAccounting_StoresPricesAndCosts()
    {
        var usage = new TokenUsage
        {
            InputTokens = 2_000_000,
            OutputTokens = 1_000_000,
            ModelName = "legacy-name"
        };

        AiUsageAccounting.ApplyModelAccounting(
            usage,
            new AiUsageModelAccounting(
                "provider-id",
                "Provider",
                "DeepSeekOpenAI",
                "deepseek-v4-pro",
                "DeepSeek V4 Pro",
                0.5m,
                2m,
                0.1m,
                0.25m));

        Assert.Equal("provider-id", usage.ProviderId);
        Assert.Equal("deepseek-v4-pro", usage.ModelId);
        Assert.Equal("DeepSeek V4 Pro", usage.ModelName);
        Assert.Equal(0.5m, usage.InputTokenPrice);
        Assert.Equal(2m, usage.OutputTokenPrice);
        Assert.Equal(0.1m, usage.CacheHitTokenPrice);
        Assert.Equal(0.25m, usage.CacheCreationTokenPrice);
        Assert.Equal(1m, usage.InputCost);
        Assert.Equal(2m, usage.OutputCost);
        Assert.Equal(3m, usage.TotalCost);
    }

    [Fact]
    public void CalculateCost_AccountsForUncachedCacheHitAndCacheCreationTokens()
    {
        var cost = AiUsageAccounting.CalculateCost(
            inputTokens: 1_000_000,
            outputTokens: 500_000,
            cachedInputTokens: 200_000,
            cacheCreationInputTokens: 300_000,
            inputTokenPrice: 2m,
            outputTokenPrice: 8m,
            cacheHitTokenPrice: 0.5m,
            cacheCreationTokenPrice: 3m);

        Assert.Equal(1m + 0.1m + 0.9m, cost.InputCost);
        Assert.Equal(4m, cost.OutputCost);
        Assert.Equal(6m, cost.TotalCost);
    }

    [Fact]
    public void CalculateCost_FallsBackToInputPriceWhenCachePricesAreMissing()
    {
        var cost = AiUsageAccounting.CalculateCost(
            inputTokens: 1_000_000,
            outputTokens: 0,
            cachedInputTokens: 250_000,
            cacheCreationInputTokens: 250_000,
            inputTokenPrice: 4m,
            outputTokenPrice: null,
            cacheHitTokenPrice: null,
            cacheCreationTokenPrice: null);

        Assert.Equal(4m, cost.InputCost);
        Assert.Equal(0m, cost.OutputCost);
        Assert.Equal(4m, cost.TotalCost);
    }

    [Fact]
    public void CalculateCost_NormalizesCacheBucketsBeforeBilling()
    {
        var cost = AiUsageAccounting.CalculateCost(
            inputTokens: 100,
            outputTokens: 0,
            cachedInputTokens: 90,
            cacheCreationInputTokens: 50,
            inputTokenPrice: 1_000_000m,
            outputTokenPrice: null,
            cacheHitTokenPrice: 500_000m,
            cacheCreationTokenPrice: 2_000_000m);

        Assert.Equal(90m * 0.5m + 10m * 2m, cost.InputCost);
        Assert.Equal(65m, cost.TotalCost);
    }
}
