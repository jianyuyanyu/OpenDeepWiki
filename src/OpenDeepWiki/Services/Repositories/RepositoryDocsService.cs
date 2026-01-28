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

    [HttpGet("/{owner}/{repo}/branches")]
    public async Task<RepositoryBranchesResponse> GetBranchesAsync(string owner, string repo)
    {
        var repository = await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OrgName == owner && item.RepoName == repo);

        if (repository is null)
        {
            return new RepositoryBranchesResponse { Branches = [], Languages = [] };
        }

        var branches = await context.RepositoryBranches
            .AsNoTracking()
            .Where(item => item.RepositoryId == repository.Id)
            .OrderBy(item => item.CreatedAt)
            .ToListAsync();

        var branchItems = new List<BranchItem>();
        var allLanguages = new HashSet<string>();

        foreach (var branch in branches)
        {
            var languages = await context.BranchLanguages
                .AsNoTracking()
                .Where(item => item.RepositoryBranchId == branch.Id)
                .Select(item => item.LanguageCode)
                .ToListAsync();

            branchItems.Add(new BranchItem
            {
                Name = branch.BranchName,
                Languages = languages
            });

            foreach (var lang in languages)
            {
                allLanguages.Add(lang);
            }
        }

        // 确定默认分支
        var defaultBranch = branches.FirstOrDefault(b => 
            string.Equals(b.BranchName, "main", StringComparison.OrdinalIgnoreCase))?.BranchName
            ?? branches.FirstOrDefault(b => 
                string.Equals(b.BranchName, "master", StringComparison.OrdinalIgnoreCase))?.BranchName
            ?? branches.FirstOrDefault()?.BranchName
            ?? "";

        return new RepositoryBranchesResponse
        {
            Branches = branchItems,
            Languages = allLanguages.ToList(),
            DefaultBranch = defaultBranch,
            DefaultLanguage = allLanguages.Contains(DefaultLanguageCode) ? DefaultLanguageCode : allLanguages.FirstOrDefault() ?? ""
        };
    }

    [HttpGet("/{owner}/{repo}/tree")]
    public async Task<RepositoryTreeResponse> GetTreeAsync(string owner, string repo, [FromQuery] string? branch = null, [FromQuery] string? lang = null)
    {
        var repository = await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OrgName == owner && item.RepoName == repo);

        // 仓库不存在
        if (repository is null)
        {
            return new RepositoryTreeResponse
            {
                Owner = owner,
                Repo = repo,
                Exists = false,
                Status = RepositoryStatus.Pending,
                Nodes = []
            };
        }

        // 仓库正在处理中或等待处理
        if (repository.Status == RepositoryStatus.Pending || repository.Status == RepositoryStatus.Processing)
        {
            return new RepositoryTreeResponse
            {
                Owner = repository.OrgName,
                Repo = repository.RepoName,
                Exists = true,
                Status = repository.Status,
                Nodes = []
            };
        }

        // 仓库处理失败
        if (repository.Status == RepositoryStatus.Failed)
        {
            return new RepositoryTreeResponse
            {
                Owner = repository.OrgName,
                Repo = repository.RepoName,
                Exists = true,
                Status = repository.Status,
                Nodes = []
            };
        }

        // 仓库处理完成，获取文档目录
        var branchEntity = await GetBranchAsync(repository.Id, branch);
        var language = await GetLanguageAsync(branchEntity.Id, lang);

        var catalogs = await context.DocCatalogs
            .AsNoTracking()
            .Where(item => item.BranchLanguageId == language.Id && !item.IsDeleted)
            .OrderBy(item => item.Order)
            .ToListAsync();

        if (catalogs.Count == 0)
        {
            // 仓库已完成但没有文档，可能是空仓库
            return new RepositoryTreeResponse
            {
                Owner = repository.OrgName,
                Repo = repository.RepoName,
                Exists = true,
                Status = repository.Status,
                Nodes = []
            };
        }

        // 构建树形结构
        var catalogMap = catalogs.ToDictionary(c => c.Id);
        var rootNodes = new List<RepositoryTreeNodeResponse>();

        foreach (var catalog in catalogs.Where(c => c.ParentId == null))
        {
            rootNodes.Add(BuildTreeNode(catalog, catalogMap));
        }

        var defaultSlug = catalogs
            .Where(c => c.ParentId == null)
            .OrderBy(c => c.Order)
            .Select(c => NormalizePath(c.Path))
            .FirstOrDefault() ?? string.Empty;

        return new RepositoryTreeResponse
        {
            Owner = repository.OrgName,
            Repo = repository.RepoName,
            DefaultSlug = defaultSlug,
            Nodes = rootNodes,
            Exists = true,
            Status = repository.Status,
            CurrentBranch = branchEntity.BranchName,
            CurrentLanguage = language.LanguageCode
        };
    }

    [HttpGet("/{owner}/{repo}/docs/{*slug}")]
    public async Task<RepositoryDocResponse> GetDocAsync(string owner, string repo, string slug, [FromQuery] string? branch = null, [FromQuery] string? lang = null)
    {
        var repository = await GetRepositoryAsync(owner, repo);
        var branchEntity = await GetBranchAsync(repository.Id, branch);
        var language = await GetLanguageAsync(branchEntity.Id, lang);
        var normalizedSlug = NormalizePath(slug);

        var catalog = await context.DocCatalogs
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.BranchLanguageId == language.Id && item.Path == normalizedSlug && !item.IsDeleted);

        if (catalog is null)
        {
            throw new InvalidOperationException("文档不存在");
        }

        if (catalog.DocFileId is null)
        {
            throw new InvalidOperationException("文档内容不存在");
        }

        var docFile = await context.DocFiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == catalog.DocFileId);

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

    private async Task<RepositoryBranch> GetBranchAsync(string repositoryId, string? branchName)
    {
        var branches = await context.RepositoryBranches
            .AsNoTracking()
            .Where(item => item.RepositoryId == repositoryId)
            .ToListAsync();

        if (branches.Count == 0)
        {
            throw new InvalidOperationException("仓库分支不存在");
        }

        // 如果指定了分支名，尝试查找
        if (!string.IsNullOrWhiteSpace(branchName))
        {
            var specified = branches.FirstOrDefault(item => 
                string.Equals(item.BranchName, branchName, StringComparison.OrdinalIgnoreCase));
            if (specified is not null)
            {
                return specified;
            }
        }

        // 否则返回默认分支
        return branches.FirstOrDefault(item => string.Equals(item.BranchName, "main", StringComparison.OrdinalIgnoreCase))
               ?? branches.FirstOrDefault(item => string.Equals(item.BranchName, "master", StringComparison.OrdinalIgnoreCase))
               ?? branches.OrderBy(item => item.CreatedAt).First();
    }

    private async Task<BranchLanguage> GetLanguageAsync(string branchId, string? languageCode)
    {
        var languages = await context.BranchLanguages
            .AsNoTracking()
            .Where(item => item.RepositoryBranchId == branchId)
            .ToListAsync();

        if (languages.Count == 0)
        {
            throw new InvalidOperationException("仓库语言不存在");
        }

        // 如果指定了语言代码，尝试查找
        if (!string.IsNullOrWhiteSpace(languageCode))
        {
            var specified = languages.FirstOrDefault(item => 
                string.Equals(item.LanguageCode, languageCode, StringComparison.OrdinalIgnoreCase));
            if (specified is not null)
            {
                return specified;
            }
        }

        // 否则返回默认语言
        return languages.FirstOrDefault(item => string.Equals(item.LanguageCode, DefaultLanguageCode, StringComparison.OrdinalIgnoreCase))
               ?? languages.OrderBy(item => item.CreatedAt).First();
    }

    private async Task<RepositoryBranch> GetDefaultBranchAsync(string repositoryId)
    {
        return await GetBranchAsync(repositoryId, null);
    }

    private async Task<BranchLanguage> GetDefaultLanguageAsync(string branchId)
    {
        return await GetLanguageAsync(branchId, null);
    }

    private static string NormalizePath(string path)
    {
        return path.Trim().Trim('/');
    }

    private static RepositoryTreeNodeResponse BuildTreeNode(DocCatalog catalog, Dictionary<string, DocCatalog> catalogMap)
    {
        var node = new RepositoryTreeNodeResponse
        {
            Title = catalog.Title,
            Slug = NormalizePath(catalog.Path),
            Children = []
        };

        var children = catalogMap.Values
            .Where(c => c.ParentId == catalog.Id)
            .OrderBy(c => c.Order);

        foreach (var child in children)
        {
            node.Children.Add(BuildTreeNode(child, catalogMap));
        }

        return node;
    }
}
