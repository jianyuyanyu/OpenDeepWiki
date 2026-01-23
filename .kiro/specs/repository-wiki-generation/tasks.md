# Implementation Plan: Repository Wiki Generation

## Overview

本实现计划将仓库 Wiki 自动生成系统分解为可执行的编码任务。采用增量开发方式，先完成核心数据模型和工具，再实现 AI Agent 集成，最后完成 API 和前端。

## Tasks

- [x] 1. 更新数据模型和数据库
  - [x] 1.1 更新 RepositoryBranch 实体添加 CommitId 跟踪字段
    - 添加 `LastCommitId` 和 `LastProcessedAt` 字段
    - _Requirements: 17.1, 17.2, 17.6_
  - [x] 1.2 创建 DocCatalog 实体替代 DocDirectory
    - 支持树形结构（ParentId, Children）
    - 包含 Title, Path, Order, DocFileId
    - _Requirements: 4.2, 4.5_
  - [x] 1.3 更新 MasterDbContext 配置
    - 添加 DocCatalog DbSet
    - 配置树形关系和唯一索引
    - _Requirements: 4.5_
  - [x] 1.4 编写 DocCatalog 结构验证属性测试
    - **Property 4: Catalog Item Structure Validity**
    - **Validates: Requirements 4.2, 4.5**

- [x] 2. 实现 Catalog 序列化和存储
  - [x] 2.1 创建 CatalogItem 模型和 JSON 序列化
    - 定义 CatalogItem 类（Title, Path, Order, Children）
    - 实现 JSON 序列化/反序列化
    - _Requirements: 6.1, 6.2_
  - [x] 2.2 编写 Catalog 序列化 Round-Trip 属性测试
    - **Property 5: Catalog Serialization Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 2.3 实现 CatalogStorage 类
    - 提供 GetCatalogJson, SetCatalog, UpdateNode 方法
    - 与数据库 DocCatalog 实体交互
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. 实现 AI Tools
  - [x] 3.1 实现 CatalogTool
    - Read: 返回当前目录结构 JSON
    - Write: 存储完整目录结构
    - Edit: 编辑指定节点
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 3.2 编写 CatalogTool Read/Write Round-Trip 属性测试
    - **Property 6: Catalog Tool Read/Write Round-Trip**
    - **Validates: Requirements 12.1, 12.2, 12.4**
  - [x] 3.3 实现 GitTool
    - Read: 读取相对路径文件内容
    - Grep: 搜索仓库文件
    - 路径抽象：隐藏实际文件系统路径
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [x] 3.4 编写 GitTool 路径抽象属性测试
    - **Property 8: Git Tool Path Abstraction**
    - **Validates: Requirements 13.3, 13.5, 13.6**
  - [x] 3.5 实现 DocTool
    - Write: 创建文档内容
    - Edit: 编辑文档内容
    - 关联目录项和文档
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [x] 3.6 编写 DocTool Write 关联属性测试
    - **Property 10: Doc Tool Write Association**
    - **Validates: Requirements 14.1, 14.3, 5.5**

- [x] 4. Checkpoint - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 实现 Prompt 插件系统
  - [x] 5.1 创建 IPromptPlugin 接口和 FilePromptPlugin 实现
    - 从文件加载提示词
    - 支持变量替换 {{variable}}
    - _Requirements: 15.1, 15.4_
  - [x] 5.2 编写 Prompt 变量替换属性测试
    - **Property 11: Prompt Plugin Variable Substitution**
    - **Validates: Requirements 15.1, 15.4**
  - [x] 5.3 创建默认提示词文件
    - prompts/catalog-generator.md
    - prompts/content-generator.md
    - prompts/incremental-updater.md
    - _Requirements: 15.2, 15.3_

- [x] 6. 实现 Repository Analyzer
  - [x] 6.1 创建 IRepositoryAnalyzer 接口和实现
    - PrepareWorkspaceAsync: 克隆/更新仓库
    - CleanupWorkspaceAsync: 清理工作目录
    - GetChangedFilesAsync: 获取变更文件列表
    - _Requirements: 16.1, 16.2, 16.4, 16.5, 17.4_
  - [x] 6.2 实现 Git 操作（使用 LibGit2Sharp 或命令行）
    - Clone, Pull, GetHeadCommitId
    - GetChangedFiles between commits
    - _Requirements: 17.1, 17.4_
  - [x] 6.3 实现工作目录路径结构
    - 路径格式: /data/{organization}/{name}/tree/
    - _Requirements: 16.2, 16.3_

- [x] 7. 实现 Wiki Generator
  - [x] 7.1 创建 WikiGeneratorOptions 配置类
    - CatalogModel, ContentModel 配置
    - Endpoint, ApiKey 配置
    - _Requirements: 11.1, 11.2, 11.5, 11.6_
  - [x] 7.2 实现 IWikiGenerator 接口
    - GenerateCatalogAsync: 生成目录结构
    - GenerateDocumentsAsync: 生成文档内容
    - IncrementalUpdateAsync: 增量更新
    - _Requirements: 4.1, 5.1, 17.5_
  - [x] 7.3 集成 AgentFactory 创建 AI Agent
    - 配置 Tools (GitTool, CatalogTool, DocTool)
    - 加载系统提示词
    - _Requirements: 11.3, 11.4_

- [x] 8. 更新 RepositoryProcessingWorker
  - [x] 8.1 集成 IRepositoryAnalyzer 和 IWikiGenerator
    - 替换空实现
    - 添加 commit ID 跟踪
    - _Requirements: 2.2, 2.3, 2.4, 17.2_
  - [x] 8.2 编写处理状态转换属性测试
    - **Property 2: Processing State Transitions**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  - [x] 8.3 实现增量更新逻辑
    - 比较 commit ID
    - 调用 IncrementalUpdateAsync
    - _Requirements: 17.3, 17.5_

- [x] 9. Checkpoint - 确保后端核心功能完成
  - 确保所有测试通过，如有问题请询问用户

- [-] 10. 实现 Wiki API
  - [x] 10.1 创建 WikiService API 端点
    - GET /api/v1/wiki/{org}/{repo}/catalog: 获取目录结构
    - GET /api/v1/wiki/{org}/{repo}/doc/{path}: 获取文档内容
    - _Requirements: 8.1, 8.2, 8.4_
  - [-] 10.2 编写 API 404 响应属性测试
    - **Property 12: API 404 for Non-Existent Paths**
    - **Validates: Requirements 8.3**
  - [ ] 10.3 更新 RepositoryService
    - 添加获取仓库列表 API（含状态）
    - _Requirements: 9.1_

- [x] 11. 实现前端仓库提交和列表
  - [x] 11.1 创建仓库提交表单组件
    - Git URL, 分支名, 语言选择
    - 表单验证
    - _Requirements: 10.1, 10.2, 10.5_
  - [x] 11.2 创建仓库列表组件
    - 显示仓库及处理状态
    - 状态指示器（Pending, Processing, Completed, Failed）
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 11.3 集成 API 调用
    - 提交仓库
    - 获取仓库列表
    - _Requirements: 10.3, 10.4_

- [x] 12. 实现前端 Wiki 查看器
  - [x] 12.1 创建 Wiki 页面路由
    - /{org}/{repo} 路由
    - 侧边栏目录导航
    - _Requirements: 8.1_
  - [x] 12.2 创建文档内容渲染组件
    - Markdown 渲染
    - 代码高亮
    - _Requirements: 8.2_

- [x] 13. Final Checkpoint - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 使用 FsCheck 作为 .NET 属性测试框架
