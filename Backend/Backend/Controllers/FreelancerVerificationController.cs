using Backend.Database;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FreelancerVerificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FreelancerVerificationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/freelancerverification/pending
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingVerificationRequests()
        {
            try
            {
                var requests = await _context.FreelancerVerificationRequests
                    .Include(r => r.User)
                    .Where(r => r.IsApproved == false && r.RejectionReason == null)
                    .Select(r => new
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        UserName = r.User.Name,
                        UserEmail = r.User.Email,
                        UniversityName = r.UniversityName,
                        Year = r.Year,
                        Department = r.Department,
                        Phone = r.Phone,
                        DocumentFileName = r.DocumentFileName,
                        DocumentFileSize = r.DocumentFileSize,
                        DocumentUploadDate = r.DocumentUploadDate,
                        DocumentStatus = r.DocumentStatus,
                        EducationLevel = r.EducationLevel,
                        RequestDate = r.RequestDate
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
        
        // GET: api/freelancerverification/documents/{requestId}
        [HttpGet("documents/{requestId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetVerificationDocument(int requestId)
        {
            try
            {
                var request = await _context.FreelancerVerificationRequests
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return NotFound("Verification request not found");

                if (string.IsNullOrEmpty(request.DocumentPath) || !System.IO.File.Exists(request.DocumentPath))
                    return NotFound("Document not found");

                var fileStream = new FileStream(request.DocumentPath, FileMode.Open, FileAccess.Read);
                var fileExtension = Path.GetExtension(request.DocumentPath);
                var contentType = GetContentType(fileExtension);

                return File(fileStream, contentType, request.DocumentFileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
        
        private string GetContentType(string fileExtension)
        {
            return fileExtension.ToLower() switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }

        // GET: api/freelancerverification/approved
        [HttpGet("approved")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetApprovedVerificationRequests()
        {
            try
            {
                var requests = await _context.FreelancerVerificationRequests
                    .Include(r => r.User)
                    .Where(r => r.IsApproved == true)
                    .Select(r => new
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        UserName = r.User.Name,
                        UserEmail = r.User.Email,
                        UniversityName = r.UniversityName,
                        Year = r.Year,
                        Department = r.Department,
                        Phone = r.Phone,
                        DocumentFileName = r.DocumentFileName,
                        DocumentFileSize = r.DocumentFileSize,
                        DocumentUploadDate = r.DocumentUploadDate,
                        DocumentStatus = r.DocumentStatus,
                        EducationLevel = r.EducationLevel,
                        RequestDate = r.RequestDate,
                        ProcessedDate = r.ProcessedDate,
                        ProcessedByAdminId = r.ProcessedByAdminId
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // GET: api/freelancerverification/rejected
        [HttpGet("rejected")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRejectedVerificationRequests()
        {
            try
            {
                var requests = await _context.FreelancerVerificationRequests
                    .Include(r => r.User)
                    .Where(r => r.RejectionReason != null)
                    .Select(r => new
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        UserName = r.User.Name,
                        UserEmail = r.User.Email,
                        UniversityName = r.UniversityName,
                        Year = r.Year,
                        Department = r.Department,
                        Phone = r.Phone,
                        DocumentFileName = r.DocumentFileName,
                        DocumentFileSize = r.DocumentFileSize,
                        DocumentUploadDate = r.DocumentUploadDate,
                        DocumentStatus = r.DocumentStatus,
                        EducationLevel = r.EducationLevel,
                        RequestDate = r.RequestDate,
                        RejectionReason = r.RejectionReason
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // POST: api/freelancerverification/approve/{requestId}
        [HttpPost("approve/{requestId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveVerificationRequest(int requestId, [FromBody] string? adminNotes = null)
        {
            try
            {
                var request = await _context.FreelancerVerificationRequests
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return NotFound("Verification request not found");

                if (request.IsApproved || request.RejectionReason != null)
                    return BadRequest("Request has already been processed");

                // Get the admin user who is processing this request
                var adminUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Update the request status
                request.IsApproved = true;
                request.ProcessedDate = DateTime.UtcNow;
                request.ProcessedByAdminId = adminUserId;
                request.AdminNotes = adminNotes;
                
                // Update the user's role to Freelancer
                request.User.Role = UserRole.Freelancer;
                
                // Create the actual Freelancer record from the verification request
                var freelancer = new Freelancer
                {
                    UserId = request.UserId,
                    UniversityName = request.UniversityName,
                    Year = request.Year,
                    Phone = request.Phone,
                    Department = request.Department,
                    EducationLevel = request.EducationLevel,
                    DocumentPath = request.DocumentPath,
                    DocumentFileName = request.DocumentFileName,
                    DocumentFileSize = request.DocumentFileSize,
                    DocumentUploadDate = request.DocumentUploadDate,
                    DocumentStatus = request.DocumentStatus,
                    Status = FreelancerStatus.Active
                };
                
                _context.Freelancers.Add(freelancer);
                
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Verification request approved successfully", UserId = request.UserId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // POST: api/freelancerverification/reject/{requestId}
        [HttpPost("reject/{requestId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectVerificationRequest(int requestId, [FromBody] string rejectionReason)
        {
            try
            {
                if (string.IsNullOrEmpty(rejectionReason))
                    return BadRequest("Rejection reason is required");

                var request = await _context.FreelancerVerificationRequests
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return NotFound("Verification request not found");

                if (request.IsApproved || request.RejectionReason != null)
                    return BadRequest("Request has already been processed");

                // Get the admin user who is processing this request
                var adminUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                // Update the request status
                request.RejectionReason = rejectionReason;
                request.ProcessedDate = DateTime.UtcNow;
                request.ProcessedByAdminId = adminUserId;
                
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Verification request rejected successfully", UserId = request.UserId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // PUT: api/freelancerverification/update-status/{freelancerId}
        [HttpPut("update-status/{freelancerId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFreelancerStatus(int freelancerId, [FromBody] FreelancerStatus newStatus)
        {
            try
            {
                var freelancer = await _context.Freelancers
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => f.Id == freelancerId);

                if (freelancer == null)
                    return NotFound("Freelancer not found");

                // Update the freelancer's status
                freelancer.Status = newStatus;
                
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Freelancer status updated successfully", Status = newStatus });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
    }
}