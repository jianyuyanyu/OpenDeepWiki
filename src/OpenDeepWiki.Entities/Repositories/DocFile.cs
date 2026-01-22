using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenDeepWiki.Entities;

/// <summary>
/// 文档文件实体
/// </summary>
public class DocFile : AggregateRoot<string>
{
    /// <summary>
    /// 分支语言ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string BranchLanguageId { get; set; } = string.Empty;

    /// <summary>
    /// 文档内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 分支语言导航属性
    /// </summary>
    [ForeignKey("BranchLanguageId")]
    public virtual BranchLanguage? BranchLanguage { get; set; }
}
