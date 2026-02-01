# Implementation Plan: OpenDeepWiki 项目文档

## Overview

本任务列表将按模块顺序生成 OpenDeepWiki 项目的技术文档。每个文档以原理解析为核心，包含架构图、代码示例和配置说明。

## Tasks

- [x] 1. 创建文档目录结构
  - [x] 1.1 创建 docs/getting-started/ 目录
  - [x] 1.2 创建 docs/architecture/ 目录
  - [x] 1.3 创建 docs/ai/ 目录
  - [x] 1.4 创建 docs/wiki-generation/ 目录
  - [x] 1.5 创建 docs/chat-system/ 目录
  - [x] 1.6 创建 docs/api/ 目录
  - [x] 1.7 创建 docs/deployment/ 目录
  - _Requirements: 1.1_

- [x] 2. Getting Started 模块文档
  - [x] 2.1 编写 docs/getting-started/introduction.md - 项目简介
    - 项目定位与愿景、核心功能列表、技术栈概览（.NET 9, Next.js, Semantic Kernel）
    - 绘制功能架构图（Mermaid flowchart）
    - 编写与 DeepWiki 关系说明
    - 参考文件: README.md, src/OpenDeepWiki/Program.cs
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 编写 docs/getting-started/quick-start.md - 快速启动指南
    - 环境要求（Docker, .NET SDK, Node.js 版本）
    - Docker 一键启动步骤（参考 compose.yaml）
    - 首次配置步骤（API Key, 数据库选择）
    - 添加第一个仓库教程、验证安装成功
    - 参考文件: compose.yaml, start.sh, start.bat, README.md
    - _Requirements: 1.3_

  - [x] 2.3 编写 docs/getting-started/configuration.md - 环境配置说明
    - AI 模型配置（CHAT_MODEL, ENDPOINT, API_KEY）
    - 数据库配置（SQLite/PostgreSQL/MySQL/SqlServer）
    - Wiki 生成配置、聊天系统配置（飞书/QQ/微信）
    - 高级配置选项、完整环境变量参考表
    - 参考文件: src/OpenDeepWiki/appsettings.json, compose.yaml
    - _Requirements: 1.3_

- [-] 3. Architecture 模块文档
  - [x] 3.1 编写 docs/architecture/overview.md - 系统架构总览
    - 整体架构设计理念、前后端分离架构图（Mermaid graph）
    - 核心模块划分说明、数据流向图、扩展点设计说明
    - 参考文件: src/OpenDeepWiki/Program.cs, web/app/layout.tsx
    - _Requirements: 2.1, 2.4_

  - [x] 3.2 编写 docs/architecture/backend-architecture.md - 后端架构原理
    - ASP.NET Core Minimal APIs 设计模式解析
    - Program.cs 依赖注入配置解析、请求处理管道图
    - JWT 认证机制、服务层设计模式、后台任务处理（HostedService）
    - 参考文件: src/OpenDeepWiki/Program.cs, src/OpenDeepWiki/Services/
    - _Requirements: 2.1_

  - [ ] 3.3 编写 docs/architecture/frontend-architecture.md - 前端架构原理
    - Next.js App Router 路由设计解析、路由结构图
    - 组件分层架构（UI/业务/布局）、数据获取模式（Server Components）
    - 状态管理策略、国际化实现（next-intl）
    - 参考文件: web/app/, web/components/, web/i18n/
    - _Requirements: 2.2, 9.1, 9.2, 9.3, 9.4_

  - [ ] 3.4 编写 docs/architecture/data-layer.md - 数据层架构
    - EF Core 多数据库支持原理、MasterDbContext 设计解析
    - Provider 模式实现（Sqlite/PostgreSQL/MySQL/SqlServer）
    - 实体关系图（ER Diagram）、核心实体模型解析、迁移策略
    - 参考文件: src/OpenDeepWiki.EFCore/, src/OpenDeepWiki.Entities/, src/EFCore/
    - _Requirements: 2.3, 7.1, 7.2, 7.3_

- [ ] 4. AI 模块文档
  - [ ] 4.1 编写 docs/ai/agent-system.md - AI代理系统原理
    - AgentFactory 类设计原理、ChatClientAgent 工作机制
    - AI 代理调用序列图、Tool 绑定与调用流程
    - 流式响应处理机制、Token 统计与限制、重试机制
    - 参考文件: src/OpenDeepWiki/Agents/AgentFactory.cs
    - _Requirements: 3.1_

  - [ ] 4.2 编写 docs/ai/prompt-engineering.md - Prompt工程
    - Prompt 模板系统设计、IPromptPlugin 接口设计
    - FilePromptPlugin 实现、变量替换机制（{{variable}}）
    - catalog-generator.md 和 content-generator.md 模板结构解析
    - 参考文件: src/OpenDeepWiki/prompts/, src/OpenDeepWiki/Services/Prompts/
    - _Requirements: 3.4_

  - [ ] 4.3 编写 docs/ai/tool-system.md - Tool系统
    - AITool 接口设计、GitTool 实现（ListFiles, Read, Grep）
    - CatalogTool 实现（ReadCatalog, WriteCatalog, EditCatalog）
    - DocTool 实现（ReadDoc, WriteDoc, EditDoc）
    - Tool 类图、Tool 调用序列图、自定义 Tool 开发指南
    - 参考文件: src/OpenDeepWiki/Agents/Tools/
    - _Requirements: 3.3_

  - [ ] 4.4 编写 docs/ai/multi-provider.md - 多AI提供商适配
    - AiRequestType 枚举设计、AiRequestOptions 配置类
    - OpenAI/Azure OpenAI/Anthropic 适配实现
    - 配置切换机制、扩展新 Provider 指南
    - 参考文件: src/OpenDeepWiki/Agents/AgentFactory.cs
    - _Requirements: 3.2_

- [ ] 5. Wiki Generation 模块文档
  - [ ] 5.1 编写 docs/wiki-generation/overview.md - Wiki生成流程总览
    - 完整生成流程图（从提交到完成）、各阶段职责划分
    - 并行处理策略（SemaphoreSlim）、错误处理与重试机制
    - 参考文件: src/OpenDeepWiki/Services/Wiki/
    - _Requirements: 4.5_

  - [ ] 5.2 编写 docs/wiki-generation/repository-analyzer.md - 仓库分析原理
    - RepositoryAnalyzer 类设计、RepositoryWorkspace 数据结构
    - LibGit2Sharp 集成、克隆与拉取策略、分支管理
    - 文件变更检测算法、语言检测算法
    - 参考文件: src/OpenDeepWiki/Services/Repositories/RepositoryAnalyzer.cs
    - _Requirements: 4.1_

  - [ ] 5.3 编写 docs/wiki-generation/catalog-generator.md - 目录生成原理
    - 目录生成 Prompt 设计思路、仓库上下文收集
    - 入口点分析逻辑、目录结构设计原则
    - CatalogStorage 实现、目录 JSON 格式规范
    - 参考文件: src/OpenDeepWiki/prompts/catalog-generator.md
    - _Requirements: 4.2_

  - [ ] 5.4 编写 docs/wiki-generation/content-generator.md - 内容生成原理
    - 内容生成 Prompt 设计思路、源码分析策略
    - Mermaid 图表生成要求、代码示例提取规范
    - 文件引用链接生成、文档质量保证机制
    - 参考文件: src/OpenDeepWiki/prompts/content-generator.md
    - _Requirements: 4.3_

  - [ ] 5.5 编写 docs/wiki-generation/incremental-update.md - 增量更新机制
    - 增量更新触发条件、变更文件分析逻辑
    - 影响范围评估算法、文档更新策略
    - 参考文件: src/OpenDeepWiki/prompts/incremental-updater.md
    - _Requirements: 4.4_

- [ ] 6. Chat System 模块文档
  - [ ] 6.1 编写 docs/chat-system/overview.md - 聊天系统架构
    - 多平台聊天系统设计理念、核心组件架构图
    - 消息处理流程、ChatServiceExtensions 服务注册
    - 参考文件: src/OpenDeepWiki/Chat/
    - _Requirements: 5.1_

  - [ ] 6.2 编写 docs/chat-system/provider-abstraction.md - Provider抽象层
    - IMessageProvider 接口设计、Provider 生命周期管理
    - Webhook 验证机制、消息发送抽象、Provider 配置热重载
    - 参考文件: src/OpenDeepWiki/Chat/Providers/
    - _Requirements: 5.2_

  - [ ] 6.3 编写 docs/chat-system/message-queue.md - 消息队列与会话
    - IMessageQueue 接口设计、DatabaseMessageQueue 实现
    - 消息合并策略（IMessageMerger）、ISessionManager 会话管理
    - 死信处理机制、并发控制策略
    - 参考文件: src/OpenDeepWiki/Chat/Queue/, src/OpenDeepWiki/Chat/Sessions/
    - _Requirements: 5.3_

  - [ ] 6.4 编写 docs/chat-system/platform-integration.md - 平台集成
    - 飞书 Provider 实现（FeishuProvider）
    - QQ Provider 实现（QQProvider）
    - 微信 Provider 实现（WeChatProvider）
    - 添加新平台 Provider 指南、平台配置示例
    - 参考文件: src/OpenDeepWiki/Chat/Providers/Feishu/, QQ/, WeChat/
    - _Requirements: 5.4_

- [ ] 7. API 模块文档
  - [ ] 7.1 编写 docs/api/authentication.md - 认证授权API
    - JWT 认证流程、登录接口（POST /api/auth/login）
    - 注册接口（POST /api/auth/register）、Token 刷新接口
    - OAuth 集成（GitHub/Gitee 等）、权限控制机制
    - 参考文件: src/OpenDeepWiki/Endpoints/AuthEndpoints.cs, OAuthEndpoints.cs
    - _Requirements: 8.1_

  - [ ] 7.2 编写 docs/api/repository.md - 仓库管理API
    - 仓库列表接口（GET /api/repositories）
    - 仓库详情接口（GET /api/repositories/{id}）
    - 仓库提交接口（POST /api/repositories）
    - 分支管理接口、处理状态查询接口、重新生成接口
    - 参考文件: src/OpenDeepWiki/Services/Repositories/
    - _Requirements: 8.2_

  - [ ] 7.3 编写 docs/api/wiki.md - Wiki文档API
    - 目录查询接口（GET /api/wiki/{owner}/{name}/catalog）
    - 文档内容接口（GET /api/wiki/{owner}/{name}/doc）
    - 搜索接口、多语言支持接口
    - 参考文件: src/OpenDeepWiki/Services/Wiki/
    - _Requirements: 8.3_

  - [ ] 7.4 编写 docs/api/admin.md - 管理后台API
    - 用户管理接口（CRUD）、角色权限接口
    - 部门管理接口、系统设置接口
    - 统计数据接口、工具管理接口
    - 参考文件: src/OpenDeepWiki/Endpoints/Admin/
    - _Requirements: 8.4_

  - [ ] 7.5 编写 docs/api/mcp.md - MCP协议接口
    - MCP 协议基本概念、SSE 端点实现（/api/mcp/sse）
    - Streamable HTTP 端点（/api/mcp）
    - MCP 配置示例（Claude, Windsurf 等）、MCP 使用教程
    - 参考文件: src/OpenDeepWiki/Endpoints/ChatEndpoints.cs
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Deployment 模块文档
  - [ ] 8.1 编写 docs/deployment/docker-deployment.md - Docker部署指南
    - docker-compose.yml 配置结构解析
    - 后端/前端 Dockerfile 构建流程
    - 多架构构建指南（ARM64/AMD64）、生产环境配置建议
    - Sealos 一键部署指南
    - 参考文件: compose.yaml, src/OpenDeepWiki/Dockerfile, web/Dockerfile
    - _Requirements: 10.1_

  - [ ] 8.2 编写 docs/deployment/environment-variables.md - 环境变量配置
    - AI 模型相关环境变量表
    - 数据库相关环境变量表
    - Wiki 生成相关环境变量表
    - 聊天系统相关环境变量表
    - 配置示例（开发/生产环境）
    - 参考文件: compose.yaml, src/OpenDeepWiki/appsettings.json
    - _Requirements: 10.2_

  - [ ] 8.3 编写 docs/deployment/database-migration.md - 数据库迁移
    - EF Core 迁移原理、迁移命令参考
    - 多数据库迁移指南、数据备份恢复指南
    - 数据库切换指南
    - 参考文件: src/EFCore/
    - _Requirements: 10.3_

  - [ ] 8.4 编写 docs/deployment/troubleshooting.md - 问题排查
    - 启动失败问题排查
    - AI 调用失败问题排查
    - 仓库克隆失败问题排查
    - 文档生成失败问题排查
    - 日志分析指南、性能调优建议
    - _Requirements: 10.4_

- [ ] 9. 创建文档索引
  - [ ] 9.1 创建 docs/README.md 文档入口
    - 文档导航目录
    - 快速链接
    - 文档更新说明
    - _Requirements: 1.1_

## Notes

- 每个文档必须包含 Mermaid 架构图或流程图
- 代码示例必须来自实际项目代码
- 文档使用中文编写
- 遵循项目现有的 Markdown 格式规范
- 任务按顺序执行，确保依赖关系正确
- 每个任务都标注了参考文件，便于编写时查阅源码
