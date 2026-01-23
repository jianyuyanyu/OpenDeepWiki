using System.ComponentModel.DataAnnotations;

namespace OpenDeepWiki.Models;

/// <summary>
/// 更新仓库可见性请求
/// </summary>
public class UpdateVisibilityRequest
{
    /// <summary>
    /// 仓库ID
    /// </summary>
    [Required]
    [StringLength(36)]
    public string RepositoryId { get; set; } = string.Empty;

    /// <summary>
    /// 是否公开
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// 所有者用户ID（用于验证所有权）
    /// </summary>
    [Required]
    [StringLength(36)]
    public string OwnerUserId { get; set; } = string.Empty;
}
