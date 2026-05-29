using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Infrastructure;
using Xunit;

namespace OpenDeepWiki.Tests.Infrastructure;

public class DbInitializerTests
{
    [Fact]
    public async Task InitializeAsync_WhenSqliteDatabaseIsMissingGraphifyArtifacts_CreatesTheTable()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.db");
        var tableExists = false;

        try
        {
            await using (var setupContext = CreateContext(dbPath))
            {
                await setupContext.Database.EnsureCreatedAsync();
                await setupContext.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS GraphifyArtifacts");
            }

            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
            services.AddLogging();
            services.AddScoped<IContext>(_ => CreateContext(dbPath));

            using (var serviceProvider = services.BuildServiceProvider())
            {
                await DbInitializer.InitializeAsync(serviceProvider);
            }

            await using (var verificationContext = CreateContext(dbPath))
            {
                tableExists = await TableExistsAsync(verificationContext, "GraphifyArtifacts");
            }
        }
        finally
        {
            DeleteDatabase(dbPath);
        }

        Assert.True(tableExists);
    }

    [Fact]
    public async Task InitializeAsync_WhenSqliteDatabaseIsMissingSkillExportColumns_CreatesColumns()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.db");

        try
        {
            await using (var setupContext = CreateContext(dbPath))
            {
                await setupContext.Database.EnsureCreatedAsync();
                await setupContext.Database.ExecuteSqlRawAsync("ALTER TABLE Repositories DROP COLUMN GenerateSkill");
                await setupContext.Database.ExecuteSqlRawAsync("ALTER TABLE BranchLanguages DROP COLUMN SkillGeneratedAt");
                await setupContext.Database.ExecuteSqlRawAsync("ALTER TABLE BranchLanguages DROP COLUMN SkillMarkdown");
            }

            await RunInitializerAsync(dbPath);

            await using var verificationContext = CreateContext(dbPath);
            Assert.True(await ColumnExistsAsync(verificationContext, "Repositories", "GenerateSkill"));
            Assert.True(await ColumnExistsAsync(verificationContext, "BranchLanguages", "SkillGeneratedAt"));
            Assert.True(await ColumnExistsAsync(verificationContext, "BranchLanguages", "SkillMarkdown"));
        }
        finally
        {
            DeleteDatabase(dbPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_WhenGpt5ModelProviderTypeIsMissing_BackfillsResponses()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.db");

        try
        {
            await using (var setupContext = CreateContext(dbPath))
            {
                await setupContext.Database.EnsureCreatedAsync();
                setupContext.AiModelConfigs.Add(CreateModel("gpt-5.2", null));
                await setupContext.SaveChangesAsync();
            }

            await RunInitializerAsync(dbPath);

            await using var verificationContext = CreateContext(dbPath);
            var model = await verificationContext.AiModelConfigs.SingleAsync(m => m.ModelId == "gpt-5.2");
            Assert.Equal("OpenAIResponses", model.ProviderType);
        }
        finally
        {
            DeleteDatabase(dbPath);
        }
    }

    [Fact]
    public async Task InitializeAsync_WhenGpt5ModelProviderTypeIsSet_DoesNotOverwriteIt()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.db");

        try
        {
            await using (var setupContext = CreateContext(dbPath))
            {
                await setupContext.Database.EnsureCreatedAsync();
                setupContext.AiModelConfigs.Add(CreateModel("gpt-5.2", "OpenAI"));
                await setupContext.SaveChangesAsync();
            }

            await RunInitializerAsync(dbPath);

            await using var verificationContext = CreateContext(dbPath);
            var model = await verificationContext.AiModelConfigs.SingleAsync(m => m.ModelId == "gpt-5.2");
            Assert.Equal("OpenAI", model.ProviderType);
        }
        finally
        {
            DeleteDatabase(dbPath);
        }
    }

    private static SqliteTestDbContext CreateContext(string dbPath)
    {
        var options = new DbContextOptionsBuilder<SqliteTestDbContext>()
            .UseSqlite($"Data Source={dbPath}")
            .Options;

        return new SqliteTestDbContext(options);
    }

    private static async Task RunInitializerAsync(string dbPath)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddLogging();
        services.AddScoped<IContext>(_ => CreateContext(dbPath));

        using var serviceProvider = services.BuildServiceProvider();
        await DbInitializer.InitializeAsync(serviceProvider);
    }

    private static AiModelConfig CreateModel(string modelId, string? providerType)
    {
        return new AiModelConfig
        {
            Id = Guid.NewGuid().ToString(),
            ProviderId = "provider-id",
            ModelId = modelId,
            Name = modelId,
            ModelType = "chat",
            ProviderType = providerType,
            SupportsTools = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static void DeleteDatabase(string dbPath)
    {
        if (!File.Exists(dbPath))
        {
            return;
        }

        try
        {
            File.Delete(dbPath);
        }
        catch (IOException)
        {
            // SQLite can keep a file handle alive briefly after context disposal.
        }
    }

    private static async Task<bool> TableExistsAsync(DbContext context, string tableName)
    {
        var connection = context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $name";

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$name";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result) > 0;
    }

    private static async Task<bool> ColumnExistsAsync(DbContext context, string tableName, string columnName)
    {
        var connection = context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{tableName}') WHERE name = $name";

        var parameter = command.CreateParameter();
        parameter.ParameterName = "$name";
        parameter.Value = columnName;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt64(result) > 0;
    }

    private sealed class SqliteTestDbContext(DbContextOptions<SqliteTestDbContext> options)
        : MasterDbContext(options);
}
