# Implementation Plan: Repository Bookmark & Subscription

## Overview

本实现计划将收藏和订阅功能分解为可执行的编码任务。采用增量开发方式，每个任务都建立在前一个任务的基础上，确保代码始终处于可运行状态。

## Tasks

- [x] 1. 扩展数据库实体和配置
  - [x] 1.1 扩展 Repository 实体，添加 BookmarkCount、SubscriptionCount、ViewCount 字段
    - 修改 `src/OpenDeepWiki.Entities/Repositories/Repository.cs`
    - 添加三个 int 类型字段，默认值为 0
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.2 创建 UserBookmark 实体
    - 创建 `src/OpenDeepWiki.Entities/Bookmarks/UserBookmark.cs`
    - 包含 UserId、RepositoryId 字段和导航属性
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 1.3 创建 UserSubscription 实体
    - 创建 `src/OpenDeepWiki.Entities/Subscriptions/UserSubscription.cs`
    - 包含 UserId、RepositoryId 字段和导航属性
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 1.4 更新 MasterDbContext 配置
    - 修改 `src/OpenDeepWiki.EFCore/MasterDbContext.cs`
    - 添加 DbSet<UserBookmark> 和 DbSet<UserSubscription>
    - 配置唯一索引约束
    - _Requirements: 2.4, 3.4_

- [x] 2. Checkpoint - 确保实体编译通过
  - 运行 `dotnet build OpenDeepWiki.sln` 确保编译成功

- [x] 3. 实现 BookmarkService 后端服务
  - [x] 3.1 创建请求/响应模型
    - 创建 `src/OpenDeepWiki/Models/Bookmark/` 目录下的模型类
    - 包含 AddBookmarkRequest、BookmarkResponse、BookmarkListResponse 等
    - _Requirements: 6.2_
  
  - [x] 3.2 实现 BookmarkService 核心功能
    - 创建 `src/OpenDeepWiki/Services/Bookmarks/BookmarkService.cs`
    - 实现 AddBookmarkAsync 方法（原子性增加计数）
    - 实现 RemoveBookmarkAsync 方法（原子性减少计数）
    - 实现 GetUserBookmarksAsync 方法（分页查询）
    - 实现 GetBookmarkStatusAsync 方法（状态查询）
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.4, 6.5, 9.1_
  
  - [x] 3.3 编写 BookmarkService 属性测试
    - 创建 `tests/OpenDeepWiki.Tests/Services/Bookmarks/BookmarkServicePropertyTests.cs`
    - **Property 1: 收藏操作原子性**
    - **Property 2: 取消收藏操作原子性**
    - **Property 5: 收藏计数非负不变量**
    - **Validates: Requirements 4.1, 4.2, 5.1, 5.2, 5.5**
  
  - [x] 3.4 编写 BookmarkService 单元测试
    - 创建 `tests/OpenDeepWiki.Tests/Services/Bookmarks/BookmarkServiceUnitTests.cs`
    - 测试重复收藏返回错误
    - 测试收藏不存在的仓库返回错误
    - 测试取消不存在的收藏返回错误
    - _Requirements: 4.3, 4.4, 5.3_

- [x] 4. 实现 SubscriptionService 后端服务
  - [x] 4.1 创建订阅相关请求/响应模型
    - 创建 `src/OpenDeepWiki/Models/Subscription/` 目录下的模型类
    - 包含 AddSubscriptionRequest、SubscriptionResponse 等
    - _Requirements: 9.2_
  
  - [x] 4.2 实现 SubscriptionService 核心功能
    - 创建 `src/OpenDeepWiki/Services/Subscriptions/SubscriptionService.cs`
    - 实现 AddSubscriptionAsync 方法（原子性增加计数）
    - 实现 RemoveSubscriptionAsync 方法（原子性减少计数）
    - 实现 GetSubscriptionStatusAsync 方法（状态查询）
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 9.2_
  
  - [x] 4.3 编写 SubscriptionService 属性测试
    - 创建 `tests/OpenDeepWiki.Tests/Services/Subscriptions/SubscriptionServicePropertyTests.cs`
    - **Property 3: 订阅操作原子性**
    - **Property 4: 取消订阅操作原子性**
    - **Property 6: 订阅计数非负不变量**
    - **Validates: Requirements 7.1, 7.2, 8.1, 8.2, 8.5**
  
  - [x] 4.4 编写 SubscriptionService 单元测试
    - 创建 `tests/OpenDeepWiki.Tests/Services/Subscriptions/SubscriptionServiceUnitTests.cs`
    - 测试重复订阅返回错误
    - 测试订阅不存在的仓库返回错误
    - 测试取消不存在的订阅返回错误
    - _Requirements: 7.3, 7.4, 8.3_

- [x] 5. Checkpoint - 确保后端服务测试通过
  - 运行 `dotnet test tests/OpenDeepWiki.Tests/OpenDeepWiki.Tests.csproj` 确保测试通过

- [x] 6. 实现前端 API 客户端
  - [x] 6.1 创建 bookmark-api.ts
    - 创建 `web/lib/bookmark-api.ts`
    - 实现 addBookmark、removeBookmark、getUserBookmarks、getBookmarkStatus 函数
    - _Requirements: 4.1, 5.1, 6.1, 9.1_
  
  - [x] 6.2 创建 subscription-api.ts
    - 创建 `web/lib/subscription-api.ts`
    - 实现 addSubscription、removeSubscription、getSubscriptionStatus 函数
    - _Requirements: 7.1, 8.1, 9.2_
  
  - [x] 6.3 更新 TypeScript 类型定义
    - 更新 `web/types/repository.ts` 或创建新的类型文件
    - 添加 BookmarkResponse、BookmarkListResponse 等类型
    - _Requirements: 6.2_

- [x] 7. 改造收藏列表页面
  - [x] 7.1 重构 bookmarks/page.tsx 使用真实 API
    - 修改 `web/app/(main)/bookmarks/page.tsx`
    - 移除硬编码的假数据
    - 使用 getUserBookmarks API 获取真实数据
    - 实现加载状态和错误处理
    - _Requirements: 10.1, 10.3, 10.4_
  
  - [x] 7.2 实现取消收藏功能
    - 在收藏列表页面添加取消收藏按钮点击处理
    - 调用 removeBookmark API 并刷新列表
    - _Requirements: 10.2_
  
  - [x] 7.3 实现空状态和分页
    - 添加空收藏列表的提示信息
    - 实现分页组件（如果列表较长）
    - _Requirements: 6.3, 6.4_

- [x] 8. 创建仓库详情页收藏/订阅组件
  - [x] 8.1 创建 BookmarkButton 组件
    - 创建 `web/components/repo/bookmark-button.tsx`
    - 显示收藏状态和收藏数量
    - 支持收藏/取消收藏操作
    - _Requirements: 4.1, 5.1, 9.1_
  
  - [x] 8.2 创建 SubscribeButton 组件
    - 创建 `web/components/repo/subscribe-button.tsx`
    - 显示订阅状态和订阅数量
    - 支持订阅/取消订阅操作
    - _Requirements: 7.1, 8.1, 9.2_
  
  - [x] 8.3 处理未登录用户状态
    - 未登录时显示按钮但不显示状态
    - 点击时提示用户登录
    - _Requirements: 9.3_

- [x] 9. Checkpoint - 确保前端编译通过
  - 运行 `cd web && npm run build` 确保编译成功
  - 运行 `npm run lint` 确保代码风格正确

- [x] 10. 编写收藏列表属性测试
  - [x] 10.1 编写收藏列表完整性属性测试
    - 在 `tests/OpenDeepWiki.Tests/Services/Bookmarks/BookmarkServicePropertyTests.cs` 中添加
    - **Property 9: 收藏列表完整性**
    - **Validates: Requirements 6.1**
  
  - [x] 10.2 编写收藏列表排序属性测试
    - **Property 10: 收藏列表排序**
    - **Validates: Requirements 6.5**
  
  - [x] 10.3 编写收藏列表分页属性测试
    - **Property 11: 收藏列表分页正确性**
    - **Validates: Requirements 6.4**
  
  - [x] 10.4 编写状态查询一致性属性测试
    - **Property 12: 收藏状态查询一致性**
    - **Property 13: 订阅状态查询一致性**
    - **Validates: Requirements 9.1, 9.2**

- [x] 11. Final Checkpoint - 确保所有测试通过
  - 运行 `dotnet test tests/OpenDeepWiki.Tests/OpenDeepWiki.Tests.csproj` 确保所有测试通过
  - 确保所有功能正常工作，如有问题请询问用户

## Notes

- 所有任务均为必需任务，确保全面的测试覆盖
- 每个任务都引用了具体的需求以便追溯
- Checkpoint 任务用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界情况
