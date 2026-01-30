using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenDeepWiki.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSkillConfigForAgentSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PromptTemplate",
                table: "SkillConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "Version",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(byte[]),
                oldType: "BLOB",
                oldRowVersion: true,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 1024,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AllowedTools",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Author",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Compatibility",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FolderPath",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HasAssets",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasReferences",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasScripts",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "License",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SkillMdSize",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "Source",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "TotalSize",
                table: "SkillConfigs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowedTools",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "Author",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "Compatibility",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "FolderPath",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "HasAssets",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "HasReferences",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "HasScripts",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "License",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "SkillMdSize",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "SkillConfigs");

            migrationBuilder.DropColumn(
                name: "TotalSize",
                table: "SkillConfigs");

            migrationBuilder.AlterColumn<byte[]>(
                name: "Version",
                table: "SkillConfigs",
                type: "BLOB",
                rowVersion: true,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "SkillConfigs",
                type: "TEXT",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 1024);

            migrationBuilder.AddColumn<string>(
                name: "PromptTemplate",
                table: "SkillConfigs",
                type: "TEXT",
                nullable: true);
        }
    }
}
