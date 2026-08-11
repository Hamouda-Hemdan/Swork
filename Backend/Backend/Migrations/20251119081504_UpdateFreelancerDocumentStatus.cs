using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFreelancerDocumentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDocumentVerified",
                table: "Freelancers");

            migrationBuilder.AddColumn<int>(
                name: "DocumentStatus",
                table: "Freelancers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocumentStatus",
                table: "Freelancers");

            migrationBuilder.AddColumn<bool>(
                name: "IsDocumentVerified",
                table: "Freelancers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
