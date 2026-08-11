using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Admin
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? Department { get; set; }
    }
}