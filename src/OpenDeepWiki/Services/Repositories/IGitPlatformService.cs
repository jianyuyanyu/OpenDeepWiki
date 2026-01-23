namespace OpenDeepWiki.Services.Repositories;

/// <summary>
/// Git平台仓库统计信息
/// </summary>
public record GitRepoStats(int StarCount, int ForkCount);

/// <summary>
/// Git平台服务接口
/// </summary>
public interface IGitPlatformService
{
    /// <summary>
    /// 获取仓库统计信息（star数、fork数）
    /// </summary>
    /// <param name="gitUrl">Git仓库地址</param>
    /// <returns>统计信息，获取失败返回null</returns>
    Task<GitRepoStats?> GetRepoStatsAsync(string gitUrl);
}
