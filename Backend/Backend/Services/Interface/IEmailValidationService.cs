using Backend.Models.Enums;

namespace Backend.Services.Interface
{
    public interface IEmailValidationService
    {
        bool IsValidEducationalEmail(string email);
        bool IsValidEmailForRole(string email, UserRole role);
    }
}