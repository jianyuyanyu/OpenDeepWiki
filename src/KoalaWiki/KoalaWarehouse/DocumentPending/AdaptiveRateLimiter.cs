using System.Collections.Concurrent;

namespace KoalaWiki.KoalaWarehouse.DocumentPending;

/// <summary>
/// 自适应速率限制器 - 根据 API 响应动态调整并发和延迟
/// </summary>
public class AdaptiveRateLimiter
{
    private readonly SemaphoreSlim _semaphore;
    private readonly ConcurrentQueue<DateTimeOffset> _successTimestamps = new();
    private readonly ConcurrentQueue<DateTimeOffset> _errorTimestamps = new();
    private int _currentDelay = 1000; // 初始延迟 1 秒
    private readonly object _lock = new();

    public AdaptiveRateLimiter(int initialConcurrency = 3)
    {
        _semaphore = new SemaphoreSlim(initialConcurrency, initialConcurrency);
    }

    /// <summary>
    /// 等待获取执行权限
    /// </summary>
    public async Task<IDisposable> AcquireAsync(CancellationToken cancellationToken = default)
    {
        await _semaphore.WaitAsync(cancellationToken);

        // 动态延迟
        var delay = GetAdaptiveDelay();
        if (delay > 0)
        {
            await Task.Delay(delay, cancellationToken);
        }

        return new ReleaseHandle(this);
    }

    /// <summary>
    /// 记录成功执行
    /// </summary>
    public void RecordSuccess()
    {
        _successTimestamps.Enqueue(DateTimeOffset.UtcNow);
        AdjustParameters(isSuccess: true);
        CleanupOldTimestamps();
    }

    /// <summary>
    /// 记录失败执行（429 限流或其他 API 错误）
    /// </summary>
    public void RecordError(bool isRateLimit = false)
    {
        _errorTimestamps.Enqueue(DateTimeOffset.UtcNow);
        AdjustParameters(isSuccess: false, isRateLimit: isRateLimit);
        CleanupOldTimestamps();
    }

    /// <summary>
    /// 获取自适应延迟时间
    /// </summary>
    private int GetAdaptiveDelay()
    {
        lock (_lock)
        {
            return _currentDelay;
        }
    }

    /// <summary>
    /// 动态调整参数
    /// </summary>
    private void AdjustParameters(bool isSuccess, bool isRateLimit = false)
    {
        lock (_lock)
        {
            var recentWindow = TimeSpan.FromMinutes(5);
            var recentSuccessCount = _successTimestamps.Count(t => t > DateTimeOffset.UtcNow - recentWindow);
            var recentErrorCount = _errorTimestamps.Count(t => t > DateTimeOffset.UtcNow - recentWindow);

            var totalRecent = recentSuccessCount + recentErrorCount;
            if (totalRecent == 0) return;

            var successRate = (double)recentSuccessCount / totalRecent;

            if (isRateLimit)
            {
                // 遇到限流，激进退避
                _currentDelay = Math.Min(_currentDelay * 2, 30000); // 最大30秒
                Log.Logger.Warning("遭遇 API 限流，延迟增加至 {delay}ms", _currentDelay);
            }
            else if (!isSuccess)
            {
                // 其他错误，适度增加延迟
                _currentDelay = Math.Min(_currentDelay + 500, 10000); // 最大10秒
            }
            else if (successRate > 0.9 && _currentDelay > 500)
            {
                // 成功率高，减少延迟
                _currentDelay = Math.Max(_currentDelay - 200, 500); // 最小500ms
            }
        }
    }

    /// <summary>
    /// 清理旧的时间戳（保留最近 5 分钟）
    /// </summary>
    private void CleanupOldTimestamps()
    {
        var cutoff = DateTimeOffset.UtcNow - TimeSpan.FromMinutes(5);

        while (_successTimestamps.TryPeek(out var timestamp) && timestamp < cutoff)
        {
            _successTimestamps.TryDequeue(out _);
        }

        while (_errorTimestamps.TryPeek(out var timestamp) && timestamp < cutoff)
        {
            _errorTimestamps.TryDequeue(out _);
        }
    }

    private class ReleaseHandle : IDisposable
    {
        private readonly AdaptiveRateLimiter _limiter;
        private bool _disposed;

        public ReleaseHandle(AdaptiveRateLimiter limiter)
        {
            _limiter = limiter;
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _limiter._semaphore.Release();
                _disposed = true;
            }
        }
    }

    /// <summary>
    /// 获取当前统计信息
    /// </summary>
    public (int currentDelay, int successCount, int errorCount) GetStats()
    {
        var recentWindow = TimeSpan.FromMinutes(5);
        var recentSuccessCount = _successTimestamps.Count(t => t > DateTimeOffset.UtcNow - recentWindow);
        var recentErrorCount = _errorTimestamps.Count(t => t > DateTimeOffset.UtcNow - recentWindow);

        return (_currentDelay, recentSuccessCount, recentErrorCount);
    }
}
