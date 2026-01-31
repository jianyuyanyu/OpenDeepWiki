using Microsoft.AspNetCore.Mvc;
using OpenDeepWiki.Models.UserProfile;
using OpenDeepWiki.Services.UserProfile;

namespace OpenDeepWiki.Endpoints;

/// <summary>
/// 用户资料相关端点
/// </summary>
public static class UserProfileEndpoints
{
    public static IEndpointRouteBuilder MapUserProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/user")
            .WithTags("用户资料")
            .RequireAuthorization();

        // 更新个人资料
        group.MapPut("/profile", async (
            HttpContext context,
            [FromBody] UpdateProfileRequest request,
            [FromServices] IUserProfileService profileService) =>
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var userInfo = await profileService.UpdateProfileAsync(userId, request);
                return Results.Ok(new { success = true, data = userInfo });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { success = false, message = ex.Message });
            }
        })
        .WithName("UpdateProfile")
        .WithSummary("更新个人资料");

        // 修改密码
        group.MapPut("/password", async (
            HttpContext context,
            [FromBody] ChangePasswordRequest request,
            [FromServices] IUserProfileService profileService) =>
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                await profileService.ChangePasswordAsync(userId, request);
                return Results.Ok(new { success = true, message = "密码修改成功" });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.BadRequest(new { success = false, message = "当前密码错误" });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { success = false, message = ex.Message });
            }
        })
        .WithName("ChangePassword")
        .WithSummary("修改密码");

        // 获取用户设置
        group.MapGet("/settings", async (
            HttpContext context,
            [FromServices] IUserProfileService profileService) =>
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var settings = await profileService.GetSettingsAsync(userId);
                return Results.Ok(new { success = true, data = settings });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { success = false, message = ex.Message });
            }
        })
        .WithName("GetUserSettings")
        .WithSummary("获取用户设置");

        // 更新用户设置
        group.MapPut("/settings", async (
            HttpContext context,
            [FromBody] UserSettingsDto request,
            [FromServices] IUserProfileService profileService) =>
        {
            var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var settings = await profileService.UpdateSettingsAsync(userId, request);
                return Results.Ok(new { success = true, data = settings });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { success = false, message = ex.Message });
            }
        })
        .WithName("UpdateUserSettings")
        .WithSummary("更新用户设置");

        return app;
    }
}
