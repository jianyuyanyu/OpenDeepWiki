namespace OpenDeepWiki.Models;

/// <summary>
/// 仓库分支和语言响应
/// </summary>
public class RepositoryBranchesResponse
{
    /// <summary>
    /// 分支列表
    /// </summary>
    public List<BranchItem> Branches { get; set; } = [];

    /// <summary>
    /// 所有可用语言
    /// </summary>
    public List<string> Languages { get; set; } = [];

    /// <summary>
    /// 默认分支
    /// </summary>
    public string DefaultBranch { get; set; } = string.Empty;

    /// <summary>
    /// 默认语言
    /// </summary>
    public string DefaultLanguage { get; set; } = string.Empty;
}

/// <summary>
/// 分支项
/// </summary>
public class BranchItem
{
    /// <summary>
    /// 分支名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 该分支支持的语言列表
    /// </summary>
    public List<string> Languages { get; set; } = [];
}
