# Multi-Platform Agent Chat 对接指南

本文档介绍如何将 OpenDeepWiki 的 Agent Chat 系统接入飞书、QQ 机器人、微信客服等第三方对话平台。

## 目录

- [系统概述](#系统概述)
- [快速开始](#快速开始)
- [平台接入](#平台接入)
  - [飞书机器人](#飞书机器人)
  - [QQ 机器人](#qq-机器人)
  - [微信客服](#微信客服)
- [API 参考](#api-参考)
- [配置管理](#配置管理)
- [监控与运维](#监控与运维)
- [常见问题](#常见问题)

---

## 系统概述

### 架构说明

Multi-Platform Agent Chat 系统采用统一消息抽象层设计，支持多种第三方对话平台接入：

```
┌─────────────────────────────────────────────────────────┐
│                    第三方平台                            │
│         飞书  │  QQ机器人  │  微信客服  │  ...          │
└───────┬───────────┬────────────┬────────────────────────┘
        │           │            │
        ▼           ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                  Provider 层                             │
│    FeishuProvider │ QQProvider │ WeChatProvider         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   核心处理层                             │
│   MessageRouter → SessionManager → AgentExecutor        │
└─────────────────────────────────────────────────────────┘
```

### 核心特性

- **统一消息格式**：屏蔽不同平台的消息格式差异
- **会话管理**：自动维护多轮对话上下文
- **异步处理**：消息队列保证系统稳定性
- **自动重试**：API 调用失败自动重试（最多 3 次）
- **配置热重载**：修改配置无需重启服务
- **敏感信息加密**：API 密钥等敏感配置加密存储

---

## 快速开始

### 1. 确保服务已启动

```bash
# 启动后端服务
dotnet run --project src/OpenDeepWiki/OpenDeepWiki.csproj
```

### 2. 配置 Provider

通过管理 API 添加平台配置：

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "feishu",
    "displayName": "飞书机器人",
    "isEnabled": true,
    "configData": "{\"appId\":\"your_app_id\",\"appSecret\":\"your_app_secret\"}",
    "webhookUrl": "https://your-domain.com/api/chat/webhook/feishu"
  }'
```

### 3. 配置平台 Webhook

在对应平台的开发者后台配置 Webhook URL：
- 飞书：`https://your-domain.com/api/chat/webhook/feishu`
- QQ：`https://your-domain.com/api/chat/webhook/qq`
- 微信：`https://your-domain.com/api/chat/webhook/wechat`

### 4. 测试连接

向机器人发送消息，验证是否正常响应。

---

## 平台接入

### 飞书机器人

#### 前置条件

1. 拥有飞书开放平台账号
2. 已创建企业自建应用
3. 服务器可被公网访问（用于接收 Webhook）

#### 步骤一：创建飞书应用

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 在「凭证与基础信息」页面获取：
   - App ID
   - App Secret

#### 步骤二：配置机器人能力

1. 在应用管理页面，添加「机器人」能力
2. 配置机器人信息（名称、头像等）

#### 步骤三：配置事件订阅

1. 进入「事件订阅」页面
2. 配置请求地址：`https://your-domain.com/api/chat/webhook/feishu`
3. 获取 Verification Token 和 Encrypt Key
4. 订阅以下事件：
   - `im.message.receive_v1`（接收消息）

#### 步骤四：保存配置到系统

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "feishu",
    "displayName": "飞书机器人",
    "isEnabled": true,
    "configData": "{\"appId\":\"cli_xxxxxxxxxx\",\"appSecret\":\"xxxxxxxxxxxxxxxxxx\",\"verificationToken\":\"xxxxxxxxxx\",\"encryptKey\":\"xxxxxxxxxx\"}",
    "webhookUrl": "https://your-domain.com/api/chat/webhook/feishu",
    "messageInterval": 500,
    "maxRetryCount": 3
  }'
```

#### 配置参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| appId | 是 | 飞书应用 App ID |
| appSecret | 是 | 飞书应用 App Secret |
| verificationToken | 是 | 事件订阅验证 Token |
| encryptKey | 否 | 消息加密密钥（推荐配置） |

#### 步骤五：发布应用

1. 在飞书开放平台提交应用审核
2. 审核通过后发布应用
3. 在企业内安装应用

---

### QQ 机器人

#### 前置条件

1. 拥有 QQ 开放平台账号
2. 已创建机器人应用
3. 服务器可被公网访问

#### 步骤一：创建 QQ 机器人

1. 登录 [QQ 开放平台](https://q.qq.com/)
2. 创建机器人应用
3. 获取以下信息：
   - App ID
   - Token
   - App Secret

#### 步骤二：配置回调地址

在 QQ 开放平台配置消息回调地址：
`https://your-domain.com/api/chat/webhook/qq`

#### 步骤三：保存配置到系统

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "qq",
    "displayName": "QQ 机器人",
    "isEnabled": true,
    "configData": "{\"appId\":\"xxxxxxxxxx\",\"token\":\"xxxxxxxxxx\",\"appSecret\":\"xxxxxxxxxx\",\"sandbox\":false}",
    "messageInterval": 1000,
    "maxRetryCount": 3
  }'
```

#### 配置参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| appId | 是 | QQ 机器人 App ID |
| token | 是 | 机器人 Token |
| appSecret | 是 | App Secret |
| sandbox | 否 | 是否沙箱环境，默认 false |

#### 支持的消息类型

- 文本消息
- @ 消息
- 私聊消息
- 群聊消息

---

### 微信客服

#### 前置条件

1. 拥有企业微信账号
2. 已开通微信客服功能
3. 服务器可被公网访问

#### 步骤一：配置微信客服

1. 登录 [企业微信管理后台](https://work.weixin.qq.com/)
2. 进入「应用管理」→「微信客服」
3. 获取以下信息：
   - Corp ID（企业 ID）
   - Secret（应用密钥）

#### 步骤二：配置回调地址

1. 在微信客服设置中配置回调 URL
2. 设置 Token 和 EncodingAESKey
3. 回调地址：`https://your-domain.com/api/chat/webhook/wechat`

#### 步骤三：保存配置到系统

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "wechat",
    "displayName": "微信客服",
    "isEnabled": true,
    "configData": "{\"corpId\":\"xxxxxxxxxx\",\"secret\":\"xxxxxxxxxx\",\"token\":\"xxxxxxxxxx\",\"encodingAesKey\":\"xxxxxxxxxx\"}",
    "webhookUrl": "https://your-domain.com/api/chat/webhook/wechat",
    "messageInterval": 500,
    "maxRetryCount": 3
  }'
```

#### 配置参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| corpId | 是 | 企业微信 Corp ID |
| secret | 是 | 应用 Secret |
| token | 是 | 回调 Token |
| encodingAesKey | 是 | 消息加解密密钥 |

#### 支持的消息类型

- 文本消息
- 图片消息
- 语音消息

---

## API 参考

### Webhook 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat/webhook/feishu` | POST | 飞书消息 Webhook |
| `/api/chat/webhook/qq` | POST | QQ 机器人消息 Webhook |
| `/api/chat/webhook/wechat` | GET | 微信 Webhook 验证 |
| `/api/chat/webhook/wechat` | POST | 微信消息 Webhook |
| `/api/chat/webhook/{platform}` | POST | 通用 Webhook |

### 管理端点

#### 获取所有 Provider

```http
GET /api/chat/admin/providers
```

响应示例：
```json
[
  {
    "platform": "feishu",
    "displayName": "飞书机器人",
    "isEnabled": true,
    "isRegistered": true,
    "webhookUrl": "https://example.com/api/chat/webhook/feishu",
    "messageInterval": 500,
    "maxRetryCount": 3
  }
]
```

#### 获取指定 Provider

```http
GET /api/chat/admin/providers/{platform}
```

#### 保存 Provider 配置

```http
POST /api/chat/admin/providers
Content-Type: application/json

{
  "platform": "feishu",
  "displayName": "飞书机器人",
  "isEnabled": true,
  "configData": "{...}",
  "webhookUrl": "https://example.com/api/chat/webhook/feishu",
  "messageInterval": 500,
  "maxRetryCount": 3
}
```

#### 启用/禁用 Provider

```http
POST /api/chat/admin/providers/{platform}/enable
POST /api/chat/admin/providers/{platform}/disable
```

#### 重载配置

```http
POST /api/chat/admin/providers/{platform}/reload
```

#### 删除 Provider

```http
DELETE /api/chat/admin/providers/{platform}
```

### 队列监控端点

#### 获取队列状态

```http
GET /api/chat/admin/queue/status
```

响应示例：
```json
{
  "pendingCount": 5,
  "deadLetterCount": 2,
  "timestamp": "2026-01-30T12:00:00Z"
}
```

#### 获取死信队列

```http
GET /api/chat/admin/queue/deadletter?skip=0&take=20
```

#### 重新处理死信消息

```http
POST /api/chat/admin/queue/deadletter/{messageId}/reprocess
```

#### 删除死信消息

```http
DELETE /api/chat/admin/queue/deadletter/{messageId}
```

#### 清空死信队列

```http
DELETE /api/chat/admin/queue/deadletter
```

---

## 配置管理

### appsettings.json 配置

在 `appsettings.json` 中添加 Chat 配置节：

```json
{
  "Chat": {
    "ValidateOnStartup": true,
    "CacheExpirationSeconds": 300,
    "EnableHotReload": true
  }
}
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| ValidateOnStartup | true | 启动时验证配置完整性 |
| CacheExpirationSeconds | 300 | 配置缓存过期时间（秒） |
| EnableHotReload | true | 是否启用配置热重载 |

### Provider 配置字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | string | 是 | 平台标识（feishu/qq/wechat） |
| displayName | string | 是 | 显示名称 |
| isEnabled | boolean | 否 | 是否启用，默认 true |
| configData | string | 是 | 平台配置 JSON |
| webhookUrl | string | 否 | Webhook URL |
| messageInterval | int | 否 | 消息发送间隔（毫秒），默认 500 |
| maxRetryCount | int | 否 | 最大重试次数，默认 3 |

### 配置热重载

修改配置后，可通过 API 触发热重载，无需重启服务：

```bash
# 重载指定平台配置
curl -X POST http://localhost:5000/api/chat/admin/providers/feishu/reload

# 重载所有配置
curl -X POST http://localhost:5000/api/chat/admin/providers/reload
```

---

## 监控与运维

### 队列监控

定期检查队列状态，确保消息正常处理：

```bash
curl http://localhost:5000/api/chat/admin/queue/status
```

### 死信队列处理

死信队列包含处理失败的消息，需要定期检查和处理：

```bash
# 查看死信消息
curl "http://localhost:5000/api/chat/admin/queue/deadletter?skip=0&take=20"

# 重新处理
curl -X POST http://localhost:5000/api/chat/admin/queue/deadletter/{messageId}/reprocess

# 删除无法处理的消息
curl -X DELETE http://localhost:5000/api/chat/admin/queue/deadletter/{messageId}
```

### 日志查看

系统日志位于 `logs/` 目录，包含详细的消息处理记录。

关键日志标签：
- `OpenDeepWiki.Chat.Routing` - 消息路由
- `OpenDeepWiki.Chat.Processing` - 消息处理
- `OpenDeepWiki.Chat.Providers` - Provider 操作

---

## 常见问题

### Q: Webhook 验证失败怎么办？

A: 检查以下几点：
1. 确保 Webhook URL 可被公网访问
2. 检查 Token 和密钥配置是否正确
3. 查看服务器日志获取详细错误信息

### Q: 消息发送失败如何处理？

A: 系统会自动重试最多 3 次。如果仍然失败：
1. 检查死信队列查看失败原因
2. 确认平台 API 密钥是否有效
3. 检查网络连接是否正常

### Q: 如何添加新的平台支持？

A: 实现 `IMessageProvider` 接口：
1. 创建新的 Provider 类继承 `BaseMessageProvider`
2. 实现消息解析和发送逻辑
3. 在 `ChatServiceExtensions` 中注册 Provider

### Q: 会话上下文如何管理？

A: 系统自动管理会话：
- 根据用户 ID 和平台自动创建/查找会话
- 会话历史默认保留最近 20 条消息
- 会话超时后自动清理（默认 30 分钟）

### Q: 如何处理平台限流？

A: 系统内置限流处理：
- 自动检测限流响应
- 延迟后自动重试
- 可配置消息发送间隔

---

## 技术支持

如有问题，请通过以下方式获取帮助：
- 提交 GitHub Issue
- 查看项目 Wiki
- 联系技术支持团队
