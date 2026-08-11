// Services/Interface/IAuthService.cs
using Backend.Models;
using Backend.Models.DTOs;
using System.IO;

namespace Backend.Services.Interface
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<object> UploadProfilePhotoAsync(ProfilePhotoDto photoDto);
        Task<Stream?> GetProfilePhotoAsync(int userId);
        Task<UserProfileDto> GetUserProfileAsync(int userId);
        Task<UserProfileDto> UpdateUserProfileAsync(int userId, UpdateProfileDto updateProfileDto);
        string GenerateJwtToken(User user);
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }
}