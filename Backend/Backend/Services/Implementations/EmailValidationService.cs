using Backend.Services.Interface;
using Backend.Models.Enums;
using System.Text.RegularExpressions;

namespace Backend.Services.Implementations
{
    public class EmailValidationService : IEmailValidationService
    {
        private readonly HashSet<string> _educationalDomains = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "edu", "stud", "academy", "college", "university", "institute", "school", "faculty", "campus"
        };

        private readonly HashSet<string> _commonCountryCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "ru", "uk", "eg", "us", "ca", "au", "de", "fr", "it", "es",
            "jp", "cn", "in", "br", "mx", "za", "ng", "ke", "sa", "ae",
            "tr", "gr", "nl", "se", "no", "dk", "fi", "pl", "cz", "hu"
        };

        public bool IsValidEducationalEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var atIndex = email.LastIndexOf('@');
            if (atIndex <= 0 || atIndex == email.Length - 1)
                return false;

            var domain = email.Substring(atIndex + 1).ToLower();
            var domainParts = domain.Split('.');

            if (domainParts.Length < 2)
                return false;

            foreach (var part in domainParts)
            {
                if (_educationalDomains.Contains(part))
                    return true;
            }

            for (int i = 0; i < domainParts.Length - 1; i++)
            {
                if (_educationalDomains.Contains(domainParts[i]) &&
                    domainParts.Length > i + 1 &&
                    _commonCountryCodes.Contains(domainParts[i + 1]))
                {
                    return true;
                }

                if (i > 0 && _educationalDomains.Contains(domainParts[i - 1]) &&
                    domainParts.Length > i + 1 &&
                    _commonCountryCodes.Contains(domainParts[i + 1]))
                {
                    return true;
                }
            }

            return CheckSpecificPatterns(domain, domainParts);
        }

        private bool CheckSpecificPatterns(string domain, string[] domainParts)
        {
            if (domain.Contains(".edu."))
                return true;

            if (domain.StartsWith("stud."))
                return true;

            if (domain.Contains(".ac."))
                return true;

            if (domain.Contains(".sch."))
                return true;

            foreach (var part in domainParts)
            {
                if (part.Contains("edu") || part.Contains("stud") ||
                    part.Contains("univ") || part.Contains("college"))
                    return true;
            }

            return false;
        }

        public bool IsValidEmailForRole(string email, UserRole role)
        {
            return role switch
            {
                UserRole.Freelancer => IsValidEducationalEmail(email),
                UserRole.Client or UserRole.Admin => true,
                _ => false
            };
        }
    }
}