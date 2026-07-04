using Microsoft.Extensions.Options;
using Moq;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Repositories;
using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Repositories;

public class RepositoryScanPlanResolverTests
{
    [Fact]
    public void Resolve_WhenManualConfigured_UsesRepositoryOverrides()
    {
        var resolver = CreateResolver(new WikiGeneratorOptions
        {
            DirectoryTreeMaxDepth = 2,
            FileListMaxDepth = 1,
            MaxTreeNodes = 100,
            MaxFilesPerDirectory = 10,
            MaxTotalTreeFiles = 50
        });
        var repository = new Repository
        {
            ScanDepthMode = RepositoryScanDepthMode.Manual,
            DirectoryTreeDepthOverride = 4,
            FileListDepthOverride = 5,
            MaxTreeNodes = 1400,
            MaxFilesPerDirectory = 25,
            MaxTotalFiles = 700
        };

        var plan = resolver.Resolve(repository);

        Assert.Equal("Manual", plan.Source);
        Assert.Equal(RepositoryScanDepthMode.Manual, plan.Mode);
        Assert.Equal(4, plan.DirectoryTreeDepth);
        Assert.Equal(4, plan.FileListDepth);
        Assert.Equal(1400, plan.MaxTreeNodes);
        Assert.Equal(25, plan.MaxFilesPerDirectory);
        Assert.Equal(700, plan.MaxTotalFiles);
    }

    [Fact]
    public void Resolve_WhenAutoHasNoSavedPlan_UsesGlobalDefaults()
    {
        var resolver = CreateResolver(new WikiGeneratorOptions
        {
            DirectoryTreeMaxDepth = 3,
            FileListMaxDepth = 2,
            MaxTreeNodes = 300,
            MaxFilesPerDirectory = 12,
            MaxTotalTreeFiles = 90
        });

        var plan = resolver.Resolve(new Repository());

        Assert.Equal("Global", plan.Source);
        Assert.Equal(3, plan.DirectoryTreeDepth);
        Assert.Equal(2, plan.FileListDepth);
        Assert.Equal(300, plan.MaxTreeNodes);
        Assert.Equal(12, plan.MaxFilesPerDirectory);
        Assert.Equal(90, plan.MaxTotalFiles);
    }

    private static RepositoryScanPlanResolver CreateResolver(WikiGeneratorOptions options)
    {
        var monitor = new Mock<IOptionsMonitor<WikiGeneratorOptions>>();
        monitor.SetupGet(item => item.CurrentValue).Returns(options);
        return new RepositoryScanPlanResolver(monitor.Object);
    }
}
