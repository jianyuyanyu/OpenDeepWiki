# Admin Management System - 技术方案

## 1. 项目概述

### 1.1 目标
为 OpenDeepWiki 创建完整的管理员后台管理系统，提供系统监控、资源管理和配置功能。

### 1.2 功能范围
- 统计数据仪表盘（仓库统计、Token 消耗）
- 全局仓库管理
- 仓库生成工具配置（MCPs、Skills、模型配置）
- 角色管理
- 用户管理
- 系统设置

## 2. 技术架构

### 2.1 后端架构

```
src/OpenDeepWiki/
├── Endpoints/
│   └── Admin/
│       ├── AdminEndpoints.cs          # 管理端路由注册
│       ├── AdminStatisticsEndpoints.cs
│       ├── AdminRepositoryEndpoints.cs
│       ├── AdminUserEndpoints.cs
│       ├── AdminRoleEndpoints.cs
│       ├── AdminToolsEndpoints.cs     # MCPs/Skills/Models
│       └── AdminSettingsEndpoints.cs
├── Services/
│   └── Admin/
│       ├── IAdminStatisticsService.cs
│       ├── AdminStatisticsService.cs
│       ├── IAdminRepositoryService.cs
│       ├── AdminRepositoryService.cs
│       ├── IAdminUserService.cs
│       ├── AdminUserService.cs
│       ├── IAdminRoleService.cs
│       ├── AdminRoleService.cs
│       ├── IAdminToolsService.cs
│       ├── AdminToolsService.cs
│       ├── IAdminSettingsService.cs
│       └── AdminSettingsService.cs
└── Models/
    └── Admin/
        ├── StatisticsResponse.cs
        ├── AdminRepositoryDto.cs
        ├── AdminUserDto.cs
        ├── AdminRoleDto.cs
        ├── McpConfigDto.cs
        ├── SkillConfigDto.cs
        ├── ModelConfigDto.cs
        └── SystemSettingDto.cs
```

### 2.2 前端架构

```
web/app/admin/
├── layout.tsx                    # 管理端布局（侧边栏+权限检查）
├── page.tsx                      # 仪表盘首页
├── repositories/
│   └── page.tsx                  # 仓库管理
├── tools/
│   ├── mcps/page.tsx            # MCPs 管理
│   ├── skills/page.tsx          # Skills 管理
│   └── models/page.tsx          # 模型配置
├── roles/
│   └── page.tsx                  # 角色管理
├── users/
│   └── page.tsx                  # 用户管理
└── settings/
    └── page.tsx                  # 系统设置

web/components/admin/
├── admin-sidebar.tsx             # 管理端侧边栏
├── admin-guard.tsx               # 权限守卫组件
├── statistics/
│   ├── repository-chart.tsx      # 仓库统计图表
│   └── token-usage-chart.tsx     # Token 消耗图表
├── repositories/
│   ├── repository-table.tsx
│   └── repository-dialog.tsx
├── users/
│   ├── user-table.tsx
│   └── user-dialog.tsx
├── roles/
│   ├── role-table.tsx
│   └── role-dialog.tsx
└── tools/
    ├── mcp-config-form.tsx
    ├── skill-config-form.tsx
    └── model-config-form.tsx

web/lib/
└── admin-api.ts                  # 管理端 API 客户端
```

## 3. 数据库设计

### 3.1 新增实体

#### TokenUsage（Token 消耗记录）
```csharp
public class TokenUsage : AggregateRoot<string>
{
    public string? RepositoryId { get; set; }
    public string? UserId { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public string? ModelName { get; set; }
    public string? Operation { get; set; }  // catalog, content, etc.
    public DateTime RecordedAt { get; set; }
}
```

#### McpConfig（MCP 配置）
```csharp
public class McpConfig : AggregateRoot<string>
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public string ServerUrl { get; set; }
    public string? ApiKey { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
```

#### SkillConfig（Skill 配置）
```csharp
public class SkillConfig : AggregateRoot<string>
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public string PromptTemplate { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
```

#### ModelConfig（模型配置）
```csharp
public class ModelConfig : AggregateRoot<string>
{
    public string Name { get; set; }
    public string Provider { get; set; }  // OpenAI, Anthropic, etc.
    public string ModelId { get; set; }
    public string? Endpoint { get; set; }
    public string? ApiKey { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
}
```

#### SystemSetting（系统设置）
```csharp
public class SystemSetting : AggregateRoot<string>
{
    public string Key { get; set; }
    public string? Value { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; }  // general, ai, security, etc.
}
```

## 4. API 设计

### 4.1 路由结构

所有管理端 API 使用 `/api/admin` 前缀，需要 Admin 角色授权。

```
/api/admin/statistics
  GET /dashboard          # 获取仪表盘统计数据
  GET /token-usage        # 获取 Token 消耗统计

/api/admin/repositories
  GET /                   # 获取仓库列表（分页）
  GET /{id}              # 获取仓库详情
  PUT /{id}              # 更新仓库
  DELETE /{id}           # 删除仓库
  PUT /{id}/status       # 更新仓库状态

/api/admin/users
  GET /                   # 获取用户列表（分页）
  GET /{id}              # 获取用户详情
  POST /                  # 创建用户
  PUT /{id}              # 更新用户
  DELETE /{id}           # 删除用户
  PUT /{id}/status       # 更新用户状态
  PUT /{id}/roles        # 更新用户角色
  POST /{id}/reset-password  # 重置密码

/api/admin/roles
  GET /                   # 获取角色列表
  GET /{id}              # 获取角色详情
  POST /                  # 创建角色
  PUT /{id}              # 更新角色
  DELETE /{id}           # 删除角色

/api/admin/tools/mcps
  GET /                   # 获取 MCP 配置列表
  POST /                  # 创建 MCP 配置
  PUT /{id}              # 更新 MCP 配置
  DELETE /{id}           # 删除 MCP 配置

/api/admin/tools/skills
  GET /                   # 获取 Skill 配置列表
  POST /                  # 创建 Skill 配置
  PUT /{id}              # 更新 Skill 配置
  DELETE /{id}           # 删除 Skill 配置

/api/admin/tools/models
  GET /                   # 获取模型配置列表
  POST /                  # 创建模型配置
  PUT /{id}              # 更新模型配置
  DELETE /{id}           # 删除模型配置

/api/admin/settings
  GET /                   # 获取系统设置
  PUT /                   # 更新系统设置
```

### 4.2 授权策略

在 `Program.cs` 中添加 Admin 授权策略：

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
});
```

在 Endpoint 中应用：

```csharp
var adminGroup = app.MapGroup("/api/admin")
    .RequireAuthorization("AdminOnly")
    .WithTags("管理端");
```

## 5. 前端实现

### 5.1 权限检查

在 `auth-context.tsx` 中添加角色检查方法：

```typescript
// 在 UserInfo 接口中已有 roles: string[]
// 添加辅助方法
export function useAuth() {
  // ... existing code
  const isAdmin = user?.roles?.includes("Admin") ?? false;
  return { ..., isAdmin };
}
```

### 5.2 Header 组件更新

在用户下拉菜单中添加管理入口：

```tsx
{isAdmin && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => router.push("/admin")}>
      {t("common.adminPanel")}
    </DropdownMenuItem>
  </>
)}
```

### 5.3 Admin 布局

```tsx
// web/app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) return <Loading />;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

### 5.4 图表库选择

使用 `recharts` 库实现统计图表：

```bash
cd web && npm install recharts
```

## 6. 统计数据实现

### 6.1 仪表盘统计查询

```csharp
public class DashboardStatistics
{
    public List<DailyStatistic> RepositoryStats { get; set; }
    public List<DailyStatistic> UserStats { get; set; }
    public List<TokenUsageStatistic> TokenStats { get; set; }
}

public class DailyStatistic
{
    public DateTime Date { get; set; }
    public int ProcessedCount { get; set; }
    public int SubmittedCount { get; set; }
    public int NewUserCount { get; set; }
}

public class TokenUsageStatistic
{
    public DateTime Date { get; set; }
    public long InputTokens { get; set; }
    public long OutputTokens { get; set; }
    public long TotalTokens { get; set; }
}
```

### 6.2 Token 消耗记录集成

在 `WikiGenerator` 中添加 Token 消耗记录：

```csharp
// 在 AI 调用完成后记录
await _tokenUsageService.RecordUsageAsync(new TokenUsage
{
    RepositoryId = repositoryId,
    UserId = userId,
    InputTokens = response.Usage.InputTokens,
    OutputTokens = response.Usage.OutputTokens,
    ModelName = modelName,
    Operation = "catalog",
    RecordedAt = DateTime.UtcNow
});
```

## 7. 管理端侧边栏导航

```tsx
// web/components/admin/admin-sidebar.tsx
const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "仪表盘" },
  { href: "/admin/repositories", icon: GitBranch, label: "仓库管理" },
  {
    label: "工具配置",
    icon: Settings,
    children: [
      { href: "/admin/tools/mcps", label: "MCPs 管理" },
      { href: "/admin/tools/skills", label: "Skills 管理" },
      { href: "/admin/tools/models", label: "模型配置" },
    ]
  },
  { href: "/admin/roles", icon: Shield, label: "角色管理" },
  { href: "/admin/users", icon: Users, label: "用户管理" },
  { href: "/admin/settings", icon: Cog, label: "系统设置" },
];
```

## 8. 国际化支持

在 `web/messages/` 中添加管理端翻译：

```json
{
  "admin": {
    "dashboard": "仪表盘",
    "repositories": "仓库管理",
    "tools": "工具配置",
    "mcps": "MCPs 管理",
    "skills": "Skills 管理",
    "models": "模型配置",
    "roles": "角色管理",
    "users": "用户管理",
    "settings": "系统设置"
  }
}
```

## 9. 实施顺序

1. **Phase 1**: 基础架构（API 路由、授权策略、前端布局）
2. **Phase 2**: 统计数据模块（仪表盘、图表）
3. **Phase 3**: 仓库管理模块
4. **Phase 4**: 工具配置模块（MCPs、Skills、模型）
5. **Phase 5**: 角色管理模块
6. **Phase 6**: 用户管理模块
7. **Phase 7**: 系统设置模块

## 10. 注意事项

- 系统角色（Admin、User）不可删除
- Token 消耗记录需要在 WikiGenerator 中集成
- 敏感配置（API Key）需要加密存储
- 管理端操作需要记录审计日志
