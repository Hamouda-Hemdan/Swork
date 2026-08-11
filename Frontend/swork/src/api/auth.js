import axios from "axios";

export const API_BASE_URL = "https://localhost:7139/api";
export const HUB_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },

  httpsAgent: {
    rejectUnauthorized: false,
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const roleClaimKey =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const userIdClaimKey =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

export const getTokenPayload = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};

export const setProjectDeadline = async (id, deadlineAt) => {
  try {
    const response = await apiClient.put(`/Project/${id}/deadline`, {
      deadlineAt,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUserRole = () => {
  const payload = getTokenPayload();
  return payload?.[roleClaimKey] ?? null;
};

export const getCurrentUserId = () => {
  const payload = getTokenPayload();
  return Number(payload?.[userIdClaimKey] ?? 0);
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/Auth/register", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post("/Auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("token");

  window.dispatchEvent(new Event("storage"));
  window.location.href = "/login";
};

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/Auth/profile");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put("/Auth/profile", profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfilePhoto = async (formData) => {
  try {
    const uploadClient = axios.create({
      baseURL: "https://localhost:7139/api",
      timeout: 30000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      httpsAgent: {
        rejectUnauthorized: false,
      },
    });

    const token = localStorage.getItem("token");
    if (token) {
      uploadClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const response = await uploadClient.put("/Auth/profile-photo", formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProfilePhoto = async () => {
  try {
    const imageClient = axios.create({
      baseURL: "https://localhost:7139/api",
      responseType: "blob",
      httpsAgent: {
        rejectUnauthorized: false,
      },
    });

    const token = localStorage.getItem("token");
    if (token) {
      imageClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const response = await imageClient.get("/Auth/profile-photo");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEducationLevels = async () => {
  try {
    const response = await apiClient.get("/Enums/education-levels");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPublicFreelancers = async () => {
  try {
    const response = await apiClient.get("/Freelancer/public");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getJobPostCategories = async () => {
  try {
    const response = await apiClient.get("/JobPost/categories");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getJobPosts = async () => {
  try {
    const response = await apiClient.get("/JobPost");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyJobPosts = async () => {
  try {
    const response = await apiClient.get("/JobPost/my-posts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getJobPostById = async (id) => {
  try {
    const response = await apiClient.get(`/JobPost/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createJobPost = async (jobPostData) => {
  try {
    const response = await apiClient.post("/JobPost", jobPostData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateJobPost = async (id, jobPostData) => {
  try {
    const response = await apiClient.put(`/JobPost/${id}`, jobPostData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteJobPost = async (id) => {
  try {
    const response = await apiClient.delete(`/JobPost/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Job Application API functions
export const getJobPostApplications = async (jobPostId) => {
  try {
    const response = await apiClient.get(
      `/JobApplication/job/${jobPostId}/applications`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyApplicationForJob = async (jobPostId) => {
  try {
    const response = await apiClient.get(
      `/JobApplication/job/${jobPostId}/my-application`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyApplications = async () => {
  try {
    const response = await apiClient.get("/JobApplication/my-applications");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createJobApplication = async (applicationData) => {
  try {
    const response = await apiClient.post("/JobApplication", applicationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateJobApplicationStatus = async (id, status) => {
  try {
    // Map string status to enum integer: Pending=1, Accepted=2, Rejected=3
    const statusMap = {
      Pending: 1,
      Accepted: 2,
      Rejected: 3,
    };
    const statusValue = typeof status === "string" ? statusMap[status] : status;
    const response = await apiClient.put(`/JobApplication/${id}/status`, {
      status: statusValue,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Project API functions
export const getMyProjects = async () => {
  try {
    const response = await apiClient.get("/Project/my-projects");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await apiClient.get(`/Project/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProjectStatus = async (id, status, comment = null) => {
  try {
    const statusMap = {
      InProgress: 1,
      DoneByFreelancer: 2,
      ApprovedByClient: 3,
      OnHold: 4,
      Cancelled: 5,
      ChangesRequestedByClient: 6,
    };
    const statusValue = typeof status === "string" ? statusMap[status] : status;
    const response = await apiClient.put(`/Project/${id}/status`, {
      status: statusValue,
      comment,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectMessages = async (id) => {
  try {
    const response = await apiClient.get(`/Project/${id}/messages`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendProjectMessage = async (id, message) => {
  try {
    const response = await apiClient.post(`/Project/${id}/messages`, {
      message,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const upsertProjectReview = async (id, reviewData) => {
  try {
    const response = await apiClient.post(`/Project/${id}/review`, reviewData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMockProjectPaymentStatus = async (id) => {
  try {
    const response = await apiClient.get(`/Project/${id}/mock-payment/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const startMockProjectPayment = async (id) => {
  try {
    const response = await apiClient.post(`/Project/${id}/mock-payment/start`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeMockProjectPayment = async (id) => {
  try {
    const response = await apiClient.post(
      `/Project/${id}/mock-payment/complete`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Resume API functions
export const getMyResumes = async () => {
  try {
    const response = await apiClient.get("/Resume/my-resumes");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createResume = async (resumeData) => {
  try {
    const response = await apiClient.post("/Resume", resumeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateResume = async (id, resumeData) => {
  try {
    const response = await apiClient.put(`/Resume/${id}`, resumeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteResume = async (id) => {
  try {
    const response = await apiClient.delete(`/Resume/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getResumeById = async (id) => {
  try {
    const response = await apiClient.get(`/Resume/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Skills API functions
export const getSkills = async (query = "") => {
  // This is a mock implementation with common skills
  // In a real implementation, this would call an external API

  // Common skills database
  const skillsDatabase = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "C#",
    "PHP",
    "Ruby",
    "Go",
    "HTML",
    "CSS",
    "SASS",
    "TypeScript",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "AWS",
    "Azure",
    "Google Cloud",
    "Docker",
    "Kubernetes",
    "Git",
    "Jenkins",
    "Agile",
    "Scrum",
    "Project Management",
    "Leadership",
    "Communication",
    "Design",
    "UI/UX",
    "Photoshop",
    "Illustrator",
    "Figma",
    "Adobe XD",
    "Data Analysis",
    "Machine Learning",
    "AI",
    "Deep Learning",
    "Statistics",
    "Marketing",
    "SEO",
    "Social Media",
    "Content Writing",
    "Copywriting",
    "Sales",
    "Customer Service",
    "Accounting",
    "Finance",
    "Bookkeeping",
    "Translation",
    "Research",
    "Writing",
    "Editing",
    "Proofreading",
    "Mobile Development",
    "iOS",
    "Android",
    "Swift",
    "Kotlin",
    "Flutter",
    "React Native",
    "DevOps",
    "CI/CD",
    "Linux",
    "Windows",
    "MacOS",
    "Networking",
    "Cybersecurity",
    "Testing",
    "QA",
    "Manual Testing",
    "Automation Testing",
    "Blockchain",
    "Ethereum",
    "Smart Contracts",
    "Solidity",
    "Data Science",
    "Big Data",
    "Hadoop",
    "Spark",
    "R",
    "Business Analysis",
    "Requirements Gathering",
    "Process Improvement",
    "Human Resources",
    "Recruitment",
    "Talent Management",
    "Operations",
    "Supply Chain",
    "Logistics",
    "Inventory Management",
  ];

  if (query) {
    const filteredSkills = skillsDatabase.filter((skill) =>
      skill.toLowerCase().includes(query.toLowerCase()),
    );
    return filteredSkills.slice(0, 20); // Return max 20 results
  }

  return skillsDatabase.slice(0, 50); // Return first 50 skills
};

// Alternative function that could connect to a real API
export const getSkillsFromExternalAPI = async (query = "") => {
  try {
    // Example of how to connect to a real API like APILayer Skills API
    // Replace with your actual API endpoint and key if you choose to use a real API
    /*
    const response = await axios.get(`https://api.apilayer.com/skills?q=${encodeURIComponent(query)}`, {
      headers: {
        'apikey': 'YOUR_API_KEY_HERE'
      }
    });
    return response.data;
    */

    // For now, return the mock implementation
    return await getSkills(query);
  } catch (error) {
    console.error("Error fetching skills from external API:", error);
    // Fallback to mock implementation if external API fails
    return await getSkills(query);
  }
};

// Admin Dashboard API functions
export const getPendingVerifications = async () => {
  try {
    const response = await apiClient.get("/FreelancerVerification/pending");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveRequest = async (requestId) => {
  try {
    const response = await apiClient.post(
      `/FreelancerVerification/approve/${requestId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectRequest = async (requestId) => {
  try {
    const response = await apiClient.post(
      `/FreelancerVerification/reject/${requestId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectRequestWithMessage = async (requestId, message) => {
  try {
    const response = await apiClient.post(
      `/FreelancerVerification/reject/${requestId}`,
      { message },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getApprovedVerifications = async () => {
  try {
    const response = await apiClient.get("/FreelancerVerification/approved");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRejectedVerifications = async () => {
  try {
    const response = await apiClient.get("/FreelancerVerification/rejected");
    return response.data;
  } catch (error) {
    throw error;
  }
};
