using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Admin;
using OpenDeepWiki.Services.Repositories;

namespace OpenDeepWiki.Services.Admin;

/// <summary>
/// 管理端仓库服务实现
/// </summary>
public class AdminRepositoryService : IAdminRepositoryService
{
    private readonly IContext _context;
    private readonly IGitPlatformService _gitPlatformService;

    public AdminRepositoryService(IContext context, IGitPlatformService gitPlatformService)
    {
        _context = context;
        _gitPlatformService = gitPlatformService;
    }

    public async Task<AdminRepositoryListResponse> GetRepositoriesAsync(int page, int pageSize, string? search, int? status)
    {
        var query = _context.Repositories.Where(r => !r.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.RepoName.Contains(search) || r.OrgName.Contains(search) || r.GitUrl.Contains(search));
        }

        if (status.HasValue)
        {
            query = query.Where(r => (int)r.Status == status.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AdminRepositoryDto
            {
                Id = r.Id,
                GitUrl = r.GitUrl,
                RepoName = r.RepoName,
                OrgName = r.OrgName,
                IsPublic = r.IsPublic,
                Status = (int)r.Status,
                StatusText = GetStatusText(r.Status),
                StarCount = r.StarCount,
                ForkCount = r.ForkCount,
                BookmarkCount = r.BookmarkCount,
                ViewCount = r.ViewCount,
                OwnerUserId = r.OwnerUserId,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return new AdminRepositoryListResponse
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminRepositoryDto?> GetRepositoryByIdAsync(string id)
    {
        var repo = await _context.Repositories
            .Where(r => r.Id == id && !r.IsDeleted)
            .FirstOrDefaultAsync();

        if (repo == null) return null;

        return new AdminRepositoryDto
        {
            Id = repo.Id,
            GitUrl = repo.GitUrl,
            RepoName = repo.RepoName,
            OrgName = repo.OrgName,
            IsPublic = repo.IsPublic,
            Status = (int)repo.Status,
            StatusText = GetStatusText(repo.Status),
            StarCount = repo.StarCount,
            ForkCount = repo.ForkCount,
            BookmarkCount = repo.BookmarkCount,
            ViewCount = repo.ViewCount,
            OwnerUserId = repo.OwnerUserId,
            CreatedAt = repo.CreatedAt,
            UpdatedAt = repo.UpdatedAt
        };
    }

    public async Task<bool> UpdateRepositoryAsync(string id, UpdateRepositoryRequest request)
    {
        var repo = await _context.Repositories
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (repo == null) return false;

        if (request.IsPublic.HasValue)
            repo.IsPublic = request.IsPublic.Value;
        if (request.AuthAccount != null)
            repo.AuthAccount = request.AuthAccount;
        if (request.AuthPassword != null)
            repo.AuthPassword = request.AuthPassword;

        repo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRepositoryAsync(string id)
    {
        var repo = await _context.Repositories
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (repo == null) return false;

        repo.IsDeleted = true;
        repo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateRepositoryStatusAsync(string id, int status)
    {
        var repo = await _context.Repositories
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (repo == null) return false;

        repo.Status = (RepositoryStatus)status;
        repo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private static string GetStatusText(RepositoryStatus status) => status switch
    {
        RepositoryStatus.Pending => "待处理",
        RepositoryStatus.Processing => "处理中",
        RepositoryStatus.Completed => "已完成",
        RepositoryStatus.Failed => "失败",
        _ => "未知"
    };

    public async Task<SyncStatsResult> SyncRepositoryStatsAsync(string id)
    {
        var repo = await _context.Repositories
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

        if (repo == null)
        {
            return new SyncStatsResult { Success = false, Message = "仓库不存在" };
        }

        var stats = await _gitPlatformService.GetRepoStatsAsync(repo.GitUrl);
        if (stats == null)
        {
            return new SyncStatsResult { Success = false, Message = "无法获取仓库统计信息，可能是私有仓库或不支持的平台" };
        }

        repo.StarCount = stats.StarCount;
        repo.ForkCount = stats.ForkCount;
        repo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new SyncStatsResult
        {
            Success = true,
            Message = "同步成功",
            StarCount = stats.StarCount,
            ForkCount = stats.ForkCount
        };
    }

    public async Task<BatchSyncStatsResult> BatchSyncRepositoryStatsAsync(string[] ids)
    {
        var result = new BatchSyncStatsResult
        {
            TotalCount = ids.Length
        };

        var repos = await _context.Repositories
            .Where(r => ids.Contains(r.Id) && !r.IsDeleted)
            .ToListAsync();

        foreach (var repo in repos)
        {
            var itemResult = new BatchSyncItemResult
            {
                Id = repo.Id,
                RepoName = $"{repo.OrgName}/{repo.RepoName}"
            };

            var stats = await _gitPlatformService.GetRepoStatsAsync(repo.GitUrl);
            if (stats != null)
            {
                repo.StarCount = stats.StarCount;
                repo.ForkCount = stats.ForkCount;
                repo.UpdatedAt = DateTime.UtcNow;

                itemResult.Success = true;
                itemResult.StarCount = stats.StarCount;
                itemResult.ForkCount = stats.ForkCount;
                result.SuccessCount++;
            }
            else
            {
                itemResult.Success = false;
                itemResult.Message = "无法获取统计信息";
                result.FailedCount++;
            }

            result.Results.Add(itemResult);
        }

        // 处理不存在的仓库
        var foundIds = repos.Select(r => r.Id).ToHashSet();
        foreach (var id in ids.Where(id => !foundIds.Contains(id)))
        {
            result.Results.Add(new BatchSyncItemResult
            {
                Id = id,
                Success = false,
                Message = "仓库不存在"
            });
            result.FailedCount++;
        }

        await _context.SaveChangesAsync();
        return result;
    }

    public async Task<BatchDeleteResult> BatchDeleteRepositoriesAsync(string[] ids)
    {
        var result = new BatchDeleteResult
        {
            TotalCount = ids.Length
        };

        var repos = await _context.Repositories
            .Where(r => ids.Contains(r.Id) && !r.IsDeleted)
            .ToListAsync();

        foreach (var repo in repos)
        {
            repo.IsDeleted = true;
            repo.UpdatedAt = DateTime.UtcNow;
            result.SuccessCount++;
        }

        // 记录不存在的仓库
        var foundIds = repos.Select(r => r.Id).ToHashSet();
        result.FailedIds = ids.Where(id => !foundIds.Contains(id)).ToList();
        result.FailedCount = result.FailedIds.Count;

        await _context.SaveChangesAsync();
        return result;
    }
}
