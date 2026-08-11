using Backend.Database;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FreelancerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FreelancerController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("public")]
        public async Task<IActionResult> GetPublicFreelancers()
        {
            try
            {
                var freelancers = await _context.Freelancers
                    .Include(f => f.User)
                    .Include(f => f.ReceivedProjectReviews)
                    .Include(f => f.Projects)
                    .Where(f => f.Status == FreelancerStatus.Active)
                    .OrderByDescending(f => f.ReceivedProjectReviews.Any() ? f.ReceivedProjectReviews.Average(r => (double)r.Rating) : 0)
                    .ThenByDescending(f => f.Projects.Count(p => p.Status == ProjectStatus.ApprovedByClient))
                    .Select(f => new PublicFreelancerDto
                    {
                        FreelancerId = f.Id,
                        UserId = f.UserId,
                        Name = f.User.Name,
                        Department = f.Department,
                        UniversityName = f.UniversityName,
                        Year = f.Year,
                        AverageRating = f.ReceivedProjectReviews.Any()
                            ? Math.Round(f.ReceivedProjectReviews.Average(r => (double)r.Rating), 2)
                            : 0,
                        CompletedProjectsCount = f.Projects.Count(p => p.Status == ProjectStatus.ApprovedByClient),
                        TotalReviews = f.ReceivedProjectReviews.Count
                    })
                    .Take(12)
                    .ToListAsync();

                return Ok(freelancers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] FreelancerDocumentDto documentDto)
        {
            try
            {
                // Find the freelancer
                var freelancer = await _context.Freelancers
                    .FirstOrDefaultAsync(f => f.Id == documentDto.FreelancerId);
                
                if (freelancer == null)
                {
                    return NotFound("Freelancer not found");
                }

                // Process the uploaded file
                if (documentDto.DocumentFile != null && documentDto.DocumentFile.Length > 0)
                {
                    // Validate file size (5MB limit)
                    if (documentDto.DocumentFile.Length > 5 * 1024 * 1024)
                    {
                        return BadRequest("File size exceeds 5MB limit");
                    }

                    // Validate file type
                    var allowedTypes = new[] { 
                        "application/pdf", 
                        "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "image/jpeg", 
                        "image/png" 
                    };
                    if (!allowedTypes.Contains(documentDto.DocumentFile.ContentType))
                    {
                        return BadRequest("Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed.");
                    }

                    // Save document and update freelancer entity
                    await SaveFreelancerDocumentAsync(freelancer, documentDto.DocumentFile);
                    
                    // Save changes to database
                    await _context.SaveChangesAsync();
                    
                    return Ok(new { Message = "Document uploaded successfully", Freelancer = freelancer });
                }
                
                return BadRequest("No document file provided");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("update-document-status/{freelancerId}")]
        [Authorize(Roles = "Admin")] // Only admin users can update document status
        public async Task<IActionResult> UpdateDocumentStatus(int freelancerId, [FromBody] DocumentVerificationDto verificationDto)
        {
            try
            {
                // Find the freelancer
                var freelancer = await _context.Freelancers
                    .FirstOrDefaultAsync(f => f.Id == freelancerId);
                
                if (freelancer == null)
                {
                    return NotFound("Freelancer not found");
                }

                // Update document status
                freelancer.DocumentStatus = verificationDto.DocumentStatus;
                
                // Save changes to database
                await _context.SaveChangesAsync();
                
                return Ok(new { Message = "Document status updated successfully", Freelancer = freelancer });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private async Task SaveFreelancerDocumentAsync(Freelancer freelancer, IFormFile documentFile)
        {
            // Generate unique file name
            var extension = Path.GetExtension(documentFile.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}_{documentFile.FileName}";
            
            // Define file path (in a real application, you might want to store this in a cloud storage)
            var uploadsFolder = Path.Combine("wwwroot", "documents", "freelancers");
            
            // Ensure directory exists
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }
            
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            
            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await documentFile.CopyToAsync(stream);
            }
            
            // Update freelancer entity with document information
            freelancer.DocumentPath = filePath;
            freelancer.DocumentFileName = documentFile.FileName;
            freelancer.DocumentFileSize = documentFile.Length;
            freelancer.DocumentUploadDate = DateTime.UtcNow;
            // DocumentStatus remains Pending by default until manually updated
        }
    }
}