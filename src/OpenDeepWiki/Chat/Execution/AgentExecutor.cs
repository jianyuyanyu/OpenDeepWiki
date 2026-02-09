using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Chat.Abstractions;
using OpenDeepWiki.Chat.Exceptions;
using OpenDeepWiki.Chat.Sessions;
using ChatRole = Microsoft.Extensions.AI.ChatRole;
using AIChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace OpenDeepWiki.Chat.Execution;

/// <summary>
/// Agent 执行器实现
/// 集成现有 Agent 系统，处理消息并生成响应
/// </summary>
public class AgentExecutor : IAgentExecutor
{
    private readonly ILogger<AgentExecutor> _logger;
    private readonly AgentExecutorOptions _options;
    private readonly AgentFactory _agentFactory;

    public AgentExecutor(
        ILogger<AgentExecutor> logger,
        IOptions<AgentExecutorOptions> options,
        AgentFactory agentFactory)
    {
        _logger = logger;
        _options = options.Value;
        _agentFactory = agentFactory;
    }

    /// <inheritdoc />
    public async Task<AgentResponse> ExecuteAsync(
        IChatMessage message,
        IChatSession session,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(session);

        _logger.LogInformation(
            "Executing agent for session {SessionId}, message {MessageId}",
            session.SessionId, message.MessageId);

        try
        {
            // 构建上下文消息列表
            var contextMessages = BuildContextMessages(message, session);
            
            // 创建 Agent 并执行
            var agent = _agentFactory.CreateSimpleChatClient(_options.DefaultModel);
            
            // 构建聊天消息
            var chatMessages = BuildAIChatMessages(contextMessages);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

            // 使用流式 API 收集完整响应
            var thread = await agent.CreateSessionAsync(cts.Token);
            var contentBuilder = new StringBuilder();
            
            await foreach (var update in agent.RunStreamingAsync(chatMessages, thread, cancellationToken: cts.Token))
            {
                if (!string.IsNullOrEmpty(update.Text))
                {
                    contentBuilder.Append(update.Text);
                }
            }
            
            var responseContent = contentBuilder.ToString();
            
            var responseMessage = new Abstractions.ChatMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                SenderId = "assistant",
                ReceiverId = message.SenderId,
                Content = responseContent,
                MessageType = ChatMessageType.Text,
                Platform = message.Platform,
                Timestamp = DateTimeOffset.UtcNow
            };

            _logger.LogInformation(
                "Agent execution completed for session {SessionId}",
                session.SessionId);

            return AgentResponse.CreateSuccess(responseMessage);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                "Agent execution cancelled for session {SessionId}",
                session.SessionId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Agent execution failed for session {SessionId}",
                session.SessionId);

            return CreateFriendlyErrorResponse(ex);
        }
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<AgentResponseChunk> ExecuteStreamAsync(
        IChatMessage message,
        IChatSession session,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(session);

        _logger.LogInformation(
            "Starting streaming agent execution for session {SessionId}, message {MessageId}",
            session.SessionId, message.MessageId);

        // 构建上下文消息列表
        var contextMessages = BuildContextMessages(message, session);
        
        // 创建 Agent
        var agent = _agentFactory.CreateSimpleChatClient(_options.DefaultModel);
        
        // 构建聊天消息
        var chatMessages = BuildAIChatMessages(contextMessages);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        Microsoft.Agents.AI.AgentSession? thread = null;
        string? initError = null;
        
        // 获取线程
        try
        {
            thread = await agent.CreateSessionAsync(cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to create agent thread for session {SessionId}",
                session.SessionId);
            initError = CreateFriendlyErrorMessage(ex);
        }
        
        if (initError != null || thread == null)
        {
            yield return AgentResponseChunk.CreateError(initError ?? _options.FriendlyErrorMessage);
            yield break;
        }
        
        // 收集所有响应块到列表中
        var chunks = new List<AgentResponseChunk>();
        string? streamError = null;
        
        try
        {
            await foreach (var update in agent.RunStreamingAsync(chatMessages, thread, cancellationToken: cts.Token))
            {
                if (!string.IsNullOrEmpty(update.Text))
                {
                    chunks.Add(AgentResponseChunk.CreateContent(update.Text));
                }
            }
            chunks.Add(AgentResponseChunk.CreateComplete());
            
            _logger.LogInformation(
                "Streaming agent execution completed for session {SessionId}",
                session.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error during streaming for session {SessionId}",
                session.SessionId);
            streamError = CreateFriendlyErrorMessage(ex);
        }
        
        // 输出所有收集的块
        foreach (var chunk in chunks)
        {
            yield return chunk;
        }
        
        // 如果有错误，输出错误块
        if (streamError != null)
        {
            yield return AgentResponseChunk.CreateError(streamError);
        }
    }

    /// <summary>
    /// 构建上下文消息列表，包含当前消息和会话历史
    /// </summary>
    private static List<IChatMessage> BuildContextMessages(IChatMessage currentMessage, IChatSession session)
    {
        var messages = new List<IChatMessage>();
        
        // 添加会话历史
        messages.AddRange(session.History);
        
        // 添加当前消息
        messages.Add(currentMessage);
        
        return messages;
    }
    
    /// <summary>
    /// 构建 AI 聊天消息列表
    /// </summary>
    private List<AIChatMessage> BuildAIChatMessages(List<IChatMessage> contextMessages)
    {
        var chatMessages = new List<AIChatMessage>
        {
            new(ChatRole.System, _options.DefaultSystemPrompt)
        };
        
        // 添加历史消息
        foreach (var historyMsg in contextMessages)
        {
            var role = historyMsg.SenderId == "assistant" 
                ? ChatRole.Assistant 
                : ChatRole.User;
            chatMessages.Add(new AIChatMessage(role, historyMsg.Content));
        }
        
        return chatMessages;
    }

    /// <summary>
    /// 创建友好的错误响应
    /// </summary>
    private AgentResponse CreateFriendlyErrorResponse(Exception ex)
    {
        return AgentResponse.CreateFailure(CreateFriendlyErrorMessage(ex));
    }
    
    /// <summary>
    /// 创建友好的错误消息
    /// </summary>
    private string CreateFriendlyErrorMessage(Exception ex)
    {
        var friendlyMessage = _options.FriendlyErrorMessage;
        
        // 根据异常类型提供更具体的错误信息
        if (ex is ChatException chatEx)
        {
            friendlyMessage = $"{_options.FriendlyErrorMessage} (错误代码: {chatEx.ErrorCode})";
        }
        else if (ex is TimeoutException or OperationCanceledException)
        {
            friendlyMessage = "处理超时，请稍后重试。";
        }

        return friendlyMessage;
    }
}
