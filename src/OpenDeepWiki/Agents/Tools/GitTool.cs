using System.ComponentModel;
using System.Text.RegularExpressions;

namespace OpenDeepWiki.Agents.Tools;

/// <summary>
/// AI Tool for reading and searching repository code.
/// Provides methods for AI agents to access repository files with path abstraction.
/// The actual file system path is hidden from the AI agent.
/// </summary>
public class GitTool
{
    private readonly string _workingDirectory;

    /// <summary>
    /// Initializes a new instance of GitTool with the specified working directory.
    /// </summary>
    /// <param name="workingDirectory">The absolute path to the repository working directory.</param>
    public GitTool(string workingDirectory)
    {
        if (string.IsNullOrWhiteSpace(workingDirectory))
        {
            throw new ArgumentException("Working directory cannot be empty.", nameof(workingDirectory));
        }

        _workingDirectory = Path.GetFullPath(workingDirectory);
        
        if (!Directory.Exists(_workingDirectory))
        {
            throw new DirectoryNotFoundException($"Working directory does not exist: {_workingDirectory}");
        }
    }

    /// <summary>
    /// Reads the content of a file at the specified relative path.
    /// </summary>
    /// <param name="relativePath">The path relative to the repository root, e.g., "src/main.cs" or "README.md".</param>
    /// <returns>The file content as a string.</returns>
    [Description("读取仓库中指定文件的内容")]
    public string Read(
        [Description("相对于仓库根目录的文件路径，如 'src/main.cs' 或 'README.md'")] 
        string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException("Relative path cannot be empty.", nameof(relativePath));
        }

        // Normalize the path to prevent directory traversal attacks
        var normalizedPath = NormalizePath(relativePath);
        var fullPath = Path.GetFullPath(Path.Combine(_workingDirectory, normalizedPath));

        // Security check: ensure the resolved path is within the working directory
        if (!fullPath.StartsWith(_workingDirectory, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException($"Access denied: path '{relativePath}' is outside the repository.");
        }

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {relativePath}");
        }

        return File.ReadAllText(fullPath);
    }

    /// <summary>
    /// Reads the content of a file asynchronously at the specified relative path.
    /// </summary>
    /// <param name="relativePath">The path relative to the repository root.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The file content as a string.</returns>
    [Description("异步读取仓库中指定文件的内容")]
    public async Task<string> ReadAsync(
        [Description("相对于仓库根目录的文件路径，如 'src/main.cs' 或 'README.md'")] 
        string relativePath,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException("Relative path cannot be empty.", nameof(relativePath));
        }

        var normalizedPath = NormalizePath(relativePath);
        var fullPath = Path.GetFullPath(Path.Combine(_workingDirectory, normalizedPath));

        if (!fullPath.StartsWith(_workingDirectory, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException($"Access denied: path '{relativePath}' is outside the repository.");
        }

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {relativePath}");
        }

        return await File.ReadAllTextAsync(fullPath, cancellationToken);
    }

    /// <summary>
    /// Searches for patterns in repository files.
    /// </summary>
    /// <param name="pattern">The search pattern (supports regex).</param>
    /// <param name="filePattern">Optional file extension filter, e.g., "*.cs".</param>
    /// <returns>Array of grep results with file paths and matching lines.</returns>
    [Description("在仓库中搜索匹配指定模式的内容")]
    public GrepResult[] Grep(
        [Description("搜索模式，支持正则表达式")] 
        string pattern,
        [Description("可选的文件扩展名过滤，如 '*.cs'")] 
        string? filePattern = null)
    {
        if (string.IsNullOrWhiteSpace(pattern))
        {
            throw new ArgumentException("Search pattern cannot be empty.", nameof(pattern));
        }

        var results = new List<GrepResult>();
        var regex = new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
        var searchPattern = string.IsNullOrWhiteSpace(filePattern) ? "*" : filePattern;

        try
        {
            var files = Directory.GetFiles(_workingDirectory, searchPattern, SearchOption.AllDirectories);

            foreach (var file in files)
            {
                // Skip binary files and hidden directories
                if (IsBinaryFile(file) || IsHiddenPath(file))
                {
                    continue;
                }

                try
                {
                    var lines = File.ReadAllLines(file);
                    for (int i = 0; i < lines.Length; i++)
                    {
                        if (regex.IsMatch(lines[i]))
                        {
                            // Return relative path only - hide actual file system path
                            var relativePath = GetRelativePath(file);
                            results.Add(new GrepResult
                            {
                                FilePath = relativePath,
                                LineNumber = i + 1,
                                LineContent = lines[i].Trim()
                            });
                        }
                    }
                }
                catch (Exception)
                {
                    // Skip files that cannot be read
                }
            }
        }
        catch (Exception)
        {
            // Return empty results if directory enumeration fails
        }

        return results.ToArray();
    }

    /// <summary>
    /// Searches for patterns in repository files asynchronously.
    /// </summary>
    /// <param name="pattern">The search pattern (supports regex).</param>
    /// <param name="filePattern">Optional file extension filter.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Array of grep results.</returns>
    [Description("异步在仓库中搜索匹配指定模式的内容")]
    public async Task<GrepResult[]> GrepAsync(
        [Description("搜索模式，支持正则表达式")] 
        string pattern,
        [Description("可选的文件扩展名过滤，如 '*.cs'")] 
        string? filePattern = null,
        CancellationToken cancellationToken = default)
    {
        return await Task.Run(() => Grep(pattern, filePattern), cancellationToken);
    }

    /// <summary>
    /// Lists files in the repository matching the specified pattern.
    /// </summary>
    /// <param name="filePattern">Optional file pattern filter, e.g., "*.cs".</param>
    /// <returns>Array of relative file paths.</returns>
    [Description("列出仓库中匹配指定模式的文件")]
    public string[] ListFiles(
        [Description("可选的文件模式过滤，如 '*.cs'")] 
        string? filePattern = null)
    {
        var searchPattern = string.IsNullOrWhiteSpace(filePattern) ? "*" : filePattern;
        var files = Directory.GetFiles(_workingDirectory, searchPattern, SearchOption.AllDirectories);

        return files
            .Where(f => !IsHiddenPath(f))
            .Select(GetRelativePath)
            .ToArray();
    }

    /// <summary>
    /// Normalizes a path by replacing backslashes with forward slashes and removing leading slashes.
    /// </summary>
    private static string NormalizePath(string path)
    {
        // Replace backslashes with forward slashes
        var normalized = path.Replace('\\', '/');
        
        // Remove leading slashes
        normalized = normalized.TrimStart('/');
        
        // Remove any ".." components to prevent directory traversal
        var parts = normalized.Split('/').Where(p => p != ".." && p != ".").ToArray();
        
        return string.Join(Path.DirectorySeparatorChar.ToString(), parts);
    }

    /// <summary>
    /// Gets the relative path from the working directory.
    /// </summary>
    private string GetRelativePath(string fullPath)
    {
        var relativePath = Path.GetRelativePath(_workingDirectory, fullPath);
        // Always use forward slashes for consistency
        return relativePath.Replace('\\', '/');
    }

    /// <summary>
    /// Checks if a file is likely binary based on extension.
    /// </summary>
    private static bool IsBinaryFile(string filePath)
    {
        var binaryExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".exe", ".dll", ".so", ".dylib", ".bin", ".obj", ".o",
            ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".zip", ".tar", ".gz", ".rar", ".7z",
            ".mp3", ".mp4", ".avi", ".mov", ".wav",
            ".ttf", ".otf", ".woff", ".woff2", ".eot",
            ".db", ".sqlite", ".mdb"
        };

        var extension = Path.GetExtension(filePath);
        return binaryExtensions.Contains(extension);
    }

    /// <summary>
    /// Checks if a path contains hidden directories (starting with .).
    /// </summary>
    private bool IsHiddenPath(string fullPath)
    {
        var relativePath = GetRelativePath(fullPath);
        var parts = relativePath.Split('/', '\\');
        
        // Check if any directory component starts with . (except current directory)
        return parts.Any(p => p.StartsWith('.') && p != ".");
    }
}

/// <summary>
/// Represents a grep search result.
/// </summary>
public class GrepResult
{
    /// <summary>
    /// The relative file path where the match was found.
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// The line number (1-based) where the match was found.
    /// </summary>
    public int LineNumber { get; set; }

    /// <summary>
    /// The content of the matching line.
    /// </summary>
    public string LineContent { get; set; } = string.Empty;
}
