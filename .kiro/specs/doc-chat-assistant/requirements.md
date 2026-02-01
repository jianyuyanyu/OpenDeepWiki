# Requirements Document

## Introduction

本功能为文档页面提供一个智能对话助手悬浮球，用户可以在阅读文档时与AI进行交互式对话。悬浮球位于页面右下角，点击后展开对话面板，支持模型选择、图片上传、工具调用等功能。管理员可在后台配置可用模型、MCPs和Skills，并控制功能的启用状态。

此外，用户可以创建自己的应用（App），获取AppId和AppSecret，通过嵌入JS脚本将悬浮球集成到外部网站。应用支持自定义AI模型配置、域名校验、使用统计等功能。

## Glossary

- **Chat_Assistant**: 文档对话助手系统，提供悬浮球UI和对话功能
- **Floating_Ball**: 悬浮球组件，位于页面右下角的可点击圆形按钮
- **Chat_Panel**: 对话面板，点击悬浮球后展开的对话界面
- **Model_Selector**: 模型选择器，允许用户选择可用的AI模型
- **Chat_Config**: 对话助手配置实体，存储管理员配置的模型、MCPs、Skills等
- **SSE_Stream**: Server-Sent Events流式响应，用于实时传输AI回复
- **Tool_Call**: AI工具调用，包括MCP工具和内置文档读取工具
- **Doc_Context**: 文档上下文，包含owner、repo、branch、language和当前文档信息
- **Catalog_Menu**: 目录菜单，当前仓库的完整文档目录结构
- **Chat_App**: 用户创建的对话应用，包含AppId、AppSecret和配置信息
- **App_Embed_Script**: 嵌入脚本，用于将悬浮球集成到外部网站
- **App_Statistics**: 应用统计数据，包含调用次数、Token消耗、用户提问记录等
- **Provider_Type**: AI模型提供商类型，包括OpenAI、OpenAIResponses、Anthropic

## Requirements

### Requirement 1: 悬浮球UI组件

**User Story:** As a 文档阅读者, I want 在页面右下角看到一个悬浮球, so that 我可以快速访问AI对话助手。

#### Acceptance Criteria

1. WHEN 用户访问文档页面且功能已启用 THEN THE Floating_Ball SHALL 显示在页面右下角固定位置
2. WHEN 用户点击 Floating_Ball THEN THE Chat_Panel SHALL 从右侧滑出展开
3. WHEN Chat_Panel 已展开且用户点击 Floating_Ball 或面板外区域 THEN THE Chat_Panel SHALL 收起隐藏
4. WHILE Chat_Panel 展开状态 THEN THE Floating_Ball SHALL 显示关闭图标
5. IF 功能未启用 THEN THE Floating_Ball SHALL 不显示

### Requirement 2: 对话面板界面

**User Story:** As a 文档阅读者, I want 一个清晰的对话界面, so that 我可以方便地与AI进行交流。

#### Acceptance Criteria

1. THE Chat_Panel SHALL 包含消息列表区域、输入框和发送按钮
2. THE Chat_Panel SHALL 在顶部显示 Model_Selector 下拉框
3. WHEN 用户发送消息 THEN THE Chat_Panel SHALL 在消息列表中显示用户消息
4. WHEN AI回复时 THEN THE Chat_Panel SHALL 实时流式显示AI回复内容
5. WHEN AI进行 Tool_Call THEN THE Chat_Panel SHALL 显示工具调用信息和结果
6. THE Chat_Panel SHALL 支持显示Markdown格式的消息内容
7. WHEN 页面刷新 THEN THE Chat_Panel SHALL 清空所有对话记录

### Requirement 3: 模型选择功能

**User Story:** As a 文档阅读者, I want 选择不同的AI模型, so that 我可以根据需要使用不同能力的模型。

#### Acceptance Criteria

1. WHEN Chat_Panel 加载时 THEN THE Model_Selector SHALL 从后端获取可用模型列表
2. THE Model_Selector SHALL 仅显示管理员配置为对话助手可用的模型
3. WHEN 用户选择模型 THEN THE Chat_Assistant SHALL 使用选中的模型进行后续对话
4. IF 没有可用模型 THEN THE Chat_Panel SHALL 显示提示信息并禁用发送功能

### Requirement 4: 图片支持

**User Story:** As a 文档阅读者, I want 在对话中发送图片, so that 我可以让AI分析图片内容。

#### Acceptance Criteria

1. THE Chat_Panel SHALL 提供图片上传按钮
2. WHEN 用户选择图片 THEN THE Chat_Panel SHALL 显示图片预览
3. WHEN 用户发送带图片的消息 THEN THE Chat_Assistant SHALL 将图片编码为Base64并发送给AI
4. THE Chat_Panel SHALL 支持常见图片格式（PNG、JPG、GIF、WebP）
5. IF 图片大小超过限制 THEN THE Chat_Panel SHALL 显示错误提示

### Requirement 5: 对话上下文传递

**User Story:** As a 文档阅读者, I want AI了解我当前阅读的文档上下文, so that AI可以提供更相关的回答。

#### Acceptance Criteria

1. WHEN 发送对话请求 THEN THE Chat_Assistant SHALL 传递当前的owner、repo、branch和language
2. WHEN 发送对话请求 THEN THE Chat_Assistant SHALL 传递当前打开的文档路径
3. THE Chat_Assistant SHALL 在系统提示词中包含完整的 Catalog_Menu
4. THE Chat_Assistant SHALL 根据language参数设置AI交互语言

### Requirement 6: 内置文档读取工具

**User Story:** As a 文档阅读者, I want AI能够读取仓库中的其他文档, so that AI可以提供更全面的信息。

#### Acceptance Criteria

1. THE Chat_Assistant SHALL 提供ReadDocument内置工具供AI调用
2. WHEN AI调用ReadDocument工具 THEN THE Chat_Assistant SHALL 返回指定路径的文档内容
3. THE ReadDocument工具 SHALL 仅能读取当前owner/repo/branch下的文档
4. IF 请求的文档不存在 THEN THE ReadDocument工具 SHALL 返回文档不存在的错误信息

### Requirement 7: MCP工具集成

**User Story:** As a 文档阅读者, I want AI能够使用管理员配置的MCP工具, so that AI可以执行更多操作。

#### Acceptance Criteria

1. WHEN 创建对话Agent THEN THE Chat_Assistant SHALL 加载管理员配置的启用MCP列表
2. THE Chat_Assistant SHALL 将MCP配置转换为AI可调用的Tool
3. WHEN AI调用MCP工具 THEN THE Chat_Assistant SHALL 执行对应的MCP调用并返回结果
4. IF MCP调用失败 THEN THE Chat_Assistant SHALL 返回错误信息给AI

### Requirement 8: 对话历史管理

**User Story:** As a 文档阅读者, I want 对话历史在会话期间保持, so that AI可以理解对话上下文。

#### Acceptance Criteria

1. THE Chat_Panel SHALL 在前端维护完整的对话历史
2. THE 对话历史 SHALL 包含用户消息、AI回复、Tool_Call和Tool结果
3. WHEN 发送新消息 THEN THE Chat_Assistant SHALL 将完整对话历史传递给AI
4. WHEN 页面刷新 THEN THE 对话历史 SHALL 被清空
5. THE 对话历史 SHALL 不进行持久化存储

### Requirement 9: SSE流式响应

**User Story:** As a 文档阅读者, I want 实时看到AI的回复, so that 我不需要等待完整回复。

#### Acceptance Criteria

1. THE Chat_Assistant后端 SHALL 使用SSE协议返回AI回复
2. WHEN AI生成回复 THEN THE Chat_Panel SHALL 实时显示流式内容
3. WHEN AI进行Tool_Call THEN THE SSE_Stream SHALL 发送工具调用事件
4. WHEN Tool执行完成 THEN THE SSE_Stream SHALL 发送工具结果事件
5. WHEN 对话完成 THEN THE SSE_Stream SHALL 发送完成事件

### Requirement 10: 后台管理配置

**User Story:** As a 管理员, I want 配置对话助手的可用模型和工具, so that 我可以控制用户可使用的功能。

#### Acceptance Criteria

1. THE 管理后台 SHALL 提供对话助手配置页面
2. THE 管理员 SHALL 能够选择哪些模型可用于对话助手
3. THE 管理员 SHALL 能够选择哪些MCPs可用于对话助手
4. THE 管理员 SHALL 能够选择哪些Skills可用于对话助手
5. THE 管理员 SHALL 能够启用或禁用对话助手功能
6. WHEN 管理员保存配置 THEN THE Chat_Config SHALL 立即生效

### Requirement 11: 错误处理

**User Story:** As a 文档阅读者, I want 在出错时看到友好的提示, so that 我知道发生了什么问题。

#### Acceptance Criteria

1. IF SSE连接失败 THEN THE Chat_Panel SHALL 显示连接错误提示
2. IF AI回复超时 THEN THE Chat_Panel SHALL 显示超时提示并允许重试
3. IF 模型不可用 THEN THE Chat_Panel SHALL 显示模型不可用提示
4. WHEN 发生错误 THEN THE Chat_Panel SHALL 保留已有的对话历史

### Requirement 12: 应用创建与管理

**User Story:** As a 用户, I want 创建自己的对话应用, so that 我可以将悬浮球嵌入到我的外部网站。

#### Acceptance Criteria

1. THE 用户中心 SHALL 在右上角提供应用管理入口
2. WHEN 用户创建应用 THEN THE Chat_App SHALL 自动生成唯一的AppId和AppSecret
3. THE Chat_App SHALL 包含名称、描述、图标URL配置
4. THE Chat_App SHALL 支持配置是否启用域名校验
5. WHEN 启用域名校验 THEN THE Chat_App SHALL 允许配置允许的域名列表
6. THE 用户 SHALL 能够查看、编辑和删除自己创建的应用
7. THE 用户 SHALL 能够重新生成AppSecret

### Requirement 13: 应用AI模型配置

**User Story:** As a 应用创建者, I want 配置自己的AI模型, so that 对话使用我自己的API配置。

#### Acceptance Criteria

1. THE Chat_App SHALL 支持配置模型提供商类型（OpenAI、OpenAIResponses、Anthropic）
2. THE Chat_App SHALL 支持配置ApiKey
3. THE Chat_App SHALL 支持配置BaseUrl端点
4. THE Chat_App SHALL 支持配置可用模型列表
5. WHEN 通过嵌入脚本发起对话 THEN THE Chat_Assistant SHALL 使用应用配置的模型和API
6. IF 应用未配置模型 THEN THE Chat_Assistant SHALL 返回配置缺失错误

### Requirement 14: 嵌入脚本功能

**User Story:** As a 应用创建者, I want 获取嵌入脚本, so that 我可以将悬浮球集成到我的网站。

#### Acceptance Criteria

1. THE 应用详情页 SHALL 提供嵌入脚本代码示例
2. THE App_Embed_Script SHALL 接受AppId参数
3. THE App_Embed_Script SHALL 接受自定义图标URL参数
4. WHEN 脚本加载完成 THEN THE Floating_Ball SHALL 显示在页面右下角
5. WHEN 用户点击嵌入的 Floating_Ball THEN THE Chat_Panel SHALL 从右侧展开
6. THE 嵌入的 Chat_Panel SHALL 使用应用配置的模型进行对话
7. IF 域名校验启用且当前域名不在允许列表 THEN THE App_Embed_Script SHALL 不加载悬浮球

### Requirement 15: 应用使用统计

**User Story:** As a 应用创建者, I want 查看应用的使用统计, so that 我可以了解应用的使用情况。

#### Acceptance Criteria

1. THE App_Statistics SHALL 记录每次对话请求
2. THE App_Statistics SHALL 记录每日调用次数
3. THE App_Statistics SHALL 记录输入Token数量（inputToken）
4. THE App_Statistics SHALL 记录输出Token数量（outputToken）
5. THE App_Statistics SHALL 记录请求总数
6. THE 应用详情页 SHALL 显示统计数据的图表和汇总
7. THE 用户 SHALL 能够按日期范围查询统计数据

### Requirement 16: 用户提问记录

**User Story:** As a 应用创建者, I want 查看用户的提问记录, so that 我可以了解用户的使用情况和常见问题。

#### Acceptance Criteria

1. WHEN 用户通过嵌入脚本发送消息 THEN THE Chat_App SHALL 记录提问内容
2. THE 提问记录 SHALL 包含时间戳、用户标识、提问内容、AI回复摘要
3. THE 应用详情页 SHALL 提供提问记录列表查询功能
4. THE 用户 SHALL 能够按时间范围和关键词搜索提问记录
5. THE 提问记录 SHALL 关联到对应的AppId便于分类查询

### Requirement 17: 应用安全验证

**User Story:** As a 应用创建者, I want 应用具有安全验证机制, so that 我的API配置不会被滥用。

#### Acceptance Criteria

1. WHEN 嵌入脚本发起请求 THEN THE Chat_Assistant SHALL 验证AppId的有效性
2. IF 启用域名校验 THEN THE Chat_Assistant SHALL 验证请求来源域名
3. THE Chat_Assistant SHALL 支持通过AppSecret进行服务端API调用验证
4. IF AppId无效或域名校验失败 THEN THE Chat_Assistant SHALL 返回401错误
5. THE 应用 SHALL 支持配置请求频率限制
