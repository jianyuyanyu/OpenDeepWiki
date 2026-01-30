# Implementation Plan: Multi-Platform Agent Chat System

## Overview

本实现计划将多平台 Agent Chat 系统的设计分解为可执行的编码任务。采用自底向上的实现策略，先构建核心抽象层，再实现具体 Provider，最后完成集成和测试。

技术栈：
- 后端：C# / ASP.NET Core
- 测试：xUnit + FsCheck
- 数据库：Entity Framework Core

## Tasks

- [x] 1. 创建项目结构和核心抽象
  - [x] 1.1 创建 Chat 模块目录结构
    - 在 `src/OpenDeepWiki/Chat/` 下创建 `Abstractions/`、`Providers/`、`Sessions/`、`Queue/`、`Callbacks/`、`Execution/`、`Routing/`、`Exceptions/` 目录
    - _Requirements: 2.1_

  - [x] 1.2 实现消息抽象层
    - 创建 `IChatMessage` 接口和 `ChatMessage` 实现类
    - 创建 `ChatMessageType` 枚举
    - _Requirements: 1.1, 1.4_

  - [x] 1.3 编写消息字段完整性属性测试
    - **Property 1: 消息字段完整性**
    - **Validates: Requirements 1.1**

  - [x] 1.4 实现异常类型定义
    - 创建 `ChatException`、`ProviderException`、`MessageSendException`、`RateLimitException`
    - _Requirements: 3.5, 4.5, 5.5_

- [x] 2. 实现 Provider 抽象层
  - [x] 2.1 创建 Provider 接口和基类
    - 实现 `IMessageProvider` 接口
    - 实现 `BaseMessageProvider` 抽象基类
    - 创建 `SendResult` 和 `WebhookValidationResult` 记录类型
    - 创建 `ProviderOptions` 配置类
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 实现消息类型降级逻辑
    - 在 `BaseMessageProvider` 中实现 `DegradeMessage` 方法
    - _Requirements: 1.5_

  - [x] 2.3 编写消息类型降级属性测试
    - **Property 3: 消息类型降级正确性**
    - **Validates: Requirements 1.5**

- [x] 3. Checkpoint - 确保核心抽象层测试通过
  - 运行所有测试，确保通过，如有问题请询问用户

- [x] 4. 实现数据实体层
  - [x] 4.1 创建 Chat 实体类
    - 在 `src/OpenDeepWiki.Entities/Chat/` 下创建 `ChatSession`、`ChatMessageHistory`、`ChatProviderConfig`、`ChatMessageQueue` 实体
    - _Requirements: 6.1, 6.5, 11.2_

  - [x] 4.2 配置 EF Core DbContext
    - 在 `OpenDeepWikiDbContext` 中添加 Chat 相关 DbSet
    - 配置实体关系和索引
    - _Requirements: 6.5_

  - [x] 4.3 创建数据库迁移
    - 生成并应用 EF Core 迁移
    - _Requirements: 6.5_

- [x] 5. 实现会话管理
  - [x] 5.1 创建会话接口和实现
    - 实现 `IChatSession` 接口和 `ChatSession` 实现类
    - 实现 `SessionState` 枚举
    - _Requirements: 6.1_

  - [x] 5.2 实现会话管理器
    - 实现 `ISessionManager` 接口
    - 实现 `SessionManager` 类，包含会话缓存和数据库持久化
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 5.3 编写会话查找/创建幂等性属性测试
    - **Property 6: 会话查找/创建幂等性**
    - **Validates: Requirements 6.2**

  - [x] 5.4 编写会话历史限制属性测试
    - **Property 7: 会话历史限制**
    - **Validates: Requirements 6.3**

  - [x] 5.5 编写会话持久化往返一致性属性测试
    - **Property 8: 会话持久化往返一致性**
    - **Validates: Requirements 6.5**

- [x] 6. 实现消息队列
  - [x] 6.1 创建消息队列接口和实现
    - 实现 `IMessageQueue` 接口
    - 实现 `QueuedMessage` 记录类型和 `QueuedMessageType` 枚举
    - 实现基于数据库的 `DatabaseMessageQueue` 类
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 6.2 实现消息合并策略
    - 实现短消息合并逻辑
    - _Requirements: 8.4_

  - [x] 6.3 编写消息队列顺序保持属性测试
    - **Property 9: 消息队列顺序保持**
    - **Validates: Requirements 8.1**

  - [x] 6.4 编写消息重试机制属性测试
    - **Property 10: 消息重试机制**
    - **Validates: Requirements 7.4, 8.5**

  - [x] 6.5 编写消息合并正确性属性测试
    - **Property 11: 消息合并正确性**
    - **Validates: Requirements 8.4**

- [x] 7. Checkpoint - 确保会话和队列测试通过
  - 运行所有测试，确保通过，如有问题请询问用户

- [x] 8. 实现消息回调和路由
  - [x] 8.1 实现消息回调接口
    - 实现 `IMessageCallback` 接口
    - 实现 `CallbackManager` 类
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 8.2 实现消息路由器
    - 实现 `IMessageRouter` 接口
    - 实现 `MessageRouter` 类，支持 Provider 注册和消息路由
    - _Requirements: 2.3, 7.2_

  - [x] 8.3 编写 Provider 路由正确性属性测试
    - **Property 4: Provider 路由正确性**
    - **Validates: Requirements 2.3, 7.2**

- [x] 9. 实现 Agent 执行器
  - [x] 9.1 创建 Agent 执行器接口和实现
    - 实现 `IAgentExecutor` 接口
    - 实现 `AgentExecutor` 类，集成现有 Agent 系统
    - 创建 `AgentResponse` 和 `AgentResponseChunk` 记录类型
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.2 编写 Agent 上下文传递完整性属性测试
    - **Property 12: Agent 上下文传递完整性**
    - **Validates: Requirements 9.1, 9.3**

  - [x] 9.3 编写 Agent 错误处理属性测试
    - **Property 13: Agent 错误处理**
    - **Validates: Requirements 9.4**

- [x] 10. 实现后台任务处理
  - [x] 10.1 创建消息处理 Worker
    - 实现 `ChatMessageProcessingWorker` 后台服务
    - 实现消息出队、处理、回调的完整流程
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 10.2 实现死信队列处理
    - 实现失败消息的死信队列逻辑
    - _Requirements: 10.4_

  - [x] 10.3 编写异步消息确认属性测试
    - **Property 14: 异步消息确认**
    - **Validates: Requirements 10.1**

  - [x] 10.4 编写死信队列处理属性测试
    - **Property 15: 死信队列处理**
    - **Validates: Requirements 10.4**

- [x] 11. Checkpoint - 确保核心功能测试通过
  - 运行所有测试，确保通过，如有问题请询问用户

- [x] 12. 实现配置管理
  - [x] 12.1 创建配置管理服务
    - 实现 `IChatConfigService` 接口
    - 实现 `ChatConfigService` 类，支持数据库配置存储
    - 实现敏感配置加密/解密
    - _Requirements: 11.1, 11.2, 11.4_

  - [x] 12.2 实现配置热重载
    - 实现配置变更监听和热重载机制
    - _Requirements: 11.3_

  - [x] 12.3 实现配置验证
    - 实现启动时配置完整性检查
    - _Requirements: 11.5_

  - [x] 12.4 编写配置持久化往返一致性属性测试
    - **Property 16: 配置持久化往返一致性**
    - **Validates: Requirements 11.2**

  - [x] 12.5 编写敏感配置加密属性测试
    - **Property 17: 敏感配置加密**
    - **Validates: Requirements 11.4**

  - [x] 12.6 编写配置热重载属性测试
    - **Property 18: 配置热重载**
    - **Validates: Requirements 11.3**

  - [x] 12.7 编写配置验证完整性属性测试
    - **Property 19: 配置验证完整性**
    - **Validates: Requirements 11.5**

- [x] 13. 实现飞书 Provider
  - [x] 13.1 创建飞书 Provider 实现
    - 实现 `FeishuProvider` 类，继承 `BaseMessageProvider`
    - 实现飞书消息解析和发送逻辑
    - 实现飞书消息卡片格式支持
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 13.2 实现飞书 Webhook 验证
    - 实现飞书事件订阅验证请求处理
    - _Requirements: 3.4_

  - [x] 13.3 实现飞书重试机制
    - 实现 API 调用失败重试逻辑（最多3次）
    - _Requirements: 3.5_

  - [x] 13.4 编写飞书消息转换往返一致性属性测试
    - **Property 2: 消息转换往返一致性（飞书）**
    - **Validates: Requirements 1.2, 1.3**

- [x] 14. 实现 QQ 机器人 Provider
  - [x] 14.1 创建 QQ Provider 实现
    - 实现 `QQProvider` 类，继承 `BaseMessageProvider`
    - 实现 QQ 消息解析和发送逻辑
    - 支持 @ 消息和私聊消息
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 14.2 实现 QQ 鉴权和心跳
    - 实现 QQ 平台鉴权机制
    - 实现心跳保活逻辑
    - _Requirements: 4.4_

  - [x] 14.3 实现 QQ 重试机制
    - 实现 API 调用失败重试逻辑（最多3次）
    - _Requirements: 4.5_

- [x] 15. 实现微信客服 Provider
  - [x] 15.1 创建微信 Provider 实现
    - 实现 `WeChatProvider` 类，继承 `BaseMessageProvider`
    - 实现微信消息解析和发送逻辑
    - 支持文本、图片和语音消息
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 15.2 实现微信消息加解密
    - 实现微信消息加解密逻辑
    - _Requirements: 5.4_

  - [x] 15.3 实现微信重试机制
    - 实现 API 调用失败重试逻辑（最多3次）
    - _Requirements: 5.5_

- [x] 16. Checkpoint - 确保所有 Provider 测试通过
  - 运行所有测试，确保通过，如有问题请询问用户

- [x] 17. 实现 API 端点
  - [x] 17.1 创建 Webhook 端点
    - 创建 `ChatEndpoints.cs`，实现各平台 Webhook 接收端点
    - 实现统一的消息接收和路由逻辑
    - _Requirements: 2.2, 3.4, 4.4, 5.4_

  - [x] 17.2 创建管理端点
    - 实现 Provider 配置管理 API
    - 实现队列状态监控 API
    - _Requirements: 2.5, 10.5, 11.2_

  - [x] 17.3 编写 Provider 启用/禁用状态一致性属性测试
    - **Property 5: Provider 启用/禁用状态一致性**
    - **Validates: Requirements 2.5**

- [x] 18. 依赖注入配置
  - [x] 18.1 配置服务注册
    - 在 `Program.cs` 中注册所有 Chat 相关服务
    - 配置 Provider 自动发现和加载
    - _Requirements: 2.2, 2.4_

- [x] 19. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件，确保所有单元测试和属性测试通过
  - 如有问题请询问用户

## Notes

- 每个任务都引用了具体的需求条款以保证可追溯性
- Checkpoint 任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- 所有测试任务都是必需的，确保全面的测试覆盖
