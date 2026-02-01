# 环境配置说明

本文档详细说明 OpenDeepWiki 的所有配置选项，包括 AI 模型、数据库、Wiki 生成和聊天系统等配置。

## 配置方式

OpenDeepWiki 支持多种配置方式，优先级从高到低：

1. **环境变量** - 最高优先级，适合 Docker 部署
2. **appsettings.json** - 配置文件，适合本地开发
3. **默认值** - 内置默认配置

## AI 模型配置

### 全局 AI 配置

用于聊天对话等通用 AI 功能。

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `CHAT_API_KEY` | `AI:ApiKey` | - | AI 服务 API Key（必填） |
| `ENDPOINT` | `AI:Endpoint` | `https://api.openai.com/v1` | AI 服务端点 |
| `CHAT_REQUEST_TYPE` | `AI:RequestType` | `OpenAI` | 请求类型：`OpenAI`、`AzureOpenAI`、`Anthropic` |

### 配置示例

**OpenAI 配置：**

```yaml
environment:
  - CHAT_API_KEY=sk-your-openai-api-key
  - ENDPOINT=https://api.openai.com/v1
  - CHAT_REQUEST_TYPE=OpenAI
```

**Azure OpenAI 配置：**

```yaml
environment:
  - CHAT_API_KEY=your-azure-api-key
  - ENDPOINT=https://your-resource.openai.azure.com/
  - CHAT_REQUEST_TYPE=AzureOpenAI
```

**Anthropic 配置：**

```yaml
environment:
  - CHAT_API_KEY=your-anthropic-api-key
  - ENDPOINT=https://api.anthropic.com
  - CHAT_REQUEST_TYPE=Anthropic
```

**兼容 OpenAI 格式的第三方服务：**

```yaml
environment:
  - CHAT_API_KEY=your-api-key
  - ENDPOINT=https://api.your-provider.com/v1
  - CHAT_REQUEST_TYPE=OpenAI
```

## 数据库配置

OpenDeepWiki 支持多种数据库，通过 EF Core 实现多数据库适配。

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `DB_TYPE` | `Database:Type` | `sqlite` | 数据库类型 |
| `CONNECTION_STRING` | `ConnectionStrings:Default` | - | 数据库连接字符串 |

### 支持的数据库类型

| 类型 | DB_TYPE 值 | 说明 |
|-----|-----------|------|
| SQLite | `sqlite` | 轻量级，适合开发和小规模部署 |
| PostgreSQL | `postgresql` 或 `postgres` | 生产环境推荐 |
| MySQL | `mysql` | 企业常用 |
| SQL Server | `sqlserver` | Windows 环境常用 |

### 连接字符串示例

**SQLite（默认）：**

```yaml
environment:
  - DB_TYPE=sqlite
  - CONNECTION_STRING=Data Source=/app/data/opendeepwiki.db
```

**PostgreSQL：**

```yaml
environment:
  - DB_TYPE=postgresql
  - CONNECTION_STRING=Host=localhost;Port=5432;Database=opendeepwiki;Username=postgres;Password=your-password
```

**MySQL：**

```yaml
environment:
  - DB_TYPE=mysql
  - CONNECTION_STRING=Server=localhost;Port=3306;Database=opendeepwiki;Uid=root;Pwd=your-password;
```

**SQL Server：**

```yaml
environment:
  - DB_TYPE=sqlserver
  - CONNECTION_STRING=Server=localhost;Database=opendeepwiki;User Id=sa;Password=your-password;TrustServerCertificate=True;
```


## Wiki 生成配置

Wiki 生成器支持为目录生成、内容生成和翻译分别配置不同的 AI 模型。

### 目录生成配置

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `WIKI_CATALOG_MODEL` | `WikiGenerator:CatalogModel` | - | 目录生成模型 |
| `WIKI_CATALOG_ENDPOINT` | `WikiGenerator:CatalogEndpoint` | 继承全局 | 目录生成端点 |
| `WIKI_CATALOG_API_KEY` | `WikiGenerator:CatalogApiKey` | 继承全局 | 目录生成 API Key |
| `WIKI_CATALOG_REQUEST_TYPE` | `WikiGenerator:CatalogRequestType` | 继承全局 | 请求类型 |

### 内容生成配置

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `WIKI_CONTENT_MODEL` | `WikiGenerator:ContentModel` | - | 内容生成模型 |
| `WIKI_CONTENT_ENDPOINT` | `WikiGenerator:ContentEndpoint` | 继承全局 | 内容生成端点 |
| `WIKI_CONTENT_API_KEY` | `WikiGenerator:ContentApiKey` | 继承全局 | 内容生成 API Key |
| `WIKI_CONTENT_REQUEST_TYPE` | `WikiGenerator:ContentRequestType` | 继承全局 | 请求类型 |

### 翻译配置（可选）

如果不配置，将使用内容生成的配置。

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `WIKI_TRANSLATION_MODEL` | `WikiGenerator:TranslationModel` | 继承内容配置 | 翻译模型 |
| `WIKI_TRANSLATION_ENDPOINT` | `WikiGenerator:TranslationEndpoint` | 继承内容配置 | 翻译端点 |
| `WIKI_TRANSLATION_API_KEY` | `WikiGenerator:TranslationApiKey` | 继承内容配置 | 翻译 API Key |
| `WIKI_TRANSLATION_REQUEST_TYPE` | `WikiGenerator:TranslationRequestType` | 继承内容配置 | 请求类型 |

### 其他 Wiki 配置

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `WIKI_PARALLEL_COUNT` | `WikiGenerator:ParallelCount` | `5` | 并行生成数量 |
| `WIKI_LANGUAGES` | `WikiGenerator:Languages` | `en,zh` | 支持的语言（逗号分隔） |

### 配置示例

**使用不同模型处理不同任务：**

```yaml
environment:
  # 目录生成使用较便宜的模型
  - WIKI_CATALOG_MODEL=gpt-4o-mini
  - WIKI_CATALOG_ENDPOINT=https://api.openai.com/v1
  - WIKI_CATALOG_API_KEY=sk-your-key
  
  # 内容生成使用更强大的模型
  - WIKI_CONTENT_MODEL=gpt-4o
  - WIKI_CONTENT_ENDPOINT=https://api.openai.com/v1
  - WIKI_CONTENT_API_KEY=sk-your-key
  
  # 翻译使用专门的翻译模型
  - WIKI_TRANSLATION_MODEL=gpt-4o
  
  # 并行配置
  - WIKI_PARALLEL_COUNT=5
  - WIKI_LANGUAGES=en,zh,ja
```

## 聊天系统配置

OpenDeepWiki 支持集成多个聊天平台。

### 飞书 Bot 配置

| 环境变量 | 说明 |
|---------|------|
| `FeishuAppId` | 飞书应用 App ID |
| `FeishuAppSecret` | 飞书应用 App Secret |
| `FeishuBotName` | Bot 显示名称（可选） |

**配置步骤：**

1. 在[飞书开放平台](https://open.feishu.cn/)创建应用
2. 启用「机器人」能力
3. 配置事件订阅，订阅 `im.message.receive_v1` 事件
4. 设置回调地址：`https://your-domain/api/feishu-bot/{owner}/{name}`

```yaml
environment:
  - FeishuAppId=cli_your_app_id
  - FeishuAppSecret=your_app_secret
  - FeishuBotName=OpenDeepWiki
```

### QQ Bot 配置

| 环境变量 | 说明 |
|---------|------|
| `QQBotAppId` | QQ Bot App ID |
| `QQBotToken` | QQ Bot Token |
| `QQBotSecret` | QQ Bot Secret |

### 微信 Bot 配置

| 环境变量 | 说明 |
|---------|------|
| `WeChatAppId` | 微信公众号 App ID |
| `WeChatAppSecret` | 微信公众号 App Secret |
| `WeChatToken` | 消息验证 Token |
| `WeChatEncodingAESKey` | 消息加密密钥 |


## 高级配置选项

### 仓库处理配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `REPOSITORIES_DIRECTORY` | `/app/repositories` | 仓库存储目录 |
| `TASK_MAX_SIZE_PER_USER` | `5` | 每用户最大并行任务数 |
| `EnableSmartFilter` | `true` | 启用智能文件过滤 |
| `UPDATE_INTERVAL` | `5` | 增量更新间隔（天） |
| `MAX_FILE_LIMIT` | `100` | 上传文件大小限制（MB） |
| `ENABLE_INCREMENTAL_UPDATE` | `true` | 启用增量更新 |

### AI 处理配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `CHAT_MODEL` | - | 聊天模型（需支持 Function Calling） |
| `ANALYSIS_MODEL` | - | 分析模型（用于目录结构生成） |
| `DEEP_RESEARCH_MODEL` | - | 深度研究模型（为空则使用 CHAT_MODEL） |
| `READ_MAX_TOKENS` | `100000` | AI 读取文件的最大 Token 限制 |
| `MAX_FILE_READ_COUNT` | `10` | AI 最大文件读取数量（0=无限制） |

### 代码处理配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `ENABLE_CODED_DEPENDENCY_ANALYSIS` | `false` | 启用代码依赖分析 |
| `ENABLE_WAREHOUSE_COMMIT` | `true` | 启用仓库提交记录 |
| `ENABLE_FILE_COMMIT` | `true` | 启用文件提交记录 |
| `REFINE_AND_ENHANCE_QUALITY` | `false` | 启用质量优化 |
| `ENABLE_CODE_COMPRESSION` | `false` | 启用代码压缩 |
| `CATALOGUE_FORMAT` | `compact` | 目录格式：`compact`、`json`、`pathlist`、`unix` |

### 上下文压缩配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `AUTO_CONTEXT_COMPRESS_ENABLED` | `false` | 启用智能上下文压缩 |
| `AUTO_CONTEXT_COMPRESS_TOKEN_LIMIT` | `100000` | 触发压缩的 Token 阈值 |
| `AUTO_CONTEXT_COMPRESS_MAX_TOKEN_LIMIT` | `200000` | 最大允许 Token 限制 |

### JWT 认证配置

| 环境变量 | 配置文件路径 | 默认值 | 说明 |
|---------|-------------|--------|------|
| `JWT_SECRET_KEY` | `Jwt:SecretKey` | 内置默认值 | JWT 签名密钥（生产环境必须修改） |
| - | `Jwt:Issuer` | `OpenDeepWiki` | JWT 签发者 |
| - | `Jwt:Audience` | `OpenDeepWiki` | JWT 受众 |
| - | `Jwt:ExpirationMinutes` | `1440` | Token 过期时间（分钟） |

### MCP 协议配置

| 环境变量 | 说明 |
|---------|------|
| `MCP_STREAMABLE` | MCP Streamable 配置，格式：`serviceName=url,serviceName2=url2` |

**示例：**

```yaml
environment:
  - MCP_STREAMABLE=claude=http://localhost:8080/api/mcp,windsurf=http://localhost:8080/api/mcp
```

## 完整环境变量参考表

### 必需配置

| 变量名 | 说明 | 示例 |
|-------|------|------|
| `CHAT_API_KEY` | AI API Key | `sk-xxx` |
| `ENDPOINT` | AI 服务端点 | `https://api.openai.com/v1` |

### 推荐配置

| 变量名 | 说明 | 示例 |
|-------|------|------|
| `JWT_SECRET_KEY` | JWT 密钥（生产环境必改） | 随机字符串 |
| `DB_TYPE` | 数据库类型 | `sqlite`/`postgresql` |
| `CONNECTION_STRING` | 数据库连接字符串 | 见上文 |
| `WIKI_CATALOG_MODEL` | 目录生成模型 | `gpt-4o` |
| `WIKI_CONTENT_MODEL` | 内容生成模型 | `gpt-4o` |

### 可选配置

| 变量名 | 说明 | 默认值 |
|-------|------|--------|
| `WIKI_PARALLEL_COUNT` | 并行生成数 | `5` |
| `WIKI_LANGUAGES` | 支持语言 | `en,zh` |
| `TASK_MAX_SIZE_PER_USER` | 用户并行任务数 | `5` |
| `EnableSmartFilter` | 智能过滤 | `true` |
| `UPDATE_INTERVAL` | 更新间隔（天） | `5` |
| `MAX_FILE_LIMIT` | 文件大小限制（MB） | `100` |

## 配置文件示例

### appsettings.json

```json
{
  "Database": {
    "Type": "sqlite"
  },
  "ConnectionStrings": {
    "Default": "Data Source=opendeepwiki.db"
  },
  "Jwt": {
    "SecretKey": "your-secret-key-change-in-production",
    "Issuer": "OpenDeepWiki",
    "Audience": "OpenDeepWiki",
    "ExpirationMinutes": 1440
  },
  "AI": {
    "Endpoint": "https://api.openai.com/v1",
    "ApiKey": "your-api-key"
  },
  "WikiGenerator": {
    "CatalogModel": "gpt-4o",
    "ContentModel": "gpt-4o",
    "PromptsDirectory": "prompts",
    "MaxRetryAttempts": 3,
    "RetryDelayMs": 1000
  }
}
```

### Docker Compose 完整配置

```yaml
services:
  opendeepwiki:
    image: opendeepwiki:latest
    environment:
      # 数据库
      - DB_TYPE=postgresql
      - CONNECTION_STRING=Host=db;Database=opendeepwiki;Username=postgres;Password=secret
      
      # JWT
      - JWT_SECRET_KEY=your-production-secret-key
      
      # AI 全局配置
      - CHAT_API_KEY=sk-your-key
      - ENDPOINT=https://api.openai.com/v1
      
      # Wiki 生成
      - WIKI_CATALOG_MODEL=gpt-4o
      - WIKI_CONTENT_MODEL=gpt-4o
      - WIKI_PARALLEL_COUNT=5
      - WIKI_LANGUAGES=en,zh
      
      # 处理配置
      - TASK_MAX_SIZE_PER_USER=5
      - EnableSmartFilter=true
      - UPDATE_INTERVAL=5
    volumes:
      - opendeepwiki-repos:/app/repositories
      - opendeepwiki-data:/app/data
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=opendeepwiki
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  opendeepwiki-repos:
  opendeepwiki-data:
  postgres-data:
```

## 下一步

- [系统架构总览](../architecture/overview.md) - 了解系统设计
- [AI 代理系统](../ai/agent-system.md) - 深入了解 AI 配置
- [Docker 部署指南](../deployment/docker-deployment.md) - 生产环境部署
