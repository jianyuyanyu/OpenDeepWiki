CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "AppStatistics" (
    "Id" uuid NOT NULL,
    "AppId" character varying(64) NOT NULL,
    "Date" timestamp with time zone NOT NULL,
    "RequestCount" bigint NOT NULL,
    "InputTokens" bigint NOT NULL,
    "OutputTokens" bigint NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_AppStatistics" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatApps" (
    "Id" uuid NOT NULL,
    "UserId" character varying(100) NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    "IconUrl" character varying(500),
    "AppId" character varying(64) NOT NULL,
    "AppSecret" character varying(128) NOT NULL,
    "EnableDomainValidation" boolean NOT NULL,
    "AllowedDomains" character varying(2000),
    "ProviderType" character varying(50) NOT NULL,
    "ApiKey" character varying(500),
    "BaseUrl" character varying(500),
    "AvailableModels" character varying(1000),
    "DefaultModel" character varying(100),
    "RateLimitPerMinute" integer,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatApps" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatAssistantConfigs" (
    "Id" uuid NOT NULL,
    "IsEnabled" boolean NOT NULL,
    "EnabledModelIds" character varying(2000),
    "EnabledMcpIds" character varying(2000),
    "EnabledSkillIds" character varying(2000),
    "DefaultModelId" character varying(100),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatAssistantConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatLogs" (
    "Id" uuid NOT NULL,
    "AppId" character varying(64) NOT NULL,
    "UserIdentifier" character varying(100),
    "Question" text NOT NULL,
    "AnswerSummary" character varying(500),
    "InputTokens" integer NOT NULL,
    "OutputTokens" integer NOT NULL,
    "ModelUsed" character varying(100),
    "SourceDomain" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatLogs" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatMessageQueues" (
    "Id" uuid NOT NULL,
    "SessionId" uuid,
    "TargetUserId" character varying(200) NOT NULL,
    "Platform" character varying(50) NOT NULL,
    "MessageContent" text NOT NULL,
    "QueueType" character varying(20) NOT NULL,
    "Status" character varying(20) NOT NULL,
    "RetryCount" integer NOT NULL,
    "ScheduledAt" timestamp with time zone,
    "ErrorMessage" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatMessageQueues" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatProviderConfigs" (
    "Id" uuid NOT NULL,
    "Platform" character varying(50) NOT NULL,
    "DisplayName" character varying(100) NOT NULL,
    "IsEnabled" boolean NOT NULL,
    "ConfigData" text NOT NULL,
    "WebhookUrl" character varying(500),
    "MessageInterval" integer NOT NULL,
    "MaxRetryCount" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatProviderConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatSessions" (
    "Id" uuid NOT NULL,
    "UserId" character varying(200) NOT NULL,
    "Platform" character varying(50) NOT NULL,
    "State" character varying(20) NOT NULL,
    "LastActivityAt" timestamp with time zone NOT NULL,
    "Metadata" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatSessions" PRIMARY KEY ("Id")
);

CREATE TABLE "Departments" (
    "Id" text NOT NULL,
    "Name" character varying(100) NOT NULL,
    "ParentId" character varying(36),
    "Description" character varying(500),
    "SortOrder" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_Departments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Departments_Departments_ParentId" FOREIGN KEY ("ParentId") REFERENCES "Departments" ("Id")
);

CREATE TABLE "McpConfigs" (
    "Id" text NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    "ServerUrl" character varying(500) NOT NULL,
    "ApiKey" character varying(500),
    "IsActive" boolean NOT NULL,
    "SortOrder" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_McpConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "ModelConfigs" (
    "Id" text NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Provider" character varying(50) NOT NULL,
    "ModelId" character varying(100) NOT NULL,
    "Endpoint" character varying(500),
    "ApiKey" character varying(500),
    "IsDefault" boolean NOT NULL,
    "IsActive" boolean NOT NULL,
    "Description" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ModelConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "OAuthProviders" (
    "Id" text NOT NULL,
    "Name" character varying(50) NOT NULL,
    "DisplayName" character varying(100) NOT NULL,
    "AuthorizationUrl" character varying(500) NOT NULL,
    "TokenUrl" character varying(500) NOT NULL,
    "UserInfoUrl" character varying(500) NOT NULL,
    "ClientId" character varying(200) NOT NULL,
    "ClientSecret" character varying(500) NOT NULL,
    "RedirectUri" character varying(500) NOT NULL,
    "Scope" character varying(500),
    "UserInfoMapping" character varying(1000),
    "IsActive" boolean NOT NULL,
    "RequireEmailVerification" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_OAuthProviders" PRIMARY KEY ("Id")
);

CREATE TABLE "Roles" (
    "Id" text NOT NULL,
    "Name" character varying(50) NOT NULL,
    "Description" character varying(200),
    "IsActive" boolean NOT NULL,
    "IsSystemRole" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);

CREATE TABLE "SkillConfigs" (
    "Id" text NOT NULL,
    "Name" character varying(64) NOT NULL,
    "Description" character varying(1024) NOT NULL,
    "License" character varying(100),
    "Compatibility" character varying(500),
    "AllowedTools" character varying(1000),
    "FolderPath" character varying(200) NOT NULL,
    "IsActive" boolean NOT NULL,
    "SortOrder" integer NOT NULL,
    "Author" character varying(100),
    "Version" character varying(20) NOT NULL,
    "Source" integer NOT NULL,
    "SourceUrl" character varying(500),
    "HasScripts" boolean NOT NULL,
    "HasReferences" boolean NOT NULL,
    "HasAssets" boolean NOT NULL,
    "SkillMdSize" bigint NOT NULL,
    "TotalSize" bigint NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    CONSTRAINT "PK_SkillConfigs" PRIMARY KEY ("Id")
);

CREATE TABLE "SystemSettings" (
    "Id" text NOT NULL,
    "Key" character varying(100) NOT NULL,
    "Value" text,
    "Description" character varying(500),
    "Category" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_SystemSettings" PRIMARY KEY ("Id")
);

CREATE TABLE "UserPreferenceCaches" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "LanguageWeights" character varying(2000),
    "TopicWeights" character varying(2000),
    "PrivateRepoLanguages" character varying(2000),
    "LastCalculatedAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserPreferenceCaches" PRIMARY KEY ("Id")
);

CREATE TABLE "Users" (
    "Id" text NOT NULL,
    "Name" character varying(50) NOT NULL,
    "Email" character varying(100) NOT NULL,
    "Password" character varying(255),
    "Avatar" character varying(500),
    "Phone" character varying(20),
    "Status" integer NOT NULL,
    "IsSystem" boolean NOT NULL,
    "LastLoginAt" timestamp with time zone,
    "LastLoginIp" character varying(50),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE "ChatMessageHistories" (
    "Id" uuid NOT NULL,
    "SessionId" uuid NOT NULL,
    "MessageId" character varying(200) NOT NULL,
    "SenderId" character varying(200) NOT NULL,
    "Content" text NOT NULL,
    "MessageType" character varying(20) NOT NULL,
    "Role" character varying(20) NOT NULL,
    "MessageTimestamp" timestamp with time zone NOT NULL,
    "Metadata" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_ChatMessageHistories" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ChatMessageHistories_ChatSessions_SessionId" FOREIGN KEY ("SessionId") REFERENCES "ChatSessions" ("Id") ON DELETE CASCADE
);

CREATE TABLE "LocalStorages" (
    "Id" text NOT NULL,
    "FileName" character varying(255) NOT NULL,
    "FileExtension" character varying(50) NOT NULL,
    "FileSize" bigint NOT NULL,
    "ContentType" character varying(100) NOT NULL,
    "FilePath" character varying(500) NOT NULL,
    "FileHash" character varying(128),
    "Category" character varying(50) NOT NULL,
    "UploaderId" character varying(36) NOT NULL,
    "BusinessId" character varying(36),
    "BusinessType" character varying(50),
    "Status" integer NOT NULL,
    "IsPublic" boolean NOT NULL,
    "AccessCount" integer NOT NULL,
    "LastAccessAt" timestamp with time zone,
    "ExpiredAt" timestamp with time zone,
    "Metadata" character varying(2000),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_LocalStorages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LocalStorages_Users_UploaderId" FOREIGN KEY ("UploaderId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Repositories" (
    "Id" text NOT NULL,
    "OwnerUserId" character varying(36) NOT NULL,
    "GitUrl" character varying(500) NOT NULL,
    "RepoName" character varying(100) NOT NULL,
    "OrgName" character varying(100) NOT NULL,
    "AuthAccount" character varying(200),
    "AuthPassword" character varying(500),
    "IsPublic" boolean NOT NULL,
    "Status" integer NOT NULL,
    "StarCount" integer NOT NULL,
    "ForkCount" integer NOT NULL,
    "BookmarkCount" integer NOT NULL,
    "SubscriptionCount" integer NOT NULL,
    "ViewCount" integer NOT NULL,
    "PrimaryLanguage" character varying(50),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_Repositories" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Repositories_Users_OwnerUserId" FOREIGN KEY ("OwnerUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserDepartments" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "DepartmentId" character varying(36) NOT NULL,
    "IsManager" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserDepartments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserDepartments_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserDepartments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserOAuths" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "OAuthProviderId" character varying(36) NOT NULL,
    "OAuthUserId" character varying(200) NOT NULL,
    "OAuthUserName" character varying(200),
    "OAuthUserEmail" character varying(200),
    "OAuthUserAvatar" character varying(500),
    "AccessToken" character varying(1000),
    "RefreshToken" character varying(1000),
    "TokenExpiresAt" timestamp with time zone,
    "Scope" character varying(500),
    "TokenType" character varying(50),
    "IsBound" boolean NOT NULL,
    "LastLoginAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserOAuths" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserOAuths_OAuthProviders_OAuthProviderId" FOREIGN KEY ("OAuthProviderId") REFERENCES "OAuthProviders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserOAuths_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserRoles" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "RoleId" character varying(36) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserRoles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserRoles_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserRoles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RepositoryAssignments" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "DepartmentId" character varying(36) NOT NULL,
    "AssigneeUserId" character varying(36) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_RepositoryAssignments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RepositoryAssignments_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RepositoryAssignments_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RepositoryAssignments_Users_AssigneeUserId" FOREIGN KEY ("AssigneeUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RepositoryBranches" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "BranchName" character varying(200) NOT NULL,
    "LastCommitId" character varying(40),
    "LastProcessedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_RepositoryBranches" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RepositoryBranches_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RepositoryProcessingLogs" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "Step" integer NOT NULL,
    "Message" text NOT NULL,
    "IsAiOutput" boolean NOT NULL,
    "ToolName" character varying(100),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_RepositoryProcessingLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RepositoryProcessingLogs_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE
);

CREATE TABLE "TokenUsages" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36),
    "UserId" character varying(36),
    "InputTokens" integer NOT NULL,
    "OutputTokens" integer NOT NULL,
    "ModelName" character varying(100),
    "Operation" character varying(50),
    "RecordedAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_TokenUsages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TokenUsages_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id"),
    CONSTRAINT "FK_TokenUsages_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
);

CREATE TABLE "UserActivities" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "RepositoryId" character varying(36),
    "ActivityType" integer NOT NULL,
    "Weight" integer NOT NULL,
    "Duration" integer,
    "SearchQuery" character varying(500),
    "Language" character varying(50),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserActivities" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserActivities_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id"),
    CONSTRAINT "FK_UserActivities_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserBookmarks" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserBookmarks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserBookmarks_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserBookmarks_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserDislikes" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "Reason" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserDislikes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserDislikes_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserDislikes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "UserSubscriptions" (
    "Id" text NOT NULL,
    "UserId" character varying(36) NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_UserSubscriptions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserSubscriptions_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserSubscriptions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE "BranchLanguages" (
    "Id" text NOT NULL,
    "RepositoryBranchId" character varying(36) NOT NULL,
    "LanguageCode" character varying(50) NOT NULL,
    "UpdateSummary" character varying(2000),
    "IsDefault" boolean NOT NULL,
    "MindMapContent" text,
    "MindMapStatus" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_BranchLanguages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_BranchLanguages_RepositoryBranches_RepositoryBranchId" FOREIGN KEY ("RepositoryBranchId") REFERENCES "RepositoryBranches" ("Id") ON DELETE CASCADE
);

CREATE TABLE "DocFiles" (
    "Id" text NOT NULL,
    "BranchLanguageId" character varying(36) NOT NULL,
    "Content" text NOT NULL,
    "SourceFiles" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_DocFiles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DocFiles_BranchLanguages_BranchLanguageId" FOREIGN KEY ("BranchLanguageId") REFERENCES "BranchLanguages" ("Id") ON DELETE CASCADE
);

CREATE TABLE "TranslationTasks" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "RepositoryBranchId" character varying(36) NOT NULL,
    "SourceBranchLanguageId" character varying(36) NOT NULL,
    "TargetLanguageCode" character varying(10) NOT NULL,
    "Status" integer NOT NULL,
    "ErrorMessage" character varying(2000),
    "RetryCount" integer NOT NULL,
    "MaxRetryCount" integer NOT NULL,
    "StartedAt" timestamp with time zone,
    "CompletedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_TranslationTasks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TranslationTasks_BranchLanguages_SourceBranchLanguageId" FOREIGN KEY ("SourceBranchLanguageId") REFERENCES "BranchLanguages" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TranslationTasks_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TranslationTasks_RepositoryBranches_RepositoryBranchId" FOREIGN KEY ("RepositoryBranchId") REFERENCES "RepositoryBranches" ("Id") ON DELETE CASCADE
);

CREATE TABLE "DocCatalogs" (
    "Id" text NOT NULL,
    "BranchLanguageId" character varying(36) NOT NULL,
    "ParentId" character varying(36),
    "Title" character varying(500) NOT NULL,
    "Path" character varying(1000) NOT NULL,
    "Order" integer NOT NULL,
    "DocFileId" character varying(36),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_DocCatalogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DocCatalogs_BranchLanguages_BranchLanguageId" FOREIGN KEY ("BranchLanguageId") REFERENCES "BranchLanguages" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_DocCatalogs_DocCatalogs_ParentId" FOREIGN KEY ("ParentId") REFERENCES "DocCatalogs" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_DocCatalogs_DocFiles_DocFileId" FOREIGN KEY ("DocFileId") REFERENCES "DocFiles" ("Id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "IX_AppStatistics_AppId_Date" ON "AppStatistics" ("AppId", "Date");

CREATE UNIQUE INDEX "IX_BranchLanguages_RepositoryBranchId_LanguageCode" ON "BranchLanguages" ("RepositoryBranchId", "LanguageCode");

CREATE UNIQUE INDEX "IX_ChatApps_AppId" ON "ChatApps" ("AppId");

CREATE INDEX "IX_ChatApps_UserId" ON "ChatApps" ("UserId");

CREATE INDEX "IX_ChatLogs_AppId" ON "ChatLogs" ("AppId");

CREATE INDEX "IX_ChatLogs_CreatedAt" ON "ChatLogs" ("CreatedAt");

CREATE INDEX "IX_ChatMessageHistories_SessionId_MessageTimestamp" ON "ChatMessageHistories" ("SessionId", "MessageTimestamp");

CREATE INDEX "IX_ChatMessageQueues_Platform_TargetUserId" ON "ChatMessageQueues" ("Platform", "TargetUserId");

CREATE INDEX "IX_ChatMessageQueues_Status_ScheduledAt" ON "ChatMessageQueues" ("Status", "ScheduledAt");

CREATE UNIQUE INDEX "IX_ChatProviderConfigs_Platform" ON "ChatProviderConfigs" ("Platform");

CREATE INDEX "IX_ChatSessions_State" ON "ChatSessions" ("State");

CREATE UNIQUE INDEX "IX_ChatSessions_UserId_Platform" ON "ChatSessions" ("UserId", "Platform");

CREATE INDEX "IX_Departments_ParentId" ON "Departments" ("ParentId");

CREATE UNIQUE INDEX "IX_DocCatalogs_BranchLanguageId_Path" ON "DocCatalogs" ("BranchLanguageId", "Path");

CREATE INDEX "IX_DocCatalogs_DocFileId" ON "DocCatalogs" ("DocFileId");

CREATE INDEX "IX_DocCatalogs_ParentId" ON "DocCatalogs" ("ParentId");

CREATE INDEX "IX_DocFiles_BranchLanguageId" ON "DocFiles" ("BranchLanguageId");

CREATE INDEX "IX_LocalStorages_UploaderId" ON "LocalStorages" ("UploaderId");

CREATE UNIQUE INDEX "IX_McpConfigs_Name" ON "McpConfigs" ("Name");

CREATE UNIQUE INDEX "IX_ModelConfigs_Name" ON "ModelConfigs" ("Name");

CREATE UNIQUE INDEX "IX_Repositories_OwnerUserId_OrgName_RepoName" ON "Repositories" ("OwnerUserId", "OrgName", "RepoName");

CREATE INDEX "IX_RepositoryAssignments_AssigneeUserId" ON "RepositoryAssignments" ("AssigneeUserId");

CREATE INDEX "IX_RepositoryAssignments_DepartmentId" ON "RepositoryAssignments" ("DepartmentId");

CREATE INDEX "IX_RepositoryAssignments_RepositoryId" ON "RepositoryAssignments" ("RepositoryId");

CREATE UNIQUE INDEX "IX_RepositoryBranches_RepositoryId_BranchName" ON "RepositoryBranches" ("RepositoryId", "BranchName");

CREATE INDEX "IX_RepositoryProcessingLogs_RepositoryId_CreatedAt" ON "RepositoryProcessingLogs" ("RepositoryId", "CreatedAt");

CREATE UNIQUE INDEX "IX_SkillConfigs_Name" ON "SkillConfigs" ("Name");

CREATE UNIQUE INDEX "IX_SystemSettings_Key" ON "SystemSettings" ("Key");

CREATE INDEX "IX_TokenUsages_RecordedAt" ON "TokenUsages" ("RecordedAt");

CREATE INDEX "IX_TokenUsages_RepositoryId" ON "TokenUsages" ("RepositoryId");

CREATE INDEX "IX_TokenUsages_UserId" ON "TokenUsages" ("UserId");

CREATE UNIQUE INDEX "IX_TranslationTasks_RepositoryBranchId_TargetLanguageCode" ON "TranslationTasks" ("RepositoryBranchId", "TargetLanguageCode");

CREATE INDEX "IX_TranslationTasks_RepositoryId" ON "TranslationTasks" ("RepositoryId");

CREATE INDEX "IX_TranslationTasks_SourceBranchLanguageId" ON "TranslationTasks" ("SourceBranchLanguageId");

CREATE INDEX "IX_TranslationTasks_Status" ON "TranslationTasks" ("Status");

CREATE INDEX "IX_UserActivities_RepositoryId" ON "UserActivities" ("RepositoryId");

CREATE INDEX "IX_UserActivities_UserId_CreatedAt" ON "UserActivities" ("UserId", "CreatedAt");

CREATE INDEX "IX_UserBookmarks_RepositoryId" ON "UserBookmarks" ("RepositoryId");

CREATE UNIQUE INDEX "IX_UserBookmarks_UserId_RepositoryId" ON "UserBookmarks" ("UserId", "RepositoryId");

CREATE INDEX "IX_UserDepartments_DepartmentId" ON "UserDepartments" ("DepartmentId");

CREATE UNIQUE INDEX "IX_UserDepartments_UserId_DepartmentId" ON "UserDepartments" ("UserId", "DepartmentId");

CREATE INDEX "IX_UserDislikes_RepositoryId" ON "UserDislikes" ("RepositoryId");

CREATE UNIQUE INDEX "IX_UserDislikes_UserId_RepositoryId" ON "UserDislikes" ("UserId", "RepositoryId");

CREATE INDEX "IX_UserOAuths_OAuthProviderId" ON "UserOAuths" ("OAuthProviderId");

CREATE INDEX "IX_UserOAuths_UserId" ON "UserOAuths" ("UserId");

CREATE UNIQUE INDEX "IX_UserPreferenceCaches_UserId" ON "UserPreferenceCaches" ("UserId");

CREATE INDEX "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");

CREATE INDEX "IX_UserRoles_UserId" ON "UserRoles" ("UserId");

CREATE INDEX "IX_UserSubscriptions_RepositoryId" ON "UserSubscriptions" ("RepositoryId");

CREATE UNIQUE INDEX "IX_UserSubscriptions_UserId_RepositoryId" ON "UserSubscriptions" ("UserId", "RepositoryId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260201174943_Initial', '10.0.2');

COMMIT;

START TRANSACTION;
ALTER TABLE "Repositories" ADD "LastUpdateCheckAt" timestamp with time zone;

ALTER TABLE "Repositories" ADD "UpdateIntervalMinutes" integer;

ALTER TABLE "ChatAssistantConfigs" ADD "EnableImageUpload" boolean NOT NULL DEFAULT FALSE;

CREATE TABLE "IncrementalUpdateTasks" (
    "Id" text NOT NULL,
    "RepositoryId" character varying(36) NOT NULL,
    "BranchId" character varying(36) NOT NULL,
    "PreviousCommitId" character varying(40),
    "TargetCommitId" character varying(40),
    "Status" integer NOT NULL,
    "Priority" integer NOT NULL,
    "IsManualTrigger" boolean NOT NULL,
    "RetryCount" integer NOT NULL,
    "ErrorMessage" text,
    "StartedAt" timestamp with time zone,
    "CompletedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "DeletedAt" timestamp with time zone,
    "IsDeleted" boolean NOT NULL,
    "Version" bytea,
    CONSTRAINT "PK_IncrementalUpdateTasks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_IncrementalUpdateTasks_Repositories_RepositoryId" FOREIGN KEY ("RepositoryId") REFERENCES "Repositories" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_IncrementalUpdateTasks_RepositoryBranches_BranchId" FOREIGN KEY ("BranchId") REFERENCES "RepositoryBranches" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_IncrementalUpdateTasks_BranchId" ON "IncrementalUpdateTasks" ("BranchId");

CREATE INDEX "IX_IncrementalUpdateTasks_Priority_CreatedAt" ON "IncrementalUpdateTasks" ("Priority", "CreatedAt");

CREATE INDEX "IX_IncrementalUpdateTasks_RepositoryId_BranchId_Status" ON "IncrementalUpdateTasks" ("RepositoryId", "BranchId", "Status");

CREATE INDEX "IX_IncrementalUpdateTasks_Status" ON "IncrementalUpdateTasks" ("Status");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260204195827_AddIncrementalUpdateTask', '10.0.2');

COMMIT;

START TRANSACTION;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260205122325_UpdateRepositories', '10.0.2');

COMMIT;

