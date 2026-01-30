using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models.Admin;

namespace OpenDeepWiki.Services.Admin;

/// <summary>
/// 管理端工具配置服务实现
/// </summary>
public class AdminToolsService : IAdminToolsService
{
    private readonly IContext _context;

    public AdminToolsService(IContext context)
    {
        _context = context;
    }

    #region MCP 配置

    public async Task<List<McpConfigDto>> GetMcpConfigsAsync()
    {
        return await _context.McpConfigs
            .Where(m => !m.IsDeleted)
            .OrderBy(m => m.SortOrder)
            .Select(m => new McpConfigDto
            {
                Id = m.Id,
                Name = m.Name,
                Description = m.Description,
                ServerUrl = m.ServerUrl,
                HasApiKey = !string.IsNullOrEmpty(m.ApiKey),
                IsActive = m.IsActive,
                SortOrder = m.SortOrder,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<McpConfigDto> CreateMcpConfigAsync(McpConfigRequest request)
    {
        var config = new McpConfig
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            ServerUrl = request.ServerUrl,
            ApiKey = request.ApiKey,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.McpConfigs.Add(config);
        await _context.SaveChangesAsync();

        return new McpConfigDto
        {
            Id = config.Id,
            Name = config.Name,
            Description = config.Description,
            ServerUrl = config.ServerUrl,
            HasApiKey = !string.IsNullOrEmpty(config.ApiKey),
            IsActive = config.IsActive,
            SortOrder = config.SortOrder,
            CreatedAt = config.CreatedAt
        };
    }

    public async Task<bool> UpdateMcpConfigAsync(string id, McpConfigRequest request)
    {
        var config = await _context.McpConfigs.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (config == null) return false;

        config.Name = request.Name;
        config.Description = request.Description;
        config.ServerUrl = request.ServerUrl;
        if (request.ApiKey != null) config.ApiKey = request.ApiKey;
        config.IsActive = request.IsActive;
        config.SortOrder = request.SortOrder;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMcpConfigAsync(string id)
    {
        var config = await _context.McpConfigs.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (config == null) return false;

        config.IsDeleted = true;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Skill 配置

    public async Task<List<SkillConfigDto>> GetSkillConfigsAsync()
    {
        return await _context.SkillConfigs
            .Where(s => !s.IsDeleted)
            .OrderBy(s => s.SortOrder)
            .Select(s => new SkillConfigDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                PromptTemplate = s.PromptTemplate,
                IsActive = s.IsActive,
                SortOrder = s.SortOrder,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<SkillConfigDto> CreateSkillConfigAsync(SkillConfigRequest request)
    {
        var config = new SkillConfig
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Description = request.Description,
            PromptTemplate = request.PromptTemplate,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.SkillConfigs.Add(config);
        await _context.SaveChangesAsync();

        return new SkillConfigDto
        {
            Id = config.Id,
            Name = config.Name,
            Description = config.Description,
            PromptTemplate = config.PromptTemplate,
            IsActive = config.IsActive,
            SortOrder = config.SortOrder,
            CreatedAt = config.CreatedAt
        };
    }

    public async Task<bool> UpdateSkillConfigAsync(string id, SkillConfigRequest request)
    {
        var config = await _context.SkillConfigs.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (config == null) return false;

        config.Name = request.Name;
        config.Description = request.Description;
        config.PromptTemplate = request.PromptTemplate;
        config.IsActive = request.IsActive;
        config.SortOrder = request.SortOrder;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteSkillConfigAsync(string id)
    {
        var config = await _context.SkillConfigs.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (config == null) return false;

        config.IsDeleted = true;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region 模型配置

    public async Task<List<ModelConfigDto>> GetModelConfigsAsync()
    {
        return await _context.ModelConfigs
            .Where(m => !m.IsDeleted)
            .OrderByDescending(m => m.IsDefault)
            .ThenBy(m => m.Name)
            .Select(m => new ModelConfigDto
            {
                Id = m.Id,
                Name = m.Name,
                Provider = m.Provider,
                ModelId = m.ModelId,
                Endpoint = m.Endpoint,
                HasApiKey = !string.IsNullOrEmpty(m.ApiKey),
                IsDefault = m.IsDefault,
                IsActive = m.IsActive,
                Description = m.Description,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ModelConfigDto> CreateModelConfigAsync(ModelConfigRequest request)
    {
        var config = new ModelConfig
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Provider = request.Provider,
            ModelId = request.ModelId,
            Endpoint = request.Endpoint,
            ApiKey = request.ApiKey,
            IsDefault = request.IsDefault,
            IsActive = request.IsActive,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.ModelConfigs.Add(config);
        await _context.SaveChangesAsync();

        return new ModelConfigDto
        {
            Id = config.Id,
            Name = config.Name,
            Provider = config.Provider,
            ModelId = config.ModelId,
            Endpoint = config.Endpoint,
            HasApiKey = !string.IsNullOrEmpty(config.ApiKey),
            IsDefault = config.IsDefault,
            IsActive = config.IsActive,
            Description = config.Description,
            CreatedAt = config.CreatedAt
        };
    }

    public async Task<bool> UpdateModelConfigAsync(string id, ModelConfigRequest request)
    {
        var config = await _context.ModelConfigs.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (config == null) return false;

        config.Name = request.Name;
        config.Provider = request.Provider;
        config.ModelId = request.ModelId;
        config.Endpoint = request.Endpoint;
        if (request.ApiKey != null) config.ApiKey = request.ApiKey;
        config.IsDefault = request.IsDefault;
        config.IsActive = request.IsActive;
        config.Description = request.Description;
        config.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteModelConfigAsync(string id)
    {
        var config = await _context.ModelConfigs.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (config == null) return false;

        config.IsDeleted = true;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion
}