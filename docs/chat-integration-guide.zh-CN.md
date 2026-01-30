# 多平台 Agent Chat 对接指南

本文档介绍如何将 OpenDeepWiki 的 Agent Chat 系统接入飞书、QQ 机器人、微信客服等第三方对话平台。

## 目录

- [系统概述](#系统概述)
- [快速开始](#快速开始)
- [平台接入详解](#平台接入详解)
  - [飞书机器人](#飞书机器人)
  - [QQ 机器人](#qq-机器人)
  - [微信客服](#微信客服)
- [API 接口文档](#api-接口文档)
- [配置说明](#配置说明)
- [运维指南](#运维指南)
- [故障排查](#故障排查)

---

## 系统概述

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    第三方对话平台                         │
│         飞书  │  QQ机器人  │  微信客服  │  其他...        │
└───────┬───────────┬────────────┬────────────────────────┘
        │           │            │
        ▼           ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                  Webhook 接收层                          │
│   /api/chat/webhook/feishu  │  /qq  │  /wechat          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  消息处理流程                            │
│  消息解析 → 会话管理 → Agent执行 → 响应回调              │
└─────────────────────────────────────────────────────────┘
```

### 核心能力

| 能力 | 说明 |
|------|------|
| 统一消息格式 | 屏蔽不同平台的消息格式差异 |
| 多轮对话 | 自动维护对话上下文，支持连续对话 |
| 异步处理 | 消息队列机制，保证系统稳定性 |
| 自动重试 | API 调用失败自动重试（最多 3 次） |
| 热重载 | 修改配置无需重启服务 |
| 安全存储 | API 密钥等敏感信息加密存储 |

---

## 快速开始

### 第一步：启动服务

```bash
# 启动后端 API 服务
dotnet run --project src/OpenDeepWiki/OpenDeepWiki.csproj
```

### 第二步：添加平台配置

以飞书为例：

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "feishu",
    "displayName": "飞书机器人",
    "isEnabled": true,
    "configData": "{\"appId\":\"你的AppID\",\"appSecret\":\"你的AppSecret\",\"verificationToken\":\"验证Token\"}",
    "webhookUrl": "https://你的域名/api/chat/webhook/feishu"
  }'
```

### 第三步：配置平台回调

在对应平台的开发者后台，将 Webhook URL 配置为：

| 平台 | Webhook URL |
|------|-------------|
| 飞书 | `https://你的域名/api/chat/webhook/feishu` |
| QQ | `https://你的域名/api/chat/webhook/qq` |
| 微信 | `https://你的域名/api/chat/webhook/wechat` |

### 第四步：测试

向机器人发送一条消息，验证是否正常响应。

---

## 平台接入详解

### 飞书机器人

#### 准备工作

1. 注册 [飞书开放平台](https://open.feishu.cn/) 账号
2. 创建企业自建应用
3. 准备一个可公网访问的服务器

#### 详细步骤

**1. 创建应用**

登录飞书开放平台 → 创建应用 → 选择「企业自建应用」

**2. 获取凭证**

在「凭证与基础信息」页面记录：
- App ID（应用 ID）
- App Secret（应用密钥）

**3. 添加机器人能力**

应用管理 → 添加应用能力 → 选择「机器人」

**4. 配置事件订阅**

事件订阅 → 配置请求地址：
```
https://你的域名/api/chat/webhook/feishu
```

记录：
- Verification Token（验证令牌）
- Encrypt Key（加密密钥，可选但推荐）

订阅事件：
- `im.message.receive_v1`（接收消息事件）

**5. 保存配置**

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "feishu",
    "displayName": "飞书机器人",
    "isEnabled": true,
    "configData": "{\"appId\":\"cli_xxxxxxxxxx\",\"appSecret\":\"xxxxxxxxxxxxxxxxxx\",\"verificationToken\":\"xxxxxxxxxx\",\"encryptKey\":\"xxxxxxxxxx\"}",
    "webhookUrl": "https://你的域名/api/chat/webhook/feishu",
    "messageInterval": 500,
    "maxRetryCount": 3
  }'
```

**6. 发布应用**

提交审核 → 审核通过后发布 → 在企业内安装

#### 配置参数

| 参数 | 必填 | 说明 |
|------|------|------|
| appId | ✅ | 飞书应用 App ID |
| appSecret | ✅ | 飞书应用 App Secret |
| verificationToken | ✅ | 事件订阅验证 Token |
| encryptKey | ❌ | 消息加密密钥（推荐配置） |

---

### QQ 机器人

#### 准备工作

1. 注册 [QQ 开放平台](https://q.qq.com/) 账号
2. 创建机器人应用
3. 准备一个可公网访问的服务器

#### 详细步骤

**1. 创建机器人**

登录 QQ 开放平台 → 创建机器人

**2. 获取凭证**

记录以下信息：
- App ID
- Token
- App Secret

**3. 配置回调**

设置消息回调地址：
```
https://你的域名/api/chat/webhook/qq
```

**4. 保存配置**

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

#### 配置参数

| 参数 | 必填 | 说明 |
|------|------|------|
| appId | ✅ | QQ 机器人 App ID |
| token | ✅ | 机器人 Token |
| appSecret | ✅ | App Secret |
| sandbox | ❌ | 是否沙箱环境，默认 false |

#### 支持的消息类型

- ✅ 文本消息
- ✅ @ 消息
- ✅ 私聊消息
- ✅ 群聊消息

---

### 微信客服

#### 准备工作

1. 拥有企业微信账号
2. 开通微信客服功能
3. 准备一个可公网访问的服务器

#### 详细步骤

**1. 配置微信客服**

登录 [企业微信管理后台](https://work.weixin.qq.com/) → 应用管理 → 微信客服

**2. 获取凭证**

记录：
- Corp ID（企业 ID）
- Secret（应用密钥）

**3. 配置回调**

设置回调 URL：
```
https://你的域名/api/chat/webhook/wechat
```

设置并记录：
- Token
- EncodingAESKey

**4. 保存配置**

```bash
curl -X POST http://localhost:5000/api/chat/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "wechat",
    "displayName": "微信客服",
    "isEnabled": true,
    "configData": "{\"corpId\":\"xxxxxxxxxx\",\"secret\":\"xxxxxxxxxx\",\"token\":\"xxxxxxxxxx\",\"encodingAesKey\":\"xxxxxxxxxx\"}",
    "webhookUrl": "https://你的域名/api/chat/webhook/wechat",
    "messageInterval": 500,
    "maxRetryCount": 3
  }'
```

#### 配置参数

| 参数 | 必填 | 说明 |
|------|------|------|
| corpId | ✅ | 企业微信 Corp ID |
| secret | ✅ | 应用 Secret |
| token | ✅ | 回调 Token |
| encodingAesKey | ✅ | 消息加解密密钥 |

#### 支持的消息类型

- ✅ 文本消息
- ✅ 图片消息
- ✅ 语音消息

---

## API 接口文档

### Webhook 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat/webhook/feishu` | POST | 飞书消息接收 |
| `/api/chat/webhook/qq` | POST | QQ 消息接收 |
| `/api/chat/webhook/wechat` | GET | 微信验证请求 |
| `/api/chat/webhook/wechat` | POST | 微信消息接收 |
| `/api/chat/webhook/{platform}` | POST | 通用消息接收 |

### Provider 管理

#### 获取所有 Provider

```http
GET /api/chat/admin/providers
```

**响应示例：**
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

#### 获取单个 Provider

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

#### 启用 Provider

```http
POST /api/chat/admin/providers/{platform}/enable
```

#### 禁用 Provider

```http
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

### 队列监控

#### 获取队列状态

```http
GET /api/chat/admin/queue/status
```

**响应示例：**
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

#### 重新处理死信

```http
POST /api/chat/admin/queue/deadletter/{messageId}/reprocess
```

#### 删除死信

```http
DELETE /api/chat/admin/queue/deadletter/{messageId}
```

#### 清空死信队列

```http
DELETE /api/chat/admin/queue/deadletter
```

---

## 配置说明

### appsettings.json

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
| ValidateOnStartup | true | 启动时验证配置 |
| CacheExpirationSeconds | 300 | 配置缓存时间（秒） |
| EnableHotReload | true | 启用热重载 |

### Provider 配置字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| platform | string | ✅ | - | 平台标识 |
| displayName | string | ✅ | - | 显示名称 |
| isEnabled | bool | ❌ | true | 是否启用 |
| configData | string | ✅ | - | 平台配置 JSON |
| webhookUrl | string | ❌ | - | Webhook URL |
| messageInterval | int | ❌ | 500 | 消息间隔（毫秒） |
| maxRetryCount | int | ❌ | 3 | 最大重试次数 |

---

## 运维指南

### 日常监控

**1. 检查队列状态**

```bash
curl http://localhost:5000/api/chat/admin/queue/status
```

正常情况下 `pendingCount` 应该较低，`deadLetterCount` 应该为 0。

**2. 检查 Provider 状态**

```bash
curl http://localhost:5000/api/chat/admin/providers
```

确保所有需要的 Provider 都是 `isEnabled: true` 且 `isRegistered: true`。

### 死信队列处理

当消息处理失败超过重试次数后，会进入死信队列。

**查看死信：**
```bash
curl "http://localhost:5000/api/chat/admin/queue/deadletter?skip=0&take=20"
```

**重新处理：**
```bash
curl -X POST http://localhost:5000/api/chat/admin/queue/deadletter/{messageId}/reprocess
```

**删除无法处理的消息：**
```bash
curl -X DELETE http://localhost:5000/api/chat/admin/queue/deadletter/{messageId}
```

### 配置热重载

修改配置后无需重启服务：

```bash
# 重载指定平台
curl -X POST http://localhost:5000/api/chat/admin/providers/feishu/reload

# 重载所有
curl -X POST http://localhost:5000/api/chat/admin/providers/reload
```

### 日志位置

日志文件位于 `logs/` 目录。

关键日志标签：
- `OpenDeepWiki.Chat.Routing` - 消息路由日志
- `OpenDeepWiki.Chat.Processing` - 消息处理日志
- `OpenDeepWiki.Chat.Providers` - Provider 操作日志

---

## 故障排查

### Webhook 验证失败

**可能原因：**
1. URL 不可公网访问
2. Token 或密钥配置错误
3. 服务未启动

**排查步骤：**
1. 确认服务器可被公网访问
2. 检查配置中的 Token 是否与平台一致
3. 查看服务器日志

### 消息发送失败

**可能原因：**
1. API 密钥过期或无效
2. 网络问题
3. 平台限流

**排查步骤：**
1. 检查死信队列获取错误详情
2. 验证 API 密钥是否有效
3. 检查网络连接

### 机器人无响应

**可能原因：**
1. Provider 未启用
2. Webhook 配置错误
3. Agent 执行异常

**排查步骤：**
1. 确认 Provider 状态为启用
2. 检查 Webhook URL 配置
3. 查看处理日志

### 会话上下文丢失

**可能原因：**
1. 会话超时
2. 服务重启
3. 数据库问题

**说明：**
- 会话默认 30 分钟超时
- 会话数据持久化到数据库
- 服务重启后会话可恢复

---

## 联系支持

如有问题，请通过以下方式获取帮助：

- 📝 提交 [GitHub Issue](https://github.com/AIDotNet/OpenDeepWiki/issues)
- 📖 查看项目 Wiki
- 💬 加入技术交流群
