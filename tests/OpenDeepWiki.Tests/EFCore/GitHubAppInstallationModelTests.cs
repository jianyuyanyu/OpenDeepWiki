using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Tests.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.EFCore;

public class GitHubAppInstallationModelTests
{
    [Fact]
    public void DepartmentNavigation_UsesSingleExplicitForeignKey()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var context = new TestDbContext(options);

        var entityType = context.Model.FindEntityType(typeof(GitHubAppInstallation));
        Assert.NotNull(entityType);

        var departmentForeignKeys = entityType.GetForeignKeys()
            .Where(foreignKey => foreignKey.PrincipalEntityType.ClrType == typeof(Department))
            .ToList();

        var foreignKey = Assert.Single(departmentForeignKeys);
        Assert.Equal(nameof(GitHubAppInstallation.DepartmentId), Assert.Single(foreignKey.Properties).Name);
        Assert.Equal(nameof(GitHubAppInstallation.Department), foreignKey.DependentToPrincipal?.Name);
    }
}
