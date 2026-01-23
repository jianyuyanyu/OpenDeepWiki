# Requirements Document

## Introduction

本功能实现仓库提交后的自动 Wiki 生成系统。当用户提交仓库时，系统将仓库状态设置为待处理，后台任务定时扫描待处理仓库，通过 AI 分析仓库内容并生成树形 Wiki 目录结构和文档内容，最终实现类似 DeepWiki 的效果。

## Glossary

- **Repository**: 用户提交的 Git 仓库实体
- **Repository_Status**: 仓库处理状态枚举（Pending/Processing/Completed/Failed）
- **Processing_Worker**: 后台定时任务服务，负责扫描和处理待处理仓库
- **Wiki_Catalog**: Wiki 目录结构，树形组织的文档目录
- **Catalog_Item**: 目录项，包含标题、路径、排序和子目录
- **Doc_Content**: 文档内容，Markdown 格式的 Wiki 页面
- **Repository_Analyzer**: 仓库分析器，负责克隆仓库并分析代码结构
- **Wiki_Generator**: Wiki 生成器，使用 AI 生成目录结构和文档内容
- **AI_Agent**: AI 代理，调用 LLM 进行内容生成
- **Catalog_Model**: 用于生成目录结构的 AI 模型配置
- **Content_Model**: 用于生成文档内容的 AI 模型配置
- **Model_Config**: AI 模型配置，包含 Endpoint、API Key、模型名称等
- **Catalog_Tool**: AI 工具，提供 Read/Write/Edit 方法操作目录结构
- **Git_Tool**: AI 工具，提供 Read/Grep 方法读取和搜索仓库代码
- **Doc_Tool**: AI 工具，提供 Write/Edit 方法操作文档内容
- **Working_Directory**: AI 工作目录，隐藏实际路径前缀，AI 只需使用相对路径
- **Prompt_Plugin**: 提示词插件系统，通过名称加载指定的系统提示词

## Requirements

### Requirement 1: Repository Submission Status

**User Story:** As a user, I want my submitted repository to have a pending status, so that the system can process it asynchronously.

#### Acceptance Criteria

1. WHEN a user submits a repository, THE Repository_Service SHALL set the repository status to Pending
2. WHEN a repository is submitted, THE Repository_Service SHALL create associated branch and language records
3. IF the repository URL is invalid, THEN THE Repository_Service SHALL return an error without creating records

### Requirement 2: Background Processing Worker

**User Story:** As a system administrator, I want a background worker to process pending repositories, so that wiki generation happens automatically.

#### Acceptance Criteria

1. WHILE the application is running, THE Processing_Worker SHALL poll for pending repositories at regular intervals
2. WHEN a pending repository is found, THE Processing_Worker SHALL update its status to Processing before starting work
3. WHEN processing completes successfully, THE Processing_Worker SHALL update the repository status to Completed
4. IF processing fails, THEN THE Processing_Worker SHALL update the repository status to Failed and log the error
5. WHEN multiple repositories are pending, THE Processing_Worker SHALL process them in order of creation time

### Requirement 3: Repository Analysis

**User Story:** As a system, I want to analyze repository structure and content, so that I can generate meaningful wiki documentation.

#### Acceptance Criteria

1. WHEN analyzing a repository, THE Repository_Analyzer SHALL clone the repository to a temporary directory
2. WHEN the repository is cloned, THE Repository_Analyzer SHALL extract the file tree structure
3. WHEN analyzing files, THE Repository_Analyzer SHALL identify key files (README, package.json, config files, source directories)
4. WHEN analysis completes, THE Repository_Analyzer SHALL produce a structured summary of the repository
5. IF cloning fails due to authentication, THEN THE Repository_Analyzer SHALL use provided credentials
6. IF cloning fails, THEN THE Repository_Analyzer SHALL throw an exception with descriptive error

### Requirement 4: Wiki Catalog Generation

**User Story:** As a user, I want the system to generate a hierarchical wiki structure, so that I can navigate documentation easily.

#### Acceptance Criteria

1. WHEN generating wiki catalog, THE Wiki_Generator SHALL use AI to analyze repository summary and create a tree structure
2. WHEN creating catalog items, THE Wiki_Generator SHALL include title, path, sort order, and optional children
3. WHEN generating catalog, THE Wiki_Generator SHALL create a logical hierarchy (Overview, Architecture, Components, etc.)
4. WHEN catalog is generated, THE Wiki_Generator SHALL persist catalog items to the database
5. THE Wiki_Generator SHALL generate catalog items with unique paths within a branch language

### Requirement 5: Document Content Generation

**User Story:** As a user, I want each wiki page to have meaningful content, so that I can understand the repository.

#### Acceptance Criteria

1. WHEN generating document content, THE Wiki_Generator SHALL use AI to create Markdown content for each catalog item
2. WHEN creating content, THE Wiki_Generator SHALL reference relevant source files from the repository
3. WHEN generating content, THE Wiki_Generator SHALL include code examples where appropriate
4. WHEN content is generated, THE Wiki_Generator SHALL persist document files to the database
5. WHEN generating content, THE Wiki_Generator SHALL link catalog items to their corresponding document files

### Requirement 6: Wiki Catalog Serialization

**User Story:** As a developer, I want to serialize and deserialize wiki catalogs, so that I can store and retrieve them reliably.

#### Acceptance Criteria

1. WHEN storing wiki catalog, THE Wiki_Generator SHALL serialize the tree structure to JSON format
2. WHEN retrieving wiki catalog, THE Wiki_Generator SHALL deserialize JSON back to tree structure
3. FOR ALL valid Catalog_Item trees, serializing then deserializing SHALL produce an equivalent structure (round-trip property)

### Requirement 7: Error Handling and Recovery

**User Story:** As a system administrator, I want robust error handling, so that failures don't corrupt data or block processing.

#### Acceptance Criteria

1. IF AI generation fails, THEN THE Wiki_Generator SHALL retry up to 3 times before marking as failed
2. IF a repository processing fails, THEN THE Processing_Worker SHALL continue with the next pending repository
3. WHEN an error occurs, THE Processing_Worker SHALL log detailed error information
4. IF temporary files are created, THEN THE Repository_Analyzer SHALL clean them up after processing

### Requirement 8: Wiki Content Retrieval API

**User Story:** As a frontend developer, I want APIs to retrieve wiki content, so that I can display it in the UI.

#### Acceptance Criteria

1. WHEN requesting wiki catalog, THE API SHALL return the tree structure for a given repository and branch
2. WHEN requesting document content, THE API SHALL return the Markdown content for a given catalog path
3. IF the requested path does not exist, THEN THE API SHALL return a 404 error
4. WHEN returning catalog, THE API SHALL include document metadata (title, path, has children)

### Requirement 9: Repository List with Status Display

**User Story:** As a user, I want to see my submitted repositories with their processing status, so that I can track the wiki generation progress.

#### Acceptance Criteria

1. WHEN requesting repository list, THE API SHALL return repositories with their current status
2. WHEN displaying repository list, THE Frontend SHALL show status indicators (Pending, Processing, Completed, Failed)
3. WHEN a repository status is Pending, THE Frontend SHALL display a waiting indicator
4. WHEN a repository status is Processing, THE Frontend SHALL display a progress indicator
5. WHEN a repository status is Completed, THE Frontend SHALL provide a link to view the generated wiki
6. WHEN a repository status is Failed, THE Frontend SHALL display an error indicator with retry option

### Requirement 10: Repository Submission Form

**User Story:** As a user, I want to submit a repository through a form, so that I can add repositories for wiki generation.

#### Acceptance Criteria

1. WHEN submitting a repository, THE Frontend SHALL provide a form with Git URL, branch name, and language selection
2. WHEN the form is submitted, THE Frontend SHALL call the repository submission API
3. WHEN submission succeeds, THE Frontend SHALL add the new repository to the list with Pending status
4. IF submission fails, THEN THE Frontend SHALL display an error message
5. WHEN a repository is submitted, THE Frontend SHALL validate the Git URL format before submission

### Requirement 11: AI Model Configuration

**User Story:** As a system administrator, I want to configure different AI models for catalog and content generation, so that I can optimize cost and quality.

#### Acceptance Criteria

1. THE System SHALL support separate model configurations for catalog generation and content generation
2. WHEN configuring models, THE System SHALL allow setting Endpoint, API Key, and model name for each purpose
3. WHEN generating wiki catalog, THE Wiki_Generator SHALL use the configured Catalog_Model
4. WHEN generating document content, THE Wiki_Generator SHALL use the configured Content_Model
5. IF model configuration is missing, THEN THE System SHALL fall back to default model settings
6. THE System SHALL read model configurations from environment variables or configuration files

### Requirement 12: AI Tool - Catalog Operations

**User Story:** As an AI agent, I want tools to read, write, and edit wiki catalog structure, so that I can build the wiki incrementally.

#### Acceptance Criteria

1. THE Catalog_Tool SHALL provide a Read method to retrieve current catalog structure as JSON
2. THE Catalog_Tool SHALL provide a Write method to store complete catalog structure from JSON
3. THE Catalog_Tool SHALL provide an Edit method to modify specific parts of the catalog
4. WHEN Write is called, THE Catalog_Tool SHALL validate JSON structure before storing
5. WHEN Edit is called, THE Catalog_Tool SHALL merge changes with existing catalog structure

### Requirement 13: AI Tool - Git Repository Operations

**User Story:** As an AI agent, I want tools to read and search repository code, so that I can analyze the codebase.

#### Acceptance Criteria

1. THE Git_Tool SHALL provide a Read method to read file content by relative path
2. THE Git_Tool SHALL provide a Grep method to search for patterns in repository files
3. WHEN Read is called with relative path, THE Git_Tool SHALL resolve it against the Working_Directory
4. WHEN Grep is called, THE Git_Tool SHALL return matching file paths and line content
5. THE Git_Tool SHALL hide the actual file system path from the AI agent
6. WHEN AI requests "README.md", THE Git_Tool SHALL read from "{Working_Directory}/README.md"

### Requirement 14: AI Tool - Document Operations

**User Story:** As an AI agent, I want tools to write and edit document content, so that I can generate wiki pages.

#### Acceptance Criteria

1. THE Doc_Tool SHALL provide a Write method to create document content for a catalog path
2. THE Doc_Tool SHALL provide an Edit method to modify existing document content
3. WHEN Write is called, THE Doc_Tool SHALL associate the content with the specified catalog item
4. WHEN Edit is called, THE Doc_Tool SHALL update the existing document content
5. THE Doc_Tool SHALL store document content in Markdown format

### Requirement 15: Prompt Plugin System

**User Story:** As a system administrator, I want to manage AI prompts through a plugin system, so that I can customize agent behavior.

#### Acceptance Criteria

1. THE Prompt_Plugin SHALL load system prompts by name from a configured location
2. WHEN creating a catalog generation agent, THE System SHALL load the "catalog-generator" prompt
3. WHEN creating a content generation agent, THE System SHALL load the "content-generator" prompt
4. THE Prompt_Plugin SHALL support prompt templates with variable substitution
5. IF a prompt is not found, THEN THE Prompt_Plugin SHALL throw a descriptive error

### Requirement 16: Repository Cloning and Working Directory

**User Story:** As a system, I want to clone repositories and set up working directories, so that AI agents can access code.

#### Acceptance Criteria

1. WHEN processing a repository, THE Repository_Analyzer SHALL clone it to a structured path
2. THE Repository_Analyzer SHALL organize clones as "/data/{organization}/{name}/tree/"
3. WHEN creating AI tools, THE System SHALL set Working_Directory to the clone path
4. WHEN processing completes, THE Repository_Analyzer SHALL optionally clean up the clone directory
5. IF the repository already exists locally, THEN THE Repository_Analyzer SHALL pull latest changes

### Requirement 17: Commit ID Tracking

**User Story:** As a system, I want to track the commit ID when processing a repository, so that I can perform incremental updates.

#### Acceptance Criteria

1. WHEN cloning or pulling a repository, THE Repository_Analyzer SHALL record the current HEAD commit ID
2. WHEN processing completes, THE System SHALL persist the commit ID to the RepositoryBranch record
3. WHEN updating a repository, THE System SHALL compare the new commit ID with the stored one
4. IF the commit ID has changed, THEN THE System SHALL identify changed files between commits
5. WHEN performing incremental update, THE Wiki_Generator SHALL only regenerate documents for changed files
6. THE System SHALL store the last processed commit ID for each branch
