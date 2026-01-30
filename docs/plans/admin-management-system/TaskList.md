# Admin Management System - TaskList

## Overview
为 OpenDeepWiki 创建管理员后台管理系统，包括统计数据展示、仓库管理、工具配置、角色管理、用户管理和系统设置等功能。

## Phase 1: 基础架构搭建

### Backend 基础设施

- [x] **1.1 创建 Admin API 路由组**
  Description: 在 `src/OpenDeepWiki/Endpoints/` 下创建 `AdminEndpoints.cs`，使用 `/api/admin` 路由前缀
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **1.2 创建 Admin 授权策略**
  Description: 在 `Program.cs` 中添加 Admin 角色授权策略，确保只有 Admin 角色可以访问管理端 API
  Priority: High
  Category: Backend
  Dependencies: 1.1
  Estimated Effort: S

- [x] **1.3 创建统计数据实体**
  Description: 在 `src/OpenDeepWiki.Entities/` 下创建 `TokenUsage.cs` 实体，用于记录 Token 消耗数据
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **1.4 更新数据库上下文**
  Description: 在 `MasterDbContext.cs` 中添加 TokenUsage DbSet 和相关配置
  Priority: High
  Category: Backend
  Dependencies: 1.3
  Estimated Effort: S

- [ ] **1.5 创建数据库迁移**
  Description: 运行 `dotnet ef migrations add AddTokenUsage` 创建迁移
  Priority: High
  Category: Backend
  Dependencies: 1.4
  Estimated Effort: XS

### Frontend 基础设施

- [x] **1.6 创建 Admin 路由布局**
  Description: 在 `web/app/admin/` 下创建 `layout.tsx`，包含管理端侧边栏和权限检查
  Priority: High
  Category: Frontend
  Dependencies: None
  Estimated Effort: M

- [ ] **1.7 创建 Admin 权限守卫组件**
  Description: 创建 `AdminGuard` 组件，检查用户是否具有 Admin 角色
  Priority: High
  Category: Frontend
  Dependencies: 1.6
  Estimated Effort: S

- [x] **1.8 更新 Header 组件**
  Description: 在用户下拉菜单中添加"后台管理"选项，仅对 Admin 角色用户显示
  Priority: High
  Category: Frontend
  Dependencies: None
  Estimated Effort: S

- [ ] **1.9 安装图表库**
  Description: 安装 `recharts` 图表库用于统计数据可视化
  Priority: High
  Category: Frontend
  Dependencies: None
  Estimated Effort: XS

## Phase 2: 统计数据模块

### Backend - 统计 API

- [x] **2.1 创建统计服务接口**
  Description: 创建 `IAdminStatisticsService` 接口，定义获取统计数据的方法
  Priority: High
  Category: Backend
  Dependencies: 1.1, 1.4
  Estimated Effort: S

- [x] **2.2 实现统计服务**
  Description: 实现 `AdminStatisticsService`，查询最近七天的仓库处理数、提交数、新增用户数
  Priority: High
  Category: Backend
  Dependencies: 2.1
  Estimated Effort: M

- [x] **2.3 创建 Token 消耗统计服务**
  Description: 实现 Token 消耗统计查询，包括输入 Token 和输出 Token 的每日消耗
  Priority: High
  Category: Backend
  Dependencies: 2.1, 1.4
  Estimated Effort: M

- [x] **2.4 创建统计 API 端点**
  Description: 在 `AdminEndpoints.cs` 中添加 `/api/admin/statistics` 端点
  Priority: High
  Category: Backend
  Dependencies: 2.2, 2.3
  Estimated Effort: S

### Frontend - 统计仪表盘

- [ ] **2.5 创建统计 API 客户端**
  Description: 在 `web/lib/admin-api.ts` 中创建统计数据 API 调用函数
  Priority: High
  Category: Frontend
  Dependencies: 2.4
  Estimated Effort: S

- [ ] **2.6 创建仪表盘页面**
  Description: 创建 `web/app/admin/page.tsx` 作为管理端首页/仪表盘
  Priority: High
  Category: Frontend
  Dependencies: 1.6, 2.5
  Estimated Effort: M

- [ ] **2.7 创建柱形图组件**
  Description: 创建仓库统计柱形图组件，展示最近七天的处理/提交/新增用户数据
  Priority: High
  Category: Frontend
  Dependencies: 1.9, 2.6
  Estimated Effort: M

- [ ] **2.8 创建 Token 消耗图表组件**
  Description: 创建 Token 消耗折线图/柱形图，展示输入/输出 Token 每日消耗
  Priority: High
  Category: Frontend
  Dependencies: 1.9, 2.6
  Estimated Effort: M

## Phase 3: 仓库管理模块

### Backend - 仓库管理 API

- [x] **3.1 创建仓库管理服务接口**
  Description: 创建 `IAdminRepositoryService` 接口，定义仓库 CRUD 和查询方法
  Priority: High
  Category: Backend
  Dependencies: 1.1
  Estimated Effort: S

- [x] **3.2 实现仓库管理服务**
  Description: 实现全局仓库查询、状态更新、删除等管理功能
  Priority: High
  Category: Backend
  Dependencies: 3.1
  Estimated Effort: M

- [x] **3.3 创建仓库管理 API 端点**
  Description: 添加 `/api/admin/repositories` 端点，支持分页查询、状态筛选、搜索
  Priority: High
  Category: Backend
  Dependencies: 3.2
  Estimated Effort: M

### Frontend - 仓库管理页面

- [ ] **3.4 创建仓库管理 API 客户端**
  Description: 在 `admin-api.ts` 中添加仓库管理相关 API 调用
  Priority: High
  Category: Frontend
  Dependencies: 3.3
  Estimated Effort: S

- [ ] **3.5 创建仓库列表页面**
  Description: 创建 `web/app/admin/repositories/page.tsx`，展示所有仓库列表
  Priority: High
  Category: Frontend
  Dependencies: 3.4
  Estimated Effort: M

- [ ] **3.6 创建仓库详情/编辑对话框**
  Description: 创建仓库详情查看和编辑的 Dialog 组件
  Priority: Medium
  Category: Frontend
  Dependencies: 3.5
  Estimated Effort: M

## Phase 4: 仓库生成工具配置

### 4.1 MCPs 管理

- [x] **4.1.1 创建 MCP 配置实体**
  Description: 创建 `McpConfig` 实体，存储 MCP 服务器配置信息
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **4.1.2 创建 MCP 管理服务**
  Description: 实现 MCP 配置的 CRUD 服务
  Priority: High
  Category: Backend
  Dependencies: 4.1.1
  Estimated Effort: M

- [x] **4.1.3 创建 MCP 管理 API 端点**
  Description: 添加 `/api/admin/mcps` 端点
  Priority: High
  Category: Backend
  Dependencies: 4.1.2
  Estimated Effort: S

- [ ] **4.1.4 创建 MCP 管理页面**
  Description: 创建 `web/app/admin/tools/mcps/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 4.1.3
  Estimated Effort: M

### 4.2 Skills 管理

- [x] **4.2.1 创建 Skill 配置实体**
  Description: 创建 `SkillConfig` 实体，存储 Skill 配置信息
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **4.2.2 创建 Skill 管理服务**
  Description: 实现 Skill 配置的 CRUD 服务
  Priority: High
  Category: Backend
  Dependencies: 4.2.1
  Estimated Effort: M

- [x] **4.2.3 创建 Skill 管理 API 端点**
  Description: 添加 `/api/admin/skills` 端点
  Priority: High
  Category: Backend
  Dependencies: 4.2.2
  Estimated Effort: S

- [ ] **4.2.4 创建 Skill 管理页面**
  Description: 创建 `web/app/admin/tools/skills/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 4.2.3
  Estimated Effort: M

### 4.3 模型配置

- [x] **4.3.1 创建模型配置实体**
  Description: 创建 `ModelConfig` 实体，存储 AI 模型配置
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **4.3.2 创建模型配置服务**
  Description: 实现模型配置的 CRUD 服务
  Priority: High
  Category: Backend
  Dependencies: 4.3.1
  Estimated Effort: M

- [x] **4.3.3 创建模型配置 API 端点**
  Description: 添加 `/api/admin/models` 端点
  Priority: High
  Category: Backend
  Dependencies: 4.3.2
  Estimated Effort: S

- [ ] **4.3.4 创建模型配置页面**
  Description: 创建 `web/app/admin/tools/models/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 4.3.3
  Estimated Effort: M

## Phase 5: 角色管理模块

- [x] **5.1 创建角色管理服务接口**
  Description: 创建 `IAdminRoleService` 接口，定义角色 CRUD 方法
  Priority: High
  Category: Backend
  Dependencies: 1.1
  Estimated Effort: S

- [x] **5.2 实现角色管理服务**
  Description: 实现角色的增删改查，包括系统角色保护逻辑
  Priority: High
  Category: Backend
  Dependencies: 5.1
  Estimated Effort: M

- [x] **5.3 创建角色管理 API 端点**
  Description: 添加 `/api/admin/roles` 端点
  Priority: High
  Category: Backend
  Dependencies: 5.2
  Estimated Effort: S

- [ ] **5.4 创建角色管理页面**
  Description: 创建 `web/app/admin/roles/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 5.3
  Estimated Effort: M

- [ ] **5.5 创建角色编辑对话框**
  Description: 创建角色新增/编辑的 Dialog 组件
  Priority: Medium
  Category: Frontend
  Dependencies: 5.4
  Estimated Effort: S

## Phase 6: 用户管理模块

- [x] **6.1 创建用户管理服务接口**
  Description: 创建 `IAdminUserService` 接口，定义用户管理方法
  Priority: High
  Category: Backend
  Dependencies: 1.1
  Estimated Effort: S

- [x] **6.2 实现用户管理服务**
  Description: 实现用户查询、状态更新、角色分配、密码重置等功能
  Priority: High
  Category: Backend
  Dependencies: 6.1
  Estimated Effort: M

- [x] **6.3 创建用户管理 API 端点**
  Description: 添加 `/api/admin/users` 端点，支持分页、搜索、角色筛选
  Priority: High
  Category: Backend
  Dependencies: 6.2
  Estimated Effort: M

- [ ] **6.4 创建用户管理页面**
  Description: 创建 `web/app/admin/users/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 6.3
  Estimated Effort: M

- [ ] **6.5 创建用户详情/编辑对话框**
  Description: 创建用户详情查看、编辑、角色分配的 Dialog 组件
  Priority: Medium
  Category: Frontend
  Dependencies: 6.4
  Estimated Effort: M

- [ ] **6.6 创建用户新增对话框**
  Description: 创建管理员手动添加用户的 Dialog 组件
  Priority: Medium
  Category: Frontend
  Dependencies: 6.4
  Estimated Effort: S

## Phase 7: 系统设置模块

- [x] **7.1 创建系统设置实体**
  Description: 创建 `SystemSetting` 实体，存储键值对形式的系统配置
  Priority: High
  Category: Backend
  Dependencies: None
  Estimated Effort: S

- [x] **7.2 创建系统设置服务**
  Description: 实现系统设置的读取和更新服务
  Priority: High
  Category: Backend
  Dependencies: 7.1
  Estimated Effort: M

- [x] **7.3 创建系统设置 API 端点**
  Description: 添加 `/api/admin/settings` 端点
  Priority: High
  Category: Backend
  Dependencies: 7.2
  Estimated Effort: S

- [ ] **7.4 创建系统设置页面**
  Description: 创建 `web/app/admin/settings/page.tsx`
  Priority: High
  Category: Frontend
  Dependencies: 7.3
  Estimated Effort: M

## Progress Tracking

- Total Tasks: 42
- Completed: 27
- In Progress: 0
- Remaining: 15

## Next Steps

1. 从 Phase 1 开始，先搭建基础架构
2. 创建 Admin API 路由组和授权策略
3. 更新前端 Header 组件添加管理入口
4. 安装图表库并创建 Admin 布局

## Notes

- 所有管理端 API 使用 `/api/admin` 前缀
- 前端管理页面统一放在 `web/app/admin/` 目录下
- 需要安装 `recharts` 图表库用于统计数据可视化
- Token 消耗统计需要在 WikiGenerator 中集成记录逻辑
