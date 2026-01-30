using Microsoft.AspNetCore.Mvc;
using OpenDeepWiki.Models.Admin;
using OpenDeepWiki.Services.Admin;

namespace OpenDeepWiki.Endpoints.Admin;

/// <summary>
/// 管理端仓库管理端点
/// </summary>
public static class AdminRepositoryEndpoints
{
    public static RouteGroupBuilder MapAdminRepositoryEndpoints(this RouteGroupBuilder group)
    {
        var repoGroup = group.MapGroup("/repositories")
            .WithTags("管理端-仓库管理");

        // 获取仓库列表（分页）
        repoGroup.MapGet("/", async (
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? search,
            [FromQuery] int? status,
            [FromServices] IAdminRepositoryService repositoryService) =>
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 20;
            var result = await repositoryService.GetRepositoriesAsync(page, pageSize, search, status);
            return Results.Ok(new { success = true, data = result });
        })
        .WithName("AdminGetRepositories")
        .WithSummary("获取仓库列表");

        // 获取仓库详情
        repoGroup.MapGet("/{id}", async (
            string id,
            [FromServices] IAdminRepositoryService repositoryService) =>
        {
            var result = await repositoryService.GetRepositoryByIdAsync(id);
            if (result == null)
                return Results.NotFound(new { success = false, message = "仓库不存在" });
            return Results.Ok(new { success = true, data = result });
        })
        .WithName("AdminGetRepository")
        .WithSummary("获取仓库详情");

        // 更新仓库
        repoGroup.MapPut("/{id}", async (
            string id,
            [FromBody] UpdateRepositoryRequest request,
            [FromServices] IAdminRepositoryService repositoryService) =>
        {
            var result = await repositoryService.UpdateRepositoryAsync(id, request);
            if (!result)
                return Results.NotFound(new { success = false, message = "仓库不存在" });
            return Results.Ok(new { success = true, message = "更新成功" });
        })
        .WithName("AdminUpdateRepository")
        .WithSummary("更新仓库");

        // 删除仓库
        repoGroup.MapDelete("/{id}", async (
            string id,
            [FromServices] IAdminRepositoryService repositoryService) =>
        {
            var result = await repositoryService.DeleteRepositoryAsync(id);
            if (!result)
                return Results.NotFound(new { success = false, message = "仓库不存在" });
            return Results.Ok(new { success = true, message = "删除成功" });
        })
        .WithName("AdminDeleteRepository")
        .WithSummary("删除仓库");

        // 更新仓库状态
        repoGroup.MapPut("/{id}/status", async (
            string id,
            [FromBody] UpdateStatusRequest request,
            [FromServices] IAdminRepositoryService repositoryService) =>
        {
            var result = await repositoryService.UpdateRepositoryStatusAsync(id, request.Status);
            if (!result)
                return Results.NotFound(new { success = false, message = "仓库不存在" });
            return Results.Ok(new { success = true, message = "状态更新成功" });
        })
        .WithName("AdminUpdateRepositoryStatus")
        .WithSummary("更新仓库状态");

        return group;
    }
}
