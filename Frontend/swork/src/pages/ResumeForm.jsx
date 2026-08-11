import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResumeById, createResume, updateResume } from "../api/auth";
import SkillsSelector from "../components/SkillsSelector";
import LanguagesSelector from "../components/LanguagesSelector";
import ExperienceManager from "../components/ExperienceManager";
import { FaArrowLeft, FaSave, FaTimes, FaFileAlt } from "react-icons/fa";

const ResumeForm = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [currentResume, setCurrentResume] = useState({
    title: "",
    description: "",
    skills: [],
    experience: [],
    projects: "",
    education: "",
    certifications: "",
    languages: [],
    additionalInfo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  


  // Load resume data if in edit mode
  useEffect(() => {
    if (id) {
      loadResumeData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadResumeData = async () => {
    try {
      const resumeData = await getResumeById(id);
      // Convert skills string to array if it's a string
      const skills = typeof resumeData.skills === 'string' 
        ? resumeData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        : Array.isArray(resumeData.skills) 
          ? resumeData.skills 
          : [];
          
      // Convert languages string to array if it's a string
      const languages = typeof resumeData.languages === 'string' 
        ? resumeData.languages.split(',').map(lang => lang.trim()).filter(lang => lang)
        : Array.isArray(resumeData.languages) 
          ? resumeData.languages 
          : [];
          
      // Convert experience string to array if it's a string
      const experience = typeof resumeData.experience === 'string' 
        ? [{ position: 'Previous Position', company: 'Previous Company', description: resumeData.experience }]
        : Array.isArray(resumeData.experience) 
          ? resumeData.experience 
          : [];
          
      setCurrentResume({
        ...resumeData,
        skills,
        experience,
        languages
      });
    } catch (err) {
      console.error("Failed to load resume:", err);
      setError("Failed to load resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentResume((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkillsChange = (skills) => {
    setCurrentResume(prev => ({
      ...prev,
      skills
    }));
  };

  const handleLanguagesChange = (languages) => {
    setCurrentResume(prev => ({
      ...prev,
      languages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Prepare resume data - convert arrays to strings for API
      const resumeData = {
        ...currentResume,
        skills: Array.isArray(currentResume.skills) ? currentResume.skills.join(', ') : currentResume.skills,
        experience: Array.isArray(currentResume.experience) 
          ? currentResume.experience.map(exp => `${exp.position || ''} at ${exp.company || ''} - ${exp.description || ''}`).join('\n')
          : currentResume.experience,
        languages: Array.isArray(currentResume.languages) ? currentResume.languages.join(', ') : currentResume.languages
      };
      
      if (id) {
        // Update existing resume
        await updateResume(id, resumeData);
        setSuccess("Resume updated successfully!");
      } else {
        // Create new resume
        await createResume(resumeData);
        setSuccess("Resume created successfully!");
      }
      
      // Redirect to profile after a short delay to show success message
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error(id ? "Failed to update resume:" : "Failed to create resume:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message ||
            (id ? "Failed to update resume. Please try again." : "Failed to create resume. Please try again.")
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleCancel}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Profile
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <FaFileAlt className="text-orange-600" />
              {id ? "Edit Resume" : "Create New Resume"}
            </h1>
            <p className="text-gray-600">{id ? "Update your resume details" : "Fill in your resume information"}</p>
          </div>
          <div className="opacity-0">
            <button className="invisible">Placeholder</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={currentResume.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Software Developer Resume"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={currentResume.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Brief description of this resume"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <SkillsSelector
                  value={currentResume.skills}
                  onChange={handleSkillsChange}
                  placeholder="Search for skills (e.g., JavaScript, Marketing, Design...)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <LanguagesSelector
                  value={currentResume.languages}
                  onChange={handleLanguagesChange}
                  placeholder="Search for languages (e.g., English, Spanish, French...)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <ExperienceManager
                  value={currentResume.experience}
                  onChange={(experiences) => setCurrentResume(prev => ({
                    ...prev,
                    experience: experiences
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projects
                </label>
                <textarea
                  name="projects"
                  value={currentResume.projects}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="List your projects"
                  rows="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <textarea
                  name="education"
                  value={currentResume.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your educational background"
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <textarea
                  name="certifications"
                  value={currentResume.certifications}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="List your certifications"
                  rows="4"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={currentResume.additionalInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Any additional information"
                  rows="4"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <FaTimes />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3 text-sm rounded-lg text-white flex items-center gap-2 font-medium ${
                    saving
                      ? "bg-orange-400"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  }`}
                >
                  {saving ? (
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
                      {id ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {id ? "Update Resume" : "Create Resume"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;