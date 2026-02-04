using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Anthropic.Models.Messages;
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
    public bool EnableImageUpload { get; set; }
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
    /// <summary>
    /// 引用的选中文本
    /// </summary>
    public QuotedTextDto? QuotedText { get; set; }
}

/// <summary>
/// DTO for quoted/selected text.
/// </summary>
public class QuotedTextDto
{
    /// <summary>
    /// 引用来源的标题（如文档标题）
    /// </summary>
    public string? Title { get; set; }
    /// <summary>
    /// 选中的文本内容
    /// </summary>
    public string Text { get; set; } = string.Empty;
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
    /// <summary>
    /// User's preferred language for AI responses (e.g., "zh-CN", "en")
    /// </summary>
    public string UserLanguage { get; set; } = "en";
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
    public const string Thinking = "thinking";
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
            DefaultModelId = config.DefaultModelId,
            EnableImageUpload = config.EnableImageUpload
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

        // Add ChatDocReaderTool with dynamic catalog
        var chatDocReaderTool = await ChatDocReaderTool.CreateAsync(
            _context,
            request.Context.Owner,
            request.Context.Repo,
            request.Context.Branch,
            request.Context.Language,
            cancellationToken);
        tools.Add(chatDocReaderTool.GetTool());

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
        
        // 跟踪当前内容块
        var currentBlockIndex = -1;
        var currentBlockType = "";
        var currentToolId = "";
        var currentToolName = "";
        var toolInputJson = new System.Text.StringBuilder();
        
        // OpenAI 格式的 tool call 跟踪
        var openAiToolCalls = new Dictionary<int, (string Id, string Name, System.Text.StringBuilder Args)>();

        var thread = await agent.GetNewSessionAsync(cancellationToken);

        await foreach (var update in
                       agent.RunStreamingAsync(chatMessages, thread, cancellationToken: cancellationToken))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                yield return new SSEEvent
                {
                    Type = SSEEventType.Content,
                    Data = update.Text
                };
            }

            // Handle tool calls if present in raw representation (OpenAI format)
            if (update.RawRepresentation is OpenAI.Chat.StreamingChatCompletionUpdate chatCompletionUpdate &&
                chatCompletionUpdate.ToolCallUpdates.Count > 0)
            {
                foreach (var toolCall in chatCompletionUpdate.ToolCallUpdates)
                {
                    var index = toolCall.Index;
                    
                    // 如果是新的 tool call（有 FunctionName）
                    if (!string.IsNullOrEmpty(toolCall.FunctionName))
                    {
                        var toolId = toolCall.ToolCallId ?? Guid.NewGuid().ToString();
                        openAiToolCalls[index] = (toolId, toolCall.FunctionName, new System.Text.StringBuilder());
                        
                        // 发送 tool_call 开始事件
                        yield return new SSEEvent
                        {
                            Type = SSEEventType.ToolCall,
                            Data = new ToolCallDto
                            {
                                Id = toolId,
                                Name = toolCall.FunctionName,
                                Arguments = null
                            }
                        };
                    }
                    
                    var str = Encoding.UTF8.GetString(toolCall.FunctionArgumentsUpdate);
                    // 累积参数
                    if (!string.IsNullOrEmpty(str) && openAiToolCalls.ContainsKey(index))
                    {
                        openAiToolCalls[index].Args.Append(str);
                    }
                }
            }
            
            // 检查 OpenAI finish_reason 是否为 tool_calls，发送完整参数
            if (update.RawRepresentation is OpenAI.Chat.StreamingChatCompletionUpdate finishUpdate)
            {
                var finishReason = finishUpdate.FinishReason;
                if (finishReason == OpenAI.Chat.ChatFinishReason.ToolCalls)
                {
                    // 发送所有累积的 tool calls 的完整参数
                    foreach (var kvp in openAiToolCalls)
                    {
                        var (id, name, args) = kvp.Value;
                        var argsStr = args.ToString();
                        Dictionary<string, object>? arguments = null;
                        
                        if (!string.IsNullOrEmpty(argsStr))
                        {
                            try
                            {
                                arguments = JsonSerializer.Deserialize<Dictionary<string, object>>(argsStr);
                            }
                            catch
                            {
                                // 解析失败
                            }
                        }
                        
                        yield return new SSEEvent
                        {
                            Type = SSEEventType.ToolCall,
                            Data = new ToolCallDto
                            {
                                Id = id,
                                Name = name,
                                Arguments = arguments
                            }
                        };
                    }
                    openAiToolCalls.Clear();
                }
            }

            if (update.RawRepresentation is ChatResponseUpdate chatResponseUpdate)
            {
                if (chatResponseUpdate.RawRepresentation is RawMessageStreamEvent
                    {
                        Value: RawMessageDeltaEvent deltaEvent
                    })
                {
                    inputTokens = (int)((int)(deltaEvent.Usage.InputTokens ?? inputTokens) +
                        deltaEvent.Usage.CacheCreationInputTokens + deltaEvent.Usage.CacheReadInputTokens ?? 0);
                    outputTokens = (int)(deltaEvent.Usage.OutputTokens);
                }
                else if (chatResponseUpdate.RawRepresentation is RawMessageStreamEvent rawMessageStreamEvent)
                {
                    // 解析 Anthropic SSE 事件
                    if (rawMessageStreamEvent.Json.TryGetProperty("type", out var typeElement))
                    {
                        var eventType = typeElement.GetString();
                        
                        // 处理 content_block_start 事件
                        if (eventType == "content_block_start")
                        {
                            // 获取 block index
                            if (rawMessageStreamEvent.Json.TryGetProperty("index", out var indexElement))
                            {
                                currentBlockIndex = indexElement.GetInt32();
                            }
                            
                            if (rawMessageStreamEvent.Json.TryGetProperty("content_block", out var contentBlock))
                            {
                                var blockType = contentBlock.TryGetProperty("type", out var blockTypeElement) 
                                    ? blockTypeElement.GetString() ?? ""
                                    : "";
                                currentBlockType = blockType;
                                
                                // 处理 thinking 块开始
                                if (blockType == "thinking")
                                {
                                    yield return new SSEEvent
                                    {
                                        Type = SSEEventType.Thinking,
                                        Data = new { type = "start", index = currentBlockIndex }
                                    };
                                }
                                // 处理 tool_use 块开始
                                else if (blockType == "tool_use")
                                {
                                    currentToolId = contentBlock.TryGetProperty("id", out var idElement) 
                                        ? idElement.GetString() ?? "" 
                                        : "";
                                    currentToolName = contentBlock.TryGetProperty("name", out var nameElement) 
                                        ? nameElement.GetString() ?? "" 
                                        : "";
                                    toolInputJson.Clear();
                                    
                                    // 发送 tool_call 开始事件
                                    yield return new SSEEvent
                                    {
                                        Type = SSEEventType.ToolCall,
                                        Data = new ToolCallDto
                                        {
                                            Id = currentToolId,
                                            Name = currentToolName,
                                            Arguments = null
                                        }
                                    };
                                }
                            }
                        }
                        // 处理 content_block_delta 事件
                        else if (eventType == "content_block_delta")
                        {
                            if (rawMessageStreamEvent.Json.TryGetProperty("delta", out var delta))
                            {
                                var deltaType = delta.TryGetProperty("type", out var deltaTypeElement) 
                                    ? deltaTypeElement.GetString() 
                                    : null;
                                
                                // 处理 thinking 内容增量
                                if (deltaType == "thinking_delta")
                                {
                                    var thinkingText = delta.TryGetProperty("thinking", out var thinkingElement) 
                                        ? thinkingElement.GetString() ?? "" 
                                        : "";
                                    
                                    if (!string.IsNullOrEmpty(thinkingText))
                                    {
                                        yield return new SSEEvent
                                        {
                                            Type = SSEEventType.Thinking,
                                            Data = new { type = "delta", content = thinkingText, index = currentBlockIndex }
                                        };
                                    }
                                }
                                // 处理 tool_use 输入增量
                                else if (deltaType == "input_json_delta")
                                {
                                    var partialJson = delta.TryGetProperty("partial_json", out var jsonElement) 
                                        ? jsonElement.GetString() ?? "" 
                                        : "";
                                    
                                    // 累积 JSON 片段
                                    toolInputJson.Append(partialJson);
                                }
                            }
                        }
                        // 处理 content_block_stop 事件
                        else if (eventType == "content_block_stop")
                        {
                            // 如果是 tool_use 块结束，发送完整的参数
                            if (currentBlockType == "tool_use" && !string.IsNullOrEmpty(currentToolId))
                            {
                                Dictionary<string, object>? arguments = null;
                                var jsonStr = toolInputJson.ToString();
                                if (!string.IsNullOrEmpty(jsonStr))
                                {
                                    try
                                    {
                                        arguments = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonStr);
                                    }
                                    catch
                                    {
                                        // 解析失败，保持 null
                                    }
                                }
                                
                                // 发送带完整参数的 tool_call 事件
                                yield return new SSEEvent
                                {
                                    Type = SSEEventType.ToolCall,
                                    Data = new ToolCallDto
                                    {
                                        Id = currentToolId,
                                        Name = currentToolName,
                                        Arguments = arguments
                                    }
                                };
                                
                                // 重置状态
                                currentToolId = "";
                                currentToolName = "";
                                toolInputJson.Clear();
                            }
                            
                            currentBlockType = "";
                        }
                    }
                }
            }
            else
            {
                // Track token usage if available
                var usage = update.Contents.OfType<UsageContent>().FirstOrDefault()?.Details;
                if (usage != null)
                {
                    inputTokens = (int)(usage.InputTokenCount ?? inputTokens);
                    outputTokens = (int)(usage.OutputTokenCount ?? outputTokens);
                }
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
        var responseLanguage = context.UserLanguage switch
        {
            "zh-CN" or "zh" => "Chinese (Simplified)",
            "zh-TW" => "Chinese (Traditional)",
            "ja" => "Japanese",
            "ko" => "Korean",
            "es" => "Spanish",
            "fr" => "French",
            "de" => "German",
            _ => "English"
        };

        return $@"You are a documentation assistant for the repository ""{context.Owner}/{context.Repo}"".

## Your Role
You help users understand and navigate the documentation of this repository. You can read document content using the ReadDoc tool.

## Current Context
- Repository: {context.Owner}/{context.Repo}
- Branch: {context.Branch}
- Document Language: {context.Language}
- Current Document: {context.CurrentDocPath}

## Behavior Rules
1. ONLY answer questions related to this repository's documentation, code, architecture, usage, or technical content.
2. If a user asks questions unrelated to this repository (e.g., general knowledge, personal advice, other topics), politely decline and redirect them to ask about the documentation.
3. Use the ReadDoc tool to fetch document content when needed. The tool description contains the complete document catalog.
4. Base your answers on the actual document content. Do not make up information.
5. If you cannot find relevant information in the documents, clearly state that.

## Response Language
You MUST respond in {responseLanguage}.

## Example Refusal
If a user asks something unrelated like ""What's the weather today?"" or ""Write me a poem"", respond with:
""I'm a documentation assistant for {context.Owner}/{context.Repo}. I can only help with questions about this repository's documentation, code, and usage. Is there anything about the documentation I can help you with?""";
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

            // Add quoted text as reference block (if present)
            if (msg.QuotedText != null && !string.IsNullOrEmpty(msg.QuotedText.Text))
            {
                var title = !string.IsNullOrEmpty(msg.QuotedText.Title) 
                    ? msg.QuotedText.Title 
                    : "引用内容";
                var quotedContent = $"引用来源：{title}\n<select_text>\n{msg.QuotedText.Text}\n</select_text>";
                contents.Add(new TextContent(quotedContent));
            }

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