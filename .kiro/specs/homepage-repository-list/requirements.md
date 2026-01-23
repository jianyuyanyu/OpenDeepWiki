# Requirements Document

## Introduction

本功能为 OpenDeepWiki 首页添加公开仓库列表展示，支持搜索和滚动交互效果。用户可以在首页底部浏览系统中所有公开的仓库，通过搜索快速定位目标仓库，并点击进入仓库详情页面。

## Glossary

- **Homepage**: 首页组件，位于 `web/app/(main)/page.tsx`
- **Public_Repository_List**: 公开仓库列表组件，展示所有 `isPublic=true` 的仓库
- **Main_Search_Box**: 首页中央的主搜索框，用于搜索仓库名称
- **Header_Search_Box**: 滚动后显示在右上角的小型搜索框
- **Repository_Card**: 仓库卡片组件，展示单个仓库信息
- **Repository_API**: 仓库列表 API，位于 `web/lib/repository-api.ts`

## Requirements

### Requirement 1: 公开仓库列表展示

**User Story:** As a visitor, I want to see all public repositories on the homepage, so that I can discover and explore available documentation.

#### Acceptance Criteria

1. WHEN the homepage loads, THE Public_Repository_List SHALL fetch and display all repositories where `isPublic=true`
2. WHEN repositories are displayed, THE Public_Repository_List SHALL sort them by creation date in descending order (newest first)
3. WHEN a repository is displayed, THE Repository_Card SHALL show the repository name (`orgName/repoName`), status, and creation date
4. WHEN a user clicks on a Repository_Card, THE Homepage SHALL navigate to `/{orgName}/{repoName}`
5. WHEN no public repositories exist, THE Public_Repository_List SHALL display an appropriate empty state message

### Requirement 2: 仓库搜索功能

**User Story:** As a visitor, I want to search repositories by name, so that I can quickly find the documentation I need.

#### Acceptance Criteria

1. WHEN a user types in the Main_Search_Box, THE Public_Repository_List SHALL filter repositories by matching the search term against `orgName` or `repoName`
2. WHEN the search term is empty, THE Public_Repository_List SHALL display all public repositories
3. WHEN no repositories match the search term, THE Public_Repository_List SHALL display a "no results" message
4. THE Repository_API SHALL support a `keyword` parameter for server-side search filtering
5. WHEN a user types in the Header_Search_Box, THE Public_Repository_List SHALL apply the same filtering behavior as the Main_Search_Box

### Requirement 3: 滚动交互效果

**User Story:** As a visitor, I want a smooth scrolling experience with adaptive search UI, so that I can efficiently browse and search repositories.

#### Acceptance Criteria

1. WHEN the page is at the top position, THE Main_Search_Box SHALL be visible and centered on the page
2. WHEN the user scrolls down past a threshold, THE Main_Search_Box SHALL transition to hidden with a fade-out animation
3. WHEN the Main_Search_Box becomes hidden, THE Header_Search_Box SHALL appear in the header with a fade-in animation
4. WHEN the user scrolls back to the top, THE Header_Search_Box SHALL transition to hidden and THE Main_Search_Box SHALL reappear
5. THE scroll transitions SHALL use smooth animations (CSS transitions or framer-motion) with duration between 200-300ms

### Requirement 4: API 扩展

**User Story:** As a developer, I want the repository API to support search and sorting parameters, so that the frontend can efficiently query repositories.

#### Acceptance Criteria

1. THE Repository_API `fetchRepositoryList` function SHALL accept a `keyword` parameter for search filtering
2. THE Repository_API `fetchRepositoryList` function SHALL accept a `sortBy` parameter with value `createdAt`
3. THE Repository_API `fetchRepositoryList` function SHALL accept a `sortOrder` parameter with values `asc` or `desc`
4. THE Repository_API `fetchRepositoryList` function SHALL accept an `isPublic` parameter to filter by visibility
5. WHEN the API is called with `isPublic=true`, THE Repository_API SHALL return only public repositories

### Requirement 5: 响应式布局

**User Story:** As a visitor on different devices, I want the repository list to display properly, so that I can browse repositories on any screen size.

#### Acceptance Criteria

1. WHEN viewed on desktop (width >= 1024px), THE Public_Repository_List SHALL display repositories in a grid layout with 3 columns
2. WHEN viewed on tablet (width >= 768px and < 1024px), THE Public_Repository_List SHALL display repositories in a grid layout with 2 columns
3. WHEN viewed on mobile (width < 768px), THE Public_Repository_List SHALL display repositories in a single column layout
4. THE Header_Search_Box SHALL be appropriately sized for the header area without disrupting other header elements
