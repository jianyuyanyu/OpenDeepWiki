# Requirements Document

## Introduction

本功能为 OpenDeepWiki 平台添加仓库收藏和订阅功能。用户可以在仓库详情页对感兴趣的仓库进行收藏和订阅操作，并在收藏列表页面管理已收藏的仓库。收藏和订阅功能使用原子性计数器更新，确保数据一致性。

## Glossary

- **Bookmark_Service**: 处理用户收藏仓库相关业务逻辑的服务组件
- **Subscription_Service**: 处理用户订阅仓库相关业务逻辑的服务组件
- **User_Bookmark**: 用户与仓库之间的收藏关联实体
- **User_Subscription**: 用户与仓库之间的订阅关联实体
- **Repository**: 仓库实体，包含收藏数、订阅数、浏览数等统计字段
- **Atomic_Update**: 使用数据库原子操作更新计数器，避免并发问题

## Requirements

### Requirement 1: 仓库实体扩展

**User Story:** As a developer, I want the Repository entity to include bookmark, subscription, and view count fields, so that the system can track user engagement metrics.

#### Acceptance Criteria

1. THE Repository entity SHALL include a BookmarkCount field of type integer with default value 0
2. THE Repository entity SHALL include a SubscriptionCount field of type integer with default value 0
3. THE Repository entity SHALL include a ViewCount field of type integer with default value 0
4. THE Repository entity SHALL ensure all count fields are non-negative

### Requirement 2: 用户收藏实体

**User Story:** As a developer, I want a UserBookmark entity to track the relationship between users and their bookmarked repositories, so that the system can manage bookmark data.

#### Acceptance Criteria

1. THE User_Bookmark entity SHALL include UserId field referencing the User entity
2. THE User_Bookmark entity SHALL include RepositoryId field referencing the Repository entity
3. THE User_Bookmark entity SHALL include CreatedAt timestamp field
4. THE User_Bookmark entity SHALL enforce unique constraint on UserId and RepositoryId combination
5. WHEN a User_Bookmark record is created THEN the Bookmark_Service SHALL validate that both User and Repository exist

### Requirement 3: 用户订阅实体

**User Story:** As a developer, I want a UserSubscription entity to track the relationship between users and their subscribed repositories, so that the system can manage subscription data.

#### Acceptance Criteria

1. THE User_Subscription entity SHALL include UserId field referencing the User entity
2. THE User_Subscription entity SHALL include RepositoryId field referencing the Repository entity
3. THE User_Subscription entity SHALL include CreatedAt timestamp field
4. THE User_Subscription entity SHALL enforce unique constraint on UserId and RepositoryId combination
5. WHEN a User_Subscription record is created THEN the Subscription_Service SHALL validate that both User and Repository exist

### Requirement 4: 收藏仓库功能

**User Story:** As a user, I want to bookmark repositories from the repository detail page, so that I can quickly access my favorite repositories later.

#### Acceptance Criteria

1. WHEN a user bookmarks a repository THEN the Bookmark_Service SHALL create a User_Bookmark record
2. WHEN a user bookmarks a repository THEN the Bookmark_Service SHALL atomically increment the Repository BookmarkCount by 1
3. WHEN a user attempts to bookmark an already bookmarked repository THEN the Bookmark_Service SHALL return an error indicating duplicate bookmark
4. WHEN a user bookmarks a non-existent repository THEN the Bookmark_Service SHALL return a not found error
5. WHEN a bookmark operation fails THEN the Bookmark_Service SHALL not modify the BookmarkCount

### Requirement 5: 取消收藏功能

**User Story:** As a user, I want to remove bookmarks from repositories, so that I can manage my bookmark list.

#### Acceptance Criteria

1. WHEN a user removes a bookmark THEN the Bookmark_Service SHALL delete the User_Bookmark record
2. WHEN a user removes a bookmark THEN the Bookmark_Service SHALL atomically decrement the Repository BookmarkCount by 1
3. WHEN a user attempts to remove a non-existent bookmark THEN the Bookmark_Service SHALL return a not found error
4. WHEN an unbookmark operation fails THEN the Bookmark_Service SHALL not modify the BookmarkCount
5. THE Bookmark_Service SHALL ensure BookmarkCount never becomes negative

### Requirement 6: 收藏列表功能

**User Story:** As a user, I want to view all my bookmarked repositories in a dedicated page, so that I can easily access and manage my bookmarks.

#### Acceptance Criteria

1. WHEN a user requests their bookmark list THEN the Bookmark_Service SHALL return all repositories bookmarked by that user
2. WHEN displaying the bookmark list THEN the system SHALL show repository name, owner, description, star count, fork count, and bookmark timestamp
3. WHEN the bookmark list is empty THEN the system SHALL display an appropriate empty state message
4. THE bookmark list SHALL support pagination with configurable page size
5. THE bookmark list SHALL be ordered by bookmark creation time in descending order by default

### Requirement 7: 订阅仓库功能

**User Story:** As a user, I want to subscribe to repositories, so that I can receive updates about repository changes in the future.

#### Acceptance Criteria

1. WHEN a user subscribes to a repository THEN the Subscription_Service SHALL create a User_Subscription record
2. WHEN a user subscribes to a repository THEN the Subscription_Service SHALL atomically increment the Repository SubscriptionCount by 1
3. WHEN a user attempts to subscribe to an already subscribed repository THEN the Subscription_Service SHALL return an error indicating duplicate subscription
4. WHEN a user subscribes to a non-existent repository THEN the Subscription_Service SHALL return a not found error
5. WHEN a subscription operation fails THEN the Subscription_Service SHALL not modify the SubscriptionCount

### Requirement 8: 取消订阅功能

**User Story:** As a user, I want to unsubscribe from repositories, so that I can manage my subscriptions.

#### Acceptance Criteria

1. WHEN a user unsubscribes from a repository THEN the Subscription_Service SHALL delete the User_Subscription record
2. WHEN a user unsubscribes from a repository THEN the Subscription_Service SHALL atomically decrement the Repository SubscriptionCount by 1
3. WHEN a user attempts to unsubscribe from a non-subscribed repository THEN the Subscription_Service SHALL return a not found error
4. WHEN an unsubscribe operation fails THEN the Subscription_Service SHALL not modify the SubscriptionCount
5. THE Subscription_Service SHALL ensure SubscriptionCount never becomes negative

### Requirement 9: 收藏和订阅状态查询

**User Story:** As a user, I want to see whether I have bookmarked or subscribed to a repository when viewing its detail page, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN a user views a repository detail page THEN the system SHALL indicate whether the user has bookmarked the repository
2. WHEN a user views a repository detail page THEN the system SHALL indicate whether the user has subscribed to the repository
3. WHEN a user is not logged in THEN the system SHALL show bookmark and subscribe buttons without status indication
4. THE status query SHALL be efficient and not cause performance degradation

### Requirement 10: 前端收藏列表页面改造

**User Story:** As a user, I want the bookmarks page to display my actual bookmarked repositories instead of mock data, so that I can manage my real bookmarks.

#### Acceptance Criteria

1. WHEN the bookmarks page loads THEN the system SHALL fetch real bookmark data from the API
2. WHEN a user clicks the remove bookmark button THEN the system SHALL call the unbookmark API and refresh the list
3. WHEN the API request fails THEN the system SHALL display an appropriate error message
4. WHEN the bookmark list is loading THEN the system SHALL display a loading indicator
5. THE bookmarks page SHALL maintain the existing UI design and styling
