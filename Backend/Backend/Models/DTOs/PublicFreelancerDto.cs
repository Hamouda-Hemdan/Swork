namespace Backend.Models.DTOs
{
    public class PublicFreelancerDto
    {
        public int FreelancerId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string UniversityName { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int CompletedProjectsCount { get; set; }
        public int TotalReviews { get; set; }
    }
}
