using System.Text.Json;

namespace OpenDeepWiki.Services.Repositories;

/// <summary>
/// Git平台服务实现
/// </summary>
public class GitPlatformService(IHttpClientFactory httpClientFactory, ILogger<GitPlatformService> logger) : IGitPlatformService
{
    public async Task<GitRepoStats?> GetRepoStatsAsync(string gitUrl)
    {
        var (platform, owner, repo) = ParseGitUrl(gitUrl);
        
        if (platform == null || owner == null || repo == null)
        {
            return null;
        }

        return platform switch
        {
            "github" => await GetGitHubStatsAsync(owner, repo),
            "gitee" => await GetGiteeStatsAsync(owner, repo),
            _ => null
        };
    }

    private static (string? platform, string? owner, string? repo) ParseGitUrl(string gitUrl)
    {
        try
        {
            // 支持格式: https://github.com/owner/repo 或 https://github.com/owner/repo.git
            var uri = new Uri(gitUrl.TrimEnd('/'));
            var host = uri.Host.ToLowerInvariant();
            
            string? platform = host switch
            {
                "github.com" => "github",
                "gitee.com" => "gitee",
                _ => null
            };

            if (platform == null)
            {
                return (null, null, null);
            }

            var segments = uri.AbsolutePath.Trim('/').Split('/');
            if (segments.Length < 2)
            {
                return (null, null, null);
            }

            var owner = segments[0];
            var repo = segments[1].Replace(".git", "", StringComparison.OrdinalIgnoreCase);

            return (platform, owner, repo);
        }
        catch
        {
            return (null, null, null);
        }
    }

    private async Task<GitRepoStats?> GetGitHubStatsAsync(string owner, string repo)
    {
        try
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "OpenDeepWiki");
            client.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");

            var response = await client.GetAsync($"https://api.github.com/repos/{owner}/{repo}");
            
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("获取GitHub仓库信息失败: {Owner}/{Repo}, 状态码: {StatusCode}", owner, repo, response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var starCount = root.GetProperty("stargazers_count").GetInt32();
            var forkCount = root.GetProperty("forks_count").GetInt32();

            return new GitRepoStats(starCount, forkCount);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "获取GitHub仓库统计信息异常: {Owner}/{Repo}", owner, repo);
            return null;
        }
    }

    private async Task<GitRepoStats?> GetGiteeStatsAsync(string owner, string repo)
    {
        try
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "OpenDeepWiki");

            var response = await client.GetAsync($"https://gitee.com/api/v5/repos/{owner}/{repo}");
            
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("获取Gitee仓库信息失败: {Owner}/{Repo}, 状态码: {StatusCode}", owner, repo, response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var starCount = root.GetProperty("stargazers_count").GetInt32();
            var forkCount = root.GetProperty("forks_count").GetInt32();

            return new GitRepoStats(starCount, forkCount);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "获取Gitee仓库统计信息异常: {Owner}/{Repo}", owner, repo);
            return null;
        }
    }
}
