namespace OpenDeepWiki.Chat.Execution;

/// <summary>
/// Agent 执行器配置选项
/// </summary>
public class AgentExecutorOptions
{
    /// <summary>
    /// 默认模型名称
    /// </summary>
    public string DefaultModel { get; set; } = "gpt-4o-mini";
    
    /// <summary>
    /// 执行超时时间（秒）
    /// </summary>
    public int TimeoutSeconds { get; set; } = 120;
    
    /// <summary>
    /// 最大重试次数
    /// </summary>
    public int MaxRetries { get; set; } = 3;
    
    /// <summary>
    /// 默认系统提示
    /// </summary>
    public string DefaultSystemPrompt { get; set; } = "You are a helpful assistant.";
    
    /// <summary>
    /// 是否启用流式响应
    /// </summary>
    public bool EnableStreaming { get; set; } = true;
    
    /// <summary>
    /// 友好错误消息模板
    /// </summary>
    public string FriendlyErrorMessage { get; set; } = "抱歉，处理您的消息时遇到了问题，请稍后重试。";
}
