using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

public class WikiLanguageNamesTests
{
    [Theory]
    [InlineData("zh", "Chinese (Simplified)")]
    [InlineData("zh-CN", "Chinese (Simplified)")]
    [InlineData("zh-tw", "Chinese (Traditional)")]
    [InlineData("pt-BR", "Portuguese (Brazil)")]
    [InlineData("pt-br", "Portuguese (Brazil)")]
    [InlineData("ja", "Japanese")]
    [InlineData("ko", "Korean")]
    [InlineData("es", "Spanish")]
    [InlineData("fr", "French")]
    [InlineData("de", "German")]
    [InlineData("pl", "Polish")]
    [InlineData("ru", "Russian")]
    [InlineData("ar", "Arabic")]
    [InlineData("it", "Italian")]
    [InlineData(null, "English")]
    [InlineData("", "English")]
    public void GetEnglishName_ShouldMapKnownCodes(string? code, string expected)
    {
        Assert.Equal(expected, WikiLanguageNames.GetEnglishName(code));
    }

    [Fact]
    public void GetEnglishName_ShouldKeepUnknownCodes()
    {
        Assert.Equal("xx-custom", WikiLanguageNames.GetEnglishName("xx-custom"));
    }

    [Fact]
    public void GetTranslationLanguages_ShouldExcludePrimaryAndKeepNewDefaults()
    {
        var options = new WikiGeneratorOptions();

        var languages = options.GetTranslationLanguages("en");

        Assert.DoesNotContain("en", languages);
        Assert.Contains("zh", languages);
        Assert.Contains("zh-tw", languages);
        Assert.Contains("ja", languages);
        Assert.Contains("ko", languages);
        Assert.Contains("es", languages);
        Assert.Contains("fr", languages);
        Assert.Contains("de", languages);
        Assert.Contains("pt-br", languages);
        Assert.Contains("pl", languages);
        Assert.Contains("ru", languages);
        Assert.Contains("ar", languages);
        Assert.Equal(11, languages.Count);
    }
}
