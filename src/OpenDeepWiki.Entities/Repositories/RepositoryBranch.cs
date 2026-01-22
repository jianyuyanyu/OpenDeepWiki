using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenDeepWiki.Entities;

/// <summary>
/// 仓库分支实体
/// </summary>
public class RepositoryBranch : AggregateRoot<string>
{
    /// <summary>
    /// 仓库ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string RepositoryId { get; set; } = string.Empty;

    /// <summary>
    /// 分支名称
    /// </summary>
    [Required]
    [StringLength(200)]
    public string BranchName { get; set; } = string.Empty;

    /// <summary>
    /// 仓库导航属性
    /// </summary>
    [ForeignKey("RepositoryId")]
    public virtual Repository? Repository { get; set; }
}
