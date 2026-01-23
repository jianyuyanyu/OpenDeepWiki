using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenDeepWiki.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddCommitId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastCommitId",
                table: "RepositoryBranches",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastProcessedAt",
                table: "RepositoryBranches",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DocCatalogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    BranchLanguageId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: false),
                    ParentId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    DocFileId = table.Column<string>(type: "TEXT", maxLength: 36, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Version = table.Column<byte[]>(type: "BLOB", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocCatalogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocCatalogs_BranchLanguages_BranchLanguageId",
                        column: x => x.BranchLanguageId,
                        principalTable: "BranchLanguages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocCatalogs_DocCatalogs_ParentId",
                        column: x => x.ParentId,
                        principalTable: "DocCatalogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DocCatalogs_DocFiles_DocFileId",
                        column: x => x.DocFileId,
                        principalTable: "DocFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocCatalogs_BranchLanguageId_Path",
                table: "DocCatalogs",
                columns: new[] { "BranchLanguageId", "Path" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocCatalogs_DocFileId",
                table: "DocCatalogs",
                column: "DocFileId");

            migrationBuilder.CreateIndex(
                name: "IX_DocCatalogs_ParentId",
                table: "DocCatalogs",
                column: "ParentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocCatalogs");

            migrationBuilder.DropColumn(
                name: "LastCommitId",
                table: "RepositoryBranches");

            migrationBuilder.DropColumn(
                name: "LastProcessedAt",
                table: "RepositoryBranches");
        }
    }
}
