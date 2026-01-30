using Microsoft.AspNetCore.Mvc;
using OpenDeepWiki.Models.Admin;
using OpenDeepWiki.Services.Admin;

namespace OpenDeepWiki.Endpoints.Admin;

/// <summary>
/// 管理端系统设置端点
/// </summary>
public static class AdminSettingsEndpoints
{
    public static RouteGroupBuilder MapAdminSettingsEndpoints(this RouteGroupBuilder group)
    {
        var settingsGroup = group.MapGroup("/settings")
            .WithTags("管理端-系统设置");

        // 获取系统设置
        settingsGroup.MapGet("/", async (
            [FromQuery] string? category,
            [FromServices] IAdminSettingsService settingsService) =>
        {
            var result = await settingsService.GetSettingsAsync(category);
            return Results.Ok(new { success = true, data = result });
        })
        .WithName("AdminGetSettings")
        .WithSummary("获取系统设置");

        // 更新系统设置
        settingsGroup.MapPut("/", async (
            [FromBody] List<UpdateSettingRequest> requests,
            [FromServices] IAdminSettingsService settingsService) =>
        {
            await settingsService.UpdateSettingsAsync(requests);
            return Results.Ok(new { success = true, message = "设置更新成功" });
        })
        .WithName("AdminUpdateSettings")
        .WithSummary("更新系统设置");

        // 获取单个设置
        settingsGroup.MapGet("/{key}", async (
            string key,
            [FromServices] IAdminSettingsService settingsService) =>
        {
            var result = await settingsService.GetSettingByKeyAsync(key);
            if (result == null)
                return Results.NotFound(new { success = false, message = "设置不存在" });
            return Results.Ok(new { success = true, data = result });
        })
        .WithName("AdminGetSetting")
        .WithSummary("获取单个设置");

        return group;
    }
}
