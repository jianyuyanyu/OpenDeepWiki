using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models;

namespace OpenDeepWiki.Services.Repositories;

[MiniApi(Route = "/api/v1/repos")]
[Tags("仓库文档")]
public class RepositoryDocsService(IContext context)
{
    private const string DefaultLanguageCode = "zh";

    [HttpGet("/{owner}/{repo}/tree")]
    public async Task<RepositoryTreeResponse> GetTreeAsync(string owner, string repo)
    {
        var repository = await GetRepositoryAsync(owner, repo);
        var branch = await GetDefaultBranchAsync(repository.Id);
        var language = await GetDefaultLanguageAsync(branch.Id);

        var directories = await context.DocDirectories
            .AsNoTracking()
            .Where(item => item.BranchLanguageId == language.Id)
            .OrderBy(item => item.Path)
            .ToListAsync();

        if (directories.Count == 0)
        {
            throw new InvalidOperationException("未找到文档目录");
        }

        var rootNodes = new List<RepositoryTreeNodeResponse>();
        var nodeMap = new Dictionary<string, RepositoryTreeNodeResponse>(StringComparer.OrdinalIgnoreCase);
        var normalizedPaths = new List<string>();

        foreach (var directory in directories)
        {
            var normalizedPath = NormalizePath(directory.Path);
            if (string.IsNullOrWhiteSpace(normalizedPath))
            {
                continue;
            }

            normalizedPaths.Add(normalizedPath);
            var segments = normalizedPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var currentPath = string.Empty;
            var currentChildren = rootNodes;

            foreach (var segment in segments)
            {
                currentPath = string.IsNullOrEmpty(currentPath) ? segment : $"{currentPath}/{segment}";
                if (!nodeMap.TryGetValue(currentPath, out var node))
                {
                    node = new RepositoryTreeNodeResponse
                    {
                        Title = segment,
                        Slug = currentPath,
                        Children = []
                    };

                    nodeMap[currentPath] = node;
                    currentChildren.Add(node);
                }

                currentChildren = node.Children;
            }
        }

        var defaultSlug = normalizedPaths
            .OrderBy(path => path, StringComparer.Ordinal)
            .FirstOrDefault() ?? string.Empty;

        return new RepositoryTreeResponse
        {
            Owner = repository.OrgName,
            Repo = repository.RepoName,
            DefaultSlug = defaultSlug,
            Nodes = rootNodes
        };
    }

    [HttpGet("/{owner}/{repo}/docs/{*slug}")]
    public async Task<RepositoryDocResponse> GetDocAsync(string owner, string repo, string slug)
    {
        var repository = await GetRepositoryAsync(owner, repo);
        var branch = await GetDefaultBranchAsync(repository.Id);
        var language = await GetDefaultLanguageAsync(branch.Id);
        var normalizedSlug = NormalizePath(slug);

        var directory = await context.DocDirectories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.BranchLanguageId == language.Id && item.Path == normalizedSlug);

        if (directory is null)
        {
            throw new InvalidOperationException("文档不存在");
        }

        var docFile = await context.DocFiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == directory.DocFileId);

        if (docFile is null)
        {
            throw new InvalidOperationException("文档不存在");
        }

        return new RepositoryDocResponse
        {
            Slug = normalizedSlug,
            Content = docFile.Content
        };
    }

    private async Task<Repository> GetRepositoryAsync(string owner, string repo)
    {
        var repository = await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OrgName == owner && item.RepoName == repo);

        if (repository is null)
        {
            throw new InvalidOperationException("仓库不存在");
        }

        return repository;
    }

    private async Task<RepositoryBranch> GetDefaultBranchAsync(string repositoryId)
    {
        var branches = await context.RepositoryBranches
            .AsNoTracking()
            .Where(item => item.RepositoryId == repositoryId)
            .ToListAsync();

        if (branches.Count == 0)
        {
            throw new InvalidOperationException("仓库分支不存在");
        }

        return branches.FirstOrDefault(item => string.Equals(item.BranchName, "main", StringComparison.OrdinalIgnoreCase))
               ?? branches.FirstOrDefault(item => string.Equals(item.BranchName, "master", StringComparison.OrdinalIgnoreCase))
               ?? branches.OrderBy(item => item.CreatedAt).First();
    }

    private async Task<BranchLanguage> GetDefaultLanguageAsync(string branchId)
    {
        var languages = await context.BranchLanguages
            .AsNoTracking()
            .Where(item => item.RepositoryBranchId == branchId)
            .ToListAsync();

        if (languages.Count == 0)
        {
            throw new InvalidOperationException("仓库语言不存在");
        }

        return languages.FirstOrDefault(item => string.Equals(item.LanguageCode, DefaultLanguageCode, StringComparison.OrdinalIgnoreCase))
               ?? languages.OrderBy(item => item.CreatedAt).First();
    }

    private static string NormalizePath(string path)
    {
        return path.Trim().Trim('/');
    }
}
