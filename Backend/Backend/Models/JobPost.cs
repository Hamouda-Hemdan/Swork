using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace Backend.Models
{
    public class JobPost
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClientId { get; set; }

        [JsonIgnore]
        public Client Client { get; set; } = null!;

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

        [Required]
        public JobPostStatus Status { get; set; } = JobPostStatus.Open;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    }
}
