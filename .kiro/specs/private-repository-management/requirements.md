# 需求文档

## 简介

私有仓库管理功能允许用户在私有仓库页面查看、管理其提交的所有仓库。用户可以切换仓库的可见性（公开/私有），并快速导航到仓库的Wiki文档页面。该功能增强了用户对其仓库的控制能力，同时确保安全性约束（无密码的仓库不能设为私有）。

## 术语表

- **Repository（仓库）**: 用户提交的Git代码仓库实体
- **Visibility_Toggle（可见性切换器）**: 用于切换仓库公开/私有状态的UI组件
- **AuthPassword（认证密码）**: 仓库的访问密码，用于私有Git仓库的认证
- **IsPublic（是否公开）**: 布尔值，表示仓库是否对所有用户可见
- **Private_Repository_Page（私有仓库页面）**: 用户管理其私有仓库的页面
- **Wiki_Page（Wiki页面）**: 仓库生成的文档页面，路径格式为 `/{orgName}/{repoName}`
- **Visibility_API（可见性API）**: 后端API端点，用于更新仓库的可见性状态

## 需求

### 需求 1：仓库列表展示

**用户故事：** 作为用户，我希望在私有仓库页面看到我提交的所有仓库列表，以便我能够管理和查看我的仓库状态。

#### 验收标准

1. WHEN 用户访问私有仓库页面 THEN Private_Repository_Page SHALL 显示当前用户提交的所有仓库列表
2. WHEN 仓库列表加载中 THEN Private_Repository_Page SHALL 显示加载骨架屏
3. WHEN 仓库列表加载失败 THEN Private_Repository_Page SHALL 显示错误信息和重试按钮
4. WHEN 用户没有任何仓库 THEN Private_Repository_Page SHALL 显示空状态提示信息
5. THE Repository 列表项 SHALL 显示仓库名称、组织名、Git地址、状态和可见性图标

### 需求 2：仓库可见性切换

**用户故事：** 作为用户，我希望能够切换仓库的可见性（公开/私有），以便我能够控制谁可以看到我的仓库文档。

#### 验收标准

1. WHEN 用户点击可见性切换按钮 THEN Visibility_Toggle SHALL 发送请求到 Visibility_API 更新仓库状态
2. WHEN 可见性更新成功 THEN Private_Repository_Page SHALL 显示成功提示并更新UI状态
3. WHEN 可见性更新失败 THEN Private_Repository_Page SHALL 显示错误提示并保持原状态
4. WHILE 可见性更新请求进行中 THEN Visibility_Toggle SHALL 显示加载状态并禁用交互

### 需求 3：无密码仓库私有化限制

**用户故事：** 作为用户，我应该无法将没有设置密码的仓库设为私有，以确保私有仓库的安全性。

#### 验收标准

1. WHEN 仓库的 AuthPassword 为空或null THEN Visibility_Toggle SHALL 禁用"设为私有"选项
2. WHEN 用户尝试将无密码仓库设为私有 THEN Visibility_API SHALL 返回验证错误
3. WHEN 仓库无法设为私有 THEN Private_Repository_Page SHALL 显示提示说明原因
4. IF 用户通过API直接尝试将无密码仓库设为私有 THEN Visibility_API SHALL 拒绝请求并返回400错误

### 需求 4：仓库Wiki导航

**用户故事：** 作为用户，我希望能够点击仓库直接跳转到其Wiki文档页面，以便我能够快速查看仓库的文档内容。

#### 验收标准

1. WHEN 仓库状态为"Completed" THEN Repository 列表项 SHALL 显示可点击的"查看Wiki"按钮
2. WHEN 用户点击"查看Wiki"按钮 THEN Private_Repository_Page SHALL 导航到 `/{orgName}/{repoName}` 路径
3. WHEN 仓库状态不是"Completed" THEN Repository 列表项 SHALL 不显示"查看Wiki"按钮
4. THE Wiki导航链接 SHALL 使用正确的URL编码处理特殊字符

### 需求 5：后端可见性更新API

**用户故事：** 作为系统，我需要提供API端点来更新仓库的可见性状态，以支持前端的可见性切换功能。

#### 验收标准

1. THE Visibility_API SHALL 接受仓库ID和目标可见性状态作为参数
2. WHEN 请求更新可见性 THEN Visibility_API SHALL 验证请求用户是否为仓库所有者
3. WHEN 目标状态为私有且仓库无密码 THEN Visibility_API SHALL 返回验证错误
4. WHEN 验证通过 THEN Visibility_API SHALL 更新数据库中的 IsPublic 字段
5. WHEN 更新成功 THEN Visibility_API SHALL 返回更新后的仓库信息
6. FOR ALL 可见性更新请求，序列化后再反序列化 SHALL 产生等价的请求对象（往返一致性）
