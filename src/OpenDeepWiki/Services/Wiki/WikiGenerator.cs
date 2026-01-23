using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Agents.Tools;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Prompts;
using OpenDeepWiki.Services.Repositories;

namespace OpenDeepWiki.Services.Wiki;

/// <summary>
/// Implementation of IWikiGenerator using AI agents.
/// Generates wiki catalog structures and document content using configured AI models.
/// </summary>
public class WikiGenerator : IWikiGenerator
{
    private readonly AgentFactory _agentFactory;
    private readonly IPromptPlugin _promptPlugin;
    private readonly WikiGeneratorOptions _options;
    private readonly IContext _context;
    private readonly ILogger<WikiGenerator> _logger;

    /// <summary>
    /// Initializes a new instance of WikiGenerator.
    /// </summary>
    public WikiGenerator(
        AgentFactory agentFactory,
        IPromptPlugin promptPlugin,
        IOptions<WikiGeneratorOptions> options,
        IContext context,
        ILogger<WikiGenerator> logger)
    {
        _agentFactory = agentFactory ?? throw new ArgumentNullException(nameof(agentFactory));
        _promptPlugin = promptPlugin ?? throw new ArgumentNullException(nameof(promptPlugin));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task GenerateCatalogAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Generating catalog for {Org}/{Repo} branch {Branch} language {Language}",
            workspace.Organization, workspace.RepositoryName, 
            workspace.BranchName, branchLanguage.LanguageCode);

        var prompt = await _promptPlugin.LoadPromptAsync(
            "catalog-generator",
            new Dictionary<string, string>
            {
                ["repository_name"] = $"{workspace.Organization}/{workspace.RepositoryName}",
                ["language"] = branchLanguage.LanguageCode
            },
            cancellationToken);

        var gitTool = new GitTool(workspace.WorkingDirectory);
        var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
        var catalogTool = new CatalogTool(catalogStorage);

        await ExecuteAgentWithRetryAsync(
            _options.CatalogModel,
            _options.GetCatalogRequestOptions(),
            prompt,
            "分析仓库结构并生成 Wiki 目录结构",
            new object[] { gitTool, catalogTool },
            cancellationToken);

        _logger.LogInformation("Catalog generation completed for {Org}/{Repo}",
            workspace.Organization, workspace.RepositoryName);
    }


    /// <inheritdoc />
    public async Task GenerateDocumentsAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Generating documents for {Org}/{Repo} branch {Branch} language {Language}",
            workspace.Organization, workspace.RepositoryName,
            workspace.BranchName, branchLanguage.LanguageCode);

        // Get all catalog items that need content generation
        var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
        var catalogJson = await catalogStorage.GetCatalogJsonAsync(cancellationToken);
        var catalogItems = GetAllCatalogPaths(catalogJson);

        _logger.LogInformation("Found {Count} catalog items to generate content for", catalogItems.Count);

        foreach (var (path, title) in catalogItems)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await GenerateDocumentContentAsync(
                workspace, branchLanguage, path, title, cancellationToken);
        }

        _logger.LogInformation("Document generation completed for {Org}/{Repo}",
            workspace.Organization, workspace.RepositoryName);
    }

    /// <inheritdoc />
    public async Task IncrementalUpdateAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        string[] changedFiles,
        CancellationToken cancellationToken = default)
    {
        if (changedFiles.Length == 0)
        {
            _logger.LogInformation("No changed files, skipping incremental update");
            return;
        }

        _logger.LogInformation(
            "Performing incremental update for {Org}/{Repo} with {Count} changed files",
            workspace.Organization, workspace.RepositoryName, changedFiles.Length);

        var prompt = await _promptPlugin.LoadPromptAsync(
            "incremental-updater",
            new Dictionary<string, string>
            {
                ["repository_name"] = $"{workspace.Organization}/{workspace.RepositoryName}",
                ["language"] = branchLanguage.LanguageCode,
                ["previous_commit"] = workspace.PreviousCommitId ?? "initial",
                ["current_commit"] = workspace.CommitId,
                ["changed_files"] = string.Join("\n", changedFiles.Select(f => $"- {f}"))
            },
            cancellationToken);

        var gitTool = new GitTool(workspace.WorkingDirectory);
        var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
        var catalogTool = new CatalogTool(catalogStorage);
        var docTool = new DocTool(_context, branchLanguage.Id);

        await ExecuteAgentWithRetryAsync(
            _options.ContentModel,
            _options.GetContentRequestOptions(),
            prompt,
            "分析变更文件并更新相关的 Wiki 文档",
            new object[] { gitTool, catalogTool, docTool },
            cancellationToken);

        _logger.LogInformation("Incremental update completed for {Org}/{Repo}",
            workspace.Organization, workspace.RepositoryName);
    }

    /// <summary>
    /// Generates content for a single catalog item.
    /// </summary>
    private async Task GenerateDocumentContentAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        string catalogPath,
        string catalogTitle,
        CancellationToken cancellationToken)
    {
        _logger.LogDebug("Generating content for catalog item: {Path} - {Title}", catalogPath, catalogTitle);

        var prompt = await _promptPlugin.LoadPromptAsync(
            "content-generator",
            new Dictionary<string, string>
            {
                ["repository_name"] = $"{workspace.Organization}/{workspace.RepositoryName}",
                ["language"] = branchLanguage.LanguageCode,
                ["catalog_path"] = catalogPath,
                ["catalog_title"] = catalogTitle
            },
            cancellationToken);

        var gitTool = new GitTool(workspace.WorkingDirectory);
        var docTool = new DocTool(_context, branchLanguage.Id);

        await ExecuteAgentWithRetryAsync(
            _options.ContentModel,
            _options.GetContentRequestOptions(),
            prompt,
            $"为 '{catalogTitle}' 生成 Wiki 文档内容",
            new object[] { gitTool, docTool },
            cancellationToken);
    }


    /// <summary>
    /// Executes an AI agent with retry logic.
    /// </summary>
    private async Task ExecuteAgentWithRetryAsync(
        string model,
        AiRequestOptions requestOptions,
        string systemPrompt,
        string userMessage,
        object[] tools,
        CancellationToken cancellationToken)
    {
        var retryCount = 0;
        Exception? lastException = null;

        while (retryCount < _options.MaxRetryAttempts)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                // Create the chat client with tools using the AgentFactory
                var (chatClient, aiTools) = _agentFactory.CreateChatClientWithTools(
                    model,
                    tools,
                    requestOptions);

                // Build the conversation with system prompt and user message
                var messages = new List<ChatMessage>
                {
                    new(ChatRole.System, systemPrompt),
                    new(ChatRole.User, userMessage)
                };

                // Create chat options with the tools
                var chatOptions = new ChatOptions
                {
                    Tools = aiTools
                };

                // Use the chat client with automatic function calling
                var response = await chatClient.GetResponseAsync(messages, chatOptions, cancellationToken);
                
                // The response should contain the result after tool execution
                return;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                lastException = ex;
                retryCount++;

                if (retryCount < _options.MaxRetryAttempts)
                {
                    _logger.LogWarning(
                        ex,
                        "Agent execution attempt {Attempt} failed, retrying in {Delay}ms",
                        retryCount, _options.RetryDelayMs);

                    await Task.Delay(_options.RetryDelayMs, cancellationToken);
                }
            }
        }

        throw new InvalidOperationException(
            $"AI agent execution failed after {_options.MaxRetryAttempts} attempts",
            lastException);
    }

    /// <summary>
    /// Extracts all catalog paths and titles from the catalog JSON.
    /// </summary>
    private static List<(string Path, string Title)> GetAllCatalogPaths(string catalogJson)
    {
        var result = new List<(string, string)>();

        try
        {
            var root = System.Text.Json.JsonSerializer.Deserialize<CatalogRoot>(
                catalogJson,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                });

            if (root?.Items != null)
            {
                CollectCatalogPaths(root.Items, result);
            }
        }
        catch (System.Text.Json.JsonException)
        {
            // Return empty list if JSON parsing fails
        }

        return result;
    }

    /// <summary>
    /// Recursively collects catalog paths and titles.
    /// </summary>
    private static void CollectCatalogPaths(
        List<CatalogItem> items,
        List<(string Path, string Title)> result)
    {
        foreach (var item in items)
        {
            result.Add((item.Path, item.Title));

            if (item.Children.Count > 0)
            {
                CollectCatalogPaths(item.Children, result);
            }
        }
    }
}
