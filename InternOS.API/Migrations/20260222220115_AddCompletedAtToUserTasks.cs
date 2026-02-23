using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternOS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedAtToUserTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "UserTasks",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "UserTasks");
        }
    }
}
