import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getResumeById } from "../api/auth";
import { FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";

const ResumeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const resumeData = await getResumeById(id);
      setResume(resumeData);
    } catch (err) {
      console.error("Failed to fetch resume:", err);
      setError("Failed to load resume. Please try again.");
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume</h1>
            <div className="text-red-600">{error}</div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <FaArrowLeft />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-orange-600 hover:text-orange-700 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
            <p className="text-gray-600 text-sm">View your professional resume</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-orange-600 hover:text-orange-700 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Profile
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{resume?.title || "Untitled Resume"}</h1>
              <p className="text-gray-600">{resume?.description}</p>
            </div>

            {resume?.skills && Array.isArray(resume.skills) && resume.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )
            }
            {resume?.skills && typeof resume.skills === 'string' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.split(',').map((skill, index) => (
                    <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume?.experience && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Experience</h2>
                <div className="space-y-4">
                  {Array.isArray(resume.experience) ? (
                    resume.experience.map((exp, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{exp.position || exp.title || 'Position Title'}</h3>
                            <p className="text-orange-600 font-medium">{exp.company || 'Company'}</p>
                            <p className="text-gray-600 text-sm">{exp.location || ''}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{exp.startDate || ''} - {exp.endDate || 'Present'}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-700">{exp.description || exp.summary || ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <p className="text-gray-700 whitespace-pre-line">{resume.experience}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {resume?.projects && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Projects</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{resume.projects}</p>
                </div>
              </div>
            )}

            {resume?.education && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Education</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{resume.education}</p>
                </div>
              </div>
            )}

            {resume?.certifications && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Certifications</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{resume.certifications}</p>
                </div>
              </div>
            )}

            {resume?.languages && Array.isArray(resume.languages) && resume.languages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.languages.map((language, index) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )
            }
            {resume?.languages && typeof resume.languages === 'string' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.languages.split(',').map((language, index) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {language.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume?.additionalInfo && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Additional Information</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{resume.additionalInfo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeView;