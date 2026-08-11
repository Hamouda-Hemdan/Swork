using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class Resume
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FreelancerId { get; set; }

        [JsonIgnore] // Prevent circular reference when serializing
        public Freelancer Freelancer { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        // Skills section
        public string? Skills { get; set; } // Comma-separated skills or JSON string

        // Experience section
        public string? Experience { get; set; } // JSON string containing experience details

        // Projects section
        public string? Projects { get; set; } // JSON string containing project details

        // Education section (additional to the main freelancer education)
        public string? Education { get; set; } // JSON string containing education details

        // Certifications
        public string? Certifications { get; set; }

        // Languages
        public string? Languages { get; set; }

        // Additional information
        public string? AdditionalInfo { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}