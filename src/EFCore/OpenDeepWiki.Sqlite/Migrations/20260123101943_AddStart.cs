using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenDeepWiki.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddStart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ForkCount",
                table: "Repositories",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StarCount",
                table: "Repositories",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ForkCount",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "StarCount",
                table: "Repositories");
        }
    }
}
