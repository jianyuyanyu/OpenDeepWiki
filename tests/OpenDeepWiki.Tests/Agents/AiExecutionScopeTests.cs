using OpenDeepWiki.Agents;
using Xunit;

namespace OpenDeepWiki.Tests.Agents;

public class AiExecutionScopeTests
{
    [Fact]
    public void Begin_ShouldExposeAndRestoreNestedContext()
    {
        var outer = new AiExecutionContext
        {
            BusinessTag = "wiki_catalog_generation",
            Description = "仓库目录生成",
            Repository = "octo/wiki"
        };
        var inner = new AiExecutionContext
        {
            BusinessTag = "embed_chat",
            Description = "嵌入式聊天",
            AppId = "app-1"
        };

        Assert.Null(AiExecutionScope.Current);

        using (AiExecutionScope.Begin(outer))
        {
            Assert.Same(outer, AiExecutionScope.Current);

            using (AiExecutionScope.Begin(inner))
            {
                Assert.Same(inner, AiExecutionScope.Current);
            }

            Assert.Same(outer, AiExecutionScope.Current);
        }

        Assert.Null(AiExecutionScope.Current);
    }

    [Fact]
    public void ToSummary_ShouldIncludeKeyBusinessMarkers()
    {
        var context = new AiExecutionContext
        {
            BusinessTag = "wiki_document_generation",
            Description = "仓库文档生成",
            Repository = "octo/wiki",
            Branch = "main",
            Language = "zh-CN",
            DocumentPath = "architecture/overview",
            ModelId = "gpt-5-mini"
        };

        var summary = context.ToSummary();

        Assert.Contains("tag=wiki_document_generation", summary);
        Assert.Contains("desc=仓库文档生成", summary);
        Assert.Contains("repo=octo/wiki", summary);
        Assert.Contains("branch=main", summary);
        Assert.Contains("lang=zh-CN", summary);
        Assert.Contains("path=architecture/overview", summary);
        Assert.Contains("model=gpt-5-mini", summary);
    }
}
