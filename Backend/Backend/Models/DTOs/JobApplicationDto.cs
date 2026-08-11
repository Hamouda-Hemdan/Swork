using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class JobApplicationDto
    {
        public int Id { get; set; }
        public int JobPostId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public int ClientId { get; set; }
        public int ClientUserId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public int FreelancerId { get; set; }
        public int FreelancerUserId { get; set; }
        public string FreelancerName { get; set; } = string.Empty;
        public string FreelancerEmail { get; set; } = string.Empty;
        public double FreelancerAverageRating { get; set; }
        public int FreelancerCompletedProjectsCount { get; set; }
        public string UniversityName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public int? ResumeId { get; set; }
        public string? ResumeTitle { get; set; }
        public string? ResumeFileName { get; set; }
        public string? ResumeSkills { get; set; }
        public string? ResumeExperience { get; set; }
        public string CoverLetter { get; set; } = string.Empty;
        public decimal? ProposedBudget { get; set; }
        public JobApplicationStatus Status { get; set; }
        public string StatusName => Status.ToString();
        public DateTime AppliedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateJobApplicationDto
    {
        [Required]
        public int JobPostId { get; set; }

        public int? ResumeId { get; set; }

        [Required]
        [StringLength(2000)]
        public string CoverLetter { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? ProposedBudget { get; set; }
    }

    public class UpdateJobApplicationStatusDto
    {
        [Required]
        public JobApplicationStatus Status { get; set; }
    }
}
