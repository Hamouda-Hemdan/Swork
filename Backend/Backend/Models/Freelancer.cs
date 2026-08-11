using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Freelancer
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
        [Phone]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        // Document upload fields for Proof of Enrollment/Graduation
        public string? DocumentPath { get; set; }
        
        public string? DocumentFileName { get; set; }
        
        public long? DocumentFileSize { get; set; }
        
        public DateTime? DocumentUploadDate { get; set; }
        
        public DocumentStatus DocumentStatus { get; set; } = DocumentStatus.Pending;
        
        // Education level
        public EducationLevel EducationLevel { get; set; }

        [Required]
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;

        public FreelancerStatus Status { get; set; } = FreelancerStatus.Active;

        // Resumes
        public ICollection<Resume> Resumes { get; set; } = new List<Resume>();

        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();

        public ICollection<Project> Projects { get; set; } = new List<Project>();

        public ICollection<ProjectReview> ReceivedProjectReviews { get; set; } = new List<ProjectReview>();
    }
}