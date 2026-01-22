namespace OpenDeepWiki.Models;

/// <summary>
/// 仓库文档响应
/// </summary>
public class RepositoryDocResponse
{
    /// <summary>
    /// 文档路径（slug）
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Markdown 内容
    /// </summary>
    public string Content { get; set; } = string.Empty;
}
