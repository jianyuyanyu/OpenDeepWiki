using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities.Tools;
using OpenDeepWiki.Services.Chat;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Chat;

public class SkillToolConverterTests
{
    [Fact]
    public async Task ConvertSkillConfigsToToolsAsync_CanRunConcurrentlyWithSeparateContexts()
    {
        var databaseName = Guid.NewGuid().ToString();
        var databaseRoot = new InMemoryDatabaseRoot();

        await using (var seedContext = CreateContext(databaseName, databaseRoot))
        {
            seedContext.SkillConfigs.AddRange(
                CreateSkill("skill-alpha", "alpha-skill", isActive: true, sortOrder: 2),
                CreateSkill("skill-beta", "beta-skill", isActive: true, sortOrder: 1),
                CreateSkill("skill-inactive", "inactive-skill", isActive: false, sortOrder: 3));
            await seedContext.SaveChangesAsync();
        }

        var contextFactory = new TestContextFactory(databaseName, databaseRoot);
        var converter = new SkillToolConverter(
            contextFactory,
            NullLogger<SkillToolConverter>.Instance,
            new ConfigurationBuilder().Build());

        var skillIds = new List<string> { "skill-alpha", "skill-beta", "skill-inactive" };
        var conversions = Enumerable.Range(0, 12)
            .Select(_ => converter.ConvertSkillConfigsToToolsAsync(skillIds))
            .ToArray();

        var results = await Task.WhenAll(conversions);

        Assert.Equal(conversions.Length, contextFactory.CreateCount);
        Assert.All(results, tools =>
        {
            var tool = Assert.Single(tools);
            Assert.Equal("Skill", tool.Name);
            Assert.Contains("alpha-skill", tool.Description);
            Assert.Contains("beta-skill", tool.Description);
            Assert.DoesNotContain("inactive-skill", tool.Description);
        });
    }

    private static SkillConfig CreateSkill(string id, string name, bool isActive, int sortOrder)
    {
        return new SkillConfig
        {
            Id = id,
            Name = name,
            Description = $"{name} description",
            FolderPath = name,
            IsActive = isActive,
            SortOrder = sortOrder
        };
    }

    private static TestDbContext CreateContext(string databaseName, InMemoryDatabaseRoot databaseRoot)
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(databaseName, databaseRoot)
            .Options;

        return new TestDbContext(options);
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
            return SkillToolConverterTests.CreateContext(_databaseName, _databaseRoot);
        }
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options)
        : MasterDbContext(options);
}
