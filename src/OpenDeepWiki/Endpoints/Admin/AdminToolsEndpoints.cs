using Microsoft.AspNetCore.Mvc;
using OpenDeepWiki.Models.Admin;
using OpenDeepWiki.Services.Admin;

namespace OpenDeepWiki.Endpoints.Admin;

/// <summary>
/// 管理端工具配置端点
/// </summary>
public static class AdminToolsEndpoints
{
    public static RouteGroupBuilder MapAdminToolsEndpoints(this RouteGroupBuilder group)
    {
        var toolsGroup = group.MapGroup("/tools")
            .WithTags("管理端-工具配置");

        // MCP 配置端点
        MapMcpEndpoints(toolsGroup);
        // Skill 配置端点
        MapSkillEndpoints(toolsGroup);
        // 模型配置端点
        MapModelEndpoints(toolsGroup);

        return group;
    }

    private static void MapMcpEndpoints(RouteGroupBuilder group)
    {
        var mcpGroup = group.MapGroup("/mcps");

        mcpGroup.MapGet("/", async ([FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.GetMcpConfigsAsync();
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminGetMcps");

        mcpGroup.MapPost("/", async (
            [FromBody] McpConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.CreateMcpConfigAsync(request);
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminCreateMcp");

        mcpGroup.MapPut("/{id}", async (
            string id,
            [FromBody] McpConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.UpdateMcpConfigAsync(id, request);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminUpdateMcp");

        mcpGroup.MapDelete("/{id}", async (
            string id,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.DeleteMcpConfigAsync(id);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminDeleteMcp");
    }

    private static void MapSkillEndpoints(RouteGroupBuilder group)
    {
        var skillGroup = group.MapGroup("/skills");

        skillGroup.MapGet("/", async ([FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.GetSkillConfigsAsync();
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminGetSkills");

        skillGroup.MapPost("/", async (
            [FromBody] SkillConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.CreateSkillConfigAsync(request);
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminCreateSkill");

        skillGroup.MapPut("/{id}", async (
            string id,
            [FromBody] SkillConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.UpdateSkillConfigAsync(id, request);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminUpdateSkill");

        skillGroup.MapDelete("/{id}", async (
            string id,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.DeleteSkillConfigAsync(id);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminDeleteSkill");
    }

    private static void MapModelEndpoints(RouteGroupBuilder group)
    {
        var modelGroup = group.MapGroup("/models");

        modelGroup.MapGet("/", async ([FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.GetModelConfigsAsync();
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminGetModels");

        modelGroup.MapPost("/", async (
            [FromBody] ModelConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.CreateModelConfigAsync(request);
            return Results.Ok(new { success = true, data = result });
        }).WithName("AdminCreateModel");

        modelGroup.MapPut("/{id}", async (
            string id,
            [FromBody] ModelConfigRequest request,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.UpdateModelConfigAsync(id, request);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminUpdateModel");

        modelGroup.MapDelete("/{id}", async (
            string id,
            [FromServices] IAdminToolsService toolsService) =>
        {
            var result = await toolsService.DeleteModelConfigAsync(id);
            return result ? Results.Ok(new { success = true })
                : Results.NotFound(new { success = false });
        }).WithName("AdminDeleteModel");
    }
}
