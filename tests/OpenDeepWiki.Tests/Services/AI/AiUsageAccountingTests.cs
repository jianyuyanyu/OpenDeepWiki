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
                2m));

        Assert.Equal("provider-id", usage.ProviderId);
        Assert.Equal("deepseek-v4-pro", usage.ModelId);
        Assert.Equal("DeepSeek V4 Pro", usage.ModelName);
        Assert.Equal(0.5m, usage.InputTokenPrice);
        Assert.Equal(2m, usage.OutputTokenPrice);
        Assert.Equal(1m, usage.InputCost);
        Assert.Equal(2m, usage.OutputCost);
        Assert.Equal(3m, usage.TotalCost);
    }
}
