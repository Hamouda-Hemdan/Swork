using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [Required] // ADDED - Name is now required for all users
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        // Client specific
        public string? Phone { get; set; }

        // Freelancer verification request specific
        public string? UniversityName { get; set; }
        public string? Year { get; set; }
        public string? FreelancerPhone { get; set; }
        public string? FreelancerDepartment { get; set; }
        
        // Freelancer document upload (base64 encoded or file path)
        public string? DocumentBase64 { get; set; }
        public string? DocumentFileName { get; set; }

        // Admin specific
        public string? Department { get; set; }
    }
}