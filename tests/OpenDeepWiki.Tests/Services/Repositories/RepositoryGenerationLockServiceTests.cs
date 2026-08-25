using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Repositories;
using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Repositories;

public class RepositoryGenerationLockServiceTests
{
    [Fact]
    public async Task TryAcquireAsync_AllowsReservationWithoutBindingInstance()
    {
        using var context = CreateContext();
        SeedRepository(context, "repo-a");
        await context.SaveChangesAsync();

        var service = CreateService(context, "api-instance");
        var acquired = await service.TryAcquireAsync(
            context,
            "repo-a",
            RepositoryGenerationLockOwnerType.Repository,
            "repo-a",
            RepositoryGenerationLockScope.Repository);

        Assert.True(acquired);
        var generationLock = await context.RepositoryGenerationLocks.SingleAsync();
        Assert.Null(generationLock.InstanceId);
    }

    [Fact]
    public async Task TryAcquireAsync_BindsReservationToCurrentInstance()
    {
        using var context = CreateContext();
        SeedRepository(context, "repo-a");
        await context.SaveChangesAsync();

        var service = CreateService(context, "worker-a");
        Assert.True(await service.TryAcquireAsync(
            context,
            "repo-a",
            RepositoryGenerationLockOwnerType.Repository,
            "repo-a",
            RepositoryGenerationLockScope.Repository));

        Assert.True(await service.TryAcquireAsync(
            context,
            "repo-a",
            RepositoryGenerationLockOwnerType.Repository,
            "repo-a",
            RepositoryGenerationLockScope.Repository,
            bindToCurrentInstance: true));

        var generationLock = await context.RepositoryGenerationLocks.SingleAsync();
        Assert.Equal("worker-a", generationLock.InstanceId);
        Assert.NotNull(generationLock.HeartbeatAt);
    }

    [Fact]
    public async Task TryAcquireAsync_RejectsLiveLockHeldByAnotherInstance()
    {
        using var context = CreateContext();
        SeedRepository(context, "repo-a");
        await context.SaveChangesAsync();

        var first = CreateService(context, "worker-a");
        var second = CreateService(context, "worker-b");

        Assert.True(await first.TryAcquireAsync(
            context,
            "repo-a",
            RepositoryGenerationLockOwnerType.Repository,
            "repo-a",
            RepositoryGenerationLockScope.Repository,
            bindToCurrentInstance: true));

        Assert.False(await second.TryAcquireAsync(
            context,
            "repo-a",
            RepositoryGenerationLockOwnerType.Repository,
            "repo-a",
            RepositoryGenerationLockScope.Repository,
            bindToCurrentInstance: true));
    }

    private static RepositoryGenerationLockService CreateService(IContext context, string instanceId)
    {
        return new RepositoryGenerationLockService(
            context,
            new WikiGenerationInstanceIdentity(instanceId),
            new StaticOptionsMonitor<WikiGeneratorOptions>(new WikiGeneratorOptions()));
    }

    private static TestDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestDbContext(options);
    }

    private static void SeedRepository(TestDbContext context, string id)
    {
        context.Repositories.Add(new Repository
        {
            Id = id,
            OwnerUserId = "user-1",
            GitUrl = $"https://github.com/demo/{id}.git",
            OrgName = "demo",
            RepoName = id,
            Status = RepositoryStatus.Pending
        });
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options) : MasterDbContext(options);

    private sealed class StaticOptionsMonitor<T>(T value) : IOptionsMonitor<T>
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => new Noop();

        private sealed class Noop : IDisposable
        {
            public void Dispose()
            {
            }
        }
    }
}
