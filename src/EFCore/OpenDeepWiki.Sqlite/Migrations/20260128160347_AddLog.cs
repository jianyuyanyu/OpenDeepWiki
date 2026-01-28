using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenDeepWiki.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocDirectories");

            migrationBuilder.CreateTable(
                name: "RepositoryProcessingLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    RepositoryId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    Step = table.Column<int>(type: "INTEGER", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    IsAiOutput = table.Column<bool>(type: "INTEGER", nullable: false),
                    ToolName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Version = table.Column<byte[]>(type: "BLOB", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepositoryProcessingLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RepositoryProcessingLogs_Repositories_RepositoryId",
                        column: x => x.RepositoryId,
                        principalTable: "Repositories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RepositoryProcessingLogs_RepositoryId_CreatedAt",
                table: "RepositoryProcessingLogs",
                columns: new[] { "RepositoryId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RepositoryProcessingLogs");

            migrationBuilder.CreateTable(
                name: "DocDirectories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    BranchLanguageId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    DocFileId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Version = table.Column<byte[]>(type: "BLOB", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocDirectories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocDirectories_BranchLanguages_BranchLanguageId",
                        column: x => x.BranchLanguageId,
                        principalTable: "BranchLanguages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocDirectories_DocFiles_DocFileId",
                        column: x => x.DocFileId,
                        principalTable: "DocFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocDirectories_BranchLanguageId_Path",
                table: "DocDirectories",
                columns: new[] { "BranchLanguageId", "Path" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocDirectories_DocFileId",
                table: "DocDirectories",
                column: "DocFileId",
                unique: true);
        }
    }
}
