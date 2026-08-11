using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class ProjectDto
    {
        public int Id { get; set; }
        public int JobPostId { get; set; }
        public int JobApplicationId { get; set; }
        public int ClientId { get; set; }
        public int ClientUserId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public int FreelancerId { get; set; }
        public int FreelancerUserId { get; set; }
        public string FreelancerName { get; set; } = string.Empty;
        public double FreelancerAverageRating { get; set; }
        public int FreelancerCompletedProjectsCount { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal PaymentAmount { get; set; }
        public bool IsMockPaymentFunded { get; set; }
        public string MockPaymentStatus { get; set; } = "Pending";
        public DateTime? MockPaymentFundedAt { get; set; }
        public string PaymentReleaseStatus { get; set; } = "Pending";
        public DateTime? DeadlineAt { get; set; }
        public ProjectStatus Status { get; set; }
        public string StatusName => Status.ToString();
        public ProjectReviewDto? Review { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class ProjectReviewDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int ClientId { get; set; }
        public int FreelancerId { get; set; }
        public int Rating { get; set; }
        public string? Feedback { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateProjectStatusDto
    {
        [Required]
        public ProjectStatus Status { get; set; }

        [StringLength(2000)]
        public string? Comment { get; set; }
    }

    public class SetProjectDeadlineDto
    {
        [Required]
        public DateTime DeadlineAt { get; set; }
    }

    public class ProjectMessageDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int SenderUserId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
    }

    public class CreateProjectMessageDto
    {
        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;
    }

    public class UpsertProjectReviewDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Feedback { get; set; }
    }
}
