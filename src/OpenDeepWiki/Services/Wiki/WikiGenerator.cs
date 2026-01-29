using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using Microsoft.Agents.AI;
using Microsoft.EntityFrameworkCore;
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
/// Token usage statistics for tracking AI model consumption.
/// </summary>
public class TokenUsageStats
{
    public int InputTokens { get; private set; }
    public int OutputTokens { get; private set; }
    public int TotalTokens => InputTokens + OutputTokens;
    public int ToolCallCount { get; private set; }

    public void Add(int inputTokens, int outputTokens, int toolCalls = 0)
    {
        InputTokens += inputTokens;
        OutputTokens += outputTokens;
        ToolCallCount += toolCalls;
    }

    public void Reset()
    {
        InputTokens = 0;
        OutputTokens = 0;
        ToolCallCount = 0;
    }

    public override string ToString()
    {
        return $"InputTokens: {InputTokens}, OutputTokens: {OutputTokens}, TotalTokens: {TotalTokens}, ToolCalls: {ToolCallCount}";
    }
}

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
    private readonly IProcessingLogService _processingLogService;

    // 当前处理的仓库ID（用于记录日志）
    private string? _currentRepositoryId;

    /// <summary>
    /// Initializes a new instance of WikiGenerator.
    /// </summary>
    public WikiGenerator(
        AgentFactory agentFactory,
        IPromptPlugin promptPlugin,
        IOptions<WikiGeneratorOptions> options,
        IContext context,
        ILogger<WikiGenerator> logger,
        IProcessingLogService processingLogService)
    {
        _agentFactory = agentFactory ?? throw new ArgumentNullException(nameof(agentFactory));
        _promptPlugin = promptPlugin ?? throw new ArgumentNullException(nameof(promptPlugin));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _processingLogService = processingLogService ?? throw new ArgumentNullException(nameof(processingLogService));

        _logger.LogDebug(
            "WikiGenerator initialized. CatalogModel: {CatalogModel}, ContentModel: {ContentModel}, MaxRetryAttempts: {MaxRetry}",
            _options.CatalogModel, _options.ContentModel, _options.MaxRetryAttempts);
    }

    /// <summary>
    /// 设置当前处理的仓库ID
    /// </summary>
    public void SetCurrentRepository(string repositoryId)
    {
        _currentRepositoryId = repositoryId;
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

        // 记录开始生成目录
        await LogProcessingAsync(ProcessingStep.Catalog, $"开始生成目录结构 ({branchLanguage.LanguageCode})", cancellationToken);

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
                ProcessingStep.Catalog,
                cancellationToken);

            stopwatch.Stop();
            _logger.LogInformation(
                "Catalog generation completed successfully. Repository: {Org}/{Repo}, Language: {Language}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode, stopwatch.ElapsedMilliseconds);

            await LogProcessingAsync(ProcessingStep.Catalog, 
                $"目录结构生成完成，耗时 {stopwatch.ElapsedMilliseconds}ms", 
                cancellationToken);
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

        // 记录开始生成文档
        await LogProcessingAsync(ProcessingStep.Content, $"开始生成文档内容 ({branchLanguage.LanguageCode})", cancellationToken);

        // Get all catalog items that need content generation
        var catalogStorage = new CatalogStorage(_context, branchLanguage.Id);
        var catalogJson = await catalogStorage.GetCatalogJsonAsync(cancellationToken);
        var catalogItems = GetAllCatalogPaths(catalogJson);

        var parallelCount = _options.ParallelCount;
        _logger.LogInformation(
            "Found {Count} catalog items to generate content for. Repository: {Org}/{Repo}, ParallelCount: {ParallelCount}",
            catalogItems.Count, workspace.Organization, workspace.RepositoryName, parallelCount);

        await LogProcessingAsync(ProcessingStep.Content, $"发现 {catalogItems.Count} 个文档需要生成，并行数: {parallelCount}", cancellationToken);

        if (catalogItems.Count > 0)
        {
            _logger.LogDebug("Catalog items to process: {Items}",
                string.Join(", ", catalogItems.Select(i => $"{i.Path}:{i.Title}")));
        }

        var successCount = 0;
        var failCount = 0;
        var processedCount = 0;
        var lockObj = new object();

        // Use SemaphoreSlim to control parallel execution
        using var semaphore = new SemaphoreSlim(parallelCount, parallelCount);
        var tasks = catalogItems.Select(async item =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var currentIndex = Interlocked.Increment(ref processedCount);
                await LogProcessingAsync(ProcessingStep.Content, $"正在生成文档 ({currentIndex}/{catalogItems.Count}): {item.Title}", cancellationToken);

                await GenerateDocumentContentAsync(
                    workspace, branchLanguage, item.Path, item.Title, cancellationToken);
                
                lock (lockObj) { successCount++; }
            }
            catch (Exception ex)
            {
                lock (lockObj) { failCount++; }
                _logger.LogError(ex,
                    "Failed to generate document. Path: {Path}, Title: {Title}, Repository: {Org}/{Repo}",
                    item.Path, item.Title, workspace.Organization, workspace.RepositoryName);
                await LogProcessingAsync(ProcessingStep.Content, $"文档生成失败: {item.Title} - {ex.Message}", cancellationToken);
                // Continue with other documents
            }
            finally
            {
                semaphore.Release();
            }
        }).ToList();

        await Task.WhenAll(tasks);

        stopwatch.Stop();
        _logger.LogInformation(
            "Document generation completed. Repository: {Org}/{Repo}, Language: {Language}, Success: {SuccessCount}, Failed: {FailCount}, Duration: {Duration}ms",
            workspace.Organization, workspace.RepositoryName, branchLanguage.LanguageCode,
            successCount, failCount, stopwatch.ElapsedMilliseconds);

        await LogProcessingAsync(ProcessingStep.Content, $"文档生成完成，成功: {successCount}，失败: {failCount}，耗时: {stopwatch.ElapsedMilliseconds}ms", cancellationToken);
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

            var tools = gitTool.GetTools()
                .Concat(catalogTool.GetTools())
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
                ProcessingStep.Content,
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
            // 构建文件引用的基础URL
            var gitBaseUrl = BuildGitFileBaseUrl(workspace.GitUrl, workspace.BranchName);

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
            var docTool = new DocTool(_context, branchLanguage.Id, catalogPath);

            var tools = gitTool.GetTools()
                .Concat(docTool.GetTools())
                .ToArray();

            var userMessage = $@"Please generate Wiki document content for catalog item ""{catalogTitle}"" (path: {catalogPath}).

## Repository Information

- Repository: {workspace.Organization}/{workspace.RepositoryName}
- Git URL: {workspace.GitUrl}
- Branch: {workspace.BranchName}
- File Reference Base URL: {gitBaseUrl}
- Target Language: {branchLanguage.LanguageCode}

## Task Requirements

1. **Gather Source Material**
   - Use ListFiles to find source files related to ""{catalogTitle}""
   - Read key implementation files, interface definitions, configuration files
   - Use Grep to search for related classes, functions, API endpoints

2. **Document Structure** (Must Include)
   - Title (H1): Must match catalog title
   - Overview: Explain purpose and use cases
   - Architecture Diagram: Use Mermaid to illustrate component relationships, data flow, or system architecture
   - Main Content: Detailed explanation of implementation, architecture, or usage
   - Usage Examples: Code examples extracted from actual source code
   - Configuration Options (if applicable): List options in table format
   - API Reference (if applicable): Method signatures, parameters, return values
   - Related Links: Links to related documentation and source files

3. **File Reference Links** (IMPORTANT)
   - When referencing source files, use the full URL format: {gitBaseUrl}/<file_path>
   - Example: [{gitBaseUrl}/src/Example.cs]({gitBaseUrl}/src/Example.cs)
   - For specific line references: {gitBaseUrl}/<file_path>#L<line_number>
   - Always provide clickable links to source files mentioned in the document

4. **Mermaid Diagram Requirements** (IMPORTANT)
   - Include at least one architecture or flow diagram using Mermaid
   - Use appropriate diagram types:
     * `flowchart TD` or `flowchart LR` for process flows and component relationships
     * `classDiagram` for class structures and inheritance
     * `sequenceDiagram` for interaction sequences
     * `erDiagram` for data models and relationships
     * `stateDiagram-v2` for state machines
   - Mermaid syntax rules:
     * Node IDs must not contain special characters (use letters, numbers, underscores only)
     * Use quotes for labels with special characters: `A[""Label with (parentheses)""]`
     * Escape special characters in labels properly
     * Keep diagrams focused and readable (max 15-20 nodes per diagram)
     * Use subgraph for grouping related components
   - Example valid Mermaid syntax:
     ```mermaid
     flowchart TD
         subgraph Core[""Core Components""]
             A[Service Layer] --> B[Repository]
             B --> C[(Database)]
         end
         D[API Controller] --> A
     ```

5. **Content Quality Requirements**
   - All information must be based on actual source code, do not fabricate
   - Code examples must be extracted from repository with syntax highlighting
   - Explain design intent (WHY), not just description (WHAT)
   - Write document content in {branchLanguage.LanguageCode} language
   - Keep code identifiers in original form, do not translate

6. **Output Requirements**
   - Use WriteDoc tool to write the document

## Execution Steps

1. Analyze catalog title to determine document scope
2. Use ListFiles and Grep to find related source files
3. Read key files, extract information and code examples
4. Design appropriate Mermaid diagrams to illustrate architecture/flow
5. Organize content following document structure template
6. Ensure all file references use the correct URL format with branch
7. Call WriteDoc(content) to write document

Please start executing the task.";

            await ExecuteAgentWithRetryAsync(
                _options.ContentModel,
                _options.GetContentRequestOptions(),
                prompt,
                userMessage,
                tools,
                $"DocumentContent:{catalogPath}",
                ProcessingStep.Content,
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
        ProcessingStep step,
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

                        // 记录AI输出（每100个字符记录一次，避免过于频繁）
                        if (contentBuilder.Length % 200 < update.Text.Length)
                        {
                            await LogProcessingAsync(step, update.Text, true, null, cancellationToken);
                        }
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

                                // 记录工具调用
                                await LogProcessingAsync(step, $"调用工具: {tool.FunctionName}", false, tool.FunctionName, cancellationToken);
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
    /// Only collects leaf nodes (nodes without children) as parent nodes are just for categorization.
    /// </summary>
    private static void CollectCatalogPaths(
        List<CatalogItem> items,
        List<(string Path, string Title)> result)
    {
        foreach (var item in items)
        {
            if (item.Children.Count > 0)
            {
                // Parent node - only for categorization, recurse into children
                CollectCatalogPaths(item.Children, result);
            }
            else
            {
                // Leaf node - needs document generation
                result.Add((item.Path, item.Title));
            }
        }
    }

    /// <summary>
    /// 记录处理日志
    /// </summary>
    private async Task LogProcessingAsync(
        ProcessingStep step,
        string message,
        bool isAiOutput = false,
        string? toolName = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_currentRepositoryId))
        {
            return;
        }

        try
        {
            await _processingLogService.LogAsync(
                _currentRepositoryId,
                step,
                message,
                isAiOutput,
                toolName,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log processing step");
        }
    }

    /// <summary>
    /// 记录处理日志（简化版本）
    /// </summary>
    private Task LogProcessingAsync(ProcessingStep step, string message, CancellationToken cancellationToken)
    {
        return LogProcessingAsync(step, message, false, null, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<BranchLanguage> TranslateWikiAsync(
        RepositoryWorkspace workspace,
        BranchLanguage sourceBranchLanguage,
        string targetLanguageCode,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "Starting wiki translation. Repository: {Org}/{Repo}, SourceLanguage: {SourceLang}, TargetLanguage: {TargetLang}",
            workspace.Organization, workspace.RepositoryName,
            sourceBranchLanguage.LanguageCode, targetLanguageCode);

        await LogProcessingAsync(ProcessingStep.Translation, 
            $"开始翻译 Wiki: {sourceBranchLanguage.LanguageCode} -> {targetLanguageCode}", cancellationToken);

        try
        {
            // 1. 创建目标语言的BranchLanguage
            var targetBranchLanguage = new BranchLanguage
            {
                Id = Guid.NewGuid().ToString(),
                RepositoryBranchId = sourceBranchLanguage.RepositoryBranchId,
                LanguageCode = targetLanguageCode.ToLowerInvariant()
            };
            _context.BranchLanguages.Add(targetBranchLanguage);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Created target BranchLanguage. Id: {Id}, LanguageCode: {LanguageCode}",
                targetBranchLanguage.Id, targetBranchLanguage.LanguageCode);

            // 2. 获取源语言的目录结构
            var sourceCatalogStorage = new CatalogStorage(_context, sourceBranchLanguage.Id);
            var sourceCatalogJson = await sourceCatalogStorage.GetCatalogJsonAsync(cancellationToken);

            // 3. 翻译目录结构
            await LogProcessingAsync(ProcessingStep.Translation, 
                $"正在翻译目录结构 -> {targetLanguageCode}", cancellationToken);

            var translatedCatalogJson = await TranslateCatalogAsync(
                sourceCatalogJson,
                sourceBranchLanguage.LanguageCode,
                targetLanguageCode,
                cancellationToken);

            // 4. 保存翻译后的目录
            var targetCatalogStorage = new CatalogStorage(_context, targetBranchLanguage.Id);
            await targetCatalogStorage.SetCatalogAsync(translatedCatalogJson, cancellationToken);

            _logger.LogInformation("Catalog translated and saved for {TargetLang}", targetLanguageCode);

            // 5. 获取所有需要翻译的文档
            var catalogItems = GetAllCatalogPaths(sourceCatalogJson);
            var totalDocs = catalogItems.Count;
            var translatedCount = 0;
            var failedCount = 0;

            await LogProcessingAsync(ProcessingStep.Translation, 
                $"发现 {totalDocs} 个文档需要翻译 -> {targetLanguageCode}", cancellationToken);

            // 6. 预加载所有需要的数据（单线程 EF Core 操作）
            var translationTasks = new List<((string Path, string Title) Item, string SourceContent, DocCatalog TargetCatalog)>();
            foreach (var item in catalogItems)
            {
                var sourceCatalog = await _context.DocCatalogs
                    .FirstOrDefaultAsync(c => c.BranchLanguageId == sourceBranchLanguage.Id && 
                                              c.Path == item.Path && 
                                              !c.IsDeleted, cancellationToken);

                if (sourceCatalog == null || string.IsNullOrEmpty(sourceCatalog.DocFileId))
                {
                    _logger.LogWarning("Source document not found for path: {Path}", item.Path);
                    continue;
                }

                var sourceDocFile = await _context.DocFiles
                    .FirstOrDefaultAsync(d => d.Id == sourceCatalog.DocFileId && !d.IsDeleted, cancellationToken);

                if (sourceDocFile == null || string.IsNullOrEmpty(sourceDocFile.Content))
                {
                    _logger.LogWarning("Source document content not found for path: {Path}", item.Path);
                    continue;
                }

                var targetCatalog = await _context.DocCatalogs
                    .FirstOrDefaultAsync(c => c.BranchLanguageId == targetBranchLanguage.Id && 
                                              c.Path == item.Path && 
                                              !c.IsDeleted, cancellationToken);

                if (targetCatalog == null)
                {
                    _logger.LogWarning("Target catalog not found for path: {Path}", item.Path);
                    continue;
                }

                translationTasks.Add((item, sourceDocFile.Content, targetCatalog));
            }

            // 7. 并行执行 AI 翻译（IO 密集型操作）
            var translationResults = new ConcurrentBag<(DocCatalog TargetCatalog, DocFile NewDocFile)?>();
            using var semaphore = new SemaphoreSlim(_options.ParallelCount, _options.ParallelCount);
            var tasks = translationTasks.Select(async task =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    var currentIndex = Interlocked.Increment(ref translatedCount);
                    await LogProcessingAsync(ProcessingStep.Translation, 
                        $"正在翻译文档 ({currentIndex}/{totalDocs}): {task.Item.Title} -> {targetLanguageCode}", cancellationToken);

                    var translatedContent = await TranslateContentAsync(
                        task.SourceContent!,
                        sourceBranchLanguage.LanguageCode,
                        targetLanguageCode,
                        cancellationToken);

                    // 清理 <think> 标签
                    translatedContent = System.Text.RegularExpressions.Regex.Replace(
                        translatedContent,
                        @"<think>[\s\S]*?</think>",
                        string.Empty,
                        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                    var newDocFile = new DocFile
                    {
                        Id = Guid.NewGuid().ToString(),
                        BranchLanguageId = targetBranchLanguage.Id,
                        Content = translatedContent
                    };

                    translationResults.Add((task.TargetCatalog!, newDocFile));
                }
                catch (Exception ex)
                {
                    Interlocked.Increment(ref failedCount);
                    _logger.LogError(ex, "Failed to translate document. Path: {Path}, TargetLang: {TargetLang}",
                        task.Item.Path, targetLanguageCode);
                    translationResults.Add(null);
                }
                finally
                {
                    semaphore.Release();
                }
            }).ToList();

            await Task.WhenAll(tasks);

            // 8. 批量保存翻译结果（单线程 EF Core 操作）
            foreach (var result in translationResults.Where(r => r != null))
            {
                _context.DocFiles.Add(result!.Value.NewDocFile);
                result.Value.TargetCatalog.DocFileId = result.Value.NewDocFile.Id;
                result.Value.TargetCatalog.UpdateTimestamp();
            }

            await _context.SaveChangesAsync(cancellationToken);

            stopwatch.Stop();
            _logger.LogInformation(
                "Wiki translation completed. Repository: {Org}/{Repo}, TargetLanguage: {TargetLang}, Success: {Success}, Failed: {Failed}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, targetLanguageCode,
                translatedCount - failedCount, failedCount, stopwatch.ElapsedMilliseconds);

            await LogProcessingAsync(ProcessingStep.Translation, 
                $"翻译完成 -> {targetLanguageCode}，成功: {translatedCount - failedCount}，失败: {failedCount}，耗时: {stopwatch.ElapsedMilliseconds}ms", 
                cancellationToken);

            return targetBranchLanguage;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Wiki translation failed. Repository: {Org}/{Repo}, TargetLanguage: {TargetLang}, Duration: {Duration}ms",
                workspace.Organization, workspace.RepositoryName, targetLanguageCode, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    /// <summary>
    /// Translates catalog JSON from source language to target language using AI.
    /// </summary>
    private async Task<string> TranslateCatalogAsync(
        string sourceCatalogJson,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        var prompt = $@"You are a professional translator. Translate the following JSON catalog structure from {sourceLanguage} to {targetLanguage}.

IMPORTANT RULES:
1. Only translate the 'title' field values
2. Keep 'path', 'order', and 'children' structure unchanged
3. Keep the path values in English (lowercase with hyphens)
4. Return valid JSON only, no explanations
5. Maintain the exact same JSON structure

Source catalog JSON:
{sourceCatalogJson}

Return the translated JSON:";

        var messages = new List<ChatMessage>
        {
            new(ChatRole.User, prompt)
        };

        var chatClient = _agentFactory.CreateSimpleChatClient(_options.ContentModel, _options.GetContentRequestOptions());
        var thread = await chatClient.GetNewThreadAsync(cancellationToken);
        
        var contentBuilder = new StringBuilder();
        await foreach (var update in chatClient.RunStreamingAsync(messages, thread, cancellationToken: cancellationToken))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                contentBuilder.Append(update.Text);
            }
        }

        var translatedJson = contentBuilder.ToString().Trim();
        
        // 清理可能的<think>标签及其内容
        translatedJson = System.Text.RegularExpressions.Regex.Replace(
            translatedJson, 
            @"<think>[\s\S]*?</think>", 
            string.Empty, 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // 清理可能的markdown代码块标记
        if (translatedJson.StartsWith("```"))
        {
            var lines = translatedJson.Split('\n');
            translatedJson = string.Join('\n', lines.Skip(1).Take(lines.Length - 2));
        }
        
        return translatedJson;
    }

    /// <summary>
    /// Translates a single document from source language to target language.
    /// </summary>
    private async Task TranslateDocumentAsync(
        string sourceBranchLanguageId,
        string targetBranchLanguageId,
        string catalogPath,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        // 获取源文档内容
        var sourceCatalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == sourceBranchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (sourceCatalog == null || string.IsNullOrEmpty(sourceCatalog.DocFileId))
        {
            _logger.LogWarning("Source document not found for path: {Path}", catalogPath);
            return;
        }

        var sourceDocFile = await _context.DocFiles
            .FirstOrDefaultAsync(d => d.Id == sourceCatalog.DocFileId && !d.IsDeleted, cancellationToken);

        if (sourceDocFile == null || string.IsNullOrEmpty(sourceDocFile.Content))
        {
            _logger.LogWarning("Source document content not found for path: {Path}", catalogPath);
            return;
        }

        // 翻译文档内容
        var translatedContent = await TranslateContentAsync(
            sourceDocFile.Content,
            sourceLanguage,
            targetLanguage,
            cancellationToken);

        // 获取目标目录项
        var targetCatalog = await _context.DocCatalogs
            .FirstOrDefaultAsync(c => c.BranchLanguageId == targetBranchLanguageId && 
                                      c.Path == catalogPath && 
                                      !c.IsDeleted, cancellationToken);

        if (targetCatalog == null)
        {
            _logger.LogWarning("Target catalog not found for path: {Path}", catalogPath);
            return;
        }

        translatedContent = System.Text.RegularExpressions.Regex.Replace(
            translatedContent,
            @"<think>[\s\S]*?</think>",
            string.Empty,
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // 创建翻译后的文档
        var targetDocFile = new DocFile
        {
            Id = Guid.NewGuid().ToString(),
            BranchLanguageId = targetBranchLanguageId,
            Content = translatedContent
        };

        _context.DocFiles.Add(targetDocFile);
        targetCatalog.DocFileId = targetDocFile.Id;
        targetCatalog.UpdateTimestamp();

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Translates markdown content from source language to target language using AI.
    /// </summary>
    private async Task<string> TranslateContentAsync(
        string sourceContent,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        var prompt = $@"You are a professional technical documentation translator. Translate the following Markdown document from {sourceLanguage} to {targetLanguage}.

IMPORTANT RULES:
1. Translate all text content to {targetLanguage}
2. Keep all code blocks, code snippets, and technical identifiers unchanged
3. Keep all URLs, file paths, and variable names unchanged
4. Maintain the exact Markdown formatting (headers, lists, tables, etc.)
5. Keep inline code (`code`) unchanged
6. Translate comments inside code blocks if they are in {sourceLanguage}
7. Return only the translated Markdown, no explanations

Source document:
{sourceContent}

Translated document:";

        var messages = new List<ChatMessage>
        {
            new(ChatRole.User, prompt)
        };

        var chatClient = _agentFactory.CreateSimpleChatClient(_options.ContentModel, _options.GetContentRequestOptions());
        var thread = await chatClient.GetNewThreadAsync(cancellationToken);
        
        var contentBuilder = new StringBuilder();
        await foreach (var update in chatClient.RunStreamingAsync(messages, thread, cancellationToken: cancellationToken))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                contentBuilder.Append(update.Text);
            }
        }

        return contentBuilder.ToString().Trim();
    }

    /// <summary>
    /// Builds the base URL for file references in the repository.
    /// Supports GitHub, GitLab, Gitee, Bitbucket, and Azure DevOps URL formats.
    /// </summary>
    /// <param name="gitUrl">The Git repository URL (can be HTTPS or SSH format)</param>
    /// <param name="branchName">The branch name</param>
    /// <returns>The base URL for file references</returns>
    private static string BuildGitFileBaseUrl(string gitUrl, string branchName)
    {
        if (string.IsNullOrEmpty(gitUrl))
        {
            return string.Empty;
        }

        // Normalize the URL - remove .git suffix and convert SSH to HTTPS format
        var normalizedUrl = gitUrl
            .Replace(".git", "")
            .Trim();

        // Convert SSH format to HTTPS format
        // git@github.com:owner/repo -> https://github.com/owner/repo
        if (normalizedUrl.StartsWith("git@"))
        {
            normalizedUrl = normalizedUrl
                .Replace("git@", "https://")
                .Replace(":", "/");
        }

        // Remove trailing slash if present
        normalizedUrl = normalizedUrl.TrimEnd('/');

        // Determine the platform and build appropriate URL
        if (normalizedUrl.Contains("github.com"))
        {
            // GitHub: https://github.com/owner/repo/blob/branch/path
            return $"{normalizedUrl}/blob/{branchName}";
        }
        else if (normalizedUrl.Contains("gitlab.com") || normalizedUrl.Contains("gitlab"))
        {
            // GitLab: https://gitlab.com/owner/repo/-/blob/branch/path
            return $"{normalizedUrl}/-/blob/{branchName}";
        }
        else if (normalizedUrl.Contains("gitee.com"))
        {
            // Gitee: https://gitee.com/owner/repo/blob/branch/path
            return $"{normalizedUrl}/blob/{branchName}";
        }
        else if (normalizedUrl.Contains("bitbucket.org"))
        {
            // Bitbucket: https://bitbucket.org/owner/repo/src/branch/path
            return $"{normalizedUrl}/src/{branchName}";
        }
        else if (normalizedUrl.Contains("dev.azure.com") || normalizedUrl.Contains("visualstudio.com"))
        {
            // Azure DevOps: https://dev.azure.com/org/project/_git/repo?path=/path&version=GBbranch
            // Simplified format for file links
            return $"{normalizedUrl}?version=GB{branchName}&path=";
        }
        else
        {
            // Default: assume GitHub-like format
            return $"{normalizedUrl}/blob/{branchName}";
        }
    }
}