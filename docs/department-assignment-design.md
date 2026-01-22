# 部门与仓库指派设计

> 说明：本文件为需求与设计草案。

## 部门模型

- 层级部门结构，支持父子关系。
- 字段建议：
  - `Name`
  - `ParentId`
  - `Description`
  - `SortOrder`
  - `IsActive`

## 仓库指派模型

- 指派记录同时包含部门与负责人：
  - `RepositoryId`
  - `DepartmentId`
  - `AssigneeUserId`

## 可见性规则

- 仅基于 `Repository.IsPublic` 控制访问。
- 私有仓库仅在用户提供凭据时允许设置。

## 关联关系

- Department 自引用父子结构。
- Repository 与 Department/User 通过 RepositoryAssignment 关联。

## 备注

- 仓库凭据采用明文保存（按当前需求）。
