using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Entities.Tools;

namespace OpenDeepWiki.EFCore;

public interface IContext
{
    DbSet<User> Users { get; set; }
    DbSet<Role> Roles { get; set; }
    DbSet<UserRole> UserRoles { get; set; }
    DbSet<OAuthProvider> OAuthProviders { get; set; }
    DbSet<UserOAuth> UserOAuths { get; set; }
    DbSet<LocalStorage> LocalStorages { get; set; }
    DbSet<Department> Departments { get; set; }
    DbSet<Repository> Repositories { get; set; }
    DbSet<RepositoryBranch> RepositoryBranches { get; set; }
    DbSet<BranchLanguage> BranchLanguages { get; set; }
    DbSet<DocFile> DocFiles { get; set; }
    DbSet<DocCatalog> DocCatalogs { get; set; }
    DbSet<RepositoryAssignment> RepositoryAssignments { get; set; }
    DbSet<UserBookmark> UserBookmarks { get; set; }
    DbSet<UserSubscription> UserSubscriptions { get; set; }
    DbSet<RepositoryProcessingLog> RepositoryProcessingLogs { get; set; }
    DbSet<TokenUsage> TokenUsages { get; set; }
    DbSet<SystemSetting> SystemSettings { get; set; }
    DbSet<McpConfig> McpConfigs { get; set; }
    DbSet<SkillConfig> SkillConfigs { get; set; }
    DbSet<ModelConfig> ModelConfigs { get; set; }
    DbSet<ChatSession> ChatSessions { get; set; }
    DbSet<ChatMessageHistory> ChatMessageHistories { get; set; }
    DbSet<ChatProviderConfig> ChatProviderConfigs { get; set; }
    DbSet<ChatMessageQueue> ChatMessageQueues { get; set; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public abstract class MasterDbContext : DbContext, IContext
{
    protected MasterDbContext(DbContextOptions options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<OAuthProvider> OAuthProviders { get; set; } = null!;
    public DbSet<UserOAuth> UserOAuths { get; set; } = null!;
    public DbSet<LocalStorage> LocalStorages { get; set; } = null!;
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Repository> Repositories { get; set; } = null!;
    public DbSet<RepositoryBranch> RepositoryBranches { get; set; } = null!;
    public DbSet<BranchLanguage> BranchLanguages { get; set; } = null!;
    public DbSet<DocFile> DocFiles { get; set; } = null!;
    public DbSet<DocCatalog> DocCatalogs { get; set; } = null!;
    public DbSet<RepositoryAssignment> RepositoryAssignments { get; set; } = null!;
    public DbSet<UserBookmark> UserBookmarks { get; set; } = null!;
    public DbSet<UserSubscription> UserSubscriptions { get; set; } = null!;
    public DbSet<RepositoryProcessingLog> RepositoryProcessingLogs { get; set; } = null!;
    public DbSet<TokenUsage> TokenUsages { get; set; } = null!;
    public DbSet<SystemSetting> SystemSettings { get; set; } = null!;
    public DbSet<McpConfig> McpConfigs { get; set; } = null!;
    public DbSet<SkillConfig> SkillConfigs { get; set; } = null!;
    public DbSet<ModelConfig> ModelConfigs { get; set; } = null!;
    public DbSet<ChatSession> ChatSessions { get; set; } = null!;
    public DbSet<ChatMessageHistory> ChatMessageHistories { get; set; } = null!;
    public DbSet<ChatProviderConfig> ChatProviderConfigs { get; set; } = null!;
    public DbSet<ChatMessageQueue> ChatMessageQueues { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Department>()
            .HasOne(department => department.Parent)
            .WithMany()
            .HasForeignKey(department => department.ParentId);

        modelBuilder.Entity<Repository>()
            .HasIndex(repository => new { repository.OwnerUserId, repository.OrgName, repository.RepoName })
            .IsUnique();

        modelBuilder.Entity<RepositoryBranch>()
            .HasIndex(branch => new { branch.RepositoryId, branch.BranchName })
            .IsUnique();

        modelBuilder.Entity<BranchLanguage>()
            .HasIndex(language => new { language.RepositoryBranchId, language.LanguageCode })
            .IsUnique();

        // DocCatalog 树形结构配置
        modelBuilder.Entity<DocCatalog>()
            .HasOne(catalog => catalog.Parent)
            .WithMany(catalog => catalog.Children)
            .HasForeignKey(catalog => catalog.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // DocCatalog 路径唯一索引（同一分支语言下路径唯一）
        modelBuilder.Entity<DocCatalog>()
            .HasIndex(catalog => new { catalog.BranchLanguageId, catalog.Path })
            .IsUnique();

        // DocCatalog 与 DocFile 关联
        modelBuilder.Entity<DocCatalog>()
            .HasOne(catalog => catalog.DocFile)
            .WithMany()
            .HasForeignKey(catalog => catalog.DocFileId)
            .OnDelete(DeleteBehavior.SetNull);

        // UserBookmark 唯一索引（同一用户对同一仓库只能收藏一次）
        modelBuilder.Entity<UserBookmark>()
            .HasIndex(b => new { b.UserId, b.RepositoryId })
            .IsUnique();

        // UserSubscription 唯一索引（同一用户对同一仓库只能订阅一次）
        modelBuilder.Entity<UserSubscription>()
            .HasIndex(s => new { s.UserId, s.RepositoryId })
            .IsUnique();

        // RepositoryProcessingLog 索引（按仓库ID和创建时间查询）
        modelBuilder.Entity<RepositoryProcessingLog>()
            .HasIndex(log => new { log.RepositoryId, log.CreatedAt });

        // TokenUsage 索引（按记录时间查询统计）
        modelBuilder.Entity<TokenUsage>()
            .HasIndex(t => t.RecordedAt);

        // SystemSetting 唯一键索引
        modelBuilder.Entity<SystemSetting>()
            .HasIndex(s => s.Key)
            .IsUnique();

        // McpConfig 名称唯一索引
        modelBuilder.Entity<McpConfig>()
            .HasIndex(m => m.Name)
            .IsUnique();

        // SkillConfig 名称唯一索引
        modelBuilder.Entity<SkillConfig>()
            .HasIndex(s => s.Name)
            .IsUnique();

        // ModelConfig 名称唯一索引
        modelBuilder.Entity<ModelConfig>()
            .HasIndex(m => m.Name)
            .IsUnique();

        // ChatSession 用户和平台组合唯一索引
        modelBuilder.Entity<ChatSession>()
            .HasIndex(s => new { s.UserId, s.Platform })
            .IsUnique();

        // ChatSession 状态索引（用于查询活跃会话）
        modelBuilder.Entity<ChatSession>()
            .HasIndex(s => s.State);

        // ChatMessageHistory 与 ChatSession 关联
        modelBuilder.Entity<ChatMessageHistory>()
            .HasOne(m => m.Session)
            .WithMany(s => s.Messages)
            .HasForeignKey(m => m.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ChatMessageHistory 会话ID和时间戳索引（用于按时间查询消息）
        modelBuilder.Entity<ChatMessageHistory>()
            .HasIndex(m => new { m.SessionId, m.MessageTimestamp });

        // ChatProviderConfig 平台唯一索引
        modelBuilder.Entity<ChatProviderConfig>()
            .HasIndex(c => c.Platform)
            .IsUnique();

        // ChatMessageQueue 状态和计划时间索引（用于出队处理）
        modelBuilder.Entity<ChatMessageQueue>()
            .HasIndex(q => new { q.Status, q.ScheduledAt });

        // ChatMessageQueue 平台和目标用户索引（用于按用户查询队列）
        modelBuilder.Entity<ChatMessageQueue>()
            .HasIndex(q => new { q.Platform, q.TargetUserId });
    }
}
