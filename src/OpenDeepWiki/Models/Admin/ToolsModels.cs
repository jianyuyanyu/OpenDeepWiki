namespace OpenDeepWiki.Models.Admin;

/// <summary>
/// MCP 配置请求
/// </summary>
public class McpConfigRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ServerUrl { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>
/// MCP 配置 DTO
/// </summary>
public class McpConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ServerUrl { get; set; } = string.Empty;
    public bool HasApiKey { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Skill 配置请求
/// </summary>
public class SkillConfigRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PromptTemplate { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>
/// Skill 配置 DTO
/// </summary>
public class SkillConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PromptTemplate { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 模型配置请求
/// </summary>
public class ModelConfigRequest
{
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public string? Endpoint { get; set; }
    public string? ApiKey { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
}

/// <summary>
/// 模型配置 DTO
/// </summary>
public class ModelConfigDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public string? Endpoint { get; set; }
    public bool HasApiKey { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
