using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenDeepWiki.Chat.Abstractions;
using OpenDeepWiki.Chat.Callbacks;
using OpenDeepWiki.Chat.Execution;
using OpenDeepWiki.Chat.Queue;
using OpenDeepWiki.Chat.Sessions;

namespace OpenDeepWiki.Chat.Processing;

/// <summary>
/// 消息处理后台服务
/// 负责从队列中取出消息、处理并发送回调
/// Requirements: 10.1, 10.2, 10.3
/// </summary>
public class ChatMessageProcessingWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ChatMessageProcessingWorker> _logger;
    private readonly ChatProcessingOptions _options;

    public ChatMessageProcessingWorker(
        IServiceProvider serviceProvider,
        ILogger<ChatMessageProcessingWorker> logger,
        IOptions<ChatProcessingOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("消息处理 Worker 已启动，并发数: {Concurrency}", _options.MaxConcurrency);

        // 使用信号量控制并发
        using var semaphore = new SemaphoreSlim(_options.MaxConcurrency);
        var tasks = new List<Task>();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await semaphore.WaitAsync(stoppingToken);

                var task = ProcessNextMessageAsync(semaphore, stoppingToken);
                tasks.Add(task);

                // 清理已完成的任务
                tasks.RemoveAll(t => t.IsCompleted);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "消息处理循环发生错误");
                semaphore.Release();
                await Task.Delay(_options.ErrorDelayMs, stoppingToken);
            }
        }

        // 等待所有正在处理的任务完成
        await Task.WhenAll(tasks);
        _logger.LogInformation("消息处理 Worker 已停止");
    }

    private async Task ProcessNextMessageAsync(SemaphoreSlim semaphore, CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var messageQueue = scope.ServiceProvider.GetRequiredService<IMessageQueue>();
            var sessionManager = scope.ServiceProvider.GetRequiredService<ISessionManager>();
            var agentExecutor = scope.ServiceProvider.GetRequiredService<IAgentExecutor>();
            var messageCallback = scope.ServiceProvider.GetRequiredService<IMessageCallback>();

            var queuedMessage = await messageQueue.DequeueAsync(stoppingToken);
            if (queuedMessage == null)
            {
                // 队列为空，等待一段时间后重试
                await Task.Delay(_options.PollingIntervalMs, stoppingToken);
                return;
            }

            _logger.LogDebug("开始处理消息: {MessageId}, 类型: {Type}", 
                queuedMessage.Id, queuedMessage.Type);

            try
            {
                await ProcessMessageAsync(
                    queuedMessage, 
                    messageQueue, 
                    sessionManager, 
                    agentExecutor, 
                    messageCallback, 
                    stoppingToken);

                await messageQueue.CompleteAsync(queuedMessage.Id, stoppingToken);
                _logger.LogDebug("消息处理完成: {MessageId}", queuedMessage.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "消息处理失败: {MessageId}", queuedMessage.Id);
                await HandleMessageFailureAsync(queuedMessage, messageQueue, ex.Message, stoppingToken);
            }
        }
        finally
        {
            semaphore.Release();
        }
    }

    private async Task ProcessMessageAsync(
        QueuedMessage queuedMessage,
        IMessageQueue messageQueue,
        ISessionManager sessionManager,
        IAgentExecutor agentExecutor,
        IMessageCallback messageCallback,
        CancellationToken stoppingToken)
    {
        switch (queuedMessage.Type)
        {
            case QueuedMessageType.Incoming:
                await ProcessIncomingMessageAsync(
                    queuedMessage, sessionManager, agentExecutor, messageCallback, stoppingToken);
                break;

            case QueuedMessageType.Outgoing:
                await ProcessOutgoingMessageAsync(queuedMessage, messageCallback, stoppingToken);
                break;

            case QueuedMessageType.Retry:
                // 重试消息按原类型处理
                await ProcessOutgoingMessageAsync(queuedMessage, messageCallback, stoppingToken);
                break;

            default:
                _logger.LogWarning("未知的消息类型: {Type}", queuedMessage.Type);
                break;
        }
    }

    private async Task ProcessIncomingMessageAsync(
        QueuedMessage queuedMessage,
        ISessionManager sessionManager,
        IAgentExecutor agentExecutor,
        IMessageCallback messageCallback,
        CancellationToken stoppingToken)
    {
        // 获取或创建会话
        var session = await sessionManager.GetOrCreateSessionAsync(
            queuedMessage.Message.SenderId,
            queuedMessage.Message.Platform,
            stoppingToken);

        // 添加用户消息到会话历史
        session.AddMessage(queuedMessage.Message);

        // 执行 Agent 处理
        var response = await agentExecutor.ExecuteAsync(
            queuedMessage.Message, session, stoppingToken);

        if (response.Success && response.Messages.Any())
        {
            // 发送响应消息
            foreach (var responseMessage in response.Messages)
            {
                var sendResult = await messageCallback.SendAsync(
                    queuedMessage.Message.Platform,
                    queuedMessage.Message.SenderId,
                    responseMessage,
                    stoppingToken);

                if (!sendResult.Success)
                {
                    _logger.LogWarning("响应消息发送失败: {ErrorMessage}", sendResult.ErrorMessage);
                }

                // 添加 Agent 响应到会话历史
                session.AddMessage(responseMessage);
            }
        }
        else if (!response.Success)
        {
            // 发送错误消息给用户
            var errorMessage = new ChatMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                SenderId = "system",
                ReceiverId = queuedMessage.Message.SenderId,
                Content = response.ErrorMessage ?? "处理消息时发生错误，请稍后重试。",
                MessageType = ChatMessageType.Text,
                Platform = queuedMessage.Message.Platform,
                Timestamp = DateTimeOffset.UtcNow
            };

            await messageCallback.SendAsync(
                queuedMessage.Message.Platform,
                queuedMessage.Message.SenderId,
                errorMessage,
                stoppingToken);
        }

        // 更新会话
        await sessionManager.UpdateSessionAsync(session, stoppingToken);
    }

    private async Task ProcessOutgoingMessageAsync(
        QueuedMessage queuedMessage,
        IMessageCallback messageCallback,
        CancellationToken stoppingToken)
    {
        var result = await messageCallback.SendAsync(
            queuedMessage.Message.Platform,
            queuedMessage.TargetUserId,
            queuedMessage.Message,
            stoppingToken);

        if (!result.Success && result.ShouldRetry)
        {
            throw new InvalidOperationException(result.ErrorMessage ?? "消息发送失败");
        }
    }

    private async Task HandleMessageFailureAsync(
        QueuedMessage queuedMessage,
        IMessageQueue messageQueue,
        string reason,
        CancellationToken stoppingToken)
    {
        if (queuedMessage.RetryCount < _options.MaxRetryCount)
        {
            // 加入重试队列
            var delaySeconds = CalculateRetryDelay(queuedMessage.RetryCount);
            await messageQueue.RetryAsync(queuedMessage.Id, delaySeconds, stoppingToken);
            _logger.LogInformation("消息已加入重试队列: {MessageId}, 延迟: {Delay}秒", 
                queuedMessage.Id, delaySeconds);
        }
        else
        {
            // 移入死信队列
            await messageQueue.FailAsync(queuedMessage.Id, reason, stoppingToken);
            _logger.LogWarning("消息已移入死信队列: {MessageId}, 原因: {Reason}", 
                queuedMessage.Id, reason);
        }
    }

    /// <summary>
    /// 计算重试延迟（指数退避）
    /// </summary>
    private int CalculateRetryDelay(int retryCount)
    {
        // 指数退避: 30s, 60s, 120s, ...
        return _options.BaseRetryDelaySeconds * (int)Math.Pow(2, retryCount);
    }
}
