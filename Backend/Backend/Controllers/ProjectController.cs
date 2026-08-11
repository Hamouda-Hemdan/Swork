using Backend.Database;
using Backend.Hubs;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ProjectChatHub> _projectChatHub;
        private static readonly ConcurrentDictionary<int, DateTime> MockFundedProjects = new();
        private static readonly ConcurrentDictionary<int, DateTime> MockProjectDeadlines = new();

        public ProjectController(ApplicationDbContext context, IHubContext<ProjectChatHub> projectChatHub)
        {
            _context = context;
            _projectChatHub = projectChatHub;
        }

        [HttpPost("{id}/mock-payment/start")]
        [Authorize]
        public async Task<IActionResult> StartMockPayment(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .Include(p => p.JobApplication)
                    .Include(p => p.JobPost)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isClientOwner = user.Role == UserRole.Client && user.Client?.Id == project.ClientId;
                if (!isAdmin && !isClientOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only project client can start payment" });
                }

                var paymentAmount = ResolvePaymentAmount(project);
                var checkoutUrl = $"/payment/{project.Id}";
                return Ok(new
                {
                    projectId = project.Id,
                    checkoutUrl,
                    amount = paymentAmount,
                    mode = "payment"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("{id}/mock-payment/complete")]
        [Authorize]
        public async Task<IActionResult> CompleteMockPayment(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .Include(p => p.JobApplication)
                    .Include(p => p.JobPost)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isClientOwner = user.Role == UserRole.Client && user.Client?.Id == project.ClientId;
                if (!isAdmin && !isClientOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only project client can complete payment" });
                }

                MockFundedProjects[id] = DateTime.UtcNow;

                return Ok(new
                {
                    projectId = id,
                    isFunded = true,
                    fundedAt = MockFundedProjects[id],
                    message = "Payment marked as funded"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}/mock-payment/status")]
        [Authorize]
        public async Task<IActionResult> GetMockPaymentStatus(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .Include(p => p.JobApplication)
                    .Include(p => p.JobPost)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to this project" });
                }

                var isFunded = MockFundedProjects.ContainsKey(id);
                MockFundedProjects.TryGetValue(id, out var fundedAt);
                var paymentAmount = ResolvePaymentAmount(project);

                return Ok(new
                {
                    projectId = id,
                    isFunded,
                    fundedAt = isFunded ? fundedAt : (DateTime?)null,
                    checkoutUrl = $"/payment/{id}",
                    amount = paymentAmount,
                    mode = "payment"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("my-projects")]
        [Authorize]
        public async Task<IActionResult> GetMyProjects()
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
                    .Include(u => u.Freelancer)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                IQueryable<Project> query = _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .ThenInclude(c => c.User)
                    .Include(p => p.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(p => p.Review);

                if (user.Role == UserRole.Client && user.Client != null)
                {
                    query = query.Where(p => p.ClientId == user.Client.Id);
                }
                else if (user.Role == UserRole.Freelancer && user.Freelancer != null)
                {
                    query = query.Where(p => p.FreelancerId == user.Freelancer.Id);
                }
                else if (user.Role != UserRole.Admin)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to projects" });
                }

                var projects = await query
                    .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                    .Select(MapToDto())
                    .ToListAsync();

                return Ok(ApplyMockPaymentStatus(projects));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetProject(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .ThenInclude(c => c.User)
                    .Include(p => p.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(p => p.Review)
                    .Where(p => p.Id == id)
                    .Select(MapToDto())
                    .FirstOrDefaultAsync();

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to this project" });
                }

                return Ok(ApplyMockPaymentStatus(project));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateProjectStatus(int id, [FromBody] UpdateProjectStatusDto updateProjectStatusDto)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .Include(p => p.Review)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to this project" });
                }

                var isFreelancerOwner = user.Role == UserRole.Freelancer && user.Freelancer?.Id == project.FreelancerId;
                if (isFreelancerOwner && updateProjectStatusDto.Status != ProjectStatus.DoneByFreelancer)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Freelancers can only mark projects as done" });
                }

                if (isFreelancerOwner && project.Status != ProjectStatus.InProgress && project.Status != ProjectStatus.ChangesRequestedByClient)
                {
                    return BadRequest(new { message = "Freelancer can mark done only when project is in progress or after change request" });
                }

                var isClientOwner = user.Role == UserRole.Client && user.Client?.Id == project.ClientId;
                if (isClientOwner &&
                    updateProjectStatusDto.Status != ProjectStatus.ApprovedByClient &&
                    updateProjectStatusDto.Status != ProjectStatus.ChangesRequestedByClient)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Clients can only approve projects or request changes" });
                }

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ApprovedByClient && project.Status != ProjectStatus.DoneByFreelancer)
                {
                    return BadRequest(new { message = "Client can approve only after freelancer marks project done" });
                }

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ChangesRequestedByClient && project.Status != ProjectStatus.DoneByFreelancer)
                {
                    return BadRequest(new { message = "Client can request changes only after freelancer marks project done" });
                }

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ChangesRequestedByClient && string.IsNullOrWhiteSpace(updateProjectStatusDto.Comment))
                {
                    return BadRequest(new { message = "Please add a comment describing requested changes" });
                }

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ApprovedByClient && !MockFundedProjects.ContainsKey(project.Id))
                {
                    return BadRequest(new { message = "Payment is not funded yet. Complete payment checkout first." });
                }

                if (project.Status == ProjectStatus.ApprovedByClient && updateProjectStatusDto.Status != ProjectStatus.ApprovedByClient)
                {
                    return BadRequest(new { message = "Approved project status cannot be changed" });
                }

                project.Status = updateProjectStatusDto.Status;
                project.UpdatedAt = DateTime.UtcNow;

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ChangesRequestedByClient)
                {
                    var changeRequestMessage = new ProjectMessage
                    {
                        ProjectId = project.Id,
                        SenderUserId = user.Id,
                        Message = $"Change request: {updateProjectStatusDto.Comment!.Trim()}",
                        SentAt = DateTime.UtcNow
                    };

                    _context.ProjectMessages.Add(changeRequestMessage);
                }

                if (project.Status == ProjectStatus.ApprovedByClient)
                {
                    project.JobPost.Status = JobPostStatus.Completed;
                }
                else if (project.JobPost.Status == JobPostStatus.Completed)
                {
                    project.JobPost.Status = JobPostStatus.InProgress;
                }

                await _context.SaveChangesAsync();

                var updated = await _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .ThenInclude(c => c.User)
                    .Include(p => p.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(p => p.Review)
                    .Where(p => p.Id == project.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                if (isClientOwner && updateProjectStatusDto.Status == ProjectStatus.ChangesRequestedByClient)
                {
                    var latestChangeRequestMessage = await _context.ProjectMessages
                        .Include(m => m.SenderUser)
                        .Where(m => m.ProjectId == project.Id)
                        .OrderByDescending(m => m.SentAt)
                        .Select(MapMessageToDto())
                        .FirstOrDefaultAsync();

                    if (latestChangeRequestMessage != null)
                    {
                        await _projectChatHub.Clients
                            .Group(ProjectChatHub.GetGroupName(project.Id))
                            .SendAsync("projectMessageCreated", latestChangeRequestMessage);
                    }
                }

                return Ok(ApplyMockPaymentStatus(updated));
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        [HttpGet("{id}/messages")]
        [Authorize]
        public async Task<IActionResult> GetProjectMessages(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to this project" });
                }

                var messages = await _context.ProjectMessages
                    .Include(m => m.SenderUser)
                    .Where(m => m.ProjectId == id)
                    .OrderBy(m => m.SentAt)
                    .Select(MapMessageToDto())
                    .ToListAsync();

                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPost("{id}/messages")]
        [Authorize]
        public async Task<IActionResult> CreateProjectMessage(int id, [FromBody] CreateProjectMessageDto createProjectMessageDto)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have access to this project" });
                }

                var projectMessage = new ProjectMessage
                {
                    ProjectId = id,
                    SenderUserId = user.Id,
                    Message = createProjectMessageDto.Message.Trim(),
                    SentAt = DateTime.UtcNow
                };

                _context.ProjectMessages.Add(projectMessage);
                project.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var created = await _context.ProjectMessages
                    .Include(m => m.SenderUser)
                    .Where(m => m.Id == projectMessage.Id)
                    .Select(MapMessageToDto())
                    .FirstAsync();

                await _projectChatHub.Clients
                    .Group(ProjectChatHub.GetGroupName(id))
                    .SendAsync("projectMessageCreated", created);

                return Ok(created);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        [HttpPost("{id}/review")]
        [Authorize]
        public async Task<IActionResult> UpsertProjectReview(int id, [FromBody] UpsertProjectReviewDto upsertProjectReviewDto)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Review)
                    .Include(p => p.Client)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                if (project.Status != ProjectStatus.ApprovedByClient)
                {
                    return BadRequest(new { message = "Project must be approved by client before adding review" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isClientOwner = user.Role == UserRole.Client && user.Client?.Id == project.ClientId;

                if (!isAdmin && !isClientOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only project client can rate the freelancer" });
                }

                if (project.Review == null)
                {
                    project.Review = new ProjectReview
                    {
                        ProjectId = project.Id,
                        ClientId = project.ClientId,
                        FreelancerId = project.FreelancerId,
                        Rating = upsertProjectReviewDto.Rating,
                        Feedback = upsertProjectReviewDto.Feedback,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ProjectReviews.Add(project.Review);
                }
                else
                {
                    project.Review.Rating = upsertProjectReviewDto.Rating;
                    project.Review.Feedback = upsertProjectReviewDto.Feedback;
                    project.Review.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var updated = await _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .ThenInclude(c => c.User)
                    .Include(p => p.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(p => p.Review)
                    .Where(p => p.Id == project.Id)
                    .Select(MapToDto())
                    .FirstAsync();

                return Ok(ApplyMockPaymentStatus(updated));
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message;
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}{(string.IsNullOrWhiteSpace(innerMessage) ? string.Empty : $" | Details: {innerMessage}")}" });
            }
        }

        [HttpPut("{id}/deadline")]
        [Authorize]
        public async Task<IActionResult> SetProjectDeadline(int id, [FromBody] SetProjectDeadlineDto setProjectDeadlineDto)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .Include(p => p.Freelancer)
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var user = await GetAuthenticatedUserWithRoles();
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                var isAdmin = user.Role == UserRole.Admin;
                var isClientOwner = user.Role == UserRole.Client && user.Client?.Id == project.ClientId;

                if (!isAdmin && !isClientOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only project client can set deadline" });
                }

                if (setProjectDeadlineDto.DeadlineAt <= DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Deadline must be in the future" });
                }

                MockProjectDeadlines[id] = DateTime.SpecifyKind(setProjectDeadlineDto.DeadlineAt, DateTimeKind.Utc);
                project.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var updated = await _context.Projects
                    .Include(p => p.JobPost)
                    .Include(p => p.JobApplication)
                    .Include(p => p.Client)
                    .ThenInclude(c => c.User)
                    .Include(p => p.Freelancer)
                    .ThenInclude(f => f.User)
                    .Include(p => p.Review)
                    .Where(p => p.Id == id)
                    .Select(MapToDto())
                    .FirstAsync();

                return Ok(ApplyMockPaymentStatus(updated));
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

        private async Task<User?> GetAuthenticatedUserWithRoles()
        {
            var userId = GetAuthenticatedUserId();
            if (userId <= 0)
            {
                return null;
            }

            return await _context.Users
                .Include(u => u.Client)
                .Include(u => u.Freelancer)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        private static bool CanAccessProject(User user, int clientId, int freelancerId)
        {
            if (user.Role == UserRole.Admin)
            {
                return true;
            }

            if (user.Role == UserRole.Client && user.Client != null)
            {
                return user.Client.Id == clientId;
            }

            if (user.Role == UserRole.Freelancer && user.Freelancer != null)
            {
                return user.Freelancer.Id == freelancerId;
            }

            return false;
        }

        private static Expression<Func<Project, ProjectDto>> MapToDto()
        {
            return p => new ProjectDto
            {
                Id = p.Id,
                JobPostId = p.JobPostId,
                JobApplicationId = p.JobApplicationId,
                ClientId = p.ClientId,
                ClientUserId = p.Client.UserId,
                ClientName = p.Client.User.Name,
                FreelancerId = p.FreelancerId,
                FreelancerUserId = p.Freelancer.UserId,
                FreelancerName = p.Freelancer.User.Name,
                FreelancerAverageRating = p.Freelancer.ReceivedProjectReviews.Any()
                    ? Math.Round(p.Freelancer.ReceivedProjectReviews.Average(r => (double)r.Rating), 2)
                    : 0,
                FreelancerCompletedProjectsCount = p.Freelancer.Projects.Count(pr => pr.Status == ProjectStatus.ApprovedByClient),
                Title = p.Title,
                Description = p.Description,
                PaymentAmount = p.JobApplication.ProposedBudget ?? p.JobPost.Budget ?? 0,
                Status = p.Status,
                Review = p.Review == null
                    ? null
                    : new ProjectReviewDto
                    {
                        Id = p.Review.Id,
                        ProjectId = p.Review.ProjectId,
                        ClientId = p.Review.ClientId,
                        FreelancerId = p.Review.FreelancerId,
                        Rating = p.Review.Rating,
                        Feedback = p.Review.Feedback,
                        CreatedAt = p.Review.CreatedAt,
                        UpdatedAt = p.Review.UpdatedAt
                    },
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }

        private static List<ProjectDto> ApplyMockPaymentStatus(List<ProjectDto> projects)
        {
            foreach (var project in projects)
            {
                ApplyMockPaymentStatus(project);
            }

            return projects;
        }

        private static ProjectDto ApplyMockPaymentStatus(ProjectDto project)
        {
            var isFunded = MockFundedProjects.ContainsKey(project.Id);
            MockFundedProjects.TryGetValue(project.Id, out var fundedAt);
            MockProjectDeadlines.TryGetValue(project.Id, out var deadlineAt);

            project.IsMockPaymentFunded = isFunded;
            project.MockPaymentStatus = isFunded ? "Funded" : "Pending";
            project.MockPaymentFundedAt = isFunded ? fundedAt : null;
            project.DeadlineAt = deadlineAt == default ? null : deadlineAt;
            project.PaymentReleaseStatus = isFunded && project.Status == ProjectStatus.ApprovedByClient
                ? "Received"
                : "Pending";

            return project;
        }

        private static decimal ResolvePaymentAmount(Project project)
        {
            return project.JobApplication?.ProposedBudget ?? project.JobPost?.Budget ?? 0;
        }

        private static Expression<Func<ProjectMessage, ProjectMessageDto>> MapMessageToDto()
        {
            return m => new ProjectMessageDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                SenderUserId = m.SenderUserId,
                SenderName = m.SenderUser.Name,
                SenderRole = m.SenderUser.Role.ToString(),
                Message = m.Message,
                SentAt = m.SentAt
            };
        }
    }
}
