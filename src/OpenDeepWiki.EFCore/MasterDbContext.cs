using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.Entities;

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
    DbSet<DocDirectory> DocDirectories { get; set; }
    DbSet<DocFile> DocFiles { get; set; }
    DbSet<RepositoryAssignment> RepositoryAssignments { get; set; }

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
    public DbSet<DocDirectory> DocDirectories { get; set; } = null!;
    public DbSet<DocFile> DocFiles { get; set; } = null!;
    public DbSet<RepositoryAssignment> RepositoryAssignments { get; set; } = null!;

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

        modelBuilder.Entity<DocDirectory>()
            .HasIndex(directory => new { directory.BranchLanguageId, directory.Path })
            .IsUnique();

        modelBuilder.Entity<DocDirectory>()
            .HasOne(directory => directory.DocFile)
            .WithOne()
            .HasForeignKey<DocDirectory>(directory => directory.DocFileId);
    }
}
