using Microsoft.AspNetCore.Mvc;
using OpenDeepWiki.Models.Recommendation;
using OpenDeepWiki.Services.Recommendation;

namespace OpenDeepWiki.Endpoints;

/// <summary>
/// 推荐相关端点
/// </summary>
public static class RecommendationEndpoints
{
    public static IEndpointRouteBuilder MapRecommendationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/recommendations")
            .WithTags("推荐");

        // 获取推荐仓库列表
        group.MapGet("/", GetRecommendationsAsync)
            .WithName("GetRecommendations")
            .WithSummary("获取推荐仓库列表");

        // 获取热门仓库
        group.MapGet("/popular", GetPopularReposAsync)
            .WithName("GetPopularRepos")
            .WithSummary("获取热门仓库");

        // 获取可用语言列表
        group.MapGet("/languages", GetAvailableLanguagesAsync)
            .WithName("GetAvailableLanguages")
            .WithSummary("获取可用的编程语言列表");

        // 记录用户活动
        group.MapPost("/activity", RecordActivityAsync)
            .WithName("RecordActivity")
            .WithSummary("记录用户活动");

        // 标记不感兴趣
        group.MapPost("/dislike", MarkAsDislikedAsync)
            .WithName("MarkAsDisliked")
            .WithSummary("标记仓库为不感兴趣");

        // 取消不感兴趣
        group.MapDelete("/dislike/{repositoryId}", RemoveDislikeAsync)
            .WithName("RemoveDislike")
            .WithSummary("取消不感兴趣标记");

        // 刷新用户偏好缓存
        group.MapPost("/refresh-preference/{userId}", RefreshUserPreferenceAsync)
            .WithName("RefreshUserPreference")
            .WithSummary("刷新用户偏好缓存");

        return app;
    }

    private static async Task<RecommendationResponse> GetRecommendationsAsync(
        [FromQuery] string? userId,
        [FromQuery] int limit,
        [FromQuery] string? strategy,
        [FromQuery] string? language,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        var request = new RecommendationRequest
        {
            UserId = userId,
            Limit = limit,
            Strategy = strategy ?? "default",
            LanguageFilter = language
        };

        return await recommendationService.GetRecommendationsAsync(request, cancellationToken);
    }

    private static async Task<RecommendationResponse> GetPopularReposAsync(
        [FromQuery] int limit,
        [FromQuery] string? language,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        var request = new RecommendationRequest
        {
            UserId = null,
            Limit = limit,
            Strategy = "popular",
            LanguageFilter = language
        };

        return await recommendationService.GetRecommendationsAsync(request, cancellationToken);
    }

    private static async Task<RecordActivityResponse> RecordActivityAsync(
        [FromBody] RecordActivityRequest request,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return new RecordActivityResponse
            {
                Success = false,
                ErrorMessage = "用户ID不能为空"
            };
        }

        if (string.IsNullOrWhiteSpace(request.ActivityType))
        {
            return new RecordActivityResponse
            {
                Success = false,
                ErrorMessage = "活动类型不能为空"
            };
        }

        var success = await recommendationService.RecordActivityAsync(request, cancellationToken);

        return new RecordActivityResponse
        {
            Success = success,
            ErrorMessage = success ? null : "记录活动失败"
        };
    }

    private static async Task<IResult> RefreshUserPreferenceAsync(
        string userId,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.BadRequest(new { error = "用户ID不能为空" });
        }

        await recommendationService.UpdateUserPreferenceCacheAsync(userId, cancellationToken);

        return Results.Ok(new { success = true, message = "用户偏好缓存已刷新" });
    }

    private static async Task<AvailableLanguagesResponse> GetAvailableLanguagesAsync(
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        return await recommendationService.GetAvailableLanguagesAsync(cancellationToken);
    }

    private static async Task<DislikeResponse> MarkAsDislikedAsync(
        [FromBody] DislikeRequest request,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return new DislikeResponse
            {
                Success = false,
                ErrorMessage = "用户ID不能为空"
            };
        }

        if (string.IsNullOrWhiteSpace(request.RepositoryId))
        {
            return new DislikeResponse
            {
                Success = false,
                ErrorMessage = "仓库ID不能为空"
            };
        }

        var success = await recommendationService.MarkAsDislikedAsync(request, cancellationToken);

        return new DislikeResponse
        {
            Success = success,
            ErrorMessage = success ? null : "标记失败"
        };
    }

    private static async Task<IResult> RemoveDislikeAsync(
        string repositoryId,
        [FromQuery] string userId,
        [FromServices] RecommendationService recommendationService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.BadRequest(new { error = "用户ID不能为空" });
        }

        var success = await recommendationService.RemoveDislikeAsync(userId, repositoryId, cancellationToken);

        return success
            ? Results.Ok(new { success = true })
            : Results.Json(new { success = false, error = "取消失败" }, statusCode: StatusCodes.Status500InternalServerError);
    }
}
