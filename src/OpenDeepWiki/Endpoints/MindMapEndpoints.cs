using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;

namespace OpenDeepWiki.Endpoints;

/// <summary>
/// 思维导图相关端点
/// </summary>
public static class MindMapEndpoints
{
    public static IEndpointRouteBuilder MapMindMapEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/repos")
            .WithTags("思维导图");

        // 获取仓库思维导图
        group.MapGet("/{owner}/{repo}/mindmap", GetMindMapAsync)
            .WithName("GetMindMap")
            .WithSummary("获取仓库项目架构思维导图");

        return app;
    }

    private static async Task<IResult> GetMindMapAsync(
        string owner,
        string repo,
        [FromQuery] string? branch,
        [FromQuery] string? lang,
        [FromServices] IContext context)
    {
        // 查找仓库
        var repository = await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.OrgName == owner && r.RepoName == repo);

        if (repository is null)
        {
            return Results.NotFound(new { error = "仓库不存在" });
        }

        // 查找分支
        var branchQuery = context.RepositoryBranches
            .AsNoTracking()
            .Where(b => b.RepositoryId == repository.Id);

        if (!string.IsNullOrEmpty(branch))
        {
            branchQuery = branchQuery.Where(b => b.BranchName == branch);
        }

        var repoBranch = await branchQuery.FirstOrDefaultAsync();
        if (repoBranch is null)
        {
            return Results.NotFound(new { error = "分支不存在" });
        }

        // 查找语言
        var languageQuery = context.BranchLanguages
            .AsNoTracking()
            .Where(l => l.RepositoryBranchId == repoBranch.Id && !l.IsDeleted);

        if (!string.IsNullOrEmpty(lang))
        {
            languageQuery = languageQuery.Where(l => l.LanguageCode == lang);
        }
        else
        {
            // 优先选择默认语言
            languageQuery = languageQuery.OrderByDescending(l => l.IsDefault);
        }

        var branchLanguage = await languageQuery.FirstOrDefaultAsync();
        if (branchLanguage is null)
        {
            return Results.NotFound(new { error = "语言不存在" });
        }

        return Results.Ok(new MindMapResponse
        {
            Owner = owner,
            Repo = repo,
            Branch = repoBranch.BranchName,
            Language = branchLanguage.LanguageCode,
            Status = branchLanguage.MindMapStatus,
            StatusName = branchLanguage.MindMapStatus.ToString(),
            Content = branchLanguage.MindMapContent
        });
    }
}

/// <summary>
/// 思维导图API响应
/// </summary>
public class MindMapResponse
{
    public string Owner { get; set; } = string.Empty;
    public string Repo { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public MindMapStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? Content { get; set; }
}
