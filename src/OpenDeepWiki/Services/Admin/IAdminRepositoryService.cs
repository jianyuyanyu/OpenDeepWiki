using OpenDeepWiki.Models.Admin;

namespace OpenDeepWiki.Services.Admin;

/// <summary>
/// 管理端仓库服务接口
/// </summary>
public interface IAdminRepositoryService
{
    Task<AdminRepositoryListResponse> GetRepositoriesAsync(int page, int pageSize, string? search, int? status);
    Task<AdminRepositoryDto?> GetRepositoryByIdAsync(string id);
    Task<bool> UpdateRepositoryAsync(string id, UpdateRepositoryRequest request);
    Task<bool> DeleteRepositoryAsync(string id);
    Task<bool> UpdateRepositoryStatusAsync(string id, int status);
    
    /// <summary>
    /// 同步单个仓库的统计信息（star、fork等）
    /// </summary>
    Task<SyncStatsResult> SyncRepositoryStatsAsync(string id);
    
    /// <summary>
    /// 批量同步仓库统计信息
    /// </summary>
    Task<BatchSyncStatsResult> BatchSyncRepositoryStatsAsync(string[] ids);
    
    /// <summary>
    /// 批量删除仓库
    /// </summary>
    Task<BatchDeleteResult> BatchDeleteRepositoriesAsync(string[] ids);
}
