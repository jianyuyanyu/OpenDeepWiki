using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Admin;

namespace OpenDeepWiki.Services.Admin;

/// <summary>
/// 管理端仓库服务实现
/// </summary>
public class AdminRepositoryService : IAdminRepositoryService
{
    private readonly IContext _context;

    public AdminRepositoryService(IContext context)
    {
        _context = context;
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
}
