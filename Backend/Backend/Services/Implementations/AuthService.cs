﻿using Backend.Database;
using Backend.Models;
using Backend.Models.DTOs;
using Backend.Models.Enums;
using Backend.Services.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailValidationService _emailValidationService;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IEmailValidationService emailValidationService)
        {
            _context = context;
            _configuration = configuration;
            _emailValidationService = emailValidationService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                throw new Exception("User with this email already exists");
            }

            // Validate email based on role
            if (!_emailValidationService.IsValidEmailForRole(registerDto.Email, registerDto.Role))
            {
                throw new Exception($"Invalid email for {registerDto.Role} role. Freelancers must use educational email addresses.");
            }

            // Validate role-specific required fields
            ValidateRoleSpecificData(registerDto);

            // Create user
            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = HashPassword(registerDto.Password),
                Role = registerDto.Role,
                Name = registerDto.Name, // Added name to user entity
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create role-specific data
            await CreateRoleSpecificData(user.Id, registerDto);

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role.ToString(),
                Expires = DateTime.UtcNow.AddHours(24)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                throw new Exception("Invalid email or password");
            }

            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role.ToString(),
                Expires = DateTime.UtcNow.AddHours(24)
            };
        }

        public async Task<object> UploadProfilePhotoAsync(ProfilePhotoDto photoDto)
        {
            // Find the user
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == photoDto.UserId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Process the uploaded file
            if (photoDto.PhotoFile == null || photoDto.PhotoFile.Length == 0)
            {
                throw new Exception("No photo file provided");
            }

            // Validate file size (5MB limit)
            if (photoDto.PhotoFile.Length > 5 * 1024 * 1024)
            {
                throw new Exception("File size exceeds 5MB limit");
            }

            // Validate file type (only allow common image formats)
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(photoDto.PhotoFile.ContentType))
            {
                throw new Exception("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
            }

            // Save photo and update user entity
            await SaveUserProfilePhotoAsync(user, photoDto.PhotoFile);

            // Save changes to database
            await _context.SaveChangesAsync();

            return new { Message = "Profile photo uploaded successfully", User = user };
        }
        
        public async Task<Stream?> GetProfilePhotoAsync(int userId)
        {
            // Find the user
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Check if user has a profile photo
            if (string.IsNullOrEmpty(user.ProfilePhotoPath) || !File.Exists(user.ProfilePhotoPath))
            {
                return null;
            }

            // Return file stream
            return new FileStream(user.ProfilePhotoPath, FileMode.Open, FileAccess.Read);
        }

        public async Task<UserProfileDto> GetUserProfileAsync(int userId)
        {
            // Find the user with related data
            var user = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.Freelancer)
                    .ThenInclude(f => f.Resumes)
                .Include(u => u.Admin)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Create profile DTO
            var profileDto = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProfilePhotoFileName = user.ProfilePhotoFileName,
                ProfilePhotoFileSize = user.ProfilePhotoFileSize,
                ProfilePhotoUploadDate = user.ProfilePhotoUploadDate
            };

            // Map role-specific data
            switch (user.Role)
            {
                case UserRole.Client:
                    if (user.Client != null)
                    {
                        profileDto.Client = new ClientProfileDto
                        {
                            Phone = user.Client.Phone ?? string.Empty
                        };
                    }
                    break;

                case UserRole.Freelancer:
                    if (user.Freelancer != null)
                    {
                        profileDto.Freelancer = new FreelancerProfileDto
                        {
                            UniversityName = user.Freelancer.UniversityName ?? string.Empty,
                            Year = user.Freelancer.Year ?? string.Empty,
                            Phone = user.Freelancer.Phone ?? string.Empty,
                            Department = user.Freelancer.Department ?? string.Empty,
                            EducationLevel = user.Freelancer.EducationLevel,
                            Status = user.Freelancer.Status,
                            DocumentFileName = user.Freelancer.DocumentFileName,
                            DocumentFileSize = user.Freelancer.DocumentFileSize,
                            DocumentUploadDate = user.Freelancer.DocumentUploadDate,
                            DocumentStatus = user.Freelancer.DocumentStatus,
                            Resumes = user.Freelancer.Resumes?.Select(r => new ResumeDto
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
                            }).ToList()
                        };
                    }
                    break;

                case UserRole.Admin:
                    if (user.Admin != null)
                    {
                        profileDto.Admin = new AdminProfileDto
                        {
                            Department = user.Admin.Department ?? string.Empty
                        };
                    }
                    break;
            }

            return profileDto;
        }

        public async Task<UserProfileDto> UpdateUserProfileAsync(int userId, UpdateProfileDto updateProfileDto)
        {
            // Find the user with related data
            var user = await _context.Users
                .Include(u => u.Client)
                .Include(u => u.Freelancer)
                    .ThenInclude(f => f.Resumes)
                .Include(u => u.Admin)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Update common user fields
            if (!string.IsNullOrEmpty(updateProfileDto.Name))
            {
                user.Name = updateProfileDto.Name;
            }

            // Update role-specific fields
            switch (user.Role)
            {
                case UserRole.Client:
                    if (user.Client != null && !string.IsNullOrEmpty(updateProfileDto.Phone))
                    {
                        user.Client.Phone = updateProfileDto.Phone;
                    }
                    break;

                case UserRole.Freelancer:
                    if (user.Freelancer != null)
                    {
                        if (!string.IsNullOrEmpty(updateProfileDto.UniversityName))
                        {
                            user.Freelancer.UniversityName = updateProfileDto.UniversityName;
                        }
                        if (!string.IsNullOrEmpty(updateProfileDto.Year))
                        {
                            user.Freelancer.Year = updateProfileDto.Year;
                        }
                        if (!string.IsNullOrEmpty(updateProfileDto.FreelancerPhone))
                        {
                            user.Freelancer.Phone = updateProfileDto.FreelancerPhone;
                        }
                        if (!string.IsNullOrEmpty(updateProfileDto.Department))
                        {
                            user.Freelancer.Department = updateProfileDto.Department;
                        }
                        if (updateProfileDto.EducationLevel.HasValue)
                        {
                            user.Freelancer.EducationLevel = updateProfileDto.EducationLevel.Value;
                        }
                    }
                    break;

                case UserRole.Admin:
                    if (user.Admin != null && !string.IsNullOrEmpty(updateProfileDto.Department))
                    {
                        user.Admin.Department = updateProfileDto.Department;
                    }
                    break;
            }

            // Save changes to database
            await _context.SaveChangesAsync();

            // Return updated profile
            return await GetUserProfileAsync(userId);
        }

        private async Task SaveUserProfilePhotoAsync(User user, IFormFile photoFile)
        {
            // Generate unique file name
            var extension = Path.GetExtension(photoFile.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}_{photoFile.FileName}";

            // Define file path (in a real application, you might want to store this in a cloud storage)
            var uploadsFolder = Path.Combine("wwwroot", "profile-photos");

            // Ensure directory exists
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await photoFile.CopyToAsync(stream);
            }

            // Update user entity with photo information
            user.ProfilePhotoPath = filePath;
            user.ProfilePhotoFileName = photoFile.FileName;
            user.ProfilePhotoFileSize = photoFile.Length;
            user.ProfilePhotoUploadDate = DateTime.UtcNow;
        }

        private void ValidateRoleSpecificData(RegisterDto registerDto)
        {
            // Name is now validated for all roles in the DTO

            switch (registerDto.Role)
            {
                case UserRole.Client:
                    if (string.IsNullOrEmpty(registerDto.Phone))
                        throw new Exception("Phone number is required for clients");
                    break;

                case UserRole.Freelancer:
                    if (string.IsNullOrEmpty(registerDto.UniversityName))
                        throw new Exception("University name is required for freelancers");
                    if (string.IsNullOrEmpty(registerDto.Year))
                        throw new Exception("Year is required for freelancers");
                    if (string.IsNullOrEmpty(registerDto.FreelancerPhone))
                        throw new Exception("Phone number is required for freelancers");
                    if (string.IsNullOrEmpty(registerDto.FreelancerDepartment))
                        throw new Exception("Department is required for freelancers");
                    // Document is not required at registration but can be uploaded
                    break;

                case UserRole.Admin:
                    // Only name is required for admin
                    break;
            }
        }

        private async Task CreateRoleSpecificData(int userId, RegisterDto registerDto)
        {
            switch (registerDto.Role)
            {
                case UserRole.Client:
                    var client = new Client
                    {
                        UserId = userId,
                        Phone = registerDto.Phone!
                    };
                    _context.Clients.Add(client);
                    break;

                case UserRole.Freelancer:
                    // For freelancers, create a verification request instead of a freelancer directly
                    var verificationRequest = new FreelancerVerificationRequest
                    {
                        UserId = userId,
                        UniversityName = registerDto.UniversityName!,
                        Year = registerDto.Year!,
                        Phone = registerDto.FreelancerPhone!,
                        Department = registerDto.FreelancerDepartment!, // Make required
                        EducationLevel = EducationLevel.Bachelor // Default to Bachelor
                    };

                    // Handle document upload if provided during registration
                    if (!string.IsNullOrEmpty(registerDto.DocumentBase64) && 
                        !string.IsNullOrEmpty(registerDto.DocumentFileName))
                    {
                        try
                        {
                            // Save document and update verification request entity
                            await SaveFreelancerDocumentAsyncForVerification(verificationRequest, registerDto.DocumentBase64, registerDto.DocumentFileName);
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail registration
                            // In a production environment, you'd want to log this properly
                            Console.WriteLine($"Document upload failed: {ex.Message}");
                        }
                    }

                    _context.FreelancerVerificationRequests.Add(verificationRequest);
                    break;

                case UserRole.Admin:
                    var admin = new Admin
                    {
                        UserId = userId,
                        Department = registerDto.Department ?? string.Empty
                    };
                    _context.Admins.Add(admin);
                    break;
            }

            await _context.SaveChangesAsync();
        }

        private async Task SaveFreelancerDocumentAsyncForVerification(FreelancerVerificationRequest verificationRequest, string base64Document, string fileName)
        {
            try
            {
                // Remove data URI prefix if present
                var base64Data = base64Document;
                var mediaType = "application/pdf"; // default

                if (base64Document.StartsWith("data:"))
                {
                    var dataIndex = base64Document.IndexOf(";base64,");
                    if (dataIndex > 0)
                    {
                        mediaType = base64Document.Substring(5, dataIndex - 5); // Skip "data:"
                        base64Data = base64Document.Substring(dataIndex + 8); // Skip ";base64,"
                    }
                }

                // Validate file type (only allow PDF, DOC, DOCX, JPG, PNG)
                var allowedTypes = new[] { 
                    "application/pdf", 
                    "application/msword", 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "image/jpeg", 
                    "image/png" 
                };
                if (!allowedTypes.Contains(mediaType))
                {
                    throw new Exception("Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed.");
                }

                // Convert base64 to bytes
                var fileBytes = Convert.FromBase64String(base64Data);

                // Validate file size (limit to 5MB)
                if (fileBytes.Length > 5 * 1024 * 1024)
                {
                    throw new Exception("File size exceeds 5MB limit.");
                }

                // Generate unique file name
                var extension = GetFileExtension(mediaType);
                var uniqueFileName = $"{Guid.NewGuid()}_{fileName}{extension}";

                // Define file path (in a real application, you might want to store this in a cloud storage)
                var uploadsFolder = Path.Combine("wwwroot", "documents", "freelancers");

                // Ensure directory exists
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                await File.WriteAllBytesAsync(filePath, fileBytes);

                // Update verification request entity with document information
                verificationRequest.DocumentPath = filePath;
                verificationRequest.DocumentFileName = fileName;
                verificationRequest.DocumentFileSize = fileBytes.Length;
                verificationRequest.DocumentUploadDate = DateTime.UtcNow;
                // DocumentStatus remains Pending by default until manually updated
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save document: {ex.Message}");
            }
        }

        private async Task SaveFreelancerDocumentAsync(Freelancer freelancer, string base64Document, string fileName)
        {
            try
            {
                // Remove data URI prefix if present
                var base64Data = base64Document;
                var mediaType = "application/pdf"; // default

                if (base64Document.StartsWith("data:"))
                {
                    var dataIndex = base64Document.IndexOf(";base64,");
                    if (dataIndex > 0)
                    {
                        mediaType = base64Document.Substring(5, dataIndex - 5); // Skip "data:"
                        base64Data = base64Document.Substring(dataIndex + 8); // Skip ";base64,"
                    }
                }

                // Validate file type (only allow PDF, DOC, DOCX, JPG, PNG)
                var allowedTypes = new[] { 
                    "application/pdf", 
                    "application/msword", 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "image/jpeg", 
                    "image/png" 
                };
                if (!allowedTypes.Contains(mediaType))
                {
                    throw new Exception("Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed.");
                }

                // Convert base64 to bytes
                var fileBytes = Convert.FromBase64String(base64Data);

                // Validate file size (limit to 5MB)
                if (fileBytes.Length > 5 * 1024 * 1024)
                {
                    throw new Exception("File size exceeds 5MB limit.");
                }

                // Generate unique file name
                var extension = GetFileExtension(mediaType);
                var uniqueFileName = $"{Guid.NewGuid()}_{fileName}{extension}";

                // Define file path (in a real application, you might want to store this in a cloud storage)
                var uploadsFolder = Path.Combine("wwwroot", "documents", "freelancers");

                // Ensure directory exists
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                await File.WriteAllBytesAsync(filePath, fileBytes);

                // Update freelancer entity with document information
                freelancer.DocumentPath = filePath;
                freelancer.DocumentFileName = fileName;
                freelancer.DocumentFileSize = fileBytes.Length;
                freelancer.DocumentUploadDate = DateTime.UtcNow;
                // DocumentStatus remains Pending by default until manually updated
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save document: {ex.Message}");
            }
        }

        private string GetFileExtension(string mediaType)
        {
            return mediaType switch
            {
                "application/pdf" => ".pdf",
                "application/msword" => ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                _ => ".dat" // default extension
            };
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var expirationMinutes = int.Parse(jwtSettings["ExpirationInMinutes"] ?? "60");

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
    }
}