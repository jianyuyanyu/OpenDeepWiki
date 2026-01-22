namespace OpenDeepWiki.Models;

/// <summary>
/// 仓库目录树响应
/// </summary>
public class RepositoryTreeResponse
{
    /// <summary>
    /// 组织名称
    /// </summary>
    public string Owner { get; set; } = string.Empty;

    /// <summary>
    /// 仓库名称
    /// </summary>
    public string Repo { get; set; } = string.Empty;

    /// <summary>
    /// 默认 slug
    /// </summary>
    public string DefaultSlug { get; set; } = string.Empty;

    /// <summary>
    /// 目录树节点
    /// </summary>
    public List<RepositoryTreeNodeResponse> Nodes { get; set; } = [];
}
