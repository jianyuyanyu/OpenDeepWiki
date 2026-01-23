# 认证系统使用指南

## 概述

OpenDeepWiki 支持以下认证方式：
- JWT 本地认证（邮箱+密码）
- GitHub OAuth 登录
- Gitee OAuth 登录

## 配置

### 1. JWT 配置

在 `appsettings.json` 中配置 JWT 参数：

```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-at-least-32-characters-long",
    "Issuer": "OpenDeepWiki",
    "Audience": "OpenDeepWiki",
    "ExpirationMinutes": 1440
  }
}
```

或通过环境变量配置：
```bash
export JWT_SECRET_KEY="your-secret-key"
```

### 2. GitHub OAuth 配置

1. 在 GitHub 创建 OAuth App：
   - 访问 https://github.com/settings/developers
   - 点击 "New OAuth App"
   - 填写信息：
     - Application name: OpenDeepWiki
     - Homepage URL: http://localhost:5000
     - Authorization callback URL: http://localhost:5000/api/oauth/github/callback
   - 获取 Client ID 和 Client Secret

2. 在数据库中更新 GitHub OAuth 提供商配置：
   ```sql
   UPDATE OAuthProviders 
   SET ClientId = 'your-github-client-id',
       ClientSecret = 'your-github-client-secret',
       IsActive = 1
   WHERE Name = 'github';
   ```

### 3. Gitee OAuth 配置

1. 在 Gitee 创建第三方应用：
   - 访问 https://gitee.com/oauth/applications
   - 点击 "创建应用"
   - 填写信息：
     - 应用名称: OpenDeepWiki
     - 应用主页: http://localhost:5000
     - 应用回调地址: http://localhost:5000/api/oauth/gitee/callback
     - 权限: user_info, emails
   - 获取 Client ID 和 Client Secret

2. 在数据库中更新 Gitee OAuth 提供商配置：
   ```sql
   UPDATE OAuthProviders 
   SET ClientId = 'your-gitee-client-id',
       ClientSecret = 'your-gitee-client-secret',
       IsActive = 1
   WHERE Name = 'gitee';
   ```

## API 端点

### 认证端点

#### 1. 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "user-id",
      "name": "张三",
      "email": "zhangsan@example.com",
      "avatar": null,
      "roles": ["User"]
    }
  }
}
```

#### 2. 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

响应格式同注册接口。

#### 3. 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer {token}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "张三",
    "email": "zhangsan@example.com",
    "avatar": null,
    "roles": ["User"]
  }
}
```

### OAuth 端点

#### 1. 获取 OAuth 授权 URL
```http
GET /api/oauth/{provider}/authorize?state=random-state
```

支持的 provider: `github`, `gitee`

响应：
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://github.com/login/oauth/authorize?client_id=..."
  }
}
```

#### 2. OAuth 回调处理
```http
GET /api/oauth/{provider}/callback?code=xxx&state=xxx
```

此端点由 OAuth 提供商自动调用，返回登录响应。

#### 3. 快捷登录（重定向）
```http
GET /api/oauth/github/login
GET /api/oauth/gitee/login
```

直接重定向到 OAuth 提供商的授权页面。

## 使用流程

### 本地认证流程

1. 用户注册：
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "张三",
       "email": "zhangsan@example.com",
       "password": "password123",
       "confirmPassword": "password123"
     }'
   ```

2. 用户登录：
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "zhangsan@example.com",
       "password": "password123"
     }'
   ```

3. 使用 Token 访问受保护的资源：
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer {your-token}"
   ```

### OAuth 认证流程

#### 前端集成示例

```javascript
// 1. 获取授权 URL
async function loginWithGitHub() {
  const response = await fetch('/api/oauth/github/authorize');
  const data = await response.json();
  
  // 重定向到 GitHub 授权页面
  window.location.href = data.data.authorizationUrl;
}

// 2. 处理回调（在回调页面）
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  const response = await fetch(`/api/oauth/github/callback?code=${code}&state=${state}`);
  const data = await response.json();
  
  if (data.success) {
    // 保存 token
    localStorage.setItem('token', data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    
    // 跳转到主页
    window.location.href = '/';
  }
}
```

#### 或使用快捷方式

```html
<a href="/api/oauth/github/login">使用 GitHub 登录</a>
<a href="/api/oauth/gitee/login">使用 Gitee 登录</a>
```

## 安全建议

1. **生产环境必须修改 JWT 密钥**：使用至少 32 字符的强随机密钥
2. **使用 HTTPS**：生产环境必须启用 HTTPS
3. **配置 CORS**：限制允许的来源域名
4. **Token 存储**：前端使用 httpOnly cookie 或安全的本地存储
5. **密钥管理**：使用环境变量或密钥管理服务存储敏感信息
6. **回调 URL**：确保 OAuth 回调 URL 与配置的完全一致

## 数据库表结构

系统使用以下表存储认证相关数据：

- `Users`: 用户表
- `Roles`: 角色表
- `UserRoles`: 用户角色关联表
- `OAuthProviders`: OAuth 提供商配置表
- `UserOAuths`: 用户 OAuth 绑定表

## 故障排查

### 常见问题

1. **JWT 验证失败**
   - 检查密钥配置是否正确
   - 确认 Token 未过期
   - 验证 Issuer 和 Audience 配置

2. **OAuth 回调失败**
   - 确认回调 URL 配置正确
   - 检查 Client ID 和 Secret 是否正确
   - 验证 OAuth 提供商是否已启用（IsActive = true）

3. **用户无法登录**
   - 检查用户状态（Status = 1 表示正常）
   - 确认密码是否正确
   - 查看数据库日志

## 扩展

### 添加新的 OAuth 提供商

1. 在数据库中添加新的 OAuth 提供商配置
2. 配置相应的授权、令牌和用户信息端点
3. 根据需要调整用户信息映射配置

### 自定义角色和权限

系统默认提供 `Admin` 和 `User` 两个角色，可以：
1. 在数据库中添加新角色
2. 在 API 端点上使用 `[Authorize(Roles = "Admin")]` 限制访问
3. 实现自定义的权限检查逻辑
