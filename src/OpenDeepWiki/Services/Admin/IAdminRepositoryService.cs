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
}
