import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createJobApplication,
  getCurrentUserId,
  getCurrentUserRole,
  getJobPostById,
  getJobPostApplications,
  getMyApplicationForJob,
  getMyResumes,
  updateJobApplicationStatus,
} from "../api/auth";
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPaperPlane,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPencilAlt,
  FaTrash,
  FaFileAlt,
  FaSearch,
} from "react-icons/fa";

const formatCategory = (categoryName) => {
  if (!categoryName) return "Other";
  return categoryName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/And/g, "&");
};

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    Open: {
      icon: FaClock,
      color: "bg-green-100 text-green-700",
      label: "Open",
    },
    InProgress: {
      icon: FaBriefcase,
      color: "bg-blue-100 text-blue-700",
      label: "In Progress",
    },
    Completed: {
      icon: FaCheckCircle,
      color: "bg-purple-100 text-purple-700",
      label: "Completed",
    },
    Closed: {
      icon: FaTimesCircle,
      color: "bg-gray-100 text-gray-700",
      label: "Closed",
    },
  };

  const config = statusConfig[status] || {
    icon: FaClock,
    color: "bg-gray-100 text-gray-700",
    label: status,
  };
  const Icon = config.icon;

  return (
    <span
      className={`${config.color} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const ApplicationStatusBadge = ({ status }) => {
  const statusConfig = {
    Pending: {
      color: "bg-yellow-100 text-yellow-700",
      label: "Pending Review",
    },
    Accepted: { color: "bg-green-100 text-green-700", label: "Accepted" },
    Rejected: { color: "bg-red-100 text-red-700", label: "Not Selected" },
  };

  const config = statusConfig[status] || {
    color: "bg-gray-100 text-gray-700",
    label: status,
  };

  return (
    <span
      className={`${config.color} px-3 py-1 rounded-full text-xs font-semibold`}
    >
      {config.label}
    </span>
  );
};

const SkillTag = ({ skill }) => (
  <span className="bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium px-3 py-1 rounded-full">
    {skill}
  </span>
);

const JobPostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = Number(id);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [myApplication, setMyApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");

  const [applying, setApplying] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: "",
    proposedBudget: "",
    resumeId: "",
  });
  const [myResumes, setMyResumes] = useState([]);

  const userRole = getCurrentUserRole();
  const currentUserId = getCurrentUserId();
  const isFreelancer = userRole === "Freelancer";
  const isClient = userRole === "Client";
  const isAdmin = userRole === "Admin";

  const isOwner = job?.clientUserId === currentUserId;
  const canManageApplications = isOwner || isAdmin;
  const canApply =
    isFreelancer &&
    (job?.statusName === "Open" || job?.statusName === "InProgress");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const jobData = await getJobPostById(jobId);
      setJob(jobData);

      if (isFreelancer) {
        try {
          const myApp = await getMyApplicationForJob(jobId);
          setMyApplication(myApp);
        } catch (err) {
          if (err.response?.status === 404) {
            setMyApplication(null);
          }
        }
        // Load freelancer resumes for application
        try {
          const resumes = await getMyResumes();
          setMyResumes(resumes);
        } catch (err) {
          console.error("Failed to load resumes:", err);
        }
      }

      if (jobData.clientUserId === currentUserId || isAdmin) {
        const apps = await getJobPostApplications(jobId);
        setApplications(apps);
      }
    } catch (err) {
      console.error("Failed to load job details:", err);
      setError(err.response?.data?.message || "Failed to load job details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { state: { from: `/jobs/${jobId}` } });
      return;
    }
    loadData();
  }, [jobId]);

  const skills = useMemo(() => {
    if (!job?.requiredSkills) return [];
    return job.requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [job?.requiredSkills]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (
        applicationStatusFilter !== "all" &&
        app.statusName !== applicationStatusFilter
      ) {
        return false;
      }

      if (!applicationSearch.trim()) {
        return true;
      }

      const normalized = applicationSearch.toLowerCase();
      const searchableText = [
        app.freelancerName,
        app.freelancerEmail,
        app.coverLetter,
        app.resumeTitle,
        app.universityName,
        app.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalized);
    });
  }, [applications, applicationSearch, applicationStatusFilter]);

  const handleApply = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!applicationForm.coverLetter.trim()) {
      setError("Please write a cover letter.");
      return;
    }

    setApplying(true);
    try {
      await createJobApplication({
        jobPostId: jobId,
        coverLetter: applicationForm.coverLetter.trim(),
        proposedBudget:
          applicationForm.proposedBudget === ""
            ? null
            : Number(applicationForm.proposedBudget),
        resumeId:
          applicationForm.resumeId === ""
            ? null
            : Number(applicationForm.resumeId),
      });
      setSuccess("Your application has been submitted successfully!");
      setApplicationForm({ coverLetter: "", proposedBudget: "", resumeId: "" });
      await loadData();
    } catch (err) {
      console.error("Failed to submit application:", err);
      setError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    const action = newStatus === "Accepted" ? "accept" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this application?`,
    );
    if (!confirmed) return;

    setSuccess("");
    setError("");
    try {
      await updateJobApplicationStatus(applicationId, newStatus);
      setSuccess(`Application ${action}ed successfully.`);
      await loadData();
    } catch (err) {
      console.error("Failed to update application:", err);
      setError(
        err.response?.data?.message || "Failed to update application status.",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Job post not found.</p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 mt-4 text-orange-600 hover:text-orange-700 font-medium"
            >
              <FaArrowLeft />
              Back to jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium"
        >
          <FaArrowLeft />
          Back to jobs
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {formatCategory(job.categoryName)}
                </span>
                <StatusBadge status={job.statusName} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 break-words">
                {job.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {(isOwner || isAdmin) && (
                <>
                  <Link
                    to={`/jobs/${job.id}/edit`}
                    className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaPencilAlt />
                    Edit
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FaUserTie className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Posted by</p>
                <p className="font-medium text-gray-900">{job.clientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FaMapMarkerAlt className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium text-gray-900">
                  {job.location || "Remote / Flexible"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FaMoneyBillWave className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-medium text-gray-900">
                  {job.budget
                    ? `$${job.budget.toLocaleString()}`
                    : "Negotiable"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-600 leading-7 whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {skills.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Posted on {new Date(job.createdAt).toLocaleDateString()}
              {job.updatedAt &&
                ` • Updated on ${new Date(job.updatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {canApply && myApplication && (
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Application
              </h2>
              <ApplicationStatusBadge status={myApplication.statusName} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Cover Letter
                </p>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  {myApplication.coverLetter}
                </p>
              </div>
              {myApplication.proposedBudget && (
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-orange-600" />
                  <span className="text-sm text-gray-600">
                    Proposed budget:{" "}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${myApplication.proposedBudget}
                  </span>
                </div>
              )}
              {myApplication.resumeId && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaFileAlt className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Attached Resume
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    {myApplication.resumeTitle}
                  </p>
                  {myApplication.resumeFileName && (
                    <p className="text-xs text-gray-500">
                      {myApplication.resumeFileName}
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Applied on{" "}
                {new Date(myApplication.appliedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {canApply && !myApplication && job.statusName === "Open" && (
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaPaperPlane className="text-orange-600" />
              Apply for this job
            </h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applicationForm.coverLetter}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      coverLetter: e.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Introduce yourself and explain why you're a great fit for this job..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {applicationForm.coverLetter.length}/2000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Budget (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={applicationForm.proposedBudget}
                    onChange={(e) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        proposedBudget: e.target.value,
                      }))
                    }
                    placeholder="Your proposed rate or total budget"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the client's budget
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resume (optional)
                </label>
                <select
                  value={applicationForm.resumeId}
                  onChange={(e) =>
                    setApplicationForm((prev) => ({
                      ...prev,
                      resumeId: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Select a resume to attach --</option>
                  {myResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
                {myResumes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    You don't have any resumes.{" "}
                    <Link to="/resume-form" className="underline">
                      Create one
                    </Link>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Attaching a resume helps clients learn more about your skills
                  and experience
                </p>
              </div>

              <button
                type="submit"
                disabled={applying}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {applying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Submit Application
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {canManageApplications && (
          <div className="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Applications
              </h2>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                {filteredApplications.length} / {applications.length} applicant
                {applications.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    placeholder="Search by freelancer, email, cover letter, or resume"
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <select
                  value={applicationStatusFilter}
                  onChange={(e) => setApplicationStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {applications.length === 0
                    ? "No applications yet."
                    : "No applications match the selected filters."}
                </p>
                {applications.length === 0 && job.statusName === "Open" && (
                  <p className="text-sm text-gray-400 mt-2">
                    Freelancers will be able to apply once they find this job.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold">
                            {app.freelancerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {app.freelancerName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {app.freelancerEmail}
                            </p>
                            <p className="text-xs text-orange-700">
                              {Number(app.freelancerAverageRating || 0).toFixed(
                                1,
                              )}{" "}
                              ★ • {app.freelancerCompletedProjectsCount}{" "}
                              completed projects
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 ml-13">
                          <p>
                            <span className="font-medium">University:</span>{" "}
                            {app.universityName} ({app.department}, Year{" "}
                            {app.year})
                          </p>
                          {app.proposedBudget && (
                            <p className="flex items-center gap-1">
                              <span className="font-medium">
                                Proposed Budget:
                              </span>
                              <span className="text-orange-600 font-medium">
                                ${app.proposedBudget}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            {app.coverLetter}
                          </p>
                        </div>
                        {app.resumeId && (
                          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaFileAlt className="text-orange-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Attached Resume
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">
                              {app.resumeTitle}
                            </p>
                            {app.resumeSkills && (
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Skills:</span>{" "}
                                {app.resumeSkills}
                              </p>
                            )}
                            {app.resumeExperience && (
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Experience:</span>{" "}
                                {app.resumeExperience}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Applied on{" "}
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <ApplicationStatusBadge status={app.statusName} />
                        {app.statusName === "Pending" &&
                          job.statusName === "Open" && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  handleUpdateStatus(app.id, "Accepted")
                                }
                                className="inline-flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              >
                                <FaCheckCircle className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(app.id, "Rejected")
                                }
                                className="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              >
                                <FaTimesCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPostDetails;
