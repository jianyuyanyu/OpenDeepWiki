using OpenDeepWiki.Models.Admin;

namespace OpenDeepWiki.Services.Admin;

/// <summary>
/// 管理端工具配置服务接口
/// </summary>
public interface IAdminToolsService
{
    // MCP 配置
    Task<List<McpConfigDto>> GetMcpConfigsAsync();
    Task<McpConfigDto> CreateMcpConfigAsync(McpConfigRequest request);
    Task<bool> UpdateMcpConfigAsync(string id, McpConfigRequest request);
    Task<bool> DeleteMcpConfigAsync(string id);

    // Skill 配置
    Task<List<SkillConfigDto>> GetSkillConfigsAsync();
    Task<SkillConfigDto> CreateSkillConfigAsync(SkillConfigRequest request);
    Task<bool> UpdateSkillConfigAsync(string id, SkillConfigRequest request);
    Task<bool> DeleteSkillConfigAsync(string id);

    // 模型配置
    Task<List<ModelConfigDto>> GetModelConfigsAsync();
    Task<ModelConfigDto> CreateModelConfigAsync(ModelConfigRequest request);
    Task<bool> UpdateModelConfigAsync(string id, ModelConfigRequest request);
    Task<bool> DeleteModelConfigAsync(string id);
}
