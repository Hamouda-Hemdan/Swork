import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  deleteJobPost,
  getCurrentUserId,
  getCurrentUserRole,
  getJobPosts,
  getMyJobPosts,
} from "../api/auth";
import {
  FaBriefcase,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaSearch,
  FaStar,
  FaTrash,
  FaPencilAlt,
  FaSyncAlt,
  FaUserTie,
} from "react-icons/fa";

const formatCategory = (categoryName) => {
  if (!categoryName) {
    return "Other";
  }

  return categoryName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/And/g, "&");
};

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const JobCard = ({ job, canEdit, canDelete, onDelete, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                {formatCategory(job.categoryName)}
              </span>
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                {formatStatus(job.statusName)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
          </div>
        </div>

        {job.assignedFreelancerId && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-semibold shrink-0">
                  {job.assignedFreelancerName?.charAt(0)?.toUpperCase() || "F"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-orange-700 font-semibold">
                    Selected Freelancer
                  </p>
                  <p className="font-semibold text-gray-900 truncate">
                    {job.assignedFreelancerName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {job.assignedFreelancerDepartment} • Year{" "}
                    {job.assignedFreelancerYear}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.assignedFreelancerUniversityName}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-orange-700 inline-flex items-center gap-1 justify-end">
                  <FaStar className="text-orange-500" />
                  {Number(job.assignedFreelancerAverageRating || 0).toFixed(1)}
                </p>
                <p className="text-xs text-gray-600 inline-flex items-center gap-1 justify-end mt-1">
                  <FaCheckCircle className="text-green-600" />
                  {job.assignedFreelancerCompletedProjectsCount || 0} completed
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {job.assignedFreelancerTotalReviews || 0} reviews
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 leading-6 flex-1 whitespace-pre-line">
          {job.description}
        </p>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Required skills
          </p>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills
              ?.split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
              .map((skill) => (
                <span
                  key={`${job.id}-${skill}`}
                  className="bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FaUserTie className="text-orange-600" />
            <span>{job.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-orange-600" />
            <span>{job.location || "Remote / Flexible"}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-orange-600" />
            <span>{job.budget ? `$${job.budget}` : "Budget negotiable"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/jobs/${job.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FaPencilAlt />
                Edit
              </Link>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FaTrash />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const JobPosts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingMine, setRefreshingMine] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const userRole = getCurrentUserRole();
  const currentUserId = getCurrentUserId();
  const categoryFilter = searchParams.get("category");
  const isClient = userRole === "Client";
  const isAdmin = userRole === "Admin";

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const [allJobs, myPosts] = await Promise.all([
        getJobPosts(),
        isClient ? getMyJobPosts() : Promise.resolve([]),
      ]);

      setJobs(allJobs);
      setMyJobs(myPosts);
    } catch (err) {
      console.error("Failed to load job posts:", err);
      setError("Failed to load job posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [isClient]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.statusName !== "Open") {
        return false;
      }

      if (categoryFilter && String(job.category) !== categoryFilter) {
        return false;
      }

      if (statusFilter !== "all" && job.statusName !== statusFilter) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const normalized = searchTerm.toLowerCase();
      const searchableText = [
        job.title,
        job.description,
        job.clientName,
        job.location,
        job.requiredSkills,
        job.categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalized);
    });
  }, [jobs, categoryFilter, statusFilter, searchTerm]);

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job post?",
    );
    if (!confirmed) {
      return;
    }

    try {
      setRefreshingMine(true);
      await deleteJobPost(jobId);
      setSuccess("Job post deleted successfully.");
      await loadJobs();
    } catch (err) {
      console.error("Failed to delete job post:", err);
      setError(err.response?.data?.message || "Failed to delete the job post.");
    } finally {
      setRefreshingMine(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <FaBriefcase />
                SWork Jobs
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Browse job opportunities
              </h1>
              <p className="text-gray-600 mt-3 max-w-3xl leading-7">
                Clients can post short-term projects, freelancers can browse
                open opportunities, and admins can moderate the marketplace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadJobs}
                className="inline-flex items-center gap-2 bg-white border border-orange-200 hover:border-orange-400 text-orange-700 px-4 py-3 rounded-xl font-medium transition-colors"
              >
                <FaSyncAlt />
                Refresh
              </button>
              {isClient && (
                <Link
                  to="/jobs/new"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <FaPlus />
                  Create Job Post
                </Link>
              )}
            </div>
          </div>
        </section>

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

        {isClient && (
          <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My job posts
                </h2>
                <p className="text-gray-600 mt-2">
                  Manage the jobs you created and keep them up to date.
                </p>
              </div>
              <Link
                to="/jobs/new"
                className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-3 rounded-xl font-medium transition-colors"
              >
                <FaPlus />
                New Job
              </Link>
            </div>

            {myJobs.length === 0 ? (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-gray-700">
                You have not posted any jobs yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {myJobs.map((job) => (
                  <JobCard
                    key={`my-${job.id}`}
                    job={job}
                    canEdit={true}
                    canDelete={!refreshingMine}
                    onDelete={handleDelete}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Available job posts
              </h2>
              <p className="text-gray-600 mt-2">
                {categoryFilter
                  ? `Filtered by category #${categoryFilter}`
                  : "Explore the latest opportunities from clients on SWork."}
              </p>
            </div>
            {categoryFilter && (
              <Link
                to="/jobs"
                className="text-orange-700 font-medium hover:text-orange-800"
              >
                Clear category filter
              </Link>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, client, location, or skills"
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="all">All statuses</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8 text-gray-700">
              No job posts match the current filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const canEdit = isClient && job.clientUserId === currentUserId;
                const canDelete = isAdmin || canEdit;

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default JobPosts;
