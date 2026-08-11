using Backend.Database;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobApplicationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobApplicationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("job/{jobPostId}/applications")]
        [Authorize]
        public async Task<IActionResult> GetApplicationsForJob(int jobPostId)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users
                    .Include(u => u.Client)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var jobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .FirstOrDefaultAsync(j => j.Id == jobPostId);

                if (jobPost == null)
                {
                    return NotFound(new { message = "Job post not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isOwner = user.Client != null && jobPost.ClientId == user.Client.Id;

                if (!isAdmin && !isOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to these applications" });
                }

                var applications = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .Where(a => a.JobPostId == jobPostId)
                    .OrderByDescending(a => a.AppliedAt)
                    .Select(MapToDto())
                    .ToListAsync();

                return Ok(applications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("job/{jobPostId}/my-application")]
        [Authorize]
        public async Task<IActionResult> GetMyApplicationForJob(int jobPostId)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (user.Role != UserRole.Freelancer || user.Freelancer == null)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only approved freelancers can access their applications" });
                }

                var application = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .Where(a => a.JobPostId == jobPostId && a.FreelancerId == user.Freelancer.Id)
                    .Select(MapToDto())
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    return NotFound(new { message = "Application not found" });
                }

                return Ok(application);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("my-applications")]
        [Authorize]
        public async Task<IActionResult> GetMyApplications()
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (user.Role != UserRole.Freelancer || user.Freelancer == null)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only approved freelancers can access their applications" });
                }

                var applications = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .Where(a => a.FreelancerId == user.Freelancer.Id)
                    .OrderByDescending(a => a.AppliedAt)
                    .Select(MapToDto())
                    .ToListAsync();

                return Ok(applications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateApplication([FromBody] CreateJobApplicationDto createJobApplicationDto)
        {
            try
            {
                var userId = GetAuthenticatedUserId();
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (user.Role != UserRole.Freelancer || user.Freelancer == null)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only approved freelancers can apply to jobs" });
                }

                var jobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(j => j.Id == createJobApplicationDto.JobPostId);

                if (jobPost == null)
                {
                    return NotFound(new { message = "Job post not found" });
                }

                if (jobPost.Status != JobPostStatus.Open && jobPost.Status != JobPostStatus.InProgress)
                {
                    return BadRequest(new { message = "Applications are closed for this job" });
                }

                // Validate ResumeId if provided
                if (createJobApplicationDto.ResumeId.HasValue)
                {
                    var resume = await _context.Resumes
                        .FirstOrDefaultAsync(r => r.Id == createJobApplicationDto.ResumeId.Value && r.FreelancerId == user.Freelancer.Id);
                    if (resume == null)
                    {
                        return BadRequest(new { message = "Invalid resume selected" });
                    }
                }

                var alreadyApplied = await _context.JobApplications
                    .AnyAsync(a => a.JobPostId == createJobApplicationDto.JobPostId && a.FreelancerId == user.Freelancer.Id);

                if (alreadyApplied)
                {
                    return BadRequest(new { message = "You have already applied to this job" });
                }

                var application = new JobApplication
                {
                    JobPostId = createJobApplicationDto.JobPostId,
                    FreelancerId = user.Freelancer.Id,
                    ResumeId = createJobApplicationDto.ResumeId,
                    CoverLetter = createJobApplicationDto.CoverLetter,
                    ProposedBudget = createJobApplicationDto.ProposedBudget,
                    Status = JobApplicationStatus.Pending,
                    AppliedAt = DateTime.UtcNow
                };

                _context.JobApplications.Add(application);
                await _context.SaveChangesAsync();

                var createdApplication = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .Where(a => a.Id == application.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                return CreatedAtAction(nameof(GetMyApplicationForJob), new { jobPostId = application.JobPostId }, createdApplication);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateJobApplicationStatusDto updateJobApplicationStatusDto)
        {
            try
            {
                if (updateJobApplicationStatusDto.Status != JobApplicationStatus.Accepted && updateJobApplicationStatusDto.Status != JobApplicationStatus.Rejected)
                {
                    return BadRequest(new { message = "Applications can only be accepted or rejected" });
                }

                var application = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (application == null)
                {
                    return NotFound(new { message = "Application not found" });
                }

                var userId = GetAuthenticatedUserId();
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var user = await _context.Users
                    .Include(u => u.Client)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isOwner = user.Client != null && application.JobPost.ClientId == user.Client.Id;

                if (!isAdmin && !isOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to manage this application" });
                }

                if (updateJobApplicationStatusDto.Status == JobApplicationStatus.Accepted)
                {
                    var anotherAcceptedApplicationExists = await _context.JobApplications
                        .AnyAsync(a => a.JobPostId == application.JobPostId && a.Id != application.Id && a.Status == JobApplicationStatus.Accepted);

                    if (anotherAcceptedApplicationExists)
                    {
                        return BadRequest(new { message = "This job already has an accepted application" });
                    }

                    application.JobPost.Status = JobPostStatus.InProgress;

                    var existingProject = await _context.Projects
                        .FirstOrDefaultAsync(p => p.JobApplicationId == application.Id);

                    if (existingProject == null)
                    {
                        var project = new Project
                        {
                            JobPostId = application.JobPostId,
                            JobApplicationId = application.Id,
                            ClientId = application.JobPost.ClientId,
                            FreelancerId = application.FreelancerId,
                            Title = application.JobPost.Title,
                            Description = application.JobPost.Description,
                            Status = ProjectStatus.InProgress,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.Projects.Add(project);
                    }
                    else if (existingProject.Status != ProjectStatus.InProgress)
                    {
                        existingProject.Status = ProjectStatus.InProgress;
                        existingProject.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else if (application.Status == JobApplicationStatus.Accepted)
                {
                    application.JobPost.Status = JobPostStatus.Open;

                    var existingProject = await _context.Projects
                        .FirstOrDefaultAsync(p => p.JobApplicationId == application.Id);
                    if (existingProject != null)
                    {
                        existingProject.Status = ProjectStatus.Cancelled;
                        existingProject.UpdatedAt = DateTime.UtcNow;
                    }
                }

                application.Status = updateJobApplicationStatusDto.Status;
                application.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var updatedApplication = await _context.JobApplications
                    .Include(a => a.JobPost)
                    .ThenInclude(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Include(a => a.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(a => a.Resume)
                    .Where(a => a.Id == application.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                return Ok(updatedApplication);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        private int GetAuthenticatedUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private static System.Linq.Expressions.Expression<Func<JobApplication, JobApplicationDto>> MapToDto()
        {
            return a => new JobApplicationDto
            {
                Id = a.Id,
                JobPostId = a.JobPostId,
                JobTitle = a.JobPost.Title,
                ClientId = a.JobPost.ClientId,
                ClientUserId = a.JobPost.Client.UserId,
                ClientName = a.JobPost.Client.User.Name,
                FreelancerId = a.FreelancerId,
                FreelancerUserId = a.Freelancer.UserId,
                FreelancerName = a.Freelancer.User.Name,
                FreelancerEmail = a.Freelancer.User.Email,
                FreelancerAverageRating = a.Freelancer.ReceivedProjectReviews.Any()
                    ? Math.Round(a.Freelancer.ReceivedProjectReviews.Average(r => (double)r.Rating), 2)
                    : 0,
                FreelancerCompletedProjectsCount = a.Freelancer.Projects.Count(p => p.Status == ProjectStatus.ApprovedByClient),
                UniversityName = a.Freelancer.UniversityName,
                Department = a.Freelancer.Department,
                Year = a.Freelancer.Year,
                ResumeId = a.ResumeId,
                ResumeTitle = a.Resume != null ? a.Resume.Title : null,
                ResumeFileName = null, // Resume doesn't have FileName
                ResumeSkills = a.Resume != null ? a.Resume.Skills : null,
                ResumeExperience = a.Resume != null ? a.Resume.Experience : null,
                CoverLetter = a.CoverLetter,
                ProposedBudget = a.ProposedBudget,
                Status = a.Status,
                AppliedAt = a.AppliedAt,
                UpdatedAt = a.UpdatedAt
            };
        }
    }
}
