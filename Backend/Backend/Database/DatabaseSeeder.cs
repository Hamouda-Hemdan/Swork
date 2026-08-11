using Backend.Models;
using Backend.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Database
{
    public static class DatabaseSeeder
    {
        public static async Task SeedSampleDataAsync(ApplicationDbContext context)
        {
            const string seedMarkerEmail = "seed.client1@swork.local";
            if (await context.Users.AnyAsync(u => u.Email == seedMarkerEmail))
            {
                return;
            }

            var random = new Random();
            var now = DateTime.UtcNow;

            var clientUsers = new List<User>
            {
                CreateUser(seedMarkerEmail, "Seed Client 1", UserRole.Client),
                CreateUser("seed.client2@swork.local", "Seed Client 2", UserRole.Client),
                CreateUser("seed.client3@swork.local", "Seed Client 3", UserRole.Client)
            };

            var freelancerUsers = new List<User>
            {
                CreateUser("seed.freelancer1@swork.edu", "Seed Freelancer 1", UserRole.Freelancer),
                CreateUser("seed.freelancer2@swork.edu", "Seed Freelancer 2", UserRole.Freelancer),
                CreateUser("seed.freelancer3@swork.edu", "Seed Freelancer 3", UserRole.Freelancer),
                CreateUser("seed.freelancer4@swork.edu", "Seed Freelancer 4", UserRole.Freelancer),
                CreateUser("seed.freelancer5@swork.edu", "Seed Freelancer 5", UserRole.Freelancer),
                CreateUser("seed.freelancer6@swork.edu", "Seed Freelancer 6", UserRole.Freelancer)
            };

            context.Users.AddRange(clientUsers);
            context.Users.AddRange(freelancerUsers);
            await context.SaveChangesAsync();

            var clients = clientUsers.Select((u, i) => new Client
            {
                UserId = u.Id,
                Phone = $"+20110000000{i + 1}"
            }).ToList();

            context.Clients.AddRange(clients);
            await context.SaveChangesAsync();

            var departments = new[] { "Computer Science", "Software Engineering", "Design", "Marketing" };
            var freelancers = freelancerUsers.Select((u, i) => new Freelancer
            {
                UserId = u.Id,
                UniversityName = "SWork University",
                Year = ((i % 4) + 1).ToString(),
                Phone = $"+20120000000{i + 1}",
                EducationLevel = EducationLevel.Bachelor,
                Department = departments[i % departments.Length],
                Status = FreelancerStatus.Active
            }).ToList();

            context.Freelancers.AddRange(freelancers);
            await context.SaveChangesAsync();

            var resumes = freelancers.Select((f, i) => new Resume
            {
                FreelancerId = f.Id,
                Title = $"{freelancerUsers[i].Name} Resume",
                Description = "Sample resume for development testing",
                Skills = "React,ASP.NET Core,SQL,UI/UX",
                Experience = "[{\"title\":\"Freelance Project\",\"years\":1}]",
                Projects = "[{\"name\":\"Marketplace Demo\"}]",
                Education = "[{\"school\":\"SWork University\"}]",
                Certifications = "Agile Foundations",
                Languages = "English,Arabic",
                CreatedAt = now.AddDays(-random.Next(30, 120))
            }).ToList();

            context.Resumes.AddRange(resumes);
            await context.SaveChangesAsync();

            var categories = Enum.GetValues<JobPostCategory>();
            var jobPosts = new List<JobPost>();
            for (var i = 1; i <= 10; i++)
            {
                var client = clients[random.Next(clients.Count)];
                jobPosts.Add(new JobPost
                {
                    ClientId = client.Id,
                    Category = categories[random.Next(categories.Length)],
                    Title = $"Sample Job {i}: Build feature set #{i}",
                    RequiredSkills = "React,ASP.NET Core,SignalR",
                    Description = "Sample seeded job for QA and demo. Deliver clean code and short documentation.",
                    Location = i % 2 == 0 ? "Remote" : "Cairo",
                    Budget = random.Next(100, 800),
                    Status = JobPostStatus.Open,
                    CreatedAt = now.AddDays(-random.Next(1, 20))
                });
            }

            context.JobPosts.AddRange(jobPosts);
            await context.SaveChangesAsync();

            var applications = new List<JobApplication>();
            foreach (var job in jobPosts)
            {
                var applicantPool = freelancers
                    .OrderBy(_ => random.Next())
                    .Take(random.Next(2, 5))
                    .ToList();

                foreach (var freelancer in applicantPool)
                {
                    var resume = resumes.First(r => r.FreelancerId == freelancer.Id);
                    applications.Add(new JobApplication
                    {
                        JobPostId = job.Id,
                        FreelancerId = freelancer.Id,
                        ResumeId = resume.Id,
                        CoverLetter = "Hi, I have relevant experience and can deliver on time.",
                        ProposedBudget = job.Budget.HasValue ? job.Budget.Value - random.Next(0, 40) : random.Next(80, 500),
                        Status = JobApplicationStatus.Pending,
                        AppliedAt = now.AddDays(-random.Next(0, 15))
                    });
                }
            }

            context.JobApplications.AddRange(applications);
            await context.SaveChangesAsync();

            var projects = new List<Project>();
            var projectMessages = new List<ProjectMessage>();
            var projectReviews = new List<ProjectReview>();

            var jobsForProjects = jobPosts.Take(4).ToList();
            for (var i = 0; i < jobsForProjects.Count; i++)
            {
                var job = jobsForProjects[i];
                var appsForJob = applications.Where(a => a.JobPostId == job.Id).ToList();
                if (!appsForJob.Any())
                {
                    continue;
                }

                var accepted = appsForJob[0];
                accepted.Status = JobApplicationStatus.Accepted;
                accepted.UpdatedAt = now;

                foreach (var rejected in appsForJob.Skip(1))
                {
                    rejected.Status = JobApplicationStatus.Rejected;
                    rejected.UpdatedAt = now;
                }

                var status = i switch
                {
                    0 => ProjectStatus.InProgress,
                    1 => ProjectStatus.DoneByFreelancer,
                    2 => ProjectStatus.ApprovedByClient,
                    _ => ProjectStatus.ApprovedByClient
                };

                job.Status = status == ProjectStatus.ApprovedByClient
                    ? JobPostStatus.Completed
                    : JobPostStatus.InProgress;

                var project = new Project
                {
                    JobPostId = job.Id,
                    JobApplicationId = accepted.Id,
                    ClientId = job.ClientId,
                    FreelancerId = accepted.FreelancerId,
                    Title = job.Title,
                    Description = job.Description,
                    Status = status,
                    CreatedAt = now.AddDays(-random.Next(1, 10)),
                    UpdatedAt = now
                };

                projects.Add(project);
            }

            context.Projects.AddRange(projects);
            await context.SaveChangesAsync();

            foreach (var project in projects)
            {
                var clientUserId = clients.First(c => c.Id == project.ClientId).UserId;
                var freelancerUserId = freelancers.First(f => f.Id == project.FreelancerId).UserId;

                projectMessages.Add(new ProjectMessage
                {
                    ProjectId = project.Id,
                    SenderUserId = clientUserId,
                    Message = "Welcome! Let's align on milestones.",
                    SentAt = now.AddHours(-8)
                });

                projectMessages.Add(new ProjectMessage
                {
                    ProjectId = project.Id,
                    SenderUserId = freelancerUserId,
                    Message = "Sure, I will send first update by tomorrow.",
                    SentAt = now.AddHours(-6)
                });

                projectMessages.Add(new ProjectMessage
                {
                    ProjectId = project.Id,
                    SenderUserId = clientUserId,
                    Message = "Great, thank you.",
                    SentAt = now.AddHours(-5)
                });

                if (project.Status == ProjectStatus.ApprovedByClient)
                {
                    projectReviews.Add(new ProjectReview
                    {
                        ProjectId = project.Id,
                        ClientId = project.ClientId,
                        FreelancerId = project.FreelancerId,
                        Rating = random.Next(4, 6),
                        Feedback = "Good communication and clean delivery.",
                        CreatedAt = now.AddDays(-1)
                    });
                }
            }

            context.ProjectMessages.AddRange(projectMessages);
            context.ProjectReviews.AddRange(projectReviews);
            await context.SaveChangesAsync();
        }

        private static User CreateUser(string email, string name, UserRole role)
        {
            return new User
            {
                Email = email,
                Name = name,
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
