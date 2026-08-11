import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  getProfilePhoto,
  getMyResumes,
  createResume,
  updateResume,
  deleteResume,
} from "../api/auth";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaGraduationCap,
  FaEdit,
  FaSave,
  FaTimes,
  FaUpload,
  FaCamera,
  FaFileAlt,
  FaPlus,
  FaTrash,
  FaPencilAlt,
} from "react-icons/fa";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    universityName: "",
    year: "",
    freelancerPhone: "",
    department: "",
    role: 1,
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // Resume state variables
  const [resumes, setResumes] = useState([]);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [currentResume, setCurrentResume] = useState({
    title: "",
    description: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    certifications: "",
    languages: "",
    additionalInfo: "",
  });
  const [resumeLoading, setResumeLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchProfile();
    fetchProfilePhoto();
    fetchResumes();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const profile = await getUserProfile();

      const flattenedProfile = {
        ...profile,

        ...(profile.role === 2 && profile.freelancer
          ? {
              universityName: profile.freelancer.universityName || "",
              year: profile.freelancer.year || "",
              freelancerPhone: profile.freelancer.phone || "",
              department: profile.freelancer.department || "",
            }
          : {}),

        ...(profile.role === 1 && profile.client
          ? {
              phone: profile.client.phone || "",
            }
          : {}),

        ...(profile.role === 3 && profile.admin
          ? {
              department: profile.admin.department || "",
            }
          : {}),
      };

      setProfileData(flattenedProfile);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if (err.response && err.response.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePhoto = async () => {
    try {
      const imageData = await getProfilePhoto();

      const imageUrl = URL.createObjectURL(imageData);
      setProfilePhotoUrl(imageUrl);
    } catch (err) {
      console.error("Failed to fetch profile photo:", err);

      if (err.response && err.response.status === 404) {
        setProfilePhotoUrl("/avatar4.jpg");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      handlePhotoUploadDirect(file);
    }
  };

  const handlePhotoUploadDirect = async (file) => {
    setError("");
    setSuccess("");
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("PhotoFile", file);

      formData.append("UserId", profileData.id || 0);

      const response = await uploadProfilePhoto(formData);
      setSuccess("Profile photo uploaded successfully!");

      fetchProfilePhoto();
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            "Failed to upload profile photo. Please try again."
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setUploadingPhoto(false);
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!profilePhoto) return;

    setError("");
    setSuccess("");
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("PhotoFile", profilePhoto);

      formData.append("UserId", profileData.id || 0);

      const response = await uploadProfilePhoto(formData);
      setSuccess("Profile photo uploaded successfully!");

      fetchProfilePhoto();
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            "Failed to upload profile photo. Please try again."
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setUploadingPhoto(false);
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
    }
  };

  const openEditModal = () => {
    const formData = {
      ...profileData,

      ...(profileData.role === 2
        ? {
            universityName: profileData.universityName || "",
            year: profileData.year || "",
            freelancerPhone: profileData.freelancerPhone || "",
            department: profileData.department || "",
          }
        : {}),

      ...(profileData.role === 1
        ? {
            phone: profileData.phone || "",
          }
        : {}),

      ...(profileData.role === 3
        ? {
            department: profileData.department || "",
          }
        : {}),
    };
    setEditFormData(formData);
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setEditFormData({});
    setError("");
    setSuccess("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUpdating(true);

    try {
      const dataToSend = {
        ...editFormData,

        ...(editFormData.role === 2
          ? {
              freelancer: {
                universityName: editFormData.universityName || "",
                year: editFormData.year || "",
                phone: editFormData.freelancerPhone || "",
                department: editFormData.department || "",
              },
            }
          : {}),

        ...(editFormData.role === 1
          ? {
              client: {
                phone: editFormData.phone || "",
              },
            }
          : {}),

        ...(editFormData.role === 3
          ? {
              admin: {
                department: editFormData.department || "",
              },
            }
          : {}),
      };

      if (editFormData.role === 2) {
        delete dataToSend.universityName;
        delete dataToSend.year;
        delete dataToSend.freelancerPhone;
        delete dataToSend.department;
      } else if (editFormData.role === 1) {
        delete dataToSend.phone;
      } else if (editFormData.role === 3) {
        delete dataToSend.department;
      }

      const response = await updateUserProfile(dataToSend);

      const flattenedResponse = {
        ...response,

        ...(response.role === 2 && response.freelancer
          ? {
              universityName: response.freelancer.universityName || "",
              year: response.freelancer.year || "",
              freelancerPhone: response.freelancer.phone || "",
              department: response.freelancer.department || "",
            }
          : {}),

        ...(response.role === 1 && response.client
          ? {
              phone: response.client.phone || "",
            }
          : {}),

        ...(response.role === 3 && response.admin
          ? {
              department: response.admin.department || "",
            }
          : {}),
      };

      setProfileData(flattenedResponse);
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        closeEditModal();
        setUpdating(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to update profile:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            "Failed to update profile. Please try again."
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setUpdating(false);
    }
  };

  // Resume functions
  const fetchResumes = async () => {
    try {
      const resumeList = await getMyResumes();
      setResumes(resumeList);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
      setError("Failed to load resumes. Please try again.");
    }
  };

  const openResumeModal = (resume = null) => {
    if (resume) {
      // Convert skills and languages to array format if they are strings
      const resumeWithArrays = {
        ...resume,
        skills: typeof resume.skills === 'string' 
          ? resume.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
          : Array.isArray(resume.skills) 
            ? resume.skills 
            : [],
        languages: typeof resume.languages === 'string' 
          ? resume.languages.split(',').map(lang => lang.trim()).filter(lang => lang)
          : Array.isArray(resume.languages) 
            ? resume.languages 
            : [],
      };
      setCurrentResume(resumeWithArrays);
      setIsEditingResume(true);
    } else {
      setCurrentResume({
        title: "",
        description: "",
        skills: [],
        experience: "",
        projects: "",
        education: "",
        certifications: "",
        languages: [],
        additionalInfo: "",
      });
      setIsEditingResume(false);
    }
    setResumeModalOpen(true);
  };

  const closeResumeModal = () => {
    setResumeModalOpen(false);
    setCurrentResume({
      title: "",
      description: "",
      skills: [],
      experience: "",
      projects: "",
      education: "",
      certifications: "",
      languages: [],
      additionalInfo: "",
    });
    setIsEditingResume(false);
    setError("");
    setSuccess("");
  };

  const handleResumeChange = (e) => {
    const { name, value } = e.target;
    setCurrentResume((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResumeLoading(true);

    try {
      // Prepare resume data - convert arrays to strings for API
      const resumeData = {
        ...currentResume,
        skills: Array.isArray(currentResume.skills) ? currentResume.skills.join(', ') : currentResume.skills,
        languages: Array.isArray(currentResume.languages) ? currentResume.languages.join(', ') : currentResume.languages
      };
      
      if (isEditingResume) {
        // Update existing resume
        await updateResume(currentResume.id, resumeData);
        setSuccess("Resume updated successfully!");
      } else {
        // Create new resume
        await createResume(resumeData);
        setSuccess("Resume created successfully!");
      }
      
      // Refresh the resumes list
      await fetchResumes();
      
      setTimeout(() => {
        closeResumeModal();
        setResumeLoading(false);
      }, 1500);
    } catch (err) {
      console.error(isEditingResume ? "Failed to update resume:" : "Failed to create resume:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            (isEditingResume ? "Failed to update resume. Please try again." : "Failed to create resume. Please try again.")
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setResumeLoading(false);
    }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteResume(id);
      setSuccess("Resume deleted successfully!");
      
      // Refresh the resumes list
      await fetchResumes();
    } catch (err) {
      console.error("Failed to delete resume:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            "Failed to delete resume. Please try again."
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Your account information</p>
          </div>
          <button
            onClick={openEditModal}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <FaEdit />
            Edit Profile
          </button>
        </div>

        <div className="bg-white-100 rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-1">
                  {profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white"
                    />
                  ) : profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white"
                    />
                  ) : profileData.role === 3 ? (
                    <img
                      src="/logo.png"
                      alt="Admin Avatar"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <img
                      src="/avatar4.jpg"
                      alt="Default Avatar"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white"
                    />
                  )}
                </div>

                <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 cursor-pointer shadow-md">
                  <FaCamera className="h-5 w-5 text-orange-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {profilePhoto && (
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                    uploadingPhoto
                      ? "bg-orange-400 text-white"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Full Name</p>
                    <p className="font-medium">
                      {profileData.name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Email Address
                    </p>
                    <p className="font-medium">
                      {profileData.email || "Not provided"}
                    </p>
                  </div>
                  {/* 
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Phone Number
                    </p>
                    <p className="font-medium">
                      {profileData.phone || "Not provided"}
                    </p>
                  </div> */}

                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Account Type
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        profileData.role === 2
                          ? "bg-orange-100 text-orange-800"
                          : profileData.role === 3
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {profileData.role === 2
                        ? "Freelancer"
                        : profileData.role === 3
                        ? "Administrator"
                        : "Client"}
                    </span>
                  </div>
                </div>
              </div>

              {profileData.role === 2 && (
                <div className="border border-gray-200 rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Freelancer Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        University
                      </p>
                      <p className="font-medium">
                        {profileData.universityName || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Graduation Year
                      </p>
                      <p className="font-medium">
                        {profileData.year || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Department
                      </p>
                      <p className="font-medium">
                        {profileData.department || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Freelancer Phone
                      </p>
                      <p className="font-medium">
                        {profileData.freelancerPhone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {profileData.role === 2 && (
          <>
            {/* Resume Section */}
            <div className="mt-8 bg-white-100 rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FaFileAlt className="text-orange-600" />
                      My Resumes
                    </h2>
                    <p className="text-gray-600">Manage your professional resumes</p>
                  </div>
                  <Link
                    to="/resume-form"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <FaPlus />
                    Add Resume
                  </Link>
                </div>

                {resumes.length === 0 ? (
                  <div className="text-center py-8">
                    <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No resumes found. Create your first resume to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{resume.title || "Untitled Resume"}</h3>
                          <div className="flex gap-2">
                            <Link
                              to={`/resume-form/${resume.id}`}
                              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                            >
                              <FaPencilAlt />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteResume(resume.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{resume.description || "No description"}</p>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(resume.skills) ? (
                              resume.skills.slice(0, 5).map((skill, index) => (
                                <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              resume.skills ? (
                                resume.skills.split(',').slice(0, 5).map((skill, index) => (
                                  <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {skill.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-500 text-sm italic">No skills listed</span>
                              )
                            )}
                            {Array.isArray(resume.skills) && resume.skills.length > 5 && (
                              <span className="text-gray-500 text-sm">+{resume.skills.length - 5} more</span>
                            )}
                            {!Array.isArray(resume.skills) && resume.skills && resume.skills.split(',').length > 5 && (
                              <span className="text-gray-500 text-sm">+{resume.skills.split(',').length - 5} more</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Link
                            to={`/resume/${resume.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <FaFileAlt />
                            View Full Resume
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Edit Profile
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name || ""}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email || ""}
                        onChange={handleEditInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData.phone || ""}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {profileData.role === 2 && (
                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Freelancer Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          University Name
                        </label>
                        <input
                          type="text"
                          name="universityName"
                          value={editFormData.universityName || ""}
                          onChange={handleEditInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., Tomsk State University"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Graduation Year
                        </label>
                        <input
                          type="text"
                          name="year"
                          value={editFormData.year || ""}
                          onChange={handleEditInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={editFormData.department || ""}
                          onChange={handleEditInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., Computer Science"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Freelancer Phone
                        </label>
                        <input
                          type="tel"
                          name="freelancerPhone"
                          value={editFormData.freelancerPhone || ""}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {profileData.role === 3 && (
                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Administrator Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={editFormData.department || ""}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className={`px-4 py-2 text-sm rounded-lg text-white flex items-center gap-2 ${
                      updating
                        ? "bg-orange-400"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {updating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
