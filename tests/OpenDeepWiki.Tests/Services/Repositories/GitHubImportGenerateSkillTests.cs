using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Admin;
using OpenDeepWiki.Models.GitHub;
using OpenDeepWiki.Services.Admin;
using OpenDeepWiki.Services.GitHub;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Repositories;

public class GitHubImportGenerateSkillTests
{
    [Fact]
    public async Task UserImportAsync_ShouldPersistGenerateSkill()
    {
        await using var context = CreateContext();
        var service = new UserGitHubImportService(
            context,
            Mock.Of<IGitHubAppService>(),
            Mock.Of<ILogger<UserGitHubImportService>>());

        await service.ImportAsync(new UserImportRequest
        {
            InstallationId = 1,
            LanguageCode = "en",
            GenerateSkill = false,
            Repos =
            [
                CreateImportRepo("owner/user-repo")
            ]
        }, "user-1");

        var repository = await context.Repositories.SingleAsync();
        Assert.False(repository.GenerateSkill);
    }

    [Fact]
    public async Task AdminBatchImportAsync_ShouldPersistGenerateSkill()
    {
        await using var context = CreateContext();
        context.Departments.Add(new Department
        {
            Id = "dept-1",
            Name = "Engineering",
            IsActive = true
        });
        await context.SaveChangesAsync();

        var service = new AdminGitHubImportService(
            context,
            Mock.Of<IGitHubAppService>(),
            Mock.Of<IAdminSettingsService>(),
            Mock.Of<IHttpClientFactory>(),
            new GitHubAppCredentialCache(),
            new ConfigurationBuilder().Build(),
            Mock.Of<ILogger<AdminGitHubImportService>>());

        await service.BatchImportAsync(new BatchImportRequest
        {
            InstallationId = 1,
            DepartmentId = "dept-1",
            LanguageCode = "en",
            GenerateSkill = false,
            Repos =
            [
                CreateImportRepo("owner/admin-repo")
            ]
        }, "admin-1");

        var repository = await context.Repositories.SingleAsync();
        Assert.False(repository.GenerateSkill);
    }

    private static BatchImportRepo CreateImportRepo(string fullName)
    {
        var parts = fullName.Split('/');
        return new BatchImportRepo
        {
            FullName = fullName,
            Owner = parts[0],
            Name = parts[1],
            CloneUrl = $"https://github.com/{fullName}.git",
            DefaultBranch = "main",
            Language = "C#",
            StargazersCount = 1,
            ForksCount = 2
        };
    }

    private static TestDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new TestDbContext(options);
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options) : MasterDbContext(options);
}
