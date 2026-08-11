﻿// Controllers/AuthController.cs
using Backend.Models.DTOs;
using Backend.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var result = await _authService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
        
        [HttpGet("profile")]
        [Authorize] // Requires authentication
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                // Get user ID from JWT token
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }
                
                var profile = await _authService.GetUserProfileAsync(userId);
                return Ok(profile);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpGet("profile-photo")]
        [Authorize] // Requires authentication
        public async Task<IActionResult> GetProfilePhoto()
        {
            try
            {
                // Get user ID from JWT token
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }
                
                var photoStream = await _authService.GetProfilePhotoAsync(userId);
                if (photoStream == null)
                {
                    return NotFound(new { message = "Profile photo not found" });
                }
                
                return File(photoStream, "image/jpeg");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpPut("profile")]
        [Authorize] // Requires authentication
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfileDto updateProfileDto)
        {
            try
            {
                // Get user ID from JWT token
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }
                
                var updatedProfile = await _authService.UpdateUserProfileAsync(userId, updateProfileDto);
                return Ok(updatedProfile);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        [HttpPut("profile-photo")]
        [Authorize] // Requires authentication
        public async Task<IActionResult> UpdateProfilePhoto([FromForm] ProfilePhotoDto photoDto)
        {
            try
            {
                // Get user ID from JWT token
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                if (userId <= 0)
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }
                
                // Set the user ID in the DTO
                photoDto.UserId = userId;
                
                var result = await _authService.UploadProfilePhotoAsync(photoDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}