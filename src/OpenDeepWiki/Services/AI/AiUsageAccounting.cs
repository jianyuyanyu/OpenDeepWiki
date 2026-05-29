using System.Text.Json;
using Anthropic.Models.Messages;
using Microsoft.Agents.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Services.AI;

public readonly record struct AiUsageSnapshot(int InputTokens, int OutputTokens, int CachedInputTokens = 0)
{
    public int TotalTokens => InputTokens + OutputTokens;
    public bool HasUsage => InputTokens > 0 || OutputTokens > 0;
    public double InputCacheHitRate => InputTokens <= 0 ? 0 : (double)CachedInputTokens / InputTokens;
}

public readonly record struct AiUsageCost(decimal InputCost, decimal OutputCost)
{
    public decimal TotalCost => InputCost + OutputCost;
}

public sealed record AiUsageModelAccounting(
    string? ProviderId,
    string? ProviderName,
    string? ProviderType,
    string ModelId,
    string? ModelName,
    decimal? InputTokenPrice,
    decimal? OutputTokenPrice);

public sealed class AiUsageAccumulator
{
    private readonly Dictionary<string, AiUsageSnapshot> _usageByResponse = new(StringComparer.Ordinal);
    private readonly List<AiUsageSnapshot> _anonymousUsages = [];
    private int _anonymousUsageIndex;
    private int _rawResponseIndex;
    private string? _currentRawResponseKey;

    public AiUsageSnapshot Snapshot
    {
        get
        {
            var inputTokens = _anonymousUsages.Sum(usage => usage.InputTokens);
            var outputTokens = _anonymousUsages.Sum(usage => usage.OutputTokens);
            var cachedInputTokens = _anonymousUsages.Sum(usage => usage.CachedInputTokens);

            foreach (var usage in _usageByResponse.Values)
            {
                inputTokens += usage.InputTokens;
                outputTokens += usage.OutputTokens;
                cachedInputTokens += usage.CachedInputTokens;
            }

            return new AiUsageSnapshot(inputTokens, outputTokens, cachedInputTokens);
        }
    }

    public int InputTokens => Snapshot.InputTokens;

    public int OutputTokens => Snapshot.OutputTokens;

    public void Add(AgentResponseUpdate update)
    {
        ArgumentNullException.ThrowIfNull(update);

        var key = GetResponseKey(update.RawRepresentation);
        var usageFound = AddUsageContents(update.Contents, key);
        AddRawRepresentation(update.RawRepresentation, key, usageFound, usageFound && key == null);
    }

    public void Add(ChatResponseUpdate update)
    {
        ArgumentNullException.ThrowIfNull(update);

        var key = GetResponseKey(update);
        var usageFound = AddUsageContents(update.Contents, key);
        AddRawRepresentation(update.RawRepresentation, key, usageFound, usageFound && key == null);
    }

    public void Add(UsageDetails usageDetails, string? responseKey = null)
    {
        AddSnapshot(ToSnapshot(usageDetails), responseKey);
    }

    private bool AddUsageContents(IEnumerable<AIContent>? contents, string? responseKey)
    {
        var usageFound = false;
        if (contents == null)
        {
            return false;
        }

        foreach (var usage in contents.OfType<UsageContent>())
        {
            AddSnapshot(ToSnapshot(usage.Details), responseKey);
            usageFound = true;
        }

        return usageFound;
    }

    private void AddRawRepresentation(
        object? rawRepresentation,
        string? responseKey,
        bool skipChatResponseContents,
        bool skipProviderUsageWhenAnonymous)
    {
        switch (rawRepresentation)
        {
            case null:
                return;

            case ChatResponseUpdate chatResponseUpdate:
            {
                var chatResponseKey = responseKey ?? GetResponseKey(chatResponseUpdate);
                if (!skipChatResponseContents)
                {
                    AddUsageContents(chatResponseUpdate.Contents, chatResponseKey);
                }

                AddRawRepresentation(
                    chatResponseUpdate.RawRepresentation,
                    chatResponseKey,
                    skipChatResponseContents: false,
                    skipProviderUsageWhenAnonymous);
                return;
            }

            case StreamingChatCompletionUpdate { Usage: { } usage }:
                if (!skipProviderUsageWhenAnonymous || responseKey != null)
                {
                    AddSnapshot(
                        new AiUsageSnapshot(usage.InputTokenCount, usage.OutputTokenCount),
                        responseKey);
                }

                return;

            case RawMessageStreamEvent rawMessageStreamEvent:
                AddAnthropicRawEvent(rawMessageStreamEvent, responseKey, skipProviderUsageWhenAnonymous);
                return;

            case string rawJson:
                AddOpenAICompatibleJson(rawJson, responseKey, skipProviderUsageWhenAnonymous);
                return;
        }
    }

    private void AddAnthropicRawEvent(
        RawMessageStreamEvent rawMessageStreamEvent,
        string? responseKey,
        bool skipProviderUsageWhenAnonymous)
    {
        var json = rawMessageStreamEvent.Json;
        var eventType = json.TryGetProperty("type", out var typeElement)
            ? typeElement.GetString()
            : null;

        var rawKey = responseKey ?? TryGetAnthropicMessageId(json);
        if (string.Equals(eventType, "message_start", StringComparison.Ordinal))
        {
            _currentRawResponseKey = rawKey ?? $"raw:{++_rawResponseIndex}";
            rawKey = _currentRawResponseKey;
        }
        else if (rawKey == null)
        {
            rawKey = _currentRawResponseKey ?? $"raw:{++_rawResponseIndex}";
            _currentRawResponseKey = rawKey;
        }

        if (!skipProviderUsageWhenAnonymous || responseKey != null)
        {
            if (json.TryGetProperty("message", out var message) &&
                message.TryGetProperty("usage", out var messageUsage))
            {
                AddSnapshot(ToAnthropicSnapshot(messageUsage), rawKey);
            }

            if (json.TryGetProperty("usage", out var usage))
            {
                AddSnapshot(ToAnthropicSnapshot(usage), rawKey);
            }
        }

        if (string.Equals(eventType, "message_stop", StringComparison.Ordinal))
        {
            _currentRawResponseKey = null;
        }
    }

    private void AddOpenAICompatibleJson(
        string rawJson,
        string? responseKey,
        bool skipProviderUsageWhenAnonymous)
    {
        if (skipProviderUsageWhenAnonymous && responseKey == null)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return;
        }

        try
        {
            using var document = JsonDocument.Parse(rawJson);
            var root = document.RootElement;
            if (!root.TryGetProperty("usage", out var usage))
            {
                return;
            }

            var key = responseKey;
            if (key == null && root.TryGetProperty("id", out var idElement))
            {
                key = idElement.GetString();
            }

            AddSnapshot(
                new AiUsageSnapshot(
                    ReadInt(usage, "prompt_tokens") ?? ReadInt(usage, "input_tokens") ?? 0,
                    ReadInt(usage, "completion_tokens") ?? ReadInt(usage, "output_tokens") ?? 0,
                    ReadCachedInputTokens(usage) ?? 0),
                key);
        }
        catch (JsonException)
        {
            // RawRepresentation is provider-owned diagnostic data. Ignore non-JSON payloads.
        }
    }

    private void AddSnapshot(AiUsageSnapshot snapshot, string? responseKey)
    {
        if (!snapshot.HasUsage)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(responseKey))
        {
            _anonymousUsages.Add(snapshot);
            return;
        }

        if (_usageByResponse.TryGetValue(responseKey, out var existing))
        {
            _usageByResponse[responseKey] = new AiUsageSnapshot(
                Math.Max(existing.InputTokens, snapshot.InputTokens),
                Math.Max(existing.OutputTokens, snapshot.OutputTokens),
                Math.Max(existing.CachedInputTokens, snapshot.CachedInputTokens));
            return;
        }

        _usageByResponse[responseKey] = snapshot;
    }

    private string NextAnonymousKey() => $"anonymous:{++_anonymousUsageIndex}";

    private static AiUsageSnapshot ToSnapshot(UsageDetails usage)
    {
        var inputTokens = ToInt(usage.InputTokenCount);
        var outputTokens = ToInt(usage.OutputTokenCount);
        var cachedInputTokens = Math.Min(inputTokens, ToInt(usage.CachedInputTokenCount));
        return new AiUsageSnapshot(inputTokens, outputTokens, cachedInputTokens);
    }

    private static AiUsageSnapshot ToAnthropicSnapshot(JsonElement usage)
    {
        var cachedInputTokens = ReadInt(usage, "cache_read_input_tokens") ?? 0;
        var inputTokens =
            (ReadInt(usage, "input_tokens") ?? 0) +
            (ReadInt(usage, "cache_creation_input_tokens") ?? 0) +
            cachedInputTokens;
        var outputTokens = ReadInt(usage, "output_tokens") ?? 0;

        return new AiUsageSnapshot(inputTokens, outputTokens, Math.Min(inputTokens, cachedInputTokens));
    }

    private static string? GetResponseKey(object? rawRepresentation)
    {
        return rawRepresentation switch
        {
            ChatResponseUpdate chatResponseUpdate => GetResponseKey(chatResponseUpdate),
            RawMessageStreamEvent rawMessageStreamEvent => TryGetAnthropicMessageId(rawMessageStreamEvent.Json),
            _ => null
        };
    }

    private static string? GetResponseKey(ChatResponseUpdate update)
    {
        return FirstNonEmpty(
            update.ResponseId,
            update.MessageId,
            GetResponseKey(update.RawRepresentation));
    }

    private static string? TryGetAnthropicMessageId(JsonElement json)
    {
        if (json.TryGetProperty("message", out var message) &&
            message.TryGetProperty("id", out var idElement))
        {
            return idElement.GetString();
        }

        if (json.TryGetProperty("id", out var topLevelIdElement))
        {
            return topLevelIdElement.GetString();
        }

        return null;
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static int? ReadInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var intValue) => intValue,
            JsonValueKind.Number when value.TryGetInt64(out var longValue) => ToInt(longValue),
            _ => null
        };
    }

    private static int? ReadCachedInputTokens(JsonElement usage)
    {
        if (usage.TryGetProperty("prompt_tokens_details", out var promptTokensDetails))
        {
            return ReadInt(promptTokensDetails, "cached_tokens");
        }

        if (usage.TryGetProperty("input_tokens_details", out var inputTokensDetails))
        {
            return ReadInt(inputTokensDetails, "cached_tokens");
        }

        return null;
    }

    private static int ToInt(long? value)
    {
        return value switch
        {
            null or <= 0 => 0,
            > int.MaxValue => int.MaxValue,
            _ => (int)value.Value
        };
    }
}

public static class AiUsageAccounting
{
    private const decimal TokensPerMillion = 1_000_000m;

    public static AiUsageCost CalculateCost(
        int inputTokens,
        int outputTokens,
        decimal? inputTokenPrice,
        decimal? outputTokenPrice)
    {
        var inputCost = inputTokenPrice.HasValue
            ? inputTokens / TokensPerMillion * inputTokenPrice.Value
            : 0m;
        var outputCost = outputTokenPrice.HasValue
            ? outputTokens / TokensPerMillion * outputTokenPrice.Value
            : 0m;

        return new AiUsageCost(inputCost, outputCost);
    }

    public static AiUsageModelAccounting FromResolvedModel(ResolvedAiModel model)
    {
        return new AiUsageModelAccounting(
            model.ProviderId,
            model.ProviderName,
            model.ProviderType,
            model.ModelId,
            model.ModelName,
            model.InputTokenPrice,
            model.OutputTokenPrice);
    }

    public static async Task<AiUsageModelAccounting?> TryResolveModelAccountingAsync(
        IContext context,
        string? modelId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(modelId))
        {
            return null;
        }

        var models = await context.AiModelConfigs
            .Where(model =>
                !model.IsDeleted &&
                model.IsActive &&
                model.ModelId == modelId)
            .Select(model => new
            {
                model.ProviderId,
                model.ModelId,
                model.Name,
                model.DisplayName,
                model.ProviderType,
                model.InputTokenPrice,
                model.OutputTokenPrice
            })
            .Take(2)
            .ToListAsync(cancellationToken);

        if (models.Count != 1)
        {
            return null;
        }

        var model = models[0];
        var provider = await context.AiProviderConfigs
            .Where(provider => provider.Id == model.ProviderId && !provider.IsDeleted)
            .Select(provider => new
            {
                provider.Id,
                provider.Name,
                provider.DisplayName,
                provider.ProviderType
            })
            .FirstOrDefaultAsync(cancellationToken);

        var providerType = AiProviderResolver.ResolveEffectiveProviderType(
            provider?.ProviderType,
            model.ProviderType);

        return new AiUsageModelAccounting(
            provider?.Id ?? model.ProviderId,
            provider?.DisplayName ?? provider?.Name,
            providerType,
            model.ModelId,
            model.DisplayName ?? model.Name,
            model.InputTokenPrice,
            model.OutputTokenPrice);
    }

    public static void ApplyModelAccounting(
        TokenUsage usage,
        AiUsageModelAccounting? modelAccounting)
    {
        if (modelAccounting == null)
        {
            return;
        }

        usage.ProviderId = modelAccounting.ProviderId;
        usage.ProviderName = modelAccounting.ProviderName;
        usage.ProviderType = modelAccounting.ProviderType;
        usage.ModelId = modelAccounting.ModelId;
        usage.ModelName = modelAccounting.ModelName ?? modelAccounting.ModelId;
        usage.InputTokenPrice = modelAccounting.InputTokenPrice;
        usage.OutputTokenPrice = modelAccounting.OutputTokenPrice;

        var cost = CalculateCost(
            usage.InputTokens,
            usage.OutputTokens,
            modelAccounting.InputTokenPrice,
            modelAccounting.OutputTokenPrice);
        usage.InputCost = cost.InputCost;
        usage.OutputCost = cost.OutputCost;
        usage.TotalCost = cost.TotalCost;
    }
}
