# Implementation Plan: Homepage Repository List

## Overview

本实现计划将首页公开仓库列表功能分解为可执行的编码任务。按照 API 扩展 → Hook 创建 → 组件开发 → 集成 的顺序进行，确保每个步骤都能增量验证。

## Tasks

- [-] 1. 扩展 Repository API
  - [x] 1.1 修改 `fetchRepositoryList` 函数添加新参数
    - 在 `web/lib/repository-api.ts` 中添加 `keyword`, `sortBy`, `sortOrder`, `isPublic` 参数
    - 更新 URL 查询字符串构建逻辑
    - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 1.2 编写 API 参数构造属性测试
    - **Property 6: API Parameter Construction**
    - **Validates: Requirements 2.4, 4.1, 4.2, 4.3, 4.4**

- [-] 2. 创建滚动位置 Hook
  - [x] 2.1 实现 `useScrollPosition` hook
    - 在 `web/hooks/use-scroll-position.ts` 创建新文件
    - 监听滚动事件，返回 `{ y, isScrolled }` 状态
    - 使用 throttle 优化性能
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 2.2 编写滚动可见性属性测试
    - **Property 7: Scroll-Based Visibility Toggle**
    - **Validates: Requirements 3.2, 3.3**

- [x] 3. Checkpoint - 确保基础设施就绪
  - 确保 API 扩展和 Hook 正常工作，如有问题请询问用户

- [-] 4. 创建公开仓库卡片组件
  - [x] 4.1 实现 `PublicRepositoryCard` 组件
    - 在 `web/components/repo/public-repository-card.tsx` 创建新文件
    - 展示仓库名称、状态、创建时间
    - 使用 Link 组件实现点击跳转到 `/{orgName}/{repoName}`
    - _Requirements: 1.3, 1.4_
  
  - [ ] 4.2 编写卡片渲染属性测试
    - **Property 3: Card Rendering Completeness**
    - **Property 4: Navigation Link Construction**
    - **Validates: Requirements 1.3, 1.4**

- [x] 5. 创建公开仓库列表组件
  - [x] 5.1 实现 `PublicRepositoryList` 组件
    - 在 `web/components/repo/public-repository-list.tsx` 创建新文件
    - 调用 API 获取公开仓库列表 (`isPublic=true`, `sortBy=createdAt`, `sortOrder=desc`)
    - 根据 keyword 过滤仓库
    - 实现响应式网格布局 (桌面3列、平板2列、手机1列)
    - 处理加载状态、空状态、错误状态
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_
  
  - [x] 5.2 编写仓库列表属性测试
    - **Property 1: Public Repository Filtering**
    - **Property 2: Sorting by Creation Date**
    - **Property 5: Search Filtering Logic**
    - **Validates: Requirements 1.1, 1.2, 2.1**

- [x] 6. 创建 Header 搜索框组件
  - [x] 6.1 实现 `HeaderSearchBox` 组件
    - 在 `web/components/header-search-box.tsx` 创建新文件
    - 接收 `value`, `onChange`, `visible` props
    - 实现淡入淡出动画 (CSS transitions, 200-300ms)
    - _Requirements: 3.3, 3.5, 5.4_

- [x] 7. Checkpoint - 确保组件开发完成
  - 确保所有新组件正常工作，如有问题请询问用户

- [x] 8. 修改 Header 组件
  - [x] 8.1 扩展 Header 组件支持搜索框
    - 修改 `web/components/header.tsx`
    - 添加可选的 `searchBox` prop
    - 在 Header 右侧集成 `HeaderSearchBox` 组件
    - _Requirements: 3.3, 5.4_

- [x] 9. 集成首页组件
  - [x] 9.1 修改首页组件集成所有功能
    - 修改 `web/app/(main)/page.tsx`
    - 添加 `keyword` 状态管理
    - 使用 `useScrollPosition` hook 检测滚动
    - 主搜索框绑定 keyword 状态，滚动时淡出
    - 传递 searchBox props 给 Header
    - 在底部添加 `PublicRepositoryList` 组件
    - _Requirements: 1.1, 2.1, 2.5, 3.1, 3.2, 3.4_

- [x] 10. 添加国际化支持
  - [x] 10.1 添加中英文翻译
    - 更新 `web/i18n/` 目录下的翻译文件
    - 添加空状态、无结果、搜索占位符等文案
    - _Requirements: 1.5, 2.3_

- [x] 11. Final Checkpoint - 确保所有功能正常
  - 运行 `npm run lint` 检查代码规范
  - 确保所有功能按预期工作，如有问题请询问用户

## Notes

- 所有任务均为必需任务
- 每个任务都引用了具体的需求条款以便追溯
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
- 由于前端测试框架未配置，属性测试可在后端实现或后续配置前端测试框架后补充
