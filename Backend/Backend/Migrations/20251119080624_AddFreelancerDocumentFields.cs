using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFreelancerDocumentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DocumentFileName",
                table: "Freelancers",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DocumentFileSize",
                table: "Freelancers",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentPath",
                table: "Freelancers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DocumentUploadDate",
                table: "Freelancers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDocumentVerified",
                table: "Freelancers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocumentFileName",
                table: "Freelancers");

            migrationBuilder.DropColumn(
                name: "DocumentFileSize",
                table: "Freelancers");

            migrationBuilder.DropColumn(
                name: "DocumentPath",
                table: "Freelancers");

            migrationBuilder.DropColumn(
                name: "DocumentUploadDate",
                table: "Freelancers");

            migrationBuilder.DropColumn(
                name: "IsDocumentVerified",
                table: "Freelancers");
        }
    }
}
