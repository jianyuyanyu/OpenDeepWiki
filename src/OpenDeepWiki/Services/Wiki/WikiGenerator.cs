using System.Diagnostics;
using System.Text;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using OpenAI.Responses;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Agents.Tools;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Services.Prompts;
using OpenDeepWiki.Services.Repositories;
using ChatMessage = Microsoft.Extensions.AI.ChatMessage;

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

        _logger.LogDebug(
            "WikiGenerator initialized. CatalogModel: {CatalogModel}, ContentModel: {ContentModel}, MaxRetryAttempts: {MaxRetry}",
            _options.CatalogModel, _options.ContentModel, _options.MaxRetryAttempts);
    }

    /// <inheritdoc />
    public async Task GenerateCatalogAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting catalog generation. Repository: {Org}/{Repo}, Branch: {Branch}, Language: {Language}, BranchLanguageId: {BranchLanguageId}",
            workspace.Organization, workspace.RepositoryName,
            workspace.BranchName, branchLanguage.LanguageCode, branchLanguage.Id);

        try
        {
            _logger.LogDebug("Loading catalog-generator prompt template");
            var prompt = await _promptPlugin.LoadPromptAsync(
                "catalog-generator",
                new Dictionary<string, string>
                {
                    ["repository_name"] = $"{workspace.Organization}/{workspace.RepositoryName}",
                    ["language"] = branchLanguage.LanguageCode
                },
                cancellationToken);
            _logger.LogDebug("Prompt template loaded. Length: {PromptLength} chars", prompt.Length);

            _logger.LogDebug("Initializing tools for catalog generation");
            var gitTool = new GitTool(workspace.WorkingDirectory);
            var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
            var catalogTool = new CatalogTool(catalogStorage);

            var tools = gitTool.GetTools()
                .Concat(catalogTool.GetTools())
                .ToArray();
            _logger.LogDebug("Tools initialized. ToolCount: {ToolCount}, Tools: {ToolNames}",
                tools.Length, string.Join(", ", tools.Select(t => t.Name)));

            var userMessage = $@"Please generate a Wiki catalog structure for repository {workspace.Organization}/{workspace.RepositoryName}.

## Task Requirements

1. **Analyze Repository Structure**
   - Use ListFiles to get file list and understand overall project structure
   - Prioritize reading README.md, package.json, *.csproj and other key files
   - Identify project type (frontend/backend/fullstack/library/tool, etc.)

2. **Design Catalog Structure**
   - Organize content from user's learning and usage perspective
   - Maximum 3 levels of nesting, avoid overly deep structures
   - Follow logical order: Overview → Getting Started → Architecture → Core Modules → API → Configuration → FAQ

3. **Output Requirements**
   - Catalog titles should be in {branchLanguage.LanguageCode} language
   - Path field must use lowercase English with hyphens (e.g., getting-started)
   - Each node must contain title, path, order, children fields
   - Use WriteCatalog tool to write the final catalog structure

## Execution Steps

1. Call ListFiles() to get file overview
2. Read key files (README, config files, entry files)
3. Use Grep to search for key patterns (class definitions, interfaces, API endpoints, etc.)
4. Design catalog structure that fits the project characteristics
5. Call WriteCatalog to write the catalog

Please start executing the task.";

            await ExecuteAgentWithRetryAsync(
                _options.CatalogModel,
                _options.GetCatalogRequestOptions(),
                prompt,
                userMessage,
                tools,
                "CatalogGeneration",
                cancellationToken);

            stopwatch.Stop();
            _logger.LogInformation(
                "Catalog generation completed successfully. Repository: {Org}/{Repo}, Language: {Language}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Catalog generation failed. Repository: {Org}/{Repo}, Language: {Language}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }


    /// <inheritdoc />
    public async Task GenerateDocumentsAsync(
        RepositoryWorkspace workspace,
        BranchLanguage branchLanguage,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting document generation. Repository: {Org}/{Repo}, Branch: {Branch}, Language: {Language}",
            workspace.Organization, workspace.RepositoryName,
            workspace.BranchName, branchLanguage.LanguageCode);

        // Get all catalog items that need content generation
        var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
        var catalogJson = await catalogStorage.GetCatalogJsonAsync(cancellationToken);
        var catalogItems = GetAllCatalogPaths(catalogJson);

        _logger.LogInformation(
            "Found {Count} catalog items to generate content for. Repository: {Org}/{Repo}",
            catalogItems.Count, workspace.Organization, workspace.RepositoryName);

        if (catalogItems.Count > 0)
        {
            _logger.LogDebug("Catalog items to process: {Items}",
                string.Join(", ", catalogItems.Select(i => $"{i.Path}:{i.Title}")));
        }

        var successCount = 0;
        var failCount = 0;

        foreach (var (path, title) in catalogItems)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                await GenerateDocumentContentAsync(
                    workspace, branchLanguage, path, title, cancellationToken);
                successCount++;
            }
            catch (Exception ex)
            {
                failCount++;
                _logger.LogError(ex,
                    "Failed to generate document. Path: {Path}, Title: {Title}, Repository: {Org}/{Repo}",
                    path, title, workspace.Organization, workspace.RepositoryName);
                // Continue with other documents
            }
        }

        stopwatch.Stop();
        _logger.LogInformation(
            "Document generation completed. Repository: {Org}/{Repo}, Language: {Language}, Success: {SuccessCount}, Failed: {FailCount}, Duration: {Duration}ms",
            workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode,
            successCount, failCount, stopwatch.ElapsedMilliseconds);
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
            _logger.LogInformation(
                "No changed files, skipping incremental update. Repository: {Org}/{Repo}, Language: {Language}",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting incremental update. Repository: {Org}/{Repo}, Language: {Language}, ChangedFileCount: {Count}",
            workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, changedFiles.Length);

        if (changedFiles.Length <= 50)
        {
            _logger.LogDebug("Changed files: {ChangedFiles}", string.Join(", ", changedFiles));
        }
        else
        {
            _logger.LogDebug("Changed files (first 50): {ChangedFiles}... and {More} more",
                string.Join(", ", changedFiles.Take(50)), changedFiles.Length - 50);
        }

        try
        {
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

            _logger.LogDebug("Initializing tools for incremental update");
            var gitTool = new GitTool(workspace.WorkingDirectory);
            var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
            var catalogTool = new CatalogTool(catalogStorage);
            var docTool = new DocTool(_context, branchLanguage.Id);

            var tools = gitTool.GetTools()
                .Concat(catalogTool.GetTools())
                .Concat(docTool.GetTools())
                .ToArray();

            var userMessage = $@"Please analyze code changes in repository {workspace.Organization}/{workspace.RepositoryName} and update relevant Wiki documentation.

## Change Information

- Changed Files Count: {changedFiles.Length}

## Task Requirements

1. **Analyze Change Impact**
   - Read changed files to understand modifications
   - Evaluate change types: API changes, configuration changes, new features, bug fixes, refactoring, etc.
   - Determine which documents need updating

2. **Update Strategy**
   - High Priority: Breaking API changes, new features → Must update immediately
   - Medium Priority: Behavior modifications, config changes → Update affected sections
   - Low Priority: Bug fixes, internal refactoring → Usually no documentation update needed

3. **Execute Updates**
   - Use ReadCatalog to get current catalog structure
   - Use ReadDoc to read documents that need updating
   - For minor changes, use EditDoc for precise replacements
   - For major changes, use WriteDoc to rewrite entire document
   - If new catalog items needed, use EditCatalog or WriteCatalog

4. **Quality Requirements**
   - Ensure code examples match current implementation
   - Maintain documentation language as {branchLanguage.LanguageCode}
   - Update API signatures, configuration options, usage examples, etc.

## Execution Steps

1. Read changed files and analyze change content
2. Read current catalog structure to identify affected documents
3. Read content of affected documents
4. Execute necessary document updates
5. Verify updates are complete

Please start executing the task.";

            await ExecuteAgentWithRetryAsync(
                _options.ContentModel,
                _options.GetContentRequestOptions(),
                prompt,
                userMessage,
                tools,
                "IncrementalUpdate",
                cancellationToken);

            stopwatch.Stop();
            _logger.LogInformation(
                "Incremental update completed successfully. Repository: {Org}/{Repo}, Language: {Language}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Incremental update failed. Repository: {Org}/{Repo}, Language: {Language}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, stopwatch.ElapsedMilliseconds);
            throw;
        }
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
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting document content generation. Path: {Path}, Title: {Title}, Language: {Language}",
            catalogPath, catalogTitle, branchLanguage.LanguageCode);

        try
        {
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

            var tools = gitTool.GetTools()
                .Concat(docTool.GetTools())
                .ToArray();

            var userMessage = $@"Please generate Wiki document content for catalog item ""{catalogTitle}"" (path: {catalogPath}).

## Repository Information

- Repository: {workspace.Organization}/{workspace.RepositoryName}
- Target Language: {branchLanguage.LanguageCode}

## Task Requirements

1. **Gather Source Material**
   - Use ListFiles to find source files related to ""{catalogTitle}""
   - Read key implementation files, interface definitions, configuration files
   - Use Grep to search for related classes, functions, API endpoints

2. **Document Structure** (Must Include)
   - Title (H1): Must match catalog title
   - Overview: Explain purpose and use cases
   - Main Content: Detailed explanation of implementation, architecture, or usage
   - Usage Examples: Code examples extracted from actual source code
   - Configuration Options (if applicable): List options in table format
   - API Reference (if applicable): Method signatures, parameters, return values
   - Related Links: Links to related documentation

3. **Content Quality Requirements**
   - All information must be based on actual source code, do not fabricate
   - Code examples must be extracted from repository with syntax highlighting
   - Explain design intent (WHY), not just description (WHAT)
   - Write document content in {branchLanguage.LanguageCode} language
   - Keep code identifiers in original form, do not translate

4. **Output Requirements**
   - Use WriteDoc tool to write the document
   - catalogPath parameter: {catalogPath}

## Execution Steps

1. Analyze catalog title to determine document scope
2. Use ListFiles and Grep to find related source files
3. Read key files, extract information and code examples
4. Organize content following document structure template
5. Call WriteDoc(""{catalogPath}"", content) to write document

Please start executing the task.";

            await ExecuteAgentWithRetryAsync(
                _options.ContentModel,
                _options.GetContentRequestOptions(),
                prompt,
                userMessage,
                tools,
                $"DocumentContent:{catalogPath}",
                cancellationToken);

            stopwatch.Stop();
            _logger.LogInformation(
                "Document content generation completed. Path: {Path}, Title: {Title}, Duration: {Duration}ms",
                catalogPath, catalogTitle, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Document content generation failed. Path: {Path}, Title: {Title}, Duration: {Duration}ms",
                catalogPath, catalogTitle, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }


    /// <summary>
    /// Executes an AI agent with retry logic.
    /// </summary>
    private async Task ExecuteAgentWithRetryAsync(
        string model,
        AiRequestOptions requestOptions,
        string systemPrompt,
        string userMessage,
        AITool[] tools,
        string operationName,
        CancellationToken cancellationToken)
    {
        var retryCount = 0;
        Exception? lastException = null;

        _logger.LogDebug(
            "Starting AI agent execution. Operation: {Operation}, Model: {Model}, ToolCount: {ToolCount}",
            operationName, model, tools.Length);

        while (retryCount < _options.MaxRetryAttempts)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var attemptStopwatch = Stopwatch.StartNew();

            try
            {
                _logger.LogDebug(
                    "AI agent attempt {Attempt}/{MaxAttempts}. Operation: {Operation}, Model: {Model}",
                    retryCount + 1, _options.MaxRetryAttempts, operationName, model);

                // Create chat options with the tools
                var chatOptions = new ChatClientAgentOptions
                {
                    ChatOptions = new ChatOptions()
                    {
                        ToolMode = ChatToolMode.Auto,
                        MaxOutputTokens = 32000,
                        Tools = tools
                    }
                };

                // Create the chat client with tools using the AgentFactory
                var (chatClient, aiTools) = _agentFactory.CreateChatClientWithTools(
                    model,
                    tools,
                    chatOptions,
                    requestOptions);

                // Build the conversation with system prompt and user message
                var messages = new List<ChatMessage>
                {
                    new(ChatRole.System, systemPrompt),
                    new(ChatRole.User, new List<AIContent>()
                    {
                        new TextContent(userMessage),
                        new TextContent("""
                                        <system-remind>
                                        IMPORTANT REMINDERS:
                                        1. You MUST use the provided tools to complete the task. Do not just describe what you would do.
                                        2. All content must be based on actual source code from the repository. Do NOT fabricate or assume.
                                        3. After completing all tool calls, provide a brief summary of what was accomplished.
                                        4. If you encounter errors, retry with adjusted parameters or report the issue.
                                        5. Do NOT output the full document content in your response - write it using the tools instead.
                                        </system-remind>
                                        """)
                    })
                };

                // Use streaming response for real-time output
                var contentBuilder = new System.Text.StringBuilder();
                UsageDetails? usageDetails = null;
                var toolCallCount = 0;

                _logger.LogDebug("Starting streaming response. Operation: {Operation}", operationName);

                var thread = await chatClient.GetNewThreadAsync(cancellationToken);

                await foreach (var update in chatClient.RunStreamingAsync(messages, thread, cancellationToken: cancellationToken))
                {
                    // Print streaming content
                    if (!string.IsNullOrEmpty(update.Text))
                    {
                        Console.Write(update.Text);
                        contentBuilder.Append(update.Text);
                    }

                    if (update.RawRepresentation is StreamingChatCompletionUpdate chatCompletionUpdate &&
                        chatCompletionUpdate.ToolCallUpdates.Count > 0)
                    {
                        foreach (var tool in chatCompletionUpdate.ToolCallUpdates)
                        {
                            if (!string.IsNullOrEmpty(tool.FunctionName))
                            {
                                toolCallCount++;
                                Console.WriteLine();
                                Console.Write("Call Function:" + tool.FunctionName);
                                _logger.LogDebug(
                                    "Tool call #{CallNumber}: {FunctionName}. Operation: {Operation}",
                                    toolCallCount, tool.FunctionName, operationName);
                            }
                            else
                            {
                                Console.Write(" " +
                                              Encoding.UTF8.GetString(tool.FunctionArgumentsUpdate.ToArray()));
                            }
                        }
                    }

                    // Check for usage information in the update contents (typically in the final update)
                    var usage = update.Contents.OfType<UsageContent>().FirstOrDefault()?.Details;
                    if (usage != null)
                    {
                        usageDetails = usage;
                    }
                }

                // Print newline after streaming completes
                Console.WriteLine();

                attemptStopwatch.Stop();

                // Log usage statistics
                if (usageDetails != null)
                {
                    _logger.LogInformation(
                        "AI agent completed. Operation: {Operation}, Model: {Model}, InputTokens: {InputTokens}, OutputTokens: {OutputTokens}, TotalTokens: {TotalTokens}, ToolCalls: {ToolCalls}, Duration: {Duration}ms",
                        operationName, model,
                        usageDetails.InputTokenCount,
                        usageDetails.OutputTokenCount,
                        usageDetails.TotalTokenCount,
                        toolCallCount,
                        attemptStopwatch.ElapsedMilliseconds);
                }
                else
                {
                    _logger.LogInformation(
                        "AI agent completed. Operation: {Operation}, Model: {Model}, ToolCalls: {ToolCalls}, Duration: {Duration}ms (no usage data)",
                        operationName, model, toolCallCount, attemptStopwatch.ElapsedMilliseconds);
                }

                _logger.LogDebug(
                    "Streaming response completed. Operation: {Operation}, ContentLength: {Length}",
                    operationName, contentBuilder.Length);

                return;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                attemptStopwatch.Stop();
                lastException = ex;
                retryCount++;

                _logger.LogWarning(
                    ex,
                    "AI agent attempt {Attempt}/{MaxAttempts} failed. Operation: {Operation}, Model: {Model}, Duration: {Duration}ms, ErrorType: {ErrorType}",
                    retryCount, _options.MaxRetryAttempts, operationName, model, attemptStopwatch.ElapsedMilliseconds, ex.GetType().Name);

                if (retryCount < _options.MaxRetryAttempts)
                {
                    _logger.LogInformation(
                        "Retrying AI agent in {Delay}ms. Operation: {Operation}, Attempt: {NextAttempt}/{MaxAttempts}",
                        _options.RetryDelayMs, operationName, retryCount + 1, _options.MaxRetryAttempts);

                    await Task.Delay(_options.RetryDelayMs, cancellationToken);
                }
            }
        }

        _logger.LogError(
            lastException,
            "AI agent execution failed after all retry attempts. Operation: {Operation}, Model: {Model}, Attempts: {Attempts}",
            operationName, model, _options.MaxRetryAttempts);

        throw new InvalidOperationException(
            $"AI agent execution failed after {_options.MaxRetryAttempts} attempts for operation '{operationName}'",
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