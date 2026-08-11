using Backend.Database;
using Backend.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Hubs
{
    [Authorize]
    public class ProjectChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ProjectChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task JoinProjectGroup(int projectId)
        {
            var userId = GetAuthenticatedUserId();
            if (userId <= 0)
            {
                throw new HubException("Invalid user token");
            }

            var user = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.Freelancer)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new HubException("User not found");
            }

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
            {
                throw new HubException("Project not found");
            }

            if (!CanAccessProject(user, project.ClientId, project.FreelancerId))
            {
                throw new HubException("You do not have access to this project");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(projectId));
        }

        public async Task LeaveProjectGroup(int projectId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(projectId));
        }

        private int GetAuthenticatedUserId()
        {
            return int.Parse(Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private static bool CanAccessProject(Models.User user, int clientId, int freelancerId)
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

        public static string GetGroupName(int projectId) => $"project-{projectId}";
    }
}
