using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenDeepWiki.EFCore;

namespace OpenDeepWiki.Postgresql;

public class PostgresqlDbContext(DbContextOptions<PostgresqlDbContext> options)
    : MasterDbContext(options)
{
}

/// <summary>
/// Factory for creating PostgresqlDbContext instances in parallel operations.
/// </summary>
public class PostgresqlContextFactory : IContextFactory
{
    private readonly IDbContextFactory<PostgresqlDbContext> _factory;

    public PostgresqlContextFactory(IDbContextFactory<PostgresqlDbContext> factory)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
    }

    public IContext CreateContext()
    {
        return _factory.CreateDbContext();
    }
}

public static class PostgresqlServiceCollectionExtensions
{
    public static IServiceCollection AddOpenDeepWikiPostgresql(
        this IServiceCollection services,
        string connectionString)
    {
        // Register DbContext for normal DI
        services.AddDbContext<IContext, PostgresqlDbContext>(
            options => options.UseNpgsql(connectionString));

        // Register DbContextFactory for parallel operations
        services.AddDbContextFactory<PostgresqlDbContext>(
            options => options.UseNpgsql(connectionString));

        // Register IContextFactory
        services.AddSingleton<IContextFactory, PostgresqlContextFactory>();

        return services;
    }
}
