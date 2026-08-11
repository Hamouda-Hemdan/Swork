using Backend.Models.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnumsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAllEnums()
        {
            var enums = new
            {
                UserRoles = Enum.GetValues<UserRole>()
                    .Cast<UserRole>()
                    .ToDictionary(e => e.ToString(), e => (int)e),
                DocumentStatuses = Enum.GetValues<DocumentStatus>()
                    .Cast<DocumentStatus>()
                    .ToDictionary(e => e.ToString(), e => (int)e),
                EducationLevels = Enum.GetValues<EducationLevel>()
                    .Cast<EducationLevel>()
                    .ToDictionary(e => e.ToString(), e => (int)e)
            };

            return Ok(enums);
        }

        [HttpGet("user-roles")]
        public IActionResult GetUserRoles()
        {
            var userRoles = Enum.GetValues<UserRole>()
                .Cast<UserRole>()
                .ToDictionary(e => e.ToString(), e => (int)e);

            return Ok(userRoles);
        }

        [HttpGet("document-statuses")]
        public IActionResult GetDocumentStatuses()
        {
            var documentStatuses = Enum.GetValues<DocumentStatus>()
                .Cast<DocumentStatus>()
                .ToDictionary(e => e.ToString(), e => (int)e);

            return Ok(documentStatuses);
        }

        [HttpGet("education-levels")]
        public IActionResult GetEducationLevels()
        {
            var educationLevels = Enum.GetValues<EducationLevel>()
                .Cast<EducationLevel>()
                .ToDictionary(e => e.ToString(), e => (int)e);

            return Ok(educationLevels);
        }
    }
}