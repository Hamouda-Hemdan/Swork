import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createJobPost,
  getCurrentUserId,
  getCurrentUserRole,
  getJobPostById,
  getJobPostCategories,
  updateJobPost,
} from "../api/auth";
import SkillsSelector from "../components/SkillsSelector";
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSave,
} from "react-icons/fa";

const formatCategoryLabel = (categoryName) => {
  if (!categoryName) {
    return "Other";
  }

  return categoryName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/And/g, "&");
};

const JobPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const currentUserId = getCurrentUserId();
  const userRole = getCurrentUserRole();

  const [categories, setCategories] = useState({});
  const [formData, setFormData] = useState({
    category: "1",
    title: "",
    requiredSkills: [],
    description: "",
    location: "",
    budget: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!localStorage.getItem("token")) {
          navigate("/login");
          return;
        }

        if (userRole !== "Client") {
          navigate("/jobs");
          return;
        }

        const categoryData = await getJobPostCategories();
        setCategories(categoryData);

        const firstCategoryValue = Object.values(categoryData)[0];
        if (firstCategoryValue) {
          setFormData((prev) => ({
            ...prev,
            category: String(firstCategoryValue),
          }));
        }

        if (isEditMode) {
          const jobPost = await getJobPostById(id);

          if (jobPost.clientUserId !== currentUserId) {
            setError("You can only edit your own job posts.");
            navigate("/jobs");
            return;
          }

          setFormData({
            category: String(jobPost.category),
            title: jobPost.title || "",
            requiredSkills: jobPost.requiredSkills
              ? jobPost.requiredSkills
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean)
              : [],
            description: jobPost.description || "",
            location: jobPost.location || "",
            budget: jobPost.budget ?? "",
          });
        }
      } catch (err) {
        console.error("Failed to load job form data:", err);
        setError(err.response?.data?.message || "Failed to load the job form.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditMode, navigate, userRole]);

  const categoryOptions = useMemo(() => {
    return Object.entries(categories).map(([label, value]) => ({
      label: formatCategoryLabel(label),
      value: String(value),
    }));
  }, [categories]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.requiredSkills.length === 0) {
      setError("Please add at least one required skill for this job.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        category: Number(formData.category),
        title: formData.title.trim(),
        requiredSkills: formData.requiredSkills.join(", "),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        budget: formData.budget === "" ? null : Number(formData.budget),
      };

      if (isEditMode) {
        await updateJobPost(id, payload);
        setSuccess("Job post updated successfully.");
      } else {
        await createJobPost(payload);
        setSuccess("Job post created successfully.");
      }

      setTimeout(() => {
        navigate("/jobs");
      }, 900);
    } catch (err) {
      console.error("Failed to save job post:", err);
      setError(err.response?.data?.message || "Failed to save the job post.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium"
        >
          <FaArrowLeft />
          Back to jobs
        </Link>

        <div className="bg-white rounded-3xl shadow-lg ring-1 ring-black/5 p-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <FaBriefcase />
              {isEditMode ? "Update Job Post" : "Create Job Post"}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode
                ? "Edit your job opportunity"
                : "Post a new job opportunity"}
            </h1>
            <p className="text-gray-600 mt-3 leading-7">
              Describe the task clearly so student freelancers can quickly
              understand the work, expectations, and budget.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
                    <FaMoneyBillWave />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={200}
                placeholder="Example: Need a React landing page for a student club"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Required skills
              </label>
              <SkillsSelector
                value={formData.requiredSkills}
                onChange={(skills) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiredSkills: skills,
                  }))
                }
                placeholder="Search and select required skills for this job"
              />
              <p className="text-xs text-gray-500 mt-2">
                Add the skills a freelancer should have before applying.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-orange-600">
                  <FaMapMarkerAlt />
                </span>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  maxLength={255}
                  placeholder="Remote, Moscow, University campus, etc."
                  className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={2000}
                rows={8}
                placeholder="Describe the task, requirements, timeline, and what kind of freelancer you are looking for."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-70"
              >
                <FaSave />
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Job Post"}
              </button>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobPostForm;
