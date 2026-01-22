using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenDeepWiki.Entities;

/// <summary>
/// 文档目录实体
/// </summary>
public class DocDirectory : AggregateRoot<string>
{
    /// <summary>
    /// 分支语言ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string BranchLanguageId { get; set; } = string.Empty;

    /// <summary>
    /// 目录路径
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// 文档文件ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string DocFileId { get; set; } = string.Empty;

    /// <summary>
    /// 分支语言导航属性
    /// </summary>
    [ForeignKey("BranchLanguageId")]
    public virtual BranchLanguage? BranchLanguage { get; set; }

    /// <summary>
    /// 文档文件导航属性
    /// </summary>
    [ForeignKey("DocFileId")]
    public virtual DocFile? DocFile { get; set; }
}
