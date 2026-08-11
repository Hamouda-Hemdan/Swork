using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs
{
    public class ProfilePhotoDto
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public IFormFile? PhotoFile { get; set; }
    }
}