using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class ProjectMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }
        public Project Project { get; set; } = null!;

        [Required]
        public int SenderUserId { get; set; }
        public User SenderUser { get; set; } = null!;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
