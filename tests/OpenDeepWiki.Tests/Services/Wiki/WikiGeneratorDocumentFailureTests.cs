using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

public class WikiGeneratorDocumentFailureTests
{
    [Fact]
    public void ShouldFailDocumentGeneration_WhenAllDocumentsFail_ReturnsTrue()
    {
        var shouldFail = WikiGenerator.ShouldFailDocumentGeneration(
            successCount: 0,
            failCount: 5);

        Assert.True(shouldFail);
    }

    [Fact]
    public void ShouldFailDocumentGeneration_WhenSomeDocumentsSucceed_ReturnsFalse()
    {
        var shouldFail = WikiGenerator.ShouldFailDocumentGeneration(
            successCount: 66,
            failCount: 5);

        Assert.False(shouldFail);
    }

    [Fact]
    public void ShouldFailDocumentGeneration_WhenNoDocumentsFail_ReturnsFalse()
    {
        var shouldFail = WikiGenerator.ShouldFailDocumentGeneration(
            successCount: 71,
            failCount: 0);

        Assert.False(shouldFail);
    }
}
