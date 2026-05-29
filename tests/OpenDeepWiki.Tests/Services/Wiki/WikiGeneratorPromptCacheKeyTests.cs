using Microsoft.Extensions.AI;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Services.AI;
using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

public class WikiGeneratorPromptCacheKeyTests
{
    [Fact]
    public void Build_DoesNotIncludeDocumentPathForDocumentGeneration()
    {
        var ai = CreateResolvedModel("provider-1", "deepseek-v4-flash");
        var first = WikiPromptCacheKeyBuilder.Build(
            ai,
            new AiExecutionContext
            {
                BusinessTag = "wiki_document_generation",
                RepositoryId = "repo-1",
                Branch = "main",
                Language = "zh",
                DocumentPath = "overview"
            },
            "tools-a");

        var second = WikiPromptCacheKeyBuilder.Build(
            ai,
            new AiExecutionContext
            {
                BusinessTag = "wiki_document_generation",
                RepositoryId = "repo-1",
                Branch = "main",
                Language = "zh",
                DocumentPath = "api-reference"
            },
            "tools-a");

        Assert.Equal(first, second);
    }

    [Fact]
    public void Build_SeparatesModelLanguageAndToolset()
    {
        var context = new AiExecutionContext
        {
            BusinessTag = "wiki_document_generation",
            RepositoryId = "repo-1",
            Branch = "main",
            Language = "zh"
        };

        var baseline = WikiPromptCacheKeyBuilder.Build(
            CreateResolvedModel("provider-1", "deepseek-v4-flash"),
            context,
            "tools-a");

        var differentModel = WikiPromptCacheKeyBuilder.Build(
            CreateResolvedModel("provider-1", "deepseek-chat"),
            context,
            "tools-a");
        var differentLanguage = WikiPromptCacheKeyBuilder.Build(
            CreateResolvedModel("provider-1", "deepseek-v4-flash"),
            new AiExecutionContext
            {
                BusinessTag = context.BusinessTag,
                RepositoryId = context.RepositoryId,
                Branch = context.Branch,
                Language = "en"
            },
            "tools-a");
        var differentToolset = WikiPromptCacheKeyBuilder.Build(
            CreateResolvedModel("provider-1", "deepseek-v4-flash"),
            context,
            "tools-b");

        Assert.NotEqual(baseline, differentModel);
        Assert.NotEqual(baseline, differentLanguage);
        Assert.NotEqual(baseline, differentToolset);
    }

    [Fact]
    public void BuildToolsetHash_IsStableByToolContentAndSensitiveToDescription()
    {
        var first = WikiPromptCacheKeyBuilder.BuildToolsetHash(
            [CreateTool("Skill", "alpha"), CreateTool("ReadFile", "read")]);
        var reordered = WikiPromptCacheKeyBuilder.BuildToolsetHash(
            [CreateTool("ReadFile", "read"), CreateTool("Skill", "alpha")]);
        var changed = WikiPromptCacheKeyBuilder.BuildToolsetHash(
            [CreateTool("Skill", "beta"), CreateTool("ReadFile", "read")]);

        Assert.Equal(first, reordered);
        Assert.NotEqual(first, changed);
    }

    private static ResolvedAiModel CreateResolvedModel(string providerId, string modelId)
    {
        return new ResolvedAiModel(
            providerId,
            "Provider",
            "DeepSeekOpenAI",
            modelId,
            modelId,
            "https://api.deepseek.com/v1",
            "test-key",
            AiRequestType.DeepSeekOpenAI,
            ContextWindow: null,
            MaxOutputTokens: null,
            InputTokenPrice: null,
            OutputTokenPrice: null,
            CacheHitTokenPrice: null,
            CacheCreationTokenPrice: null,
            SupportsThinking: true,
            ProviderRequestOverridesJson: null,
            ModelThinkingConfigJson: null,
            ModelRequestOverridesJson: null);
    }

    private static AITool CreateTool(string name, string description)
    {
        return AIFunctionFactory.Create(
            () => "ok",
            new AIFunctionFactoryOptions
            {
                Name = name,
                Description = description
            });
    }
}
