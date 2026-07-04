using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Services.Repositories;

public interface IRepositoryGenerationLockService
{
    Task<RepositoryGenerationLock?> GetLockAsync(
        string repositoryId,
        CancellationToken cancellationToken = default);

    Task<bool> TryAcquireAsync(
        IContext context,
        string repositoryId,
        RepositoryGenerationLockOwnerType ownerType,
        string ownerId,
        RepositoryGenerationLockScope scope,
        CancellationToken cancellationToken = default);

    Task ReleaseAsync(
        IContext context,
        string repositoryId,
        RepositoryGenerationLockOwnerType ownerType,
        string ownerId,
        CancellationToken cancellationToken = default);
}

public sealed class RepositoryGenerationLockService(IContext rootContext) : IRepositoryGenerationLockService
{
    public Task<RepositoryGenerationLock?> GetLockAsync(
        string repositoryId,
        CancellationToken cancellationToken = default)
    {
        return rootContext.RepositoryGenerationLocks
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.RepositoryId == repositoryId && !item.IsDeleted, cancellationToken);
    }

    public async Task<bool> TryAcquireAsync(
        IContext context,
        string repositoryId,
        RepositoryGenerationLockOwnerType ownerType,
        string ownerId,
        RepositoryGenerationLockScope scope,
        CancellationToken cancellationToken = default)
    {
        var existing = await context.RepositoryGenerationLocks
            .FirstOrDefaultAsync(item => item.RepositoryId == repositoryId && !item.IsDeleted, cancellationToken);

        if (existing is not null)
        {
            return existing.OwnerType == ownerType && existing.OwnerId == ownerId;
        }

        var generationLock = new RepositoryGenerationLock
        {
            Id = Guid.NewGuid().ToString(),
            RepositoryId = repositoryId,
            OwnerType = ownerType,
            OwnerId = ownerId,
            Scope = scope,
            AcquiredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        context.RepositoryGenerationLocks.Add(generationLock);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            if (context is DbContext dbContext)
            {
                dbContext.Entry(generationLock).State = EntityState.Detached;
            }

            return false;
        }
    }

    public async Task ReleaseAsync(
        IContext context,
        string repositoryId,
        RepositoryGenerationLockOwnerType ownerType,
        string ownerId,
        CancellationToken cancellationToken = default)
    {
        var generationLock = await context.RepositoryGenerationLocks
            .FirstOrDefaultAsync(item =>
                item.RepositoryId == repositoryId &&
                item.OwnerType == ownerType &&
                item.OwnerId == ownerId &&
                !item.IsDeleted,
                cancellationToken);

        if (generationLock is null)
        {
            return;
        }

        context.RepositoryGenerationLocks.Remove(generationLock);
        await context.SaveChangesAsync(cancellationToken);
    }
}
