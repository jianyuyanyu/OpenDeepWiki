using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenDeepWiki.EFCore;

namespace OpenDeepWiki.Sqlite;

public class SqliteDbContext(DbContextOptions<SqliteDbContext> options)
    : MasterDbContext(options)
{
}

/// <summary>
/// Factory for creating SqliteDbContext instances in parallel operations.
/// </summary>
public class SqliteContextFactory : IContextFactory
{
    private readonly IDbContextFactory<SqliteDbContext> _factory;

    public SqliteContextFactory(IDbContextFactory<SqliteDbContext> factory)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
    }

    public IContext CreateContext()
    {
        return _factory.CreateDbContext();
    }
}

public static class SqliteServiceCollectionExtensions
{
    public static IServiceCollection AddOpenDeepWikiSqlite(
        this IServiceCollection services,
        string connectionString)
    {
        // Register DbContext for normal DI
        services.AddDbContext<IContext, SqliteDbContext>(
            options => options.UseSqlite(connectionString));

        // Register DbContextFactory for parallel operations
        services.AddDbContextFactory<SqliteDbContext>(
            options => options.UseSqlite(connectionString));

        // Register IContextFactory
        services.AddSingleton<IContextFactory, SqliteContextFactory>();

        return services;
    }
}
