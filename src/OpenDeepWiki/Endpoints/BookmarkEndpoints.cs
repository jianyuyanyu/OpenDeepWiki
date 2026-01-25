using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Bookmark;

namespace OpenDeepWiki.Endpoints;

/// <summary>
/// 收藏相关端点
/// </summary>
public static class BookmarkEndpoints
{
    public static IEndpointRouteBuilder MapBookmarkEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/bookmarks")
            .WithTags("收藏");

        // 添加收藏
        group.MapPost("/", AddBookmarkAsync)
            .WithName("AddBookmark")
            .WithSummary("添加收藏");

        // 获取用户收藏列表
        group.MapGet("/", GetUserBookmarksAsync)
            .WithName("GetUserBookmarks")
            .WithSummary("获取用户收藏列表");

        // 取消收藏
        group.MapDelete("/{repositoryId}", RemoveBookmarkAsync)
            .WithName("RemoveBookmark")
            .WithSummary("取消收藏");

        // 获取收藏状态
        group.MapGet("/{repositoryId}/status", GetBookmarkStatusAsync)
            .WithName("GetBookmarkStatus")
            .WithSummary("获取收藏状态");

        return app;
    }

    private static async Task<IResult> AddBookmarkAsync(
        [FromBody] AddBookmarkRequest request,
        [FromServices] IContext context)
    {
        try
        {
            // 验证仓库是否存在
            var repository = await context.Repositories
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.RepositoryId);

            if (repository is null)
            {
                return Results.NotFound(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "仓库不存在"
                });
            }

            // 验证用户是否存在
            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (user is null)
            {
                return Results.NotFound(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "用户不存在"
                });
            }

            // 检查是否已收藏
            var existingBookmark = await context.UserBookmarks
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.UserId == request.UserId && b.RepositoryId == request.RepositoryId);

            if (existingBookmark is not null)
            {
                return Results.Conflict(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "已收藏该仓库"
                });
            }

            // 使用事务确保原子性
            var dbContext = context as DbContext;
            if (dbContext is null)
            {
                return Results.Json(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "服务器内部错误"
                }, statusCode: StatusCodes.Status500InternalServerError);
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                // 创建收藏记录
                var bookmark = new UserBookmark
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = request.UserId,
                    RepositoryId = request.RepositoryId
                };

                context.UserBookmarks.Add(bookmark);
                await context.SaveChangesAsync();

                // 原子性增加收藏计数
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Repositories SET BookmarkCount = BookmarkCount + 1 WHERE Id = {0}",
                    request.RepositoryId);

                await transaction.CommitAsync();

                return Results.Ok(new BookmarkResponse
                {
                    Success = true,
                    BookmarkId = bookmark.Id
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception)
        {
            return Results.Json(new BookmarkResponse
            {
                Success = false,
                ErrorMessage = "服务器内部错误"
            }, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<IResult> RemoveBookmarkAsync(
        string repositoryId,
        [FromQuery] string userId,
        [FromServices] IContext context)
    {
        try
        {
            // 查找收藏记录
            var bookmark = await context.UserBookmarks
                .FirstOrDefaultAsync(b => b.UserId == userId && b.RepositoryId == repositoryId);

            if (bookmark is null)
            {
                return Results.NotFound(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "收藏记录不存在"
                });
            }

            // 使用事务确保原子性
            var dbContext = context as DbContext;
            if (dbContext is null)
            {
                return Results.Json(new BookmarkResponse
                {
                    Success = false,
                    ErrorMessage = "服务器内部错误"
                }, statusCode: StatusCodes.Status500InternalServerError);
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                // 删除收藏记录
                context.UserBookmarks.Remove(bookmark);
                await context.SaveChangesAsync();

                // 原子性减少收藏计数（确保不会变为负数）
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Repositories SET BookmarkCount = CASE WHEN BookmarkCount > 0 THEN BookmarkCount - 1 ELSE 0 END WHERE Id = {0}",
                    repositoryId);

                await transaction.CommitAsync();

                return Results.Ok(new BookmarkResponse
                {
                    Success = true,
                    BookmarkId = bookmark.Id
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception)
        {
            return Results.Json(new BookmarkResponse
            {
                Success = false,
                ErrorMessage = "服务器内部错误"
            }, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<BookmarkListResponse> GetUserBookmarksAsync(
        [FromQuery] string userId,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        [FromServices] IContext context)
    {
        // 参数验证
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        // 查询用户收藏总数
        var total = await context.UserBookmarks
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .CountAsync();

        // 分页查询收藏列表，按创建时间降序排列
        var bookmarks = await context.UserBookmarks
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(b => b.Repository)
            .ToListAsync();

        // 转换为响应模型
        var items = bookmarks
            .Where(b => b.Repository is not null)
            .Select(b => new BookmarkItemResponse
            {
                BookmarkId = b.Id,
                RepositoryId = b.RepositoryId,
                RepoName = b.Repository!.RepoName,
                OrgName = b.Repository.OrgName,
                Description = null,
                StarCount = b.Repository.StarCount,
                ForkCount = b.Repository.ForkCount,
                BookmarkCount = b.Repository.BookmarkCount,
                BookmarkedAt = b.CreatedAt
            })
            .ToList();

        return new BookmarkListResponse
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private static async Task<BookmarkStatusResponse> GetBookmarkStatusAsync(
        string repositoryId,
        [FromQuery] string userId,
        [FromServices] IContext context)
    {
        // 如果用户ID为空，返回未收藏状态
        if (string.IsNullOrWhiteSpace(userId))
        {
            return new BookmarkStatusResponse
            {
                IsBookmarked = false,
                BookmarkedAt = null
            };
        }

        // 查询收藏记录
        var bookmark = await context.UserBookmarks
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.UserId == userId && b.RepositoryId == repositoryId);

        return new BookmarkStatusResponse
        {
            IsBookmarked = bookmark is not null,
            BookmarkedAt = bookmark?.CreatedAt
        };
    }
}
