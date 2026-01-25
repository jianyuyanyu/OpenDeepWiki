using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Subscription;

namespace OpenDeepWiki.Endpoints;

/// <summary>
/// 订阅相关端点
/// </summary>
public static class SubscriptionEndpoints
{
    public static IEndpointRouteBuilder MapSubscriptionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/subscriptions")
            .WithTags("订阅");

        // 添加订阅
        group.MapPost("/", AddSubscriptionAsync)
            .WithName("AddSubscription")
            .WithSummary("添加订阅");

        // 取消订阅
        group.MapDelete("/{repositoryId}", RemoveSubscriptionAsync)
            .WithName("RemoveSubscription")
            .WithSummary("取消订阅");

        // 获取订阅状态
        group.MapGet("/{repositoryId}/status", GetSubscriptionStatusAsync)
            .WithName("GetSubscriptionStatus")
            .WithSummary("获取订阅状态");

        return app;
    }

    private static async Task<IResult> AddSubscriptionAsync(
        [FromBody] AddSubscriptionRequest request,
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
                return Results.NotFound(new SubscriptionResponse
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
                return Results.NotFound(new SubscriptionResponse
                {
                    Success = false,
                    ErrorMessage = "用户不存在"
                });
            }

            // 检查是否已订阅
            var existingSubscription = await context.UserSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.RepositoryId == request.RepositoryId);

            if (existingSubscription is not null)
            {
                return Results.Conflict(new SubscriptionResponse
                {
                    Success = false,
                    ErrorMessage = "已订阅该仓库"
                });
            }

            // 使用事务确保原子性
            var dbContext = context as DbContext;
            if (dbContext is null)
            {
                return Results.Json(new SubscriptionResponse
                {
                    Success = false,
                    ErrorMessage = "服务器内部错误"
                }, statusCode: StatusCodes.Status500InternalServerError);
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                // 创建订阅记录
                var subscription = new UserSubscription
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = request.UserId,
                    RepositoryId = request.RepositoryId
                };

                context.UserSubscriptions.Add(subscription);
                await context.SaveChangesAsync();

                // 原子性增加订阅计数
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Repositories SET SubscriptionCount = SubscriptionCount + 1 WHERE Id = {0}",
                    request.RepositoryId);

                await transaction.CommitAsync();

                return Results.Ok(new SubscriptionResponse
                {
                    Success = true,
                    SubscriptionId = subscription.Id
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
            return Results.Json(new SubscriptionResponse
            {
                Success = false,
                ErrorMessage = "服务器内部错误"
            }, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<IResult> RemoveSubscriptionAsync(
        string repositoryId,
        [FromQuery] string userId,
        [FromServices] IContext context)
    {
        try
        {
            // 查找订阅记录
            var subscription = await context.UserSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.RepositoryId == repositoryId);

            if (subscription is null)
            {
                return Results.NotFound(new SubscriptionResponse
                {
                    Success = false,
                    ErrorMessage = "订阅记录不存在"
                });
            }

            // 使用事务确保原子性
            var dbContext = context as DbContext;
            if (dbContext is null)
            {
                return Results.Json(new SubscriptionResponse
                {
                    Success = false,
                    ErrorMessage = "服务器内部错误"
                }, statusCode: StatusCodes.Status500InternalServerError);
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                // 删除订阅记录
                context.UserSubscriptions.Remove(subscription);
                await context.SaveChangesAsync();

                // 原子性减少订阅计数（确保不会变为负数）
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE Repositories SET SubscriptionCount = CASE WHEN SubscriptionCount > 0 THEN SubscriptionCount - 1 ELSE 0 END WHERE Id = {0}",
                    repositoryId);

                await transaction.CommitAsync();

                return Results.Ok(new SubscriptionResponse
                {
                    Success = true,
                    SubscriptionId = subscription.Id
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
            return Results.Json(new SubscriptionResponse
            {
                Success = false,
                ErrorMessage = "服务器内部错误"
            }, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<SubscriptionStatusResponse> GetSubscriptionStatusAsync(
        string repositoryId,
        [FromQuery] string userId,
        [FromServices] IContext context)
    {
        // 如果用户ID为空，返回未订阅状态
        if (string.IsNullOrWhiteSpace(userId))
        {
            return new SubscriptionStatusResponse
            {
                IsSubscribed = false,
                SubscribedAt = null
            };
        }

        // 查询订阅记录
        var subscription = await context.UserSubscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.RepositoryId == repositoryId);

        return new SubscriptionStatusResponse
        {
            IsSubscribed = subscription is not null,
            SubscribedAt = subscription?.CreatedAt
        };
    }
}
