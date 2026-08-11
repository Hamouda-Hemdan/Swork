using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class UpdateProfileDto
    {
        // Common fields for all users
        [StringLength(100)]
        public string? Name { get; set; }
        
        // Client specific fields
        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }
        
        // Freelancer specific fields
        [StringLength(100)]
        public string? UniversityName { get; set; }
        
        [StringLength(10)]
        public string? Year { get; set; }
        
        [Phone]
        [StringLength(20)]
        public string? FreelancerPhone { get; set; }
        
        [StringLength(100)]
        public string? Department { get; set; }
        
        public EducationLevel? EducationLevel { get; set; }
        
        // Admin specific fields
    }
}