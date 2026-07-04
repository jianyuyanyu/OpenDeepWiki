using OpenDeepWiki.Agents.Tools;
using Xunit;

namespace OpenDeepWiki.Tests.Agents.Tools;

public class RepositoryFileFilterTests
{
    [Fact]
    public void IsIgnored_WhenNestedGitIgnoreExcludesDirectory_AppliesOnlyUnderNestedScope()
    {
        var root = CreateTempDirectory();
        try
        {
            var src = Directory.CreateDirectory(Path.Combine(root, "src"));
            var generated = Directory.CreateDirectory(Path.Combine(src.FullName, "generated"));
            Directory.CreateDirectory(Path.Combine(root, "generated"));
            File.WriteAllText(Path.Combine(src.FullName, ".gitignore"), "generated/\n");
            var filter = new RepositoryFileFilter(root);

            Assert.True(filter.IsIgnored(Path.Combine(generated.FullName, "code.cs")));
            Assert.False(filter.IsIgnored(Path.Combine(root, "generated", "keep.cs")));
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void IsIgnored_WhenNestedGitIgnoreHasNegation_LaterRuleReincludesPath()
    {
        var root = CreateTempDirectory();
        try
        {
            var src = Directory.CreateDirectory(Path.Combine(root, "src"));
            File.WriteAllText(Path.Combine(src.FullName, ".gitignore"), "*.log\n!important.log\n");
            var filter = new RepositoryFileFilter(root);

            Assert.True(filter.IsIgnored(Path.Combine(src.FullName, "debug.log")));
            Assert.False(filter.IsIgnored(Path.Combine(src.FullName, "important.log")));
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "opendeepwiki-filter-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}
