using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class JobPostDto
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public int ClientUserId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public JobPostCategory Category { get; set; }
        public string CategoryName => Category.ToString();
        public string Title { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }
        public decimal? Budget { get; set; }
        public JobPostStatus Status { get; set; }
        public string StatusName => Status.ToString();
        public int? AssignedFreelancerId { get; set; }
        public int? AssignedFreelancerUserId { get; set; }
        public string? AssignedFreelancerName { get; set; }
        public string? AssignedFreelancerUniversityName { get; set; }
        public string? AssignedFreelancerDepartment { get; set; }
        public string? AssignedFreelancerYear { get; set; }
        public double AssignedFreelancerAverageRating { get; set; }
        public int AssignedFreelancerCompletedProjectsCount { get; set; }
        public int AssignedFreelancerTotalReviews { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateJobPostDto
    {
        [Required]
        public JobPostCategory Category { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string RequiredSkills { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Location { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Budget { get; set; }
    }

    public class UpdateJobPostDto
    {
        public JobPostCategory? Category { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(1000)]
        public string? RequiredSkills { get; set; }

        [StringLength(2000)]
        public string? Description { get; set; }

        [StringLength(255)]
        public string? Location { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Budget { get; set; }

        public JobPostStatus? Status { get; set; }
    }
}
