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

/// <summary>
/// 同步统计信息结果
/// </summary>
public class SyncStatsResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int StarCount { get; set; }
    public int ForkCount { get; set; }
}

/// <summary>
/// 批量同步统计信息结果
/// </summary>
public class BatchSyncStatsResult
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<BatchSyncItemResult> Results { get; set; } = new();
}

/// <summary>
/// 批量同步单项结果
/// </summary>
public class BatchSyncItemResult
{
    public string Id { get; set; } = string.Empty;
    public string RepoName { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int StarCount { get; set; }
    public int ForkCount { get; set; }
}

/// <summary>
/// 批量删除结果
/// </summary>
public class BatchDeleteResult
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> FailedIds { get; set; } = new();
}

/// <summary>
/// 批量操作请求
/// </summary>
public class BatchOperationRequest
{
    public string[] Ids { get; set; } = Array.Empty<string>();
}
