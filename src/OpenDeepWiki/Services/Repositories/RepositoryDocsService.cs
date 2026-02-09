using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models;

namespace OpenDeepWiki.Services.Repositories;

[MiniApi(Route = "/api/v1/repos")]
[Tags("仓库文档")]
public class RepositoryDocsService(IContext context, IGitPlatformService gitPlatformService)
{
    private const string FallbackLanguageCode = "zh"; // 当没有默认语言标记时的回退语言

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
        string? defaultLanguageCode = null;

        foreach (var branch in branches)
        {
            // 获取该分支下有实际文档内容的语言
            var languagesWithContent = await context.BranchLanguages
                .AsNoTracking()
                .Where(item => item.RepositoryBranchId == branch.Id)
                .Where(item => context.DocCatalogs.Any(c => c.BranchLanguageId == item.Id && !c.IsDeleted))
                .ToListAsync();

            // 只有当分支有内容时才添加
            if (languagesWithContent.Count > 0)
            {
                branchItems.Add(new BranchItem
                {
                    Name = branch.BranchName,
                    Languages = languagesWithContent.Select(l => l.LanguageCode).ToList()
                });

                foreach (var lang in languagesWithContent)
                {
                    allLanguages.Add(lang.LanguageCode);
                    // 记录标记为默认的语言
                    if (lang.IsDefault && defaultLanguageCode is null)
                    {
                        defaultLanguageCode = lang.LanguageCode;
                    }
                }
            }
        }

        // 确定默认分支（只从有内容的分支中选择）
        var defaultBranch = branchItems.FirstOrDefault(b => 
            string.Equals(b.Name, "main", StringComparison.OrdinalIgnoreCase))?.Name
            ?? branchItems.FirstOrDefault(b => 
                string.Equals(b.Name, "master", StringComparison.OrdinalIgnoreCase))?.Name
            ?? branchItems.FirstOrDefault()?.Name
            ?? "";

        // 确定默认语言：优先使用标记的默认语言，否则回退
        var finalDefaultLanguage = defaultLanguageCode 
            ?? (allLanguages.Contains(FallbackLanguageCode) ? FallbackLanguageCode : allLanguages.FirstOrDefault() ?? "");

        return new RepositoryBranchesResponse
        {
            Branches = branchItems,
            Languages = allLanguages.ToList(),
            DefaultBranch = defaultBranch,
            DefaultLanguage = finalDefaultLanguage
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

        // 递归查找第一个有实际内容的文档
        var defaultSlug = FindFirstContentSlug(catalogs, null) ?? string.Empty;

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
        var normalizedSlug = NormalizePath(slug);

        var repository = await GetRepositoryAsync(owner, repo);
        if (repository is null)
        {
            return new RepositoryDocResponse { Slug = normalizedSlug, Exists = false };
        }

        var branchEntity = await GetBranchAsync(repository.Id, branch);
        if (branchEntity is null)
        {
            return new RepositoryDocResponse { Slug = normalizedSlug, Exists = false };
        }

        var language = await GetLanguageAsync(branchEntity.Id, lang);
        if (language is null)
        {
            return new RepositoryDocResponse { Slug = normalizedSlug, Exists = false };
        }

        var catalog = await context.DocCatalogs
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.BranchLanguageId == language.Id && item.Path == normalizedSlug && !item.IsDeleted);

        if (catalog is null || catalog.DocFileId is null)
        {
            return new RepositoryDocResponse { Slug = normalizedSlug, Exists = false };
        }

        var docFile = await context.DocFiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == catalog.DocFileId);

        if (docFile is null)
        {
            return new RepositoryDocResponse { Slug = normalizedSlug, Exists = false };
        }

        // 解析来源文件列表
        var sourceFiles = new List<string>();
        if (!string.IsNullOrEmpty(docFile.SourceFiles))
        {
            try
            {
                sourceFiles = System.Text.Json.JsonSerializer.Deserialize<List<string>>(docFile.SourceFiles) ?? [];
            }
            catch
            {
                // 解析失败时返回空列表
            }
        }

        return new RepositoryDocResponse
        {
            Slug = normalizedSlug,
            Content = docFile.Content,
            SourceFiles = sourceFiles,
            Exists = true
        };
    }

    /// <summary>
    /// 检查GitHub仓库是否存在
    /// </summary>
    [HttpGet("/{owner}/{repo}/check")]
    public async Task<GitRepoCheckResponse> CheckRepoAsync(string owner, string repo)
    {
        var repoInfo = await gitPlatformService.CheckRepoExistsAsync(owner, repo);
        
        return new GitRepoCheckResponse
        {
            Exists = repoInfo.Exists,
            Name = repoInfo.Name,
            Description = repoInfo.Description,
            DefaultBranch = repoInfo.DefaultBranch,
            StarCount = repoInfo.StarCount,
            ForkCount = repoInfo.ForkCount,
            Language = repoInfo.Language,
            AvatarUrl = repoInfo.AvatarUrl,
            GitUrl = $"https://github.com/{owner}/{repo}"
        };
    }

    private async Task<Repository?> GetRepositoryAsync(string owner, string repo)
    {
        return await context.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OrgName == owner && item.RepoName == repo);
    }

    private async Task<RepositoryBranch?> GetBranchAsync(string repositoryId, string? branchName)
    {
        var branches = await context.RepositoryBranches
            .AsNoTracking()
            .Where(item => item.RepositoryId == repositoryId)
            .ToListAsync();

        if (branches.Count == 0)
        {
            return null;
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

    private async Task<BranchLanguage?> GetLanguageAsync(string branchId, string? languageCode)
    {
        var languages = await context.BranchLanguages
            .AsNoTracking()
            .Where(item => item.RepositoryBranchId == branchId)
            .ToListAsync();

        if (languages.Count == 0)
        {
            return null;
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

        // 优先返回标记为默认的语言
        var defaultLanguage = languages.FirstOrDefault(item => item.IsDefault);
        if (defaultLanguage is not null)
        {
            return defaultLanguage;
        }

        // 回退：使用预设的回退语言代码
        return languages.FirstOrDefault(item => string.Equals(item.LanguageCode, FallbackLanguageCode, StringComparison.OrdinalIgnoreCase))
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

    /// <summary>
    /// 递归查找第一个有实际内容的文档路径
    /// </summary>
    private static string? FindFirstContentSlug(List<DocCatalog> catalogs, string? parentId)
    {
        var children = catalogs
            .Where(c => c.ParentId == parentId)
            .OrderBy(c => c.Order)
            .ToList();

        foreach (var child in children)
        {
            // 如果当前节点有内容，返回它的路径
            if (!string.IsNullOrEmpty(child.DocFileId))
            {
                return NormalizePath(child.Path);
            }

            // 否则递归查找子节点
            var childSlug = FindFirstContentSlug(catalogs, child.Id);
            if (childSlug != null)
            {
                return childSlug;
            }
        }

        return null;
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
