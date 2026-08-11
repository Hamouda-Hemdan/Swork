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
    public class JobPostController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobPostController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllJobPosts()
        {
            try
            {
                var jobPosts = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Where(j => j.Status == JobPostStatus.Open)
                    .OrderByDescending(j => j.CreatedAt)
                    .Select(MapToDto())
                    .ToListAsync();

                return Ok(jobPosts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("my-posts")]
        [Authorize]
        public async Task<IActionResult> GetMyJobPosts()
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

                if (user.Role == UserRole.Admin)
                {
                    var adminPosts = await _context.JobPosts
                        .Include(j => j.Client)
                        .ThenInclude(c => c.User)
                        .OrderByDescending(j => j.CreatedAt)
                        .Select(MapToDto())
                        .ToListAsync();

                    return Ok(adminPosts);
                }

                if (user.Client == null)
                {
                    return BadRequest(new { message = "Only clients can access their job posts" });
                }

                var jobPosts = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Where(j => j.ClientId == user.Client.Id)
                    .OrderByDescending(j => j.CreatedAt)
                    .Select(MapToDto())
                    .ToListAsync();

                return Ok(jobPosts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobPost(int id)
        {
            try
            {
                var jobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Where(j => j.Id == id)
                    .Select(MapToDto())
                    .FirstOrDefaultAsync();

                if (jobPost == null)
                {
                    return NotFound(new { message = "Job post not found" });
                }

                return Ok(jobPost);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            var categories = Enum.GetValues<JobPostCategory>()
                .Cast<JobPostCategory>()
                .ToDictionary(c => c.ToString(), c => (int)c);

            return Ok(categories);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateJobPost([FromBody] CreateJobPostDto createJobPostDto)
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

                if (user.Role != UserRole.Client || user.Client == null)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only clients can create job posts" });
                }

                var jobPost = new JobPost
                {
                    ClientId = user.Client.Id,
                    Category = createJobPostDto.Category,
                    Title = createJobPostDto.Title,
                    RequiredSkills = createJobPostDto.RequiredSkills,
                    Description = createJobPostDto.Description,
                    Location = createJobPostDto.Location,
                    Budget = createJobPostDto.Budget,
                    Status = JobPostStatus.Open,
                    CreatedAt = DateTime.UtcNow
                };

                _context.JobPosts.Add(jobPost);
                await _context.SaveChangesAsync();

                var createdJobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Where(j => j.Id == jobPost.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                return CreatedAtAction(nameof(GetJobPost), new { id = jobPost.Id }, createdJobPost);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateJobPost(int id, [FromBody] UpdateJobPostDto updateJobPostDto)
        {
            try
            {
                var jobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (jobPost == null)
                {
                    return NotFound(new { message = "Job post not found" });
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
                var isOwner = user.Client != null && jobPost.ClientId == user.Client.Id;

                if (!isAdmin && !isOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only update your own job posts" });
                }

                if (updateJobPostDto.Category.HasValue)
                {
                    jobPost.Category = updateJobPostDto.Category.Value;
                }

                if (!string.IsNullOrWhiteSpace(updateJobPostDto.Title))
                {
                    jobPost.Title = updateJobPostDto.Title;
                }

                if (!string.IsNullOrWhiteSpace(updateJobPostDto.RequiredSkills))
                {
                    jobPost.RequiredSkills = updateJobPostDto.RequiredSkills;
                }

                if (!string.IsNullOrWhiteSpace(updateJobPostDto.Description))
                {
                    jobPost.Description = updateJobPostDto.Description;
                }

                if (updateJobPostDto.Location != null)
                {
                    jobPost.Location = updateJobPostDto.Location;
                }

                if (updateJobPostDto.Budget.HasValue)
                {
                    jobPost.Budget = updateJobPostDto.Budget.Value;
                }

                if (updateJobPostDto.Status.HasValue)
                {
                    if (!isAdmin && updateJobPostDto.Status.Value != jobPost.Status)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only admins can change job status directly" });
                    }

                    jobPost.Status = updateJobPostDto.Status.Value;
                }

                jobPost.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var updatedJobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .Where(j => j.Id == jobPost.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                return Ok(updatedJobPost);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteJobPost(int id)
        {
            try
            {
                var jobPost = await _context.JobPosts
                    .Include(j => j.Client)
                    .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (jobPost == null)
                {
                    return NotFound(new { message = "Job post not found" });
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
                var isOwner = user.Client != null && jobPost.ClientId == user.Client.Id;

                if (!isAdmin && !isOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only delete your own job posts" });
                }

                _context.JobPosts.Remove(jobPost);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Job post deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        private int GetAuthenticatedUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private static System.Linq.Expressions.Expression<Func<JobPost, JobPostDto>> MapToDto()
        {
            return j => new JobPostDto
            {
                Id = j.Id,
                ClientId = j.ClientId,
                ClientUserId = j.Client.UserId,
                ClientName = j.Client.User.Name,
                ClientEmail = j.Client.User.Email,
                Category = j.Category,
                Title = j.Title,
                RequiredSkills = j.RequiredSkills,
                Description = j.Description,
                Location = j.Location,
                Budget = j.Budget,
                Status = j.Status,
                AssignedFreelancerId = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => (int?)a.FreelancerId)
                    .FirstOrDefault(),
                AssignedFreelancerUserId = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => (int?)a.Freelancer.UserId)
                    .FirstOrDefault(),
                AssignedFreelancerName = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.User.Name)
                    .FirstOrDefault(),
                AssignedFreelancerUniversityName = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.UniversityName)
                    .FirstOrDefault(),
                AssignedFreelancerDepartment = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.Department)
                    .FirstOrDefault(),
                AssignedFreelancerYear = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.Year)
                    .FirstOrDefault(),
                AssignedFreelancerAverageRating = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.ReceivedProjectReviews.Any()
                        ? Math.Round(a.Freelancer.ReceivedProjectReviews.Average(r => (double)r.Rating), 2)
                        : 0)
                    .FirstOrDefault(),
                AssignedFreelancerCompletedProjectsCount = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.Projects.Count(p => p.Status == ProjectStatus.ApprovedByClient))
                    .FirstOrDefault(),
                AssignedFreelancerTotalReviews = j.Applications
                    .Where(a => a.Status == JobApplicationStatus.Accepted)
                    .Select(a => a.Freelancer.ReceivedProjectReviews.Count)
                    .FirstOrDefault(),
                CreatedAt = j.CreatedAt,
                UpdatedAt = j.UpdatedAt
            };
        }
    }
}
