using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class FreelancerDocumentDto
    {
        [Required]
        public int FreelancerId { get; set; }
        
        [Required]
        public IFormFile? DocumentFile { get; set; }
    }
}