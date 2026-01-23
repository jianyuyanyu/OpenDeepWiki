using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using OpenDeepWiki.EFCore;
using OpenDeepWiki.Entities;
using OpenDeepWiki.Models;
using OpenDeepWiki.Services.Wiki;

namespace OpenDeepWiki.Tests.Services.Wiki;

/// <summary>
/// Property-based tests for WikiService API 404 responses.
/// Feature: repository-wiki-generation, Property 12: API 404 for Non-Existent Paths
/// Validates: Requirements 8.3
/// </summary>
public class WikiServicePropertyTests
{
    /// <summary>
    /// Creates an in-memory database context for testing.
    /// </summary>
    private static TestDbContext CreateTestContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TestDbContext(options);
    }

    /// <summary>
    /// Generates random non-existent path strings.
    /// </summary>
    private static Gen<string> GenerateNonExistentPath()
    {
        var prefixes = Gen.Elements("nonexistent", "missing", "invalid", "unknown", "fake");
        var suffixes = Gen.Elements("path", "doc", "page", "item", "section");
        var numbers = ArbMap.Default.GeneratorFor<int>().Where(i => i >= 1 && i <= 9999);
        
        return prefixes.SelectMany(prefix =>
            suffixes.SelectMany(suffix =>
                numbers.Select(num => $"{prefix}-{num}-{suffix}")));
    }

    /// <summary>
    /// Generates random organization names.
    /// </summary>
    private static Gen<string> GenerateOrgName()
    {
        return Gen.Elements("testorg", "myorg", "sampleorg", "demoorg", "exampleorg");
    }

    /// <summary>
    /// Generates random repository names.
    /// </summary>
    private static Gen<string> GenerateRepoName()
    {
        return Gen.Elements("testrepo", "myrepo", "samplerepo", "demorepo", "examplerepo");
    }

    /// <summary>
    /// Property 12: API 404 for Non-Existent Paths
    /// For any API request with a non-existent catalog path, the response SHALL be HTTP 404.
    /// Validates: Requirements 8.3
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GetDoc_NonExistentPath_ShouldThrowKeyNotFoundException()
    {
        return Prop.ForAll(
            GenerateOrgName().ToArbitrary(),
            GenerateRepoName().ToArbitrary(),
            GenerateNonExistentPath().ToArbitrary(),
            (org, repo, path) =>
            {
                using var context = CreateTestContext();
                
                // Setup: Create a repository with branch and language but NO catalog entries
                var repositoryId = Guid.NewGuid().ToString();
                var branchId = Guid.NewGuid().ToString();
                var languageId = Guid.NewGuid().ToString();

                context.Repositories.Add(new Repository
                {
                    Id = repositoryId,
                    OrgName = org,
                    RepoName = repo,
                    GitUrl = $"https://github.com/{org}/{repo}.git",
                    OwnerUserId = Guid.NewGuid().ToString(),
                    Status = RepositoryStatus.Completed
                });

                context.RepositoryBranches.Add(new RepositoryBranch
                {
                    Id = branchId,
                    RepositoryId = repositoryId,
                    BranchName = "main"
                });

               