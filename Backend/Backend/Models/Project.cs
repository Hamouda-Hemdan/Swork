using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int JobPostId { get; set; }
        public JobPost JobPost { get; set; } = null!;

        [Required]
        public int JobApplicationId { get; set; }
        public JobApplication JobApplication { get; set; } = null!;

        [Required]
        public int ClientId { get; set; }
        public Client Client { get; set; } = null!;

        [Required]
        public int FreelancerId { get; set; }
        public Freelancer Freelancer { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        public ProjectStatus Status { get; set; } = ProjectStatus.InProgress;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<ProjectMessage> Messages { get; set; } = new List<ProjectMessage>();

        public ProjectReview? Review { get; set; }
    }
}
