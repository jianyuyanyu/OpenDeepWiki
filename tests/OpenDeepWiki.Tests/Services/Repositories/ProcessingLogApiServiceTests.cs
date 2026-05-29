using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Repositories;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Repositories;

public class ProcessingLogApiServiceTests
{
    [Fact]
    public async Task LogAsync_WhenAiOutputOrToolCall_DoesNotPersistVerboseEntries()
    {
        var databaseName = Guid.NewGuid().ToString();
        await using var provider = CreateServiceProvider(databaseName);
        var service = new ProcessingLogService(provider.GetRequiredService<IServiceScopeFactory>());
        var repositoryId = Guid.NewGuid().ToString();

        await service.LogAsync(repositoryId, ProcessingStep.Content, "raw model output", isAiOutput: true);
        await service.LogAsync(repositoryId, ProcessingStep.Content, "Tool call: ReadFile", toolName: "ReadFile");
        await service.LogAsync(repositoryId, ProcessingStep.Content, "Generating document (1/156): secret-title");

        var response = await service.GetLogsAsync(repositoryId);

        Assert.Empty(response.Logs);
        Assert.Equal(0, response.TotalDocuments);
        Assert.Equal(0, response.CompletedDocuments);
    }

    [Fact]
    public async Task LogAsync_WhenDocumentProgressMessage_StoresOnlyProgress()
    {
        var databaseName = Guid.NewGuid().ToString();
        await using var provider = CreateServiceProvider(databaseName);
        var service = new ProcessingLogService(provider.GetRequiredService<IServiceScopeFactory>());
        var repositoryId = Guid.NewGuid().ToString();

        await service.LogAsync(repositoryId, ProcessingStep.Content, "Document complete (38/156): Weixin - success");

        var response = await service.GetLogsAsync(repositoryId);

        var log = Assert.Single(response.Logs);
        Assert.Equal("Document progress (38/156)", log.Message);
        Assert.Equal(156, response.TotalDocuments);
        Assert.Equal(38, response.CompletedDocuments);
    }

    [Fact]
    public async Task LogAsync_WhenStepStatusMessage_StoresOnlyProgressMarker()
    {
        var databaseName = Guid.NewGuid().ToString();
        await using var provider = CreateServiceProvider(databaseName);
        var service = new ProcessingLogService(provider.GetRequiredService<IServiceScopeFactory>());
        var repositoryId = Guid.NewGuid().ToString();

        await service.LogAsync(repositoryId, ProcessingStep.Workspace, "Starting repository processing: AIDotNet/OpenCowork");

        var response = await service.GetLogsAsync(repositoryId);

        var log = Assert.Single(response.Logs);
        Assert.Equal(ProcessingStep.Workspace, log.Step);
        Assert.Equal("Step progress (Workspace)", log.Message);
    }

    [Fact]
    public async Task GetProcessingLogsAsync_WhenRepositoryRouteCasingDiffers_ResolvesLocalRepository()
    {
        await using var context = CreateContext();
        var repositoryId = Guid.NewGuid().ToString();
        context.Repositories.Add(new Repository
        {
            Id = repositoryId,
            OrgName = "AIDotNet",
            RepoName = "OpenCowork",
            GitUrl = "https://github.com/AIDotNet/OpenCowork.git",
            OwnerUserId = Guid.NewGuid().ToString(),
            Status = RepositoryStatus.Processing
        });
        await context.SaveChangesAsync();

        var processingLogs = new Mock<IProcessingLogService>(MockBehavior.Strict);
        processingLogs
            .Setup(service => service.GetLogsAsync(repositoryId, null, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProcessingLogResponse
            {
                CurrentStep = ProcessingStep.Content,
                Logs =
                [
                    new ProcessingLogItem
                    {
                        Id = Guid.NewGuid().ToString(),
                        Step = ProcessingStep.Content,
                        Message = "Tool call: ReadFile",
                        ToolName = "ReadFile",
                        CreatedAt = DateTime.UtcNow
                    }
                ]
            });

        var service = new ProcessingLogApiService(context, processingLogs.Object);

        await service.GetProcessingLogsAsync("aidotnet", "opencowork", null, 10);

        processingLogs.Verify(
            logs => logs.GetLogsAsync(repositoryId, null, 10, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TestDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestDbContext(options);
    }

    private static ServiceProvider CreateServiceProvider(string databaseName)
    {
        var services = new ServiceCollection();
        services.AddDbContext<TestDbContext>(options => options.UseInMemoryDatabase(databaseName));
        services.AddScoped<IContext>(provider => provider.GetRequiredService<TestDbContext>());
        return services.BuildServiceProvider();
    }

    private sealed class TestDbContext(DbContextOptions<TestDbContext> options)
        : OpenDeepWiki.EFCore.MasterDbContext(options);
}
