namespace Backend.Models.Enums
{
    public enum FreelancerStatus
    {
        PendingVerification = 0,  // When verification request is pending
        Active = 1,               // Active freelancer
        Inactive = 2,             // Inactive freelancer
        Suspended = 3,            // Suspended by admin
        Rejected = 4              // If verification was rejected
    }
}