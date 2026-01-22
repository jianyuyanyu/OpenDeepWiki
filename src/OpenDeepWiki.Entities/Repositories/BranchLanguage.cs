using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenDeepWiki.Entities;

/// <summary>
/// 分支语言实体
/// </summary>
public class BranchLanguage : AggregateRoot<string>
{
    /// <summary>
    /// 仓库分支ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string RepositoryBranchId { get; set; } = string.Empty;

    /// <summary>
    /// 语言代码
    /// </summary>
    [Required]
    [StringLength(50)]
    public string LanguageCode { get; set; } = string.Empty;

    /// <summary>
    /// 语言更新总结
    /// </summary>
    [StringLength(2000)]
    public string? UpdateSummary { get; set; }

    /// <summary>
    /// 仓库分支导航属性
    /// </summary>
    [ForeignKey("RepositoryBranchId")]
    public virtual RepositoryBranch? RepositoryBranch { get; set; }
}
