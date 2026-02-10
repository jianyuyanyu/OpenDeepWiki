using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using OpenDeepWiki.Chat.Abstractions;
using OpenDeepWiki.Chat.Callbacks;
using OpenDeepWiki.Chat.Providers;
using OpenDeepWiki.Chat.Queue;
using OpenDeepWiki.Chat.Sessions;

namespace OpenDeepWiki.Chat.Routing;

/// <summary>
/// 消息路由器实现
/// 负责将消息路由到正确的 Provider，支持 Provider 注册和消息路由
/// </summary>
public class MessageRouter : IMessageRouter
{
    private readonly ILogger<MessageRouter> _logger;
    private readonly ISessionManager _sessionManager;
    private readonly IMessageQueue _messageQueue;
    private readonly IMessageCallback _messageCallback;
    private readonly ConcurrentDictionary<string, IMessageProvider> _providers;
    private readonly MessageRouterOptions _options;

    public MessageRouter(
        ILogger<MessageRouter> logger,
        ISessionManager sessionManager,
        IMessageQueue messageQueue,
        IMessageCallback messageCallback,
        MessageRouterOptions? options = null)
    {
        _logger = logger;
        _sessionManager = sessionManager;
        _messageQueue = messageQueue;
        _messageCallback = messageCallback;
        _providers = new ConcurrentDictionary<string, IMessageProvider>(StringComparer.OrdinalIgnoreCase);
        _options = options ?? new MessageRouterOptions();
    }

    /// <summary>
    /// 用于测试的简化构造函数
    /// </summary>
    public MessageRouter(ILogger<MessageRouter> logger)
    {
        _logger = logger;
        _sessionManager = null!;
        _messageQueue = null!;
        _messageCallback = null!;
        _providers = new ConcurrentDictionary<string, IMessageProvider>(StringComparer.OrdinalIgnoreCase);
        _options = new MessageRouterOptions();
    }

    /// <inheritdoc />
    public async Task RouteIncomingAsync(IChatMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        var platform = message.Platform;
        if (string.IsNullOrWhiteSpace(platform))
        {
            _logger.LogWarning("Message {MessageId} has no platform specified", message.MessageId);
            throw new ArgumentException("Message platform cannot be empty", nameof(message));
        }

        var provider = GetProvider(platform);
        if (provider == null)
        {
            _logger.LogWarning("No provider registered for platform: {Platform}", platform);
            throw new InvalidOperationException($"No provider registered for platform: {platform}");
        }

        if (!provider.IsEnabled)
        {
            _logger.LogWarning("Provider {Platform} is disabled, message {MessageId} will not be processed",
                platform, message.MessageId);
            return;
        }

        _logger.LogDebug("Routing incoming message {MessageId} from platform {Platform}",
            message.MessageId, platform);

        // 获取或创建会话
        var session = await _sessionManager.GetOrCreateSessionAsync(
            message.SenderId, platform, cancellationToken);

        // 将消息添加到会话历史
        session.AddMessage(message);
        await _sessionManager.UpdateSessionAsync(session, cancellationToken);

        // 将消息入队等待处理
        var queuedMessage = new QueuedMessage(
            Id: Guid.NewGuid().ToString(),
            Message: message,
            SessionId: session.SessionId,
            TargetUserId: message.SenderId,
            Type: QueuedMessageType.Incoming
        );

        await _messageQueue.EnqueueAsync(queuedMessage, cancellationToken);
        _logger.LogDebug("Message {MessageId} enqueued for processing", message.MessageId);
    }


    /// <inheritdoc />
    public async Task RouteOutgoingAsync(IChatMessage message, string targetUserId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetUserId);

        var platform = message.Platform;
        if (string.IsNullOrWhiteSpace(platform))
        {
            _logger.LogWarning("Outgoing message {MessageId} has no platform specified", message.MessageId);
            throw new ArgumentException("Message platform cannot be empty", nameof(message));
        }

        var provider = GetProvider(platform);
        if (provider == null)
        {
            _logger.LogWarning("No provider registered for platform: {Platform}", platform);
            throw new InvalidOperationException($"No provider registered for platform: {platform}");
        }

        if (!provider.IsEnabled)
        {
            _logger.LogWarning("Provider {Platform} is disabled, message {MessageId} will not be sent",
                platform, message.MessageId);
            return;
        }

        _logger.LogDebug("Routing outgoing message {MessageId} to user {UserId} on platform {Platform}",
            message.MessageId, targetUserId, platform);

        // 通过回调管理器发送消息
        await _messageCallback.SendAsync(platform, targetUserId, message, cancellationToken);
    }

    /// <inheritdoc />
    public IMessageProvider? GetProvider(string platform)
    {
        if (string.IsNullOrWhiteSpace(platform))
        {
            return null;
        }

        _providers.TryGetValue(platform, out var provider);
        return provider;
    }

    /// <inheritdoc />
    public IEnumerable<IMessageProvider> GetAllProviders()
    {
        return _providers.Values.ToList();
    }

    /// <inheritdoc />
    public void RegisterProvider(IMessageProvider provider)
    {
        ArgumentNullException.ThrowIfNull(provider);

        if (string.IsNullOrWhiteSpace(provider.PlatformId))
        {
            throw new ArgumentException("Provider PlatformId cannot be empty", nameof(provider));
        }

        if (_providers.TryAdd(provider.PlatformId, provider))
        {
            _logger.LogInformation("Provider {PlatformId} ({DisplayName}) registered successfully",
                provider.PlatformId, provider.DisplayName);
        }
        else
        {
            // 如果已存在，则更新
            _providers[provider.PlatformId] = provider;
            _logger.LogInformation("Provider {PlatformId} ({DisplayName}) updated",
                provider.PlatformId, provider.DisplayName);
        }
    }

    /// <inheritdoc />
    public bool UnregisterProvider(string platform)
    {
        if (string.IsNullOrWhiteSpace(platform))
        {
            return false;
        }

        if (_providers.TryRemove(platform, out var provider))
        {
            _logger.LogInformation("Provider {PlatformId} ({DisplayName}) unregistered",
                provider.PlatformId, provider.DisplayName);
            return true;
        }

        return false;
    }

    /// <inheritdoc />
    public bool HasProvider(string platform)
    {
        if (string.IsNullOrWhiteSpace(platform))
        {
            return false;
        }

        return _providers.ContainsKey(platform);
    }
}

/// <summary>
/// MessageRouter 配置选项
/// </summary>
public class MessageRouterOptions
{
    /// <summary>
    /// 是否启用消息日志
    /// </summary>
    public bool EnableMessageLogging { get; set; } = true;

    /// <summary>
    /// 路由超时时间（毫秒）
    /// </summary>
    public int RouteTimeoutMs { get; set; } = 30000;
}
