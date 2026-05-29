using Microsoft.Extensions.Configuration;
using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

public class WikiGeneratorOptionsConfiguratorTests
{
    [Fact]
    public void Apply_ShouldBindWikiTasks_FromProviderModelSettings()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["WikiGenerator:CatalogProviderId"] = "catalog-provider",
            ["WikiGenerator:CatalogModel"] = "catalog-model",
            ["WikiGenerator:ContentProviderId"] = "content-provider",
            ["WikiGenerator:ContentModel"] = "content-model",
            ["WikiGenerator:TranslationProviderId"] = "translation-provider",
            ["WikiGenerator:TranslationModel"] = "translation-model"
        });

        var options = new WikiGeneratorOptions();

        WikiGeneratorOptionsConfigurator.Apply(options, configuration);

        Assert.Equal("catalog-provider", options.CatalogProviderId);
        Assert.Equal("catalog-model", options.CatalogModel);
        Assert.Equal("content-provider", options.ContentProviderId);
        Assert.Equal("content-model", options.ContentModel);
        Assert.Equal("translation-provider", options.TranslationProviderId);
        Assert.Equal("translation-model", options.TranslationModel);
    }

    [Fact]
    public void Apply_ShouldIgnoreLegacyAiEndpointAndKeyFallbacks()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["AI:Endpoint"] = "https://global.example/v1",
            ["AI:ApiKey"] = "global-key",
            ["CHAT_REQUEST_TYPE"] = "OpenAI",
            ["WIKI_CONTENT_API_KEY"] = "content-key",
            ["WIKI_TRANSLATION_ENDPOINT"] = "https://translation.example/v1",
            ["WIKI_TRANSLATION_API_KEY"] = "translation-key",
            ["WIKI_TRANSLATION_REQUEST_TYPE"] = "Anthropic"
        });

        var options = new WikiGeneratorOptions();

        WikiGeneratorOptionsConfigurator.Apply(options, configuration);

        Assert.Null(options.CatalogProviderId);
        Assert.Equal("gpt-5-mini", options.CatalogModel);
        Assert.Null(options.ContentProviderId);
        Assert.Equal("gpt-5.2", options.ContentModel);
        Assert.Null(options.TranslationProviderId);
        Assert.Null(options.TranslationModel);
    }

    private static IConfiguration BuildConfiguration(IEnumerable<KeyValuePair<string, string?>> settings)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }
}
