using Backend.Models.Enums;

namespace Backend.Models.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Profile photo information
        public string? ProfilePhotoFileName { get; set; }
        public long? ProfilePhotoFileSize { get; set; }
        public DateTime? ProfilePhotoUploadDate { get; set; }
        
        // Role-specific data
        public ClientProfileDto? Client { get; set; }
        public FreelancerProfileDto? Freelancer { get; set; }
        public AdminProfileDto? Admin { get; set; }
    }
    
    public class ClientProfileDto
    {
        public string Phone { get; set; } = string.Empty;
    }
    
    public class FreelancerProfileDto
    {
        public string UniversityName { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public EducationLevel EducationLevel { get; set; }
        public FreelancerStatus Status { get; set; }
        
        // Document information
        public string? DocumentFileName { get; set; }
        public long? DocumentFileSize { get; set; }
        public DateTime? DocumentUploadDate { get; set; }
        public DocumentStatus DocumentStatus { get; set; }
        
        // Resumes
        public List<ResumeDto>? Resumes { get; set; }
    }
    
    public class AdminProfileDto
    {
        public string Department { get; set; } = string.Empty;
    }
}