# Implementation Plan: 文档对话助手悬浮球

## Overview

本实现计划将文档对话助手功能分为以下几个阶段：
1. 数据库实体和迁移
2. 后端服务和API
3. 前端组件
4. 用户应用系统
5. 嵌入脚本
6. 管理后台配置

## Tasks

- [x] 1. 创建数据库实体和迁移
  - [x] 1.1 创建ChatAssistantConfig实体
    - 在 `src/OpenDeepWiki.Entities/Chat/` 目录下创建实体
    - 包含IsEnabled、EnabledModelIds、EnabledMcpIds、EnabledSkillIds、DefaultModelId字段
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  - [x] 1.2 创建ChatApp实体
    - 包含UserId、Name、Description、IconUrl、AppId、AppSecret字段
    - 包含域名校验配置：EnableDomainValidation、AllowedDomains
    - 包含AI配置：ProviderType、ApiKey、BaseUrl、AvailableModels、DefaultModel
    - 包含RateLimitPerMinute、IsActive字段
    - _Requirements: 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4_
  - [x] 1.3 创建AppStatistics实体
    - 包含AppId、Date、RequestCount、InputTokens、OutputTokens字段
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  - [x] 1.4 创建ChatLog实体
    - 包含AppId、UserIdentifier、Question、AnswerSummary、InputTokens、OutputTokens、ModelUsed、SourceDomain字段
    - _Requirements: 16.1, 16.2, 16.5_
  - [x] 1.5 更新MasterDbContext添加DbSet和索引配置
    - 添加ChatAssistantConfigs、ChatApps、AppStatistics、ChatLogs DbSet
    - 配置AppId唯一索引、统计日期索引等
    - _Requirements: 12.2_
  - [x] 1.6 创建数据库迁移
    - 运行 `dotnet ef migrations add AddChatAssistantEntities`
    - _Requirements: 1.1-1.5_

- [x] 2. 实现后端核心服务
  - [x] 2.1 创建DocReadTool文档读取工具
    - 在 `src/OpenDeepWiki/Agents/Tools/` 目录下创建
    - 实现ReadDocumentAsync方法，根据owner/repo/branch/language读取文档
    - 实现权限控制，只能读取当前仓库文档
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 2.2 编写DocReadTool属性测试
    - **Property 4: 文档读取权限控制**
    - **Validates: Requirements 6.2, 6.3**
  - [x] 2.3 创建McpToolConverter MCP工具转换器
    - 在 `src/OpenDeepWiki/Services/Chat/` 目录下创建
    - 实现ConvertMcpConfigsToToolsAsync方法
    - 将MCP配置转换为AITool
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 2.4 创建ChatAssistantService对话服务
    - 实现GetConfigAsync获取助手配置
    - 实现GetAvailableModelsAsync获取可用模型列表
    - 实现StreamChatAsync SSE流式对话
    - 使用AgentFactory创建Agent，集成DocReadTool和MCP工具
    - _Requirements: 3.1, 3.2, 5.3, 5.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 2.5 编写模型过滤属性测试
    - **Property 5: 模型过滤正确性**
    - **Validates: Requirements 3.2**
  - [x] 2.6 编写SSE事件格式属性测试
    - **Property 3: SSE事件格式一致性**
    - **Validates: Requirements 9.3, 9.4**

- [x] 3. 实现对话助手API端点
  - [x] 3.1 创建ChatAssistantEndpoints
    - 在 `src/OpenDeepWiki/Endpoints/` 目录下创建
    - 实现 GET /api/v1/chat/config 获取配置
    - 实现 GET /api/v1/chat/models 获取模型列表
    - 实现 POST /api/v1/chat/stream SSE流式对话
    - _Requirements: 2.4, 3.1, 9.1_
  - [x] 3.2 在Program.cs中注册端点
    - 添加 app.MapChatAssistantEndpoints()
    - _Requirements: 3.1_

- [x] 4. Checkpoint - 后端核心功能验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 实现前端悬浮球和对话面板
  - [x] 5.1 创建useChatHistory Hook
    - 在 `web/hooks/` 目录下创建 use-chat-history.ts
    - 实现消息历史管理：addMessage、updateMessage、clearHistory
    - 支持存储用户消息、AI回复、工具调用和工具结果
    - _Requirements: 8.1, 8.2, 8.4_
  - [x] 5.2 编写对话历史属性测试
    - **Property 2: 对话历史完整性**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  - [x] 5.3 创建chat-api.ts SSE客户端
    - 在 `web/lib/` 目录下创建
    - 实现streamChat异步生成器函数
    - 解析SSE事件流
    - _Requirements: 9.2_
  - [x] 5.4 创建FloatingBall悬浮球组件
    - 在 `web/components/chat/` 目录下创建
    - 固定在页面右下角
    - 支持enabled、iconUrl、isOpen属性
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 5.5 创建ChatPanel对话面板组件
    - 包含消息列表、输入框、发送按钮
    - 包含ModelSelector模型选择器
    - 支持Markdown渲染
    - 支持显示工具调用信息
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_
  - [x] 5.6 创建ImageUpload图片上传组件
    - 支持PNG、JPG、GIF、WebP格式
    - 图片大小限制10MB
    - 图片预览功能
    - Base64编码
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 5.7 编写图片编码属性测试
    - **Property 6: 图片编码正确性**
    - **Validates: Requirements 4.3, 4.4**
  - [x] 5.8 集成悬浮球到文档页面
    - 在 `web/app/[owner]/[repo]/layout.tsx` 中添加FloatingBall
    - 传递DocContext上下文
    - _Requirements: 1.1, 5.1, 5.2_
  - [x] 5.9 编写上下文传递属性测试
    - **Property 1: 上下文传递完整性**
    - **Validates: Requirements 5.1, 5.2**

- [x] 6. Checkpoint - 内置悬浮球功能验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 实现用户应用管理后端
  - [x] 7.1 创建ChatAppService应用服务
    - 在 `src/OpenDeepWiki/Services/Chat/` 目录下创建
    - 实现CreateAppAsync：生成唯一AppId和AppSecret
    - 实现GetUserAppsAsync、GetAppByIdAsync、UpdateAppAsync、DeleteAppAsync
    - 实现RegenerateSecretAsync重新生成密钥
    - _Requirements: 12.2, 12.6, 12.7_
  - [x] 7.2 编写AppId唯一性属性测试
    - **Property 7: AppId唯一性**
    - **Validates: Requirements 12.2**
  - [x] 7.3 创建AppStatisticsService统计服务
    - 实现RecordRequestAsync记录请求
    - 实现GetStatisticsAsync按日期范围查询统计
    - 实现聚合计算每日调用次数、Token消耗
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.7_
  - [x] 7.4 编写统计数据记录属性测试
    - **Property 9: 统计数据记录完整性**
    - **Validates: Requirements 15.1, 15.3, 15.4**
  - [x] 7.5 创建ChatLogService提问记录服务
    - 实现RecordChatLogAsync记录提问
    - 实现GetLogsAsync按时间范围和关键词查询
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  - [x] 7.6 编写提问记录关联属性测试
    - **Property 10: 提问记录关联正确性**
    - **Validates: Requirements 16.1, 16.5**
  - [x] 7.7 创建ChatAppEndpoints应用API端点
    - 实现 GET /api/v1/apps 获取用户应用列表
    - 实现 POST /api/v1/apps 创建应用
    - 实现 GET /api/v1/apps/{id} 获取应用详情
    - 实现 PUT /api/v1/apps/{id} 更新应用
    - 实现 DELETE /api/v1/apps/{id} 删除应用
    - 实现 POST /api/v1/apps/{id}/regenerate-secret 重新生成密钥
    - 实现 GET /api/v1/apps/{id}/statistics 获取统计
    - 实现 GET /api/v1/apps/{id}/logs 获取提问记录
    - _Requirements: 12.6, 15.6, 15.7, 16.3, 16.4_

- [x] 8. 实现嵌入脚本后端
  - [x] 8.1 创建EmbedService嵌入服务
    - 实现ValidateAppAsync验证AppId有效性
    - 实现ValidateDomainAsync验证域名
    - 实现GetAppConfigAsync获取应用配置
    - _Requirements: 17.1, 17.2, 14.7_
  - [x] 8.2 编写域名校验属性测试
    - **Property 8: 域名校验正确性**
    - **Validates: Requirements 14.7, 17.2**
  - [x] 8.3 编写安全验证属性测试
    - **Property 11: 安全验证完整性**
    - **Validates: Requirements 17.1, 17.2**
  - [x] 8.4 创建EmbedEndpoints嵌入API端点
    - 实现 GET /api/v1/embed/config 获取嵌入配置
    - 实现 POST /api/v1/embed/stream 嵌入模式SSE对话
    - 验证AppId和域名
    - 使用应用配置的模型和API
    - _Requirements: 13.5, 13.6, 14.2, 17.4_
  - [x] 8.5 编写应用配置应用属性测试
    - **Property 12: 应用配置应用正确性**
    - **Validates: Requirements 13.5**

- [x] 9. Checkpoint - 用户应用后端验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 实现用户应用前端
  - [x] 10.1 创建apps-api.ts应用API客户端
    - 在 `web/lib/` 目录下创建
    - 实现应用CRUD、统计查询、日志查询API调用
    - _Requirements: 12.6, 15.6, 16.3_
  - [x] 10.2 创建应用列表页面
    - 在 `web/app/(main)/apps/page.tsx` 创建
    - 显示用户创建的应用列表
    - 提供创建应用入口
    - _Requirements: 12.1, 12.6_
  - [x] 10.3 创建应用创建/编辑表单组件
    - 在 `web/components/apps/` 目录下创建
    - 包含名称、描述、图标URL输入
    - 包含域名校验配置
    - 包含AI模型配置（ProviderType、ApiKey、BaseUrl、模型列表）
    - _Requirements: 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4_
  - [x] 10.4 创建应用详情页面
    - 在 `web/app/(main)/apps/[id]/page.tsx` 创建
    - 显示应用配置信息
    - 显示嵌入脚本代码示例
    - 显示统计数据图表
    - 提供提问记录查询
    - _Requirements: 14.1, 15.6, 16.3_
  - [x] 10.5 创建统计图表组件
    - 使用图表库展示每日调用次数、Token消耗趋势
    - 支持日期范围选择
    - _Requirements: 15.6, 15.7_
  - [x] 10.6 创建提问记录列表组件
    - 显示提问内容、时间、AI回复摘要
    - 支持关键词搜索和时间范围筛选
    - _Requirements: 16.3, 16.4_

- [x] 11. 实现嵌入脚本前端
  - [x] 11.1 创建embed.js嵌入脚本
    - 在 `web/public/` 目录下创建
    - 读取data-app-id和data-icon属性
    - 验证配置后注入悬浮球
    - _Requirements: 14.2, 14.3, 14.4, 14.7_
  - [x] 11.2 创建EmbedChatWidget嵌入对话组件
    - 独立的悬浮球和对话面板
    - 使用应用配置的模型
    - _Requirements: 14.5, 14.6_

- [x] 12. 实现管理后台配置
  - [x] 12.1 创建AdminChatAssistantService管理服务
    - 实现GetConfigAsync获取配置
    - 实现UpdateConfigAsync更新配置
    - _Requirements: 10.1, 10.6_
  - [x] 12.2 创建AdminChatAssistantEndpoints管理端点
    - 实现 GET /api/admin/chat-assistant/config
    - 实现 PUT /api/admin/chat-assistant/config
    - _Requirements: 10.1, 10.6_
  - [x] 12.3 创建管理后台配置页面
    - 在管理后台添加对话助手配置页面
    - 选择可用模型、MCPs、Skills
    - 启用/禁用功能开关
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. 实现错误处理
  - [x] 13.1 前端错误处理
    - SSE连接失败提示和重试
    - 超时处理和重试
    - 模型不可用提示
    - 保留对话历史
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x] 13.2 后端错误处理
    - 定义错误码常量
    - SSE错误事件格式
    - 工具调用错误处理
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 14. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 验证内置悬浮球功能
  - 验证用户应用创建和管理
  - 验证嵌入脚本功能
  - 验证管理后台配置
  - 如有问题请询问用户

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 使用TypeScript进行前端开发
- 使用C#进行后端开发
- 属性测试使用FsCheck库，每个测试至少运行100次迭代
