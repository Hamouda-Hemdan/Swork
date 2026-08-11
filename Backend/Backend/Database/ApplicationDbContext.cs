﻿using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Database
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Freelancer> Freelancers { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Resume> Resumes { get; set; }
        public DbSet<JobPost> JobPosts { get; set; }
        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMessage> ProjectMessages { get; set; }
        public DbSet<ProjectReview> ProjectReviews { get; set; }
        public DbSet<FreelancerVerificationRequest> FreelancerVerificationRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Client>()
                .HasOne(c => c.User)
                .WithOne(u => u.Client)
                .HasForeignKey<Client>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Freelancer>()
                .HasOne(f => f.User)
                .WithOne(u => u.Freelancer)
                .HasForeignKey<Freelancer>(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Admin>()
                .HasOne(a => a.User)
                .WithOne(u => u.Admin)
                .HasForeignKey<Admin>(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure string lengths
            modelBuilder.Entity<Client>()
                .Property(c => c.Phone)
                .HasMaxLength(20)
                .IsRequired();
                
            // Configure Freelancer document fields
            modelBuilder.Entity<Freelancer>()
                .Property(f => f.DocumentFileName)
                .HasMaxLength(255);
                
            modelBuilder.Entity<Freelancer>()
                .Property(f => f.DocumentPath)
                .HasMaxLength(500);
                
            // Configure default value for DocumentStatus
            modelBuilder.Entity<Freelancer>()
                .Property(f => f.DocumentStatus)
                .HasDefaultValue(Backend.Models.Enums.DocumentStatus.Pending);
                
            // Configure default value for EducationLevel
            modelBuilder.Entity<Freelancer>()
                .Property(f => f.EducationLevel)
                .HasDefaultValue(Backend.Models.Enums.EducationLevel.Bachelor);
                
            // Configure default value for Status
            modelBuilder.Entity<Freelancer>()
                .Property(f => f.Status)
                .HasDefaultValue(Backend.Models.Enums.FreelancerStatus.Active);
                
            // Configure User profile photo fields
            modelBuilder.Entity<User>()
                .Property(u => u.ProfilePhotoFileName)
                .HasMaxLength(255);
                
            modelBuilder.Entity<User>()
                .Property(u => u.ProfilePhotoPath)
                .HasMaxLength(500);
                
            // Configure Resume entity relationship with Freelancer
            modelBuilder.Entity<Resume>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.Resumes)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<JobPost>()
                .HasOne(j => j.Client)
                .WithMany()
                .HasForeignKey(j => j.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
 
            modelBuilder.Entity<JobPost>()
                .Property(j => j.Budget)
                .HasPrecision(18, 2);

            modelBuilder.Entity<JobPost>()
                .Property(j => j.RequiredSkills)
                .HasMaxLength(1000)
                .IsRequired();
 
            modelBuilder.Entity<JobPost>()
                .Property(j => j.Status)
                .HasDefaultValue(Backend.Models.Enums.JobPostStatus.Open);
                
            modelBuilder.Entity<JobApplication>()
                .HasOne(a => a.JobPost)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobPostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<JobApplication>()
                .HasOne(a => a.Freelancer)
                .WithMany(f => f.Applications)
                .HasForeignKey(a => a.FreelancerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobApplication>()
                .HasOne(a => a.Resume)
                .WithMany()
                .HasForeignKey(a => a.ResumeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobApplication>()
                .Property(a => a.Status)
                .HasDefaultValue(Backend.Models.Enums.JobApplicationStatus.Pending);

            modelBuilder.Entity<JobApplication>()
                .Property(a => a.CoverLetter)
                .HasMaxLength(2000)
                .IsRequired();

            modelBuilder.Entity<JobApplication>()
                .Property(a => a.ProposedBudget)
                .HasPrecision(18, 2);

            modelBuilder.Entity<JobApplication>()
                .HasIndex(a => new { a.JobPostId, a.FreelancerId })
                .IsUnique();

            modelBuilder.Entity<Project>()
                .HasOne(p => p.JobPost)
                .WithMany()
                .HasForeignKey(p => p.JobPostId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.JobApplication)
                .WithMany()
                .HasForeignKey(p => p.JobApplicationId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Freelancer)
                .WithMany(f => f.Projects)
                .HasForeignKey(p => p.FreelancerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Project>()
                .Property(p => p.Status)
                .HasDefaultValue(Backend.Models.Enums.ProjectStatus.InProgress);

            modelBuilder.Entity<Project>()
                .HasIndex(p => p.JobApplicationId)
                .IsUnique();

            modelBuilder.Entity<ProjectMessage>()
                .HasOne(m => m.Project)
                .WithMany(p => p.Messages)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectMessage>()
                .HasOne(m => m.SenderUser)
                .WithMany()
                .HasForeignKey(m => m.SenderUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProjectReview>()
                .HasOne(r => r.Project)
                .WithOne(p => p.Review)
                .HasForeignKey<ProjectReview>(r => r.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectReview>()
                .HasOne(r => r.Client)
                .WithMany()
                .HasForeignKey(r => r.ClientId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProjectReview>()
                .HasOne(r => r.Freelancer)
                .WithMany(f => f.ReceivedProjectReviews)
                .HasForeignKey(r => r.FreelancerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProjectReview>()
                .HasIndex(r => r.ProjectId)
                .IsUnique();

            // Configure FreelancerVerificationRequest entity relationships
            modelBuilder.Entity<FreelancerVerificationRequest>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
                
            modelBuilder.Entity<FreelancerVerificationRequest>()
                .HasOne(r => r.ProcessedByAdmin)
                .WithMany()
                .HasForeignKey(r => r.ProcessedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}