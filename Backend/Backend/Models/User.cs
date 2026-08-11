using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Profile photo fields
        public string? ProfilePhotoPath { get; set; }
        public string? ProfilePhotoFileName { get; set; }
        public long? ProfilePhotoFileSize { get; set; }
        public DateTime? ProfilePhotoUploadDate { get; set; }

        // Navigation properties for role-specific data
        public Client? Client { get; set; }
        public Freelancer? Freelancer { get; set; }
        public Admin? Admin { get; set; }
    }
}