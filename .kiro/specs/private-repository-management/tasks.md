# 实现计划: 私有仓库管理

## 概述

本实现计划将私有仓库管理功能分解为可执行的编码任务，包括后端API开发、前端组件扩展和属性测试。

## 任务

- [x] 1. 后端API扩展
  - [x] 1.1 扩展仓库列表响应，添加 `HasPassword` 字段
    - 修改 `src/OpenDeepWiki/Services/Repositories/RepositoryService.cs`
    - 在 `RepositoryItemResponse` 中添加 `HasPassword` 属性
    - 在 `GetListAsync` 方法中填充该字段
    - _需求: 1.5, 3.1_

  - [x] 1.2 实现可见性更新API端点
    - 在 `RepositoryService.cs` 中添加 `UpdateVisibilityAsync` 方法
    - 创建 `UpdateVisibilityRequest` 和 `UpdateVisibilityResponse` 模型
    - 实现所有权验证逻辑
    - 实现无密码仓库私有化限制验证
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 1.3 编写属性测试：无密码仓库私有化限制
    - **Property 3: 无密码仓库私有化限制**
    - **验证: 需求 3.2, 3.4, 5.3**

  - [x] 1.4 编写属性测试：仓库所有权验证
    - **Property 6: 仓库所有权验证**
    - **验证: 需求 5.2**

  - [x] 1.5 编写属性测试：可见性更新持久化一致性
    - **Property 7: 可见性更新持久化一致性**
    - **验证: 需求 5.4, 5.5**

- [x] 2. 检查点 - 确保后端测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 3. 前端类型和API扩展
  - [x] 3.1 扩展前端类型定义
    - 修改 `web/types/repository.ts`
    - 在 `RepositoryItemResponse` 中添加 `hasPassword` 字段
    - 添加 `UpdateVisibilityRequest` 和 `UpdateVisibilityResponse` 类型
    - _需求: 3.1, 5.1_

  - [x] 3.2 添加可见性更新API函数
    - 修改 `web/lib/repository-api.ts`
    - 添加 `updateRepositoryVisibility` 函数
    - _需求: 2.1, 5.1_

- [x] 4. 前端组件开发
  - [x] 4.1 创建 VisibilityToggle 组件
    - 创建 `web/components/repo/visibility-toggle.tsx`
    - 实现切换按钮UI，使用现有UI组件
    - 实现无密码仓库禁用逻辑和Tooltip提示
    - 实现加载状态和错误处理
    - _需求: 2.1, 2.2, 2.3, 2.4, 3.1, 3.3_

  - [x] 4.2 扩展 RepositoryCard 组件
    - 修改 `web/components/repo/repository-list.tsx`
    - 集成 VisibilityToggle 组件
    - 确保Wiki导航链接正确编码
    - _需求: 1.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.3 更新私有仓库页面
    - 修改 `web/app/(main)/private/page.tsx`
    - 确保仓库列表正确刷新
    - 添加成功/失败Toast提示
    - _需求: 2.2, 2.3_

- [x] 5. 检查点 - 确保前端构建通过
  - 运行 `npm run build` 和 `npm run lint`
  - 确保无编译错误和lint警告

- [x] 6. 集成测试
  - [x] 6.1 编写属性测试：请求序列化往返一致性
    - **Property 8: 请求序列化往返一致性**
    - **验证: 需求 5.6**

- [ ] 7. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

## 备注

- 所有任务都是必需的，包括属性测试
- 每个任务都引用了具体的需求以确保可追溯性
- 检查点确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
