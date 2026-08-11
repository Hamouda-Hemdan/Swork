using Backend.Database;
using Backend.Models;
using Backend.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResumeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ResumeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/resume/my-resumes
        [HttpGet("my-resumes")]
        [Authorize]
        public async Task<IActionResult> GetMyResumes()
        {
            try
            {
                // Get the authenticated user's ID from JWT token
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                if (user.Freelancer == null)
                    return BadRequest(new { message = "Only freelancers can access resumes" });

                var resumes = await _context.Resumes
                    .Where(r => r.FreelancerId == user.Freelancer.Id)
                    .Select(r => new ResumeDto
                    {
                        Id = r.Id,
                        Title = r.Title,
                        Description = r.Description,
                        Skills = r.Skills,
                        Experience = r.Experience,
                        Projects = r.Projects,
                        Education = r.Education,
                        Certifications = r.Certifications,
                        Languages = r.Languages,
                        AdditionalInfo = r.AdditionalInfo,
                        CreatedAt = r.CreatedAt,
                        UpdatedAt = r.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(resumes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
        
        // GET: api/resume/freelancer/{freelancerId}
        [HttpGet("freelancer/{freelancerId}")]
        [Authorize]
        public async Task<IActionResult> GetResumesByFreelancer(int freelancerId)
        {
            try
            {
                // Verify that the authenticated user is the freelancer or an admin
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                // Check if user is the freelancer or an admin
                bool isOwner = user.Freelancer != null && user.Freelancer.Id == freelancerId;
                bool isAdmin = user.Role == Models.Enums.UserRole.Admin;

                if (!isOwner && !isAdmin)
                    return Forbid("You can only access your own resumes");

                var resumes = await _context.Resumes
                    .Where(r => r.FreelancerId == freelancerId)
                    .Select(r => new ResumeDto
                    {
                        Id = r.Id,
                        Title = r.Title,
                        Description = r.Description,
                        Skills = r.Skills,
                        Experience = r.Experience,
                        Projects = r.Projects,
                        Education = r.Education,
                        Certifications = r.Certifications,
                        Languages = r.Languages,
                        AdditionalInfo = r.AdditionalInfo,
                        CreatedAt = r.CreatedAt,
                        UpdatedAt = r.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(resumes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // GET: api/resume/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetResume(int id)
        {
            try
            {
                var resume = await _context.Resumes
                    .Include(r => r.Freelancer)
                    .ThenInclude(f => f.User)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (resume == null)
                    return NotFound("Resume not found");

                // Verify that the authenticated user is the owner or an admin
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                bool isOwner = resume.Freelancer.UserId == userId;
                bool isAdmin = user.Role == Models.Enums.UserRole.Admin;

                if (!isOwner && !isAdmin)
                    return Forbid("You can only access your own resume");

                var resumeDto = new ResumeDto
                {
                    Id = resume.Id,
                    Title = resume.Title,
                    Description = resume.Description,
                    Skills = resume.Skills,
                    Experience = resume.Experience,
                    Projects = resume.Projects,
                    Education = resume.Education,
                    Certifications = resume.Certifications,
                    Languages = resume.Languages,
                    AdditionalInfo = resume.AdditionalInfo,
                    CreatedAt = resume.CreatedAt,
                    UpdatedAt = resume.UpdatedAt
                };

                return Ok(resumeDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // POST: api/resume
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateResume([FromBody] CreateResumeDto createResumeDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                if (user.Freelancer == null)
                    return BadRequest(new { message = "Only freelancers can create resumes" });

                var resume = new Resume
                {
                    FreelancerId = user.Freelancer.Id,
                    Title = createResumeDto.Title,
                    Description = createResumeDto.Description,
                    Skills = createResumeDto.Skills,
                    Experience = createResumeDto.Experience,
                    Projects = createResumeDto.Projects,
                    Education = createResumeDto.Education,
                    Certifications = createResumeDto.Certifications,
                    Languages = createResumeDto.Languages,
                    AdditionalInfo = createResumeDto.AdditionalInfo,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Resumes.Add(resume);
                await _context.SaveChangesAsync();

                var resumeDto = new ResumeDto
                {
                    Id = resume.Id,
                    Title = resume.Title,
                    Description = resume.Description,
                    Skills = resume.Skills,
                    Experience = resume.Experience,
                    Projects = resume.Projects,
                    Education = resume.Education,
                    Certifications = resume.Certifications,
                    Languages = resume.Languages,
                    AdditionalInfo = resume.AdditionalInfo,
                    CreatedAt = resume.CreatedAt,
                    UpdatedAt = resume.UpdatedAt
                };

                return CreatedAtAction(nameof(GetResume), new { id = resume.Id }, resumeDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // PUT: api/resume/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateResume(int id, [FromBody] UpdateResumeDto updateResumeDto)
        {
            try
            {
                var resume = await _context.Resumes
                    .Include(r => r.Freelancer)
                    .ThenInclude(f => f.User)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (resume == null)
                    return NotFound("Resume not found");

                // Verify that the authenticated user is the owner or an admin
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                bool isOwner = resume.Freelancer.UserId == userId;
                bool isAdmin = user.Role == Models.Enums.UserRole.Admin;

                if (!isOwner && !isAdmin)
                    return Forbid("You can only update your own resume");

                // Update only the fields that are provided
                if (!string.IsNullOrEmpty(updateResumeDto.Title))
                    resume.Title = updateResumeDto.Title;

                if (updateResumeDto.Description != null)
                    resume.Description = updateResumeDto.Description;

                if (updateResumeDto.Skills != null)
                    resume.Skills = updateResumeDto.Skills;

                if (updateResumeDto.Experience != null)
                    resume.Experience = updateResumeDto.Experience;

                if (updateResumeDto.Projects != null)
                    resume.Projects = updateResumeDto.Projects;

                if (updateResumeDto.Education != null)
                    resume.Education = updateResumeDto.Education;

                if (updateResumeDto.Certifications != null)
                    resume.Certifications = updateResumeDto.Certifications;

                if (updateResumeDto.Languages != null)
                    resume.Languages = updateResumeDto.Languages;

                if (updateResumeDto.AdditionalInfo != null)
                    resume.AdditionalInfo = updateResumeDto.AdditionalInfo;

                resume.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var resumeDto = new ResumeDto
                {
                    Id = resume.Id,
                    Title = resume.Title,
                    Description = resume.Description,
                    Skills = resume.Skills,
                    Experience = resume.Experience,
                    Projects = resume.Projects,
                    Education = resume.Education,
                    Certifications = resume.Certifications,
                    Languages = resume.Languages,
                    AdditionalInfo = resume.AdditionalInfo,
                    CreatedAt = resume.CreatedAt,
                    UpdatedAt = resume.UpdatedAt
                };

                return Ok(resumeDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // DELETE: api/resume/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteResume(int id)
        {
            try
            {
                var resume = await _context.Resumes
                    .Include(r => r.Freelancer)
                    .ThenInclude(f => f.User)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (resume == null)
                    return NotFound("Resume not found");

                // Verify that the authenticated user is the owner or an admin
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                bool isOwner = resume.Freelancer.UserId == userId;
                bool isAdmin = user.Role == Models.Enums.UserRole.Admin;

                if (!isOwner && !isAdmin)
                    return Forbid("You can only delete your own resume");

                _context.Resumes.Remove(resume);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Resume deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
    }
}