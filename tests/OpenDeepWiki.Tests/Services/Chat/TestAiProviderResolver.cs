using OpenDeepWiki.Agents;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.AI;

namespace OpenDeepWiki.Tests.Services.Chat;

internal sealed class TestAiProviderResolver : IAiProviderResolver
{
    public static readonly TestAiProviderResolver Instance = new();

    private TestAiProviderResolver()
    {
    }

    public Task<ResolvedAiModel> ResolveAsync(
        string? providerId,
        string? modelId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new ResolvedAiModel(
            providerId ?? "test-provider",
            "Test Provider",
            "OpenAI",
            modelId ?? "gpt-4o-mini",
            modelId ?? "gpt-4o-mini",
            "https://api.openai.com/v1",
            "test-secret",
            AiRequestType.OpenAI,
            null,
            null,
            null,
            null,
            null,
            null,
            false,
            null,
            null,
            null));
    }

    public Task<ResolvedAiModel> ResolveModelConfigAsync(
        ModelConfig modelConfig,
        CancellationToken cancellationToken = default)
    {
        return ResolveAsync(modelConfig.AiProviderId, modelConfig.ModelId, cancellationToken);
    }
}
