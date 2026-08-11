using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class FreelancerVerificationRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public User User { get; set; } = null!;

        [Required]
        [StringLength(100)]
        public string UniversityName { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Year { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        // Document upload fields for Proof of Enrollment/Graduation
        public string? DocumentPath { get; set; }
        
        public string? DocumentFileName { get; set; }
        
        public long? DocumentFileSize { get; set; }
        
        public DateTime? DocumentUploadDate { get; set; }

        public DocumentStatus DocumentStatus { get; set; } = DocumentStatus.Pending;

        public EducationLevel EducationLevel { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.UtcNow;

        public DateTime? ProcessedDate { get; set; }

        public int? ProcessedByAdminId { get; set; }

        public User? ProcessedByAdmin { get; set; }

        public string? AdminNotes { get; set; }

        public bool IsApproved { get; set; } = false;

        public string? RejectionReason { get; set; }
    }
}