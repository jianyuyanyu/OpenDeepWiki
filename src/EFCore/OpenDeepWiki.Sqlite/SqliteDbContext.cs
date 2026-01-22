using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenDeepWiki.EFCore;

namespace OpenDeepWiki.Sqlite;

public class SqliteDbContext(DbContextOptions<SqliteDbContext> options)
    : MasterDbContext(options)
{
}

public static class SqliteServiceCollectionExtensions
{
    public static IServiceCollection AddOpenDeepWikiSqlite(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<IContext, SqliteDbContext>(
            options => options.UseSqlite(connectionString));
        return services;
    }
}
