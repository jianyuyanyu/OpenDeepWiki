using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Agents.Tools;
using OpenDeepWiki.Chat.Exceptions;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Services.Chat;

/// <summary>
/// DTO for chat assistant configuration.
/// </summary>
public class ChatAssistantConfigDto
{
    public bool IsEnabled { get; set; }
    public List<string> EnabledModelIds { get; set; } = new();
    public List<string> EnabledMcpIds { get; set; } = new();
    public List<string> EnabledSkillIds { get; set; } = new();
    public string? DefaultModelId { get; set; }
}

/// <summary>
/// DTO for model configuration.
/// </summary>
public class ModelConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public bool IsEnabled { get; set; } = true; // 返回的模型都是启用的
}

/// <summary>
/// DTO for chat message.
/// </summary>
public class ChatMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string>? Images { get; set; }
    public List<ToolCallDto>? ToolCalls { get; set; }
    public ToolResultDto? ToolResult { get; set; }
}

/// <summary>
/// DTO for tool call.
/// </summary>
public class ToolCallDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, object>? Arguments { get; set; }
}

/// <summary>
/// DTO for tool result.
/// </summary>
public class ToolResultDto
{
    public string ToolCallId { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsError { get; set; }
}

/// <summary>
/// DTO for document context.
/// </summary>
public class DocContextDto
{
    public string Owner { get; set; } = string.Empty;
    public string Repo { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string CurrentDocPath { get; set; } = string.Empty;
    public List<CatalogItemDto> CatalogMenu { get; set; } = new();
}

/// <summary>
/// DTO for catalog item.
/// </summary>
public class CatalogItemDto
{
    public string Title { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public List<CatalogItemDto>? Children { get; set; }
}

/// <summary>
/// DTO for chat request.
/// </summary>
public class ChatRequest
{
    public List<ChatMessageDto> Messages { get; set; } = new();
    public string ModelId { get; set; } = string.Empty;
    public DocContextDto Context { get; set; } = new();
    public string? AppId { get; set; }
}

/// <summary>
/// SSE event types.
/// </summary>
public static class SSEEventType
{
    public const string Content = "content";
    public const string ToolCall = "tool_call";
    public const string ToolResult = "tool_result";
    public const string Done = "done";
    public const string Error = "error";
}

/// <summary>
/// SSE event data.
/// </summary>
public class SSEEvent
{
    public string Type { get; set; } = string.Empty;
    public object? Data { get; set; }
}


/// <summary>
/// Interface for chat assistant service.
/// </summary>
public interface IChatAssistantService
{
    /// <summary>
    /// Gets the chat assistant configuration.
    /// </summary>
    Task<ChatAssistantConfigDto> GetConfigAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the list of available models for the chat assistant.
    /// </summary>
    Task<List<ModelConfigDto>> GetAvailableModelsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Streams chat responses using SSE.
    /// </summary>
    IAsyncEnumerable<SSEEvent> StreamChatAsync(
        ChatRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Chat assistant service implementation.
/// </summary>
public class ChatAssistantService : IChatAssistantService
{
    private readonly IContext _context;
    private readonly AgentFactory _agentFactory;
    private readonly IMcpToolConverter _mcpToolConverter;
    private readonly ILogger<ChatAssistantService> _logger;

    public ChatAssistantService(
        IContext context,
        AgentFactory agentFactory,
        IMcpToolConverter mcpToolConverter,
        ILogger<ChatAssistantService> logger)
    {
        _context = context;
        _agentFactory = agentFactory;
        _mcpToolConverter = mcpToolConverter;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ChatAssistantConfigDto> GetConfigAsync(CancellationToken cancellationToken = default)
    {
        var config = await _context.ChatAssistantConfigs
            .FirstOrDefaultAsync(cancellationToken);

        if (config == null)
        {
            return new ChatAssistantConfigDto { IsEnabled = false };
        }

        return new ChatAssistantConfigDto
        {
            IsEnabled = config.IsEnabled,
            EnabledModelIds = ParseJsonArray(config.EnabledModelIds),
            EnabledMcpIds = ParseJsonArray(config.EnabledMcpIds),
            EnabledSkillIds = ParseJsonArray(config.EnabledSkillIds),
            DefaultModelId = config.DefaultModelId
        };
    }

    /// <inheritdoc />
    public async Task<List<ModelConfigDto>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
    {
        var config = await GetConfigAsync(cancellationToken);

        if (!config.IsEnabled || config.EnabledModelIds.Count == 0)
        {
            return new List<ModelConfigDto>();
        }

        var models = await _context.ModelConfigs
            .Where(m => config.EnabledModelIds.Contains(m.Id) && m.IsActive && !m.IsDeleted)
            .Select(m => new ModelConfigDto
            {
                Id = m.Id,
                Name = m.Name,
                Provider = m.Provider,
                ModelId = m.ModelId,
                Description = m.Description,
                IsDefault = m.Id == config.DefaultModelId || m.IsDefault,
                IsEnabled = true // 返回的模型都是启用的
            })
            .ToListAsync(cancellationToken);

        return models;
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<SSEEvent> StreamChatAsync(
        ChatRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // Get configuration
        var config = await GetConfigAsync(cancellationToken);

        if (!config.IsEnabled)
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(
                    ChatErrorCodes.FEATURE_DISABLED,
                    "对话助手功能未启用")
            };
            yield break;
        }

        // Validate model
        var modelConfig = await GetModelConfigAsync(request.ModelId, config, cancellationToken);
        if (modelConfig == null)
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(
                    ChatErrorCodes.MODEL_UNAVAILABLE,
                    "模型不可用，请选择其他模型")
            };
            yield break;
        }

        // Build tools
        var tools = new List<AITool>();

        // Add DocReadTool
        var docReadTool = new DocReadTool(
            _context,
            request.Context.Owner,
            request.Context.Repo,
            request.Context.Branch,
            request.Context.Language);
        tools.AddRange(docReadTool.GetTools());

        // Add MCP tools
        if (config.EnabledMcpIds.Count > 0)
        {
            var mcpTools = await _mcpToolConverter.ConvertMcpConfigsToToolsAsync(
                config.EnabledMcpIds, cancellationToken);
            tools.AddRange(mcpTools);
        }

        // Build system prompt
        var systemPrompt = BuildSystemPrompt(request.Context);

        // Create agent
        var agentOptions = new ChatClientAgentOptions
        {
            ChatOptions = new ChatOptions
            {
                Tools = tools.ToArray(),
                ToolMode = ChatToolMode.Auto,
                MaxOutputTokens = 32000
            }
        };

        var requestOptions = new AiRequestOptions
        {
            ApiKey = modelConfig.ApiKey,
            Endpoint = modelConfig.Endpoint,
            RequestType = ParseRequestType(modelConfig.Provider)
        };

        var (agent, _) = _agentFactory.CreateChatClientWithTools(
            modelConfig.ModelId,
            tools.ToArray(),
            agentOptions,
            requestOptions);

        // Build chat messages with system prompt
        var chatMessages = new List<ChatMessage>
        {
            new(ChatRole.System, systemPrompt)
        };
        chatMessages.AddRange(BuildChatMessages(request.Messages));

        // Stream response
        var inputTokens = 0;
        var outputTokens = 0;

        var thread = await agent.GetNewSessionAsync(cancellationToken);

        await foreach (var update in agent.RunStreamingAsync(chatMessages, thread, cancellationToken: cancellationToken))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                yield return new SSEEvent
                {
                    Type = SSEEventType.Content,
                    Data = update.Text
                };
            }

            // Handle tool calls if present in raw representation
            if (update.RawRepresentation is OpenAI.Chat.StreamingChatCompletionUpdate chatCompletionUpdate &&
                chatCompletionUpdate.ToolCallUpdates.Count > 0)
            {
                foreach (var toolCall in chatCompletionUpdate.ToolCallUpdates)
                {
                    if (!string.IsNullOrEmpty(toolCall.FunctionName))
                    {
                        yield return new SSEEvent
                        {
                            Type = SSEEventType.ToolCall,
                            Data = new ToolCallDto
                            {
                                Id = toolCall.ToolCallId ?? Guid.NewGuid().ToString(),
                                Name = toolCall.FunctionName,
                                Arguments = null
                            }
                        };
                    }
                }
            }

            // Track token usage if available
            var usage = update.Contents.OfType<UsageContent>().FirstOrDefault()?.Details;
            if (usage != null)
            {
                inputTokens = (int)(usage.InputTokenCount ?? inputTokens);
                outputTokens = (int)(usage.OutputTokenCount ?? outputTokens);
            }
        }

        // Send done event
        yield return new SSEEvent
        {
            Type = SSEEventType.Done,
            Data = new { inputTokens, outputTokens }
        };
    }


    /// <summary>
    /// Gets the model configuration by ID.
    /// </summary>
    private async Task<ModelConfig?> GetModelConfigAsync(
        string modelId,
        ChatAssistantConfigDto config,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(modelId))
        {
            // Use default model
            modelId = config.DefaultModelId ?? string.Empty;
        }

        if (!config.EnabledModelIds.Contains(modelId))
        {
            return null;
        }

        return await _context.ModelConfigs
            .FirstOrDefaultAsync(m => m.Id == modelId && m.IsActive && !m.IsDeleted, cancellationToken);
    }

    /// <summary>
    /// Builds the system prompt with document context.
    /// </summary>
    private static string BuildSystemPrompt(DocContextDto context)
    {
        var catalogMenu = FormatCatalogMenu(context.CatalogMenu);
        var languageInstruction = context.Language == "zh" ? "中文" : context.Language;

        return $@"你是一个文档助手，帮助用户理解和查找文档内容。

当前文档上下文：
- 仓库：{context.Owner}/{context.Repo}
- 分支：{context.Branch}
- 语言：{context.Language}
- 当前文档：{context.CurrentDocPath}

文档目录结构：
{catalogMenu}

你可以使用 ReadDocument 工具读取其他文档内容。
你可以使用 ListDocuments 工具查看所有可用文档。
请使用{languageInstruction}回答用户问题。";
    }

    /// <summary>
    /// Formats the catalog menu as a string.
    /// </summary>
    private static string FormatCatalogMenu(List<CatalogItemDto> items, int indent = 0)
    {
        if (items == null || items.Count == 0)
        {
            return string.Empty;
        }

        var lines = new List<string>();
        var prefix = new string(' ', indent * 2);

        foreach (var item in items)
        {
            lines.Add($"{prefix}- {item.Title} ({item.Path})");
            if (item.Children != null && item.Children.Count > 0)
            {
                lines.Add(FormatCatalogMenu(item.Children, indent + 1));
            }
        }

        return string.Join("\n", lines);
    }

    /// <summary>
    /// Builds chat messages from DTOs.
    /// </summary>
    private static List<ChatMessage> BuildChatMessages(List<ChatMessageDto> messages)
    {
        var chatMessages = new List<ChatMessage>();

        foreach (var msg in messages)
        {
            var role = msg.Role.ToLowerInvariant() switch
            {
                "user" => ChatRole.User,
                "assistant" => ChatRole.Assistant,
                "system" => ChatRole.System,
                "tool" => ChatRole.Tool,
                _ => ChatRole.User
            };

            var contents = new List<AIContent>();

            // Add text content
            if (!string.IsNullOrEmpty(msg.Content))
            {
                contents.Add(new TextContent(msg.Content));
            }

            // Add images if present
            if (msg.Images != null)
            {
                foreach (var image in msg.Images)
                {
                    // Assume base64 encoded image
                    var imageBytes = Convert.FromBase64String(image);
                    contents.Add(new DataContent(imageBytes, "image/png"));
                }
            }

            chatMessages.Add(new ChatMessage(role, contents));
        }

        return chatMessages;
    }

    /// <summary>
    /// Parses a JSON array string to a list of strings.
    /// </summary>
    private static List<string> ParseJsonArray(string? json)
    {
        if (string.IsNullOrEmpty(json))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Parses the provider string to AiRequestType.
    /// </summary>
    private static AiRequestType ParseRequestType(string provider)
    {
        return provider.ToLowerInvariant() switch
        {
            "openai" => AiRequestType.OpenAI,
            "openairesponses" => AiRequestType.OpenAIResponses,
            "anthropic" => AiRequestType.Anthropic,
            "azureopenai" => AiRequestType.AzureOpenAI,
            _ => AiRequestType.OpenAI
        };
    }
}
