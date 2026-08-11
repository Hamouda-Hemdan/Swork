using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class ResumeDto
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        // Skills section - can be comma-separated string or JSON
        public string? Skills { get; set; }

        // Experience section - JSON string containing experience details
        public string? Experience { get; set; }

        // Projects section - JSON string containing project details
        public string? Projects { get; set; }

        // Education section (additional to the main freelancer education)
        public string? Education { get; set; }

        // Certifications
        public string? Certifications { get; set; }

        // Languages
        public string? Languages { get; set; }

        // Additional information
        public string? AdditionalInfo { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateResumeDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Skills { get; set; }

        public string? Experience { get; set; }

        public string? Projects { get; set; }

        public string? Education { get; set; }

        public string? Certifications { get; set; }

        public string? Languages { get; set; }

        public string? AdditionalInfo { get; set; }
    }

    public class UpdateResumeDto
    {
        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Skills { get; set; }

        public string? Experience { get; set; }

        public string? Projects { get; set; }

        public string? Education { get; set; }

        public string? Certifications { get; set; }

        public string? Languages { get; set; }

        public string? AdditionalInfo { get; set; }
    }
}