import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProjects } from "../api/auth";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaProjectDiagram,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const statusStyles = {
  InProgress: "bg-sky-100 text-sky-800",
  DoneByFreelancer: "bg-amber-100 text-amber-800",
  ApprovedByClient: "bg-green-100 text-green-800",
  ChangesRequestedByClient: "bg-rose-100 text-rose-800",
  OnHold: "bg-zinc-200 text-zinc-800",
  Cancelled: "bg-red-100 text-red-800",
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (statusFilter !== "all" && project.statusName !== statusFilter) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const normalized = searchTerm.toLowerCase();
      const searchableText = [
        project.title,
        project.description,
        project.clientName,
        project.freelancerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalized);
    });
  }, [projects, searchTerm, statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white/80 backdrop-blur rounded-3xl shadow-xl ring-1 ring-black/5 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <FaProjectDiagram />
                Workspace Hub
              </div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600 mt-2">
                Select any project to open a full page with status workflow,
                deadline, payment, and chat popup.
              </p>
            </div>
            <button
              onClick={loadProjects}
              className="inline-flex items-center gap-2 bg-white border border-orange-200 hover:border-orange-400 text-orange-700 px-4 py-3 rounded-xl font-medium transition-colors"
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects by title, description, client, freelancer"
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">All statuses</option>
              <option value="InProgress">In Progress</option>
              <option value="DoneByFreelancer">Done by Freelancer</option>
              <option value="ChangesRequestedByClient">
                Changes Requested
              </option>
              <option value="ApprovedByClient">Approved by Client</option>
              <option value="OnHold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        {filteredProjects.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8 text-gray-700">
            No projects found.
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-full text-left p-5 rounded-2xl border border-orange-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[project.statusName] || "bg-gray-100 text-gray-700"}`}
                  >
                    {formatStatus(project.statusName)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {project.description}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Client: {project.clientName} • Freelancer:{" "}
                  {project.freelancerName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Payment release: {project.paymentReleaseStatus || "Pending"}
                </p>
                <p className="text-xs text-gray-600 mt-1 inline-flex items-center gap-1">
                  <FaCalendarAlt className="text-orange-500" />
                  {project.deadlineAt
                    ? `Deadline: ${new Date(project.deadlineAt).toLocaleString()}`
                    : "No deadline set"}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-700">
                  Open project
                  <FaArrowRight />
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Projects;
