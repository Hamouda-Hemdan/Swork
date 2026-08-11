using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class JobApplication
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int JobPostId { get; set; }
        public JobPost JobPost { get; set; } = null!;

        [Required]
        public int FreelancerId { get; set; }
        public Freelancer Freelancer { get; set; } = null!;

        public int? ResumeId { get; set; }
        public Resume? Resume { get; set; }

        [Required]
        [StringLength(2000)]
        public string CoverLetter { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal? ProposedBudget { get; set; }

        [Required]
        public JobApplicationStatus Status { get; set; } = JobApplicationStatus.Pending;

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
