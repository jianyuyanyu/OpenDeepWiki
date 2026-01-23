# Design Document

## Overview

本设计文档描述仓库 Wiki 自动生成系统的技术架构和实现方案。系统采用后台 Worker + AI Agent 架构，通过 Microsoft.Agents.AI 框架构建智能代理，使用 Tool 机制让 AI 操作目录结构、读取代码和生成文档。

### 核心设计原则

1. **工具驱动**: AI 通过 Tool 与系统交互，而非直接生成完整 JSON
2. **路径抽象**: 对 AI 隐藏实际文件路径，只暴露相对路径
3. **模型分离**: 目录生成和内容生成可配置不同模型
4. **提示词插件化**: 系统提示词通过插件系统管理

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Repository Form │  │ Repository List │  │   Wiki Viewer   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (ASP.NET Core)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Repository API  │  │   Wiki API      │  │  Config API     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              RepositoryProcessingWorker                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │ Repository  │  │   Catalog   │  │    Content      │    │  │
│  │  │  Analyzer   │  │  Generator  │  │   Generator     │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AI Agent Layer                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │  Git Tool   │  │Catalog Tool │  │    Doc Tool     │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Prompt Plugin System                    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer (EF Core)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Repository  │  │ DocCatalog  │  │      DocFile            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

```

## Components and Interfaces

### 1. Repository Analyzer

负责克隆仓库并准备工作目录。

```csharp
public interface IRepositoryAnalyzer
{
    /// <summary>
    /// 克隆或更新仓库到本地工作目录
    /// </summary>
    Task<RepositoryWorkspace> PrepareWorkspaceAsync(
        Repository repository, 
        string branchName,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// 清理工作目录
    /// </summary>
    Task CleanupWorkspaceAsync(RepositoryWorkspace workspace);
    
    /// <summary>
    /// 获取两个 commit 之间的变更文件列表
    /// </summary>
    Task<string[]> GetChangedFilesAsync(
        RepositoryWorkspace workspace,
        string? fromCommitId,
        string toCommitId,
        CancellationToken cancellationToken);
}

public class RepositoryWorkspace
{
    public string WorkingDirectory { get; set; }  // /data/{org}/{name}/tree/
    public string Organization { get; set; }
    public string RepositoryName { get; set; }
    public string BranchName { get; set; }
    public string CommitId { get; set; }  // 当前 HEAD commit ID
    public string? PreviousCommitId { get; set; }  // 上次处理的 commit ID
}
```

### 2. AI Tools

#### 2.1 Git Tool

```csharp
public class GitTool
{
    private readonly string _workingDirectory;
    
    [Description("读取仓库中指定文件的内容")]
    public string Read(
        [Description("相对于仓库根目录的文件路径，如 'src/main.cs' 或 'README.md'")] 
        string relativePath)
    {
        var fullPath = Path.Combine(_workingDirectory, relativePath);
        return File.ReadAllText(fullPath);
    }
    
    [Description("在仓库中搜索匹配指定模式的内容")]
    public GrepResult[] Grep(
        [Description("搜索模式，支持正则表达式")] 
        string pattern,
        [Description("可选的文件扩展名过滤，如 '*.cs'")] 
        string? filePattern = null)
    {
        // 使用 grep 或自实现搜索
    }
}

public class GrepResult
{
    public string FilePath { get; set; }
    public int LineNumber { get; set; }
    public string LineContent { get; set; }
}
```

#### 2.2 Catalog Tool

```csharp
public class CatalogTool
{
    private readonly CatalogStorage _storage;
    
    [Description("读取当前的 Wiki 目录结构")]
    public string Read()
    {
        return _storage.GetCatalogJson();
    }
    
    [Description("写入完整的 Wiki 目录结构")]
    public void Write(
        [Description("JSON 格式的目录结构")] 
        string catalogJson)
    {
        _storage.SetCatalog(catalogJson);
    }
    
    [Description("编辑目录结构中的指定节点")]
    public void Edit(
        [Description("要编辑的节点路径，如 '1-overview'")] 
        string path,
        [Description("新的节点数据 JSON")] 
        string nodeJson)
    {
        _storage.UpdateNode(path, nodeJson);
    }
}
```

#### 2.3 Doc Tool

```csharp
public class DocTool
{
    private readonly DocStorage _storage;
    
    [Description("为指定目录项写入文档内容")]
    public void Write(
        [Description("目录项路径，如 '1-overview'")] 
        string catalogPath,
        [Description("Markdown 格式的文档内容")] 
        string content)
    {
        _storage.WriteDocument(catalogPath, content);
    }
    
    [Description("编辑指定目录项的文档内容")]
    public void Edit(
        [Description("目录项路径")] 
        string catalogPath,
        [Description("要替换的原始内容")] 
        string oldContent,
        [Description("新的内容")] 
        string newContent)
    {
        _storage.EditDocument(catalogPath, oldContent, newContent);
    }
}
```

### 3. Prompt Plugin System

```csharp
public interface IPromptPlugin
{
    /// <summary>
    /// 根据名称加载提示词
    /// </summary>
    Task<string> LoadPromptAsync(string promptName, Dictionary<string, string>? variables = null);
}

public class FilePromptPlugin : IPromptPlugin
{
    private readonly string _promptsDirectory;
    
    public async Task<string> LoadPromptAsync(string promptName, Dictionary<string, string>? variables = null)
    {
        var path = Path.Combine(_promptsDirectory, $"{promptName}.md");
        var template = await File.ReadAllTextAsync(path);
        
        if (variables != null)
        {
            foreach (var (key, value) in variables)
            {
                template = template.Replace($"{{{{{key}}}}}", value);
            }
        }
        
        return template;
    }
}
```

### 4. Wiki Generator

```csharp
public interface IWikiGenerator
{
    Task GenerateCatalogAsync(RepositoryWorkspace workspace, BranchLanguage language, CancellationToken ct);
    Task GenerateDocumentsAsync(RepositoryWorkspace workspace, BranchLanguage language, CancellationToken ct);
    Task IncrementalUpdateAsync(RepositoryWorkspace workspace, BranchLanguage language, string[] changedFiles, CancellationToken ct);
}

public class WikiGenerator : IWikiGenerator
{
    private readonly AgentFactory _agentFactory;
    private readonly IPromptPlugin _promptPlugin;
    private readonly WikiGeneratorOptions _options;
    
    public async Task GenerateCatalogAsync(RepositoryWorkspace workspace, BranchLanguage language, CancellationToken ct)
    {
        var prompt = await _promptPlugin.LoadPromptAsync("catalog-generator", new Dictionary<string, string>
        {
            ["repository_name"] = workspace.RepositoryName,
            ["language"] = language.LanguageCode
        });
        
        var gitTool = new GitTool(workspace.WorkingDirectory);
        var catalogTool = new CatalogTool(new CatalogStorage(language.Id));
        
        var agent = _agentFactory.CreateAgent(_options.CatalogModel, options =>
        {
            options.Instructions = prompt;
            options.Tools = [gitTool, catalogTool];
        });
        
        await agent.InvokeAsync("分析仓库并生成 Wiki 目录结构", ct);
    }
    
    public async Task IncrementalUpdateAsync(RepositoryWorkspace workspace, BranchLanguage language, string[] changedFiles, CancellationToken ct)
    {
        // 只更新受影响的文档
        var prompt = await _promptPlugin.LoadPromptAsync("incremental-updater", new Dictionary<string, string>
        {
            ["repository_name"] = workspace.RepositoryName,
            ["changed_files"] = string.Join("\n", changedFiles),
            ["previous_commit"] = workspace.PreviousCommitId ?? "initial",
            ["current_commit"] = workspace.CommitId
        });
        
        // ... 创建 agent 并执行增量更新
    }
}
```

## Data Models

### Catalog Item Structure

```json
{
  "items": [
    {
      "title": "Overview",
      "path": "1-overview",
      "order": 1,
      "children": []
    },
    {
      "title": "Architecture",
      "path": "2-architecture",
      "order": 2,
      "children": [
        {
          "title": "System Design",
          "path": "2.1-system-design",
          "order": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### Entity Updates

```csharp
// 更新 RepositoryBranch 实体以支持 commit ID 跟踪
public class RepositoryBranch : AggregateRoot<string>
{
    public string RepositoryId { get; set; }
    public string BranchName { get; set; }
    public string? LastCommitId { get; set; }  // 最后处理的 commit ID
    public DateTime? LastProcessedAt { get; set; }  // 最后处理时间
    
    public virtual Repository? Repository { get; set; }
}

// 更新 DocDirectory 实体以支持树形结构
public class DocCatalog : AggregateRoot<string>
{
    public string BranchLanguageId { get; set; }
    public string? ParentId { get; set; }
    public string Title { get; set; }
    public string Path { get; set; }  // URL 友好的路径，如 "1-overview"
    public int Order { get; set; }
    public string? DocFileId { get; set; }
    
    public virtual DocCatalog? Parent { get; set; }
    public virtual ICollection<DocCatalog> Children { get; set; }
    public virtual DocFile? DocFile { get; set; }
}
```

### Configuration Models

```csharp
public class WikiGeneratorOptions
{
    public string CatalogModel { get; set; } = "gpt-4o-mini";
    public string ContentModel { get; set; } = "gpt-4o";
    public string? CatalogEndpoint { get; set; }
    public string? ContentEndpoint { get; set; }
    public string? CatalogApiKey { get; set; }
    public string? ContentApiKey { get; set; }
    public string PromptsDirectory { get; set; } = "prompts";
    public string RepositoriesDirectory { get; set; } = "/data";
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Repository Submission State Invariant

*For any* valid repository submission request, the created repository SHALL have status Pending, and associated RepositoryBranch and BranchLanguage records SHALL exist.

**Validates: Requirements 1.1, 1.2**

### Property 2: Processing State Transitions

*For any* repository being processed, the status transitions SHALL follow: Pending → Processing → (Completed | Failed). No other transitions are valid.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Processing Order Consistency

*For any* set of pending repositories, the processing order SHALL match their creation time order (oldest first).

**Validates: Requirements 2.5**

### Property 4: Catalog Item Structure Validity

*For any* catalog item, it SHALL contain non-empty title, valid path, and order >= 0. *For any* branch language, all catalog item paths SHALL be unique.

**Validates: Requirements 4.2, 4.5**

### Property 5: Catalog Serialization Round-Trip

*For any* valid catalog tree structure, serializing to JSON then deserializing SHALL produce an equivalent structure.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Catalog Tool Read/Write Round-Trip

*For any* valid catalog JSON, writing via CatalogTool.Write then reading via CatalogTool.Read SHALL return equivalent JSON structure.

**Validates: Requirements 12.1, 12.2, 12.4**

### Property 7: Catalog Tool Edit Merge

*For any* existing catalog and valid edit operation, CatalogTool.Edit SHALL merge changes while preserving unmodified nodes.

**Validates: Requirements 12.3, 12.5**

### Property 8: Git Tool Path Abstraction

*For any* file read operation, GitTool SHALL only expose relative paths. The actual file system path SHALL never appear in tool responses.

**Validates: Requirements 13.3, 13.5, 13.6**

### Property 9: Git Tool Grep Results

*For any* grep operation with a pattern that exists in files, the results SHALL contain file paths (relative) and matching line content.

**Validates: Requirements 13.2, 13.4**

### Property 10: Doc Tool Write Association

*For any* DocTool.Write operation, the created document SHALL be associated with the specified catalog item.

**Validates: Requirements 14.1, 14.3, 5.5**

### Property 11: Prompt Plugin Variable Substitution

*For any* prompt template with variables, loading with variable values SHALL replace all {{variable}} placeholders with provided values.

**Validates: Requirements 15.1, 15.4**

### Property 12: API 404 for Non-Existent Paths

*For any* API request with a non-existent catalog path, the response SHALL be HTTP 404.

**Validates: Requirements 8.3**

## Error Handling

### Repository Analyzer Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Clone failed (auth) | Use provided credentials, retry once |
| Clone failed (network) | Retry up to 3 times with exponential backoff |
| Clone failed (not found) | Mark repository as Failed, log error |
| File read error | Log warning, continue with available files |

### AI Generation Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| API timeout | Retry up to 3 times |
| Rate limit | Wait and retry with backoff |
| Invalid response | Retry with different prompt |
| All retries failed | Mark repository as Failed |

### Tool Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| Invalid JSON (CatalogTool) | Return error to AI, let it fix |
| File not found (GitTool) | Return error message to AI |
| Path not found (DocTool) | Return error message to AI |

## Testing Strategy

### Unit Tests

- Repository submission validation
- Catalog item structure validation
- JSON serialization/deserialization
- Path resolution logic
- Prompt template variable substitution

### Property-Based Tests

Using FsCheck for .NET property-based testing:

1. **Catalog Round-Trip**: Generate random catalog trees, verify serialization round-trip
2. **Path Abstraction**: Generate random file paths, verify only relative paths exposed
3. **State Transitions**: Generate random processing sequences, verify valid transitions
4. **Edit Merge**: Generate random catalogs and edits, verify merge correctness

### Integration Tests

- End-to-end repository processing flow
- API endpoint responses
- Database persistence verification

### Test Configuration

```csharp
// Property test configuration
[Property(MaxTest = 100)]
public Property CatalogRoundTrip()
{
    return Prop.ForAll(
        Arb.From<CatalogItem>(),
        catalog => {
            var json = JsonSerializer.Serialize(catalog);
            var restored = JsonSerializer.Deserialize<CatalogItem>(json);
            return catalog.Equals(restored);
        });
}
```
