using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models;
using System;

namespace OpenDeepWiki.Services.Repositories;

[MiniApi(Route = "/api/v1/repositories")]
[Tags("仓库")]
public class RepositoryService(IContext context)
{
    [HttpPost("/submit")]
    public async Task<Repository> SubmitAsync([FromBody] RepositorySubmitRequest request)
    {
        if (!request.IsPublic && string.IsNullOrWhiteSpace(request.AuthAccount) && string.IsNullOrWhiteSpace(request.AuthPassword))
        {
            throw new InvalidOperationException("仓库凭据为空时不允许设置为私有");
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
            Status = RepositoryStatus.Pending
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
}
