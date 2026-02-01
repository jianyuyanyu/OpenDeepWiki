using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Agents.Tools;
using OpenDeepWiki.Chat.Exceptions;
using OpenDeepWiki.EFCore;

namespace OpenDeepWiki.Services.Chat;

/// <summary>
/// DTO for embed configuration response.
/// </summary>
public class EmbedConfigDto
{
    public bool Valid { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? AppName { get; set; }
    public string? IconUrl { get; set; }
    public List<string> AvailableModels { get; set; } = new();
    public string? DefaultModel { get; set; }
}

/// <summary>
/// DTO for embed chat request.
/// </summary>
public class EmbedChatRequest
{
    public string AppId { get; set; } = string.Empty;
    public List<ChatMessageDto> Messages { get; set; } = new();
    public string? ModelId { get; set; }
    public string? UserIdentifier { get; set; }
}

/// <summary>
/// Interface for embed service.
/// </summary>
public interface IEmbedService
{
    /// <summary>
    /// Validates if the AppId is valid and active.
    /// </summary>
    Task<(bool IsValid, string? ErrorCode, string? ErrorMessage)> ValidateAppAsync(
        string appId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates if the request domain is allowed for the app.
    /// </summary>
    Task<(bool IsValid, string? ErrorCode, string? ErrorMessage)> ValidateDomainAsync(
        string appId,
        string? domain,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the app configuration for embedding.
    /// </summary>
    Task<EmbedConfigDto> GetAppConfigAsync(
        string appId,
        string? domain,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Streams chat responses for embedded widget.
    /// </summary>
    IAsyncEnumerable<SSEEvent> StreamEmbedChatAsync(
        EmbedChatRequest request,
        string? sourceDomain,
        CancellationToken cancellationToken = default);
}


/// <summary>
/// Embed service implementation.
/// Provides validation and chat functionality for embedded widgets.
/// </summary>
public class EmbedService : IEmbedService
{
    private readonly IContext _context;
    private readonly IChatAppService _chatAppService;
    private readonly IAppStatisticsService _statisticsService;
    private readonly IChatLogService _chatLogService;
    private readonly AgentFactory _agentFactory;
    private readonly ILogger<EmbedService> _logger;

    public EmbedService(
        IContext context,
        IChatAppService chatAppService,
        IAppStatisticsService statisticsService,
        IChatLogService chatLogService,
        AgentFactory agentFactory,
        ILogger<EmbedService> logger)
    {
        _context = context;
        _chatAppService = chatAppService;
        _statisticsService = statisticsService;
        _chatLogService = chatLogService;
        _agentFactory = agentFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<(bool IsValid, string? ErrorCode, string? ErrorMessage)> ValidateAppAsync(
        string appId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(appId))
        {
            return (false, "INVALID_APP_ID", "AppId不能为空");
        }

        var app = await _chatAppService.GetAppByAppIdAsync(appId, cancellationToken);

        if (app == null)
        {
            return (false, "INVALID_APP_ID", "应用不存在");
        }

        if (!app.IsActive)
        {
            return (false, "APP_INACTIVE", "应用已停用");
        }

        // Check if AI configuration is complete
        if (string.IsNullOrWhiteSpace(app.ApiKey))
        {
            return (false, "CONFIG_MISSING", "应用未配置API密钥");
        }

        if (app.AvailableModels.Count == 0 && string.IsNullOrWhiteSpace(app.DefaultModel))
        {
            return (false, "CONFIG_MISSING", "应用未配置可用模型");
        }

        return (true, null, null);
    }

    /// <inheritdoc />
    public async Task<(bool IsValid, string? ErrorCode, string? ErrorMessage)> ValidateDomainAsync(
        string appId,
        string? domain,
        CancellationToken cancellationToken = default)
    {
        var app = await _chatAppService.GetAppByAppIdAsync(appId, cancellationToken);

        if (app == null)
        {
            return (false, "INVALID_APP_ID", "应用不存在");
        }

        // If domain validation is not enabled, allow all domains
        if (!app.EnableDomainValidation)
        {
            return (true, null, null);
        }

        // If domain validation is enabled but no domain provided
        if (string.IsNullOrWhiteSpace(domain))
        {
            return (false, "DOMAIN_NOT_ALLOWED", "无法获取请求来源域名");
        }

        // Check if domain is in allowed list
        if (app.AllowedDomains.Count == 0)
        {
            return (false, "DOMAIN_NOT_ALLOWED", "未配置允许的域名");
        }

        var normalizedDomain = NormalizeDomain(domain);
        var isAllowed = app.AllowedDomains.Any(d => IsDomainMatch(normalizedDomain, d));

        if (!isAllowed)
        {
            return (false, "DOMAIN_NOT_ALLOWED", $"域名 {domain} 不在允许列表中");
        }

        return (true, null, null);
    }

    /// <inheritdoc />
    public async Task<EmbedConfigDto> GetAppConfigAsync(
        string appId,
        string? domain,
        CancellationToken cancellationToken = default)
    {
        // Validate AppId
        var (isAppValid, appErrorCode, appErrorMessage) = await ValidateAppAsync(appId, cancellationToken);
        if (!isAppValid)
        {
            return new EmbedConfigDto
            {
                Valid = false,
                ErrorCode = appErrorCode,
                ErrorMessage = appErrorMessage
            };
        }

        // Validate domain
        var (isDomainValid, domainErrorCode, domainErrorMessage) = await ValidateDomainAsync(appId, domain, cancellationToken);
        if (!isDomainValid)
        {
            return new EmbedConfigDto
            {
                Valid = false,
                ErrorCode = domainErrorCode,
                ErrorMessage = domainErrorMessage
            };
        }

        var app = await _chatAppService.GetAppByAppIdAsync(appId, cancellationToken);
        if (app == null)
        {
            return new EmbedConfigDto
            {
                Valid = false,
                ErrorCode = "INVALID_APP_ID",
                ErrorMessage = "应用不存在"
            };
        }

        return new EmbedConfigDto
        {
            Valid = true,
            AppName = app.Name,
            IconUrl = app.IconUrl,
            AvailableModels = app.AvailableModels,
            DefaultModel = app.DefaultModel
        };
    }


    /// <inheritdoc />
    public async IAsyncEnumerable<SSEEvent> StreamEmbedChatAsync(
        EmbedChatRequest request,
        string? sourceDomain,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // Validate AppId
        var (isAppValid, appErrorCode, appErrorMessage) = await ValidateAppAsync(request.AppId, cancellationToken);
        if (!isAppValid)
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(appErrorCode!, appErrorMessage)
            };
            yield break;
        }

        // Validate domain
        var (isDomainValid, domainErrorCode, domainErrorMessage) = await ValidateDomainAsync(request.AppId, sourceDomain, cancellationToken);
        if (!isDomainValid)
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(domainErrorCode!, domainErrorMessage)
            };
            yield break;
        }

        // Get app configuration
        var app = await _chatAppService.GetAppByAppIdAsync(request.AppId, cancellationToken);
        if (app == null)
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(
                    ChatErrorCodes.INVALID_APP_ID,
                    "应用不存在")
            };
            yield break;
        }

        // Determine model to use
        var modelId = request.ModelId;
        if (string.IsNullOrWhiteSpace(modelId))
        {
            modelId = app.DefaultModel;
        }

        // Validate model is in available models
        if (!string.IsNullOrWhiteSpace(modelId) && app.AvailableModels.Count > 0 && !app.AvailableModels.Contains(modelId))
        {
            yield return new SSEEvent
            {
                Type = SSEEventType.Error,
                Data = SSEErrorResponse.CreateNonRetryable(
                    ChatErrorCodes.MODEL_UNAVAILABLE,
                    "所选模型不可用")
            };
            yield break;
        }

        // Use default model if none specified
        if (string.IsNullOrWhiteSpace(modelId))
        {
            modelId = app.AvailableModels.FirstOrDefault() ?? "gpt-4o-mini";
        }

        // Build system prompt for embed mode
        var systemPrompt = "你是一个智能助手，帮助用户解答问题。请友好、专业地回答用户的问题。";

        // Create agent with app's AI configuration
        var agentOptions = new ChatClientAgentOptions
        {
            ChatOptions = new ChatOptions
            {
                MaxOutputTokens = 32000
            }
        };

        var requestOptions = new AiRequestOptions
        {
            ApiKey = app.ApiKey,
            Endpoint = app.BaseUrl,
            RequestType = ParseRequestType(app.ProviderType)
        };

        var (agent, _) = _agentFactory.CreateChatClientWithTools(
            modelId,
            Array.Empty<AITool>(),
            agentOptions,
            requestOptions);

        // Build chat messages
        var chatMessages = new List<ChatMessage>
        {
            new(ChatRole.System, systemPrompt)
        };
        chatMessages.AddRange(BuildChatMessages(request.Messages));

        // Get the last user message for logging
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role.Equals("user", StringComparison.OrdinalIgnoreCase));
        var question = lastUserMessage?.Content ?? string.Empty;

        // Stream response
        var inputTokens = 0;
        var outputTokens = 0;
        var responseBuilder = new System.Text.StringBuilder();

        var thread = await agent.GetNewSessionAsync(cancellationToken);

        await foreach (var update in agent.RunStreamingAsync(chatMessages, thread, cancellationToken: cancellationToken))
        {
            if (!string.IsNullOrEmpty(update.Text))
            {
                responseBuilder.Append(update.Text);
                yield return new SSEEvent
                {
                    Type = SSEEventType.Content,
                    Data = update.Text
                };
            }

            // Track token usage if available
            var usage = update.Contents.OfType<UsageContent>().FirstOrDefault()?.Details;
            if (usage != null)
            {
                inputTokens = (int)(usage.InputTokenCount ?? inputTokens);
                outputTokens = (int)(usage.OutputTokenCount ?? outputTokens);
            }
        }

        // Record statistics
        await _statisticsService.RecordRequestAsync(new RecordRequestDto
        {
            AppId = request.AppId,
            InputTokens = inputTokens,
            OutputTokens = outputTokens
        }, cancellationToken);

        // Record chat log
        var answerSummary = responseBuilder.Length > 500
            ? responseBuilder.ToString(0, 500) + "..."
            : responseBuilder.ToString();

        await _chatLogService.RecordChatLogAsync(new RecordChatLogDto
        {
            AppId = request.AppId,
            UserIdentifier = request.UserIdentifier,
            Question = question,
            AnswerSummary = answerSummary,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            ModelUsed = modelId,
            SourceDomain = sourceDomain
        }, cancellationToken);

        // Send done event
        yield return new SSEEvent
        {
            Type = SSEEventType.Done,
            Data = new { inputTokens, outputTokens }
        };
    }

    /// <summary>
    /// Normalizes a domain by removing protocol and trailing slashes.
    /// </summary>
    private static string NormalizeDomain(string domain)
    {
        if (string.IsNullOrWhiteSpace(domain))
        {
            return string.Empty;
        }

        // Remove protocol
        domain = domain.Replace("https://", "").Replace("http://", "");

        // Remove trailing slash
        domain = domain.TrimEnd('/');

        // Remove port if present (for localhost)
        var colonIndex = domain.IndexOf(':');
        if (colonIndex > 0)
        {
            domain = domain.Substring(0, colonIndex);
        }

        return domain.ToLowerInvariant();
    }

    /// <summary>
    /// Checks if a domain matches an allowed domain pattern.
    /// Supports wildcard matching with *.
    /// </summary>
    public static bool IsDomainMatch(string domain, string pattern)
    {
        if (string.IsNullOrWhiteSpace(domain) || string.IsNullOrWhiteSpace(pattern))
        {
            return false;
        }

        var normalizedDomain = NormalizeDomain(domain);
        var normalizedPattern = NormalizeDomain(pattern);

        // Exact match
        if (normalizedDomain.Equals(normalizedPattern, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Wildcard match (*.example.com)
        if (normalizedPattern.StartsWith("*."))
        {
            var baseDomain = normalizedPattern.Substring(2);
            return normalizedDomain.EndsWith("." + baseDomain, StringComparison.OrdinalIgnoreCase) ||
                   normalizedDomain.Equals(baseDomain, StringComparison.OrdinalIgnoreCase);
        }

        return false;
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
                    var imageBytes = Convert.FromBase64String(image);
                    contents.Add(new DataContent(imageBytes, "image/png"));
                }
            }

            chatMessages.Add(new ChatMessage(role, contents));
        }

        return chatMessages;
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
