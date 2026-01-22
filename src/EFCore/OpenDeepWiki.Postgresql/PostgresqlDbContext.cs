using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OpenDeepWiki.EFCore;

namespace OpenDeepWiki.Postgresql;

public class PostgresqlDbContext(DbContextOptions<PostgresqlDbContext> options)
    : MasterDbContext(options)
{
}

public static class PostgresqlServiceCollectionExtensions
{
    public static IServiceCollection AddOpenDeepWikiPostgresql(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<IContext, PostgresqlDbContext>(
            options => options.UseNpgsql(connectionString));
        return services;
    }
}
