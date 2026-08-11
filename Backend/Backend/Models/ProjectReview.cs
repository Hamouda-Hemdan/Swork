using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class ProjectReview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        [Required]
        public int ClientId { get; set; }
        public Client Client { get; set; } = null!;

        [Required]
        public int FreelancerId { get; set; }
        public Freelancer Freelancer { get; set; } = null!;

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Feedback { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
