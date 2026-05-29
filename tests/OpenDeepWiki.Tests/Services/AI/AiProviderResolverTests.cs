using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OpenDeepWiki.Agents;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.AI;
using Xunit;

namespace OpenDeepWiki.Tests.Services.AI;

public class AiProviderResolverTests
{
    [Fact]
    public async Task ResolveAsync_UsesModelProviderTypeOverride()
    {
        var databaseName = Guid.NewGuid().ToString();
        var databaseRoot = new InMemoryDatabaseRoot();
        await using var context = CreateContext(databaseName, databaseRoot);
        var provider = CreateProvider("OpenAI", "https://proxy.example.com/v1");
        var model = CreateModel(provider.Id, "deepseek-v4-flash", "DeepSeekOpenAI");
        context.AiProviderConfigs.Add(provider);
        context.AiModelConfigs.Add(model);
        await context.SaveChangesAsync();

        var resolver = new AiProviderResolver(new TestContextFactory(databaseName, databaseRoot));
        var resolved = await resolver.ResolveAsync(provider.Id, model.ModelId);

        Assert.Equal("DeepSeekOpenAI", resolved.ProviderType);
        Assert.Equal(AiRequestType.DeepSeekOpenAI, resolved.RequestType);
        Assert.Equal("https://proxy.example.com/v1", resolved.BaseUrl);
    }

    [Fact]
    public async Task ResolveAsync_FallsBackToProviderTypeWhenModelDoesNotOverride()
    {
        var databaseName = Guid.NewGuid().ToString();
        var databaseRoot = new InMemoryDatabaseRoot();
        await using var context = CreateContext(databaseName, databaseRoot);
        var provider = CreateProvider("OpenAIResponses", "https://proxy.example.com/v1");
        var model = CreateModel(provider.Id, "gpt-5.2", null);
        context.AiProviderConfigs.Add(provider);
        context.AiModelConfigs.Add(model);
        await context.SaveChangesAsync();

        var resolver = new AiProviderResolver(new TestContextFactory(databaseName, databaseRoot));
        var resolved = await resolver.ResolveAsync(provider.Id, model.ModelId);

        Assert.Equal("OpenAIResponses", resolved.ProviderType);
        Assert.Equal(AiRequestType.OpenAIResponses, resolved.RequestType);
    }

    [Fact]
    public async Task ResolveAsync_IncludesModelTokenPrices()
    {
        var databaseName = Guid.NewGuid().ToString();
        var databaseRoot = new InMemoryDatabaseRoot();
        await using var context = CreateContext(databaseName, databaseRoot);
        var provider = CreateProvider("DeepSeekOpenAI", "https://api.deepseek.com/v1");
        var model = CreateModel(provider.Id, "deepseek-v4-pro", null);
        model.InputTokenPrice = 0.5m;
        model.OutputTokenPrice = 2m;
        model.CacheHitTokenPrice = 0.1m;
        model.CacheCreationTokenPrice = 0.5m;
        context.AiProviderConfigs.Add(provider);
        context.AiModelConfigs.Add(model);
        await context.SaveChangesAsync();

        var resolver = new AiProviderResolver(new TestContextFactory(databaseName, databaseRoot));
        var resolved = await resolver.ResolveAsync(provider.Id, model.ModelId);

        Assert.Equal(0.5m, resolved.InputTokenPrice);
        Assert.Equal(2m, resolved.OutputTokenPrice);
        Assert.Equal(0.1m, resolved.CacheHitTokenPrice);
        Assert.Equal(0.5m, resolved.CacheCreationTokenPrice);
    }

    [Fact]
    public async Task ResolveAsync_CanRunConcurrentlyWithSeparateContexts()
    {
        var databaseName = Guid.NewGuid().ToString();
        var databaseRoot = new InMemoryDatabaseRoot();
        await using (var context = CreateContext(databaseName, databaseRoot))
        {
            var provider = CreateProvider("OpenAI", "https://proxy.example.com/v1");
            var model = CreateModel(provider.Id, "gpt-4o-mini", null);
            context.AiProviderConfigs.Add(provider);
            context.AiModelConfigs.Add(model);
            await context.SaveChangesAsync();

            var contextFactory = new TestContextFactory(databaseName, databaseRoot);
            var resolver = new AiProviderResolver(contextFactory);
            var resolutions = Enumerable.Range(0, 12)
                .Select(_ => resolver.ResolveAsync(provider.Id, model.ModelId))
                .ToArray();

            var results = await Task.WhenAll(resolutions);

            Assert.Equal(resolutions.Length, contextFactory.CreateCount);
            Assert.All(results, resolved =>
            {
                Assert.Equal(provider.Id, resolved.ProviderId);
                Assert.Equal(model.ModelId, resolved.ModelId);
            });
        }
    }

    [Theory]
    [InlineData(null, "gpt-5", "OpenAIResponses")]
    [InlineData(null, "gpt-5.1-codex", "OpenAIResponses")]
    [InlineData(null, "gpt-10", "OpenAIResponses")]
    [InlineData(null, "gpt-4.1", null)]
    [InlineData("Anthropic", "gpt-5", "Anthropic")]
    [InlineData("OpenAI", "gpt-5", "OpenAI")]
    public void NormalizeModelProviderType_DefaultsGpt5AndLaterOnlyWhenModelProviderTypeIsMissing(
        string? providerType,
        string modelId,
        string? expectedProviderType)
    {
        Assert.Equal(
            expectedProviderType,
            AiProviderResolver.NormalizeModelProviderType(providerType, modelId));
    }

    [Theory]
    [InlineData("deepseek")]
    [InlineData("deepseek-openai")]
    [InlineData("deepseek-chat")]
    public void ParseRequestType_MapsDeepSeekAliasesToOpenAICompatibleProvider(string providerType)
    {
        Assert.Equal(AiRequestType.DeepSeekOpenAI, AiProviderResolver.ParseRequestType(providerType));
    }

    private static AiProviderConfig CreateProvider(string providerType, string baseUrl)
    {
        return new AiProviderConfig
        {
            Id = Guid.NewGuid().ToString(),
            Name = $"provider-{Guid.NewGuid():N}",
            DisplayName = "Test Provider",
            ProviderType = providerType,
            BaseUrl = baseUrl,
            ApiKey = "test-secret",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static AiModelConfig CreateModel(string providerId, string modelId, string? providerType)
    {
        return new AiModelConfig
        {
            Id = Guid.NewGuid().ToString(),
            ProviderId = providerId,
            ModelId = modelId,
            Name = modelId,
            ModelType = "chat",
            ProviderType = providerType,
            SupportsTools = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static TestDbContext CreateContext(string databaseName, InMemoryDatabaseRoot databaseRoot)
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(databaseName, databaseRoot)
            .Options;

        var context = new TestDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private sealed class TestContextFactory : IContextFactory
    {
        private readonly string _databaseName;
        private readonly InMemoryDatabaseRoot _databaseRoot;
        private int _createCount;

        public TestContextFactory(string databaseName, InMemoryDatabaseRoot databaseRoot)
        {
            _databaseName = databaseName;
            _databaseRoot = databaseRoot;
        }

        public int CreateCount => _createCount;

        public IContext CreateContext()
        {
            Interlocked.Increment(ref _createCount);
            return AiProviderResolverTests.CreateContext(_databaseName, _databaseRoot);
        }
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options)
        : MasterDbContext(options);
}
