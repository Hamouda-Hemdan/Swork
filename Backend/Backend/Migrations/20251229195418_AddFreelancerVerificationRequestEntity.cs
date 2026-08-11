using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFreelancerVerificationRequestEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FreelancerVerificationRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UniversityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Year = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Department = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DocumentPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DocumentFileName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DocumentFileSize = table.Column<long>(type: "bigint", nullable: true),
                    DocumentUploadDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DocumentStatus = table.Column<int>(type: "int", nullable: false),
                    EducationLevel = table.Column<int>(type: "int", nullable: false),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcessedByAdminId = table.Column<int>(type: "int", nullable: true),
                    AdminNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FreelancerVerificationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FreelancerVerificationRequests_Users_ProcessedByAdminId",
                        column: x => x.ProcessedByAdminId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FreelancerVerificationRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_FreelancerVerificationRequests_ProcessedByAdminId",
                table: "FreelancerVerificationRequests",
                column: "ProcessedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_FreelancerVerificationRequests_UserId",
                table: "FreelancerVerificationRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FreelancerVerificationRequests");
        }
    }
}
