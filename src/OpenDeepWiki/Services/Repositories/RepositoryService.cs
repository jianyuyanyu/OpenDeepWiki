using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models;

namespace OpenDeepWiki.Services.Repositories;

[MiniApi(Route = "/api/v1/repositories")]
[Tags("仓库")]
public class RepositoryService(IContext context, IGitPlatformService gitPlatformService)
{
    [HttpPost("/submit")]
    public async Task<Repository> SubmitAsync([FromBody] RepositorySubmitRequest request)
    {
        if (!request.IsPublic && string.IsNullOrWhiteSpace(request.AuthAccount) && string.IsNullOrWhiteSpace(request.AuthPassword))
        {
            throw new InvalidOperationException("仓库凭据为空时不允许设置为私有");
        }

        // 获取公开仓库的star和fork数
        int starCount = 0;
        int forkCount = 0;
        
        if (string.IsNullOrWhiteSpace(request.AuthPassword) && IsPublicPlatform(request.GitUrl))
        {
            var stats = await gitPlatformService.GetRepoStatsAsync(request.GitUrl);
            if (stats != null)
            {
                starCount = stats.StarCount;
                forkCount = stats.ForkCount;
            }
        }

        var repositoryId = Guid.NewGuid().ToString();
        var repository = new Repository
        {
            Id = repositoryId,
            OwnerUserId = request.OwnerUserId,
            GitUrl = request.GitUrl,
            RepoName = request.RepoName,
            OrgName = request.OrgName,
            AuthAccount = request.AuthAccount,
            AuthPassword = request.AuthPassword,
            IsPublic = request.IsPublic,
            Status = RepositoryStatus.Pending,
            StarCount = starCount,
            ForkCount = forkCount
        };

        var branchId = Guid.NewGuid().ToString();
        var branch = new RepositoryBranch
        {
            Id = branchId,
            RepositoryId = repositoryId,
            BranchName = request.BranchName
        };

        var language = new BranchLanguage
        {
            Id = Guid.NewGuid().ToString(),
            RepositoryBranchId = branchId,
            LanguageCode = request.LanguageCode,
            UpdateSummary = string.Empty
        };

        context.Repositories.Add(repository);
        context.RepositoryBranches.Add(branch);
        context.BranchLanguages.Add(language);

        await context.SaveChangesAsync();
        return repository;
    }

    [HttpPost("/assign")]
    public async Task<RepositoryAssignment> AssignAsync([FromBody] RepositoryAssignRequest request)
    {
        var repository = await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == request.RepositoryId);

        if (repository is null)
        {
            throw new InvalidOperationException("仓库不存在");
        }

        var assignment = new RepositoryAssignment
        {
            Id = Guid.NewGuid().ToString(),
            RepositoryId = request.RepositoryId,
            DepartmentId = request.DepartmentId,
            AssigneeUserId = request.AssigneeUserId
        };

        context.RepositoryAssignments.Add(assignment);
        await context.SaveChangesAsync();
        return assignment;
    }

    /// <summary>
    /// 获取仓库列表（含状态）
    /// </summary>
    [HttpGet("/list")]
    public async Task<RepositoryListResponse> GetListAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? ownerId = null,
        [FromQuery] RepositoryStatus? status = null)
    {
        var query = context.Repositories.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(ownerId))
        {
            query = query.Where(r => r.OwnerUserId == ownerId);
        }

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var total = await query.CountAsync();

        var repositories = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new RepositoryListResponse
        {
            Total = total,
            Items = repositories.Select(r => new RepositoryItemResponse
            {
                Id = r.Id,
                OrgName = r.OrgName,
                RepoName = r.RepoName,
                GitUrl = r.GitUrl,
                Status = r.Status,
                IsPublic = r.IsPublic,
                HasPassword = !string.IsNullOrWhiteSpace(r.AuthPassword),
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            }).ToList()
        };
    }

    /// <summary>
    /// 更新仓库可见性
    /// </summary>
    [HttpPost("/visibility")]
    public async Task<IResult> UpdateVisibilityAsync([FromBody] UpdateVisibilityRequest request)
    {
        try
        {
            // 查找仓库
            var repository = await context.Repositories
                .FirstOrDefaultAsync(item => item.Id == request.RepositoryId);

            // 仓库不存在
            if (repository is null)
            {
                return Results.NotFound(new UpdateVisibilityResponse
                {
                    Id = request.RepositoryId,
                    IsPublic = request.IsPublic,
                    Success = false,
                    ErrorMessage = "仓库不存在"
                });
            }

            // 验证所有权
            if (repository.OwnerUserId != request.OwnerUserId)
            {
                return Results.Json(new UpdateVisibilityResponse
                {
                    Id = request.RepositoryId,
                    IsPublic = repository.IsPublic,
                    Success = false,
                    ErrorMessage = "无权限修改此仓库"
                }, statusCode: StatusCodes.Status403Forbidden);
            }

            // 无密码仓库不能设为私有
            if (!request.IsPublic && string.IsNullOrWhiteSpace(repository.AuthPassword))
            {
                return Results.BadRequest(new UpdateVisibilityResponse
                {
                    Id = request.RepositoryId,
                    IsPublic = repository.IsPublic,
                    Success = false,
                    ErrorMessage = "仓库凭据为空时不允许设置为私有"
                });
            }

            // 更新可见性
            repository.IsPublic = request.IsPublic;
            await context.SaveChangesAsync();

            return Results.Ok(new UpdateVisibilityResponse
            {
                Id = repository.Id,
                IsPublic = repository.IsPublic,
                Success = true,
                ErrorMessage = null
            });
        }
        catch (Exception)
        {
            return Results.Json(new UpdateVisibilityResponse
            {
                Id = request.RepositoryId,
                IsPublic = request.IsPublic,
                Success = false,
                ErrorMessage = "服务器内部错误"
            }, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 判断是否为支持获取统计信息的公开平台
    /// </summary>
    private static bool IsPublicPlatform(string gitUrl)
    {
        try
        {
            var uri = new Uri(gitUrl);
            var host = uri.Host.ToLowerInvariant();
            return host is "github.com" or "gitee.com";
        }
        catch
        {
            return false;
        }
    }
}
