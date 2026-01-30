namespace OpenDeepWiki.Models.Admin;

/// <summary>
/// 管理端仓库列表响应
/// </summary>
public class AdminRepositoryListResponse
{
    public List<AdminRepositoryDto> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// 管理端仓库 DTO
/// </summary>
public class AdminRepositoryDto
{
    public string Id { get; set; } = string.Empty;
    public string GitUrl { get; set; } = string.Empty;
    public string RepoName { get; set; } = string.Empty;
    public string OrgName { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int StarCount { get; set; }
    public int ForkCount { get; set; }
    public int BookmarkCount { get; set; }
    public int ViewCount { get; set; }
    public string? OwnerUserId { get; set; }
    public string? OwnerUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// 更新仓库请求
/// </summary>
public class UpdateRepositoryRequest
{
    public bool? IsPublic { get; set; }
    public string? AuthAccount { get; set; }
    public string? AuthPassword { get; set; }
}

/// <summary>
/// 更新状态请求
/// </summary>
public class UpdateStatusRequest
{
    public int Status { get; set; }
}
