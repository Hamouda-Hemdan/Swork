import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, getEducationLevels } from "../api/auth";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUniversity,
  FaGraduationCap,
  FaIdCard,
  FaEye,
  FaEyeSlash,
  FaUpload,
  FaUserPlus,
  FaSignInAlt,
} from "react-icons/fa";

const Register = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [educationLevels, setEducationLevels] = useState({
    Bachelor: 1,
    Master: 2,
    PhD: 3,
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    education: "",
    universityName: "",
    graduationYear: "",
    department: "",
    document: null,
  });

  useEffect(() => {
    const fetchEducationLevels = async () => {
      try {
        const levels = await getEducationLevels();
        setEducationLevels(levels);
      } catch (err) {
        console.error(
          "Failed to fetch education levels from API, using defaults:",
          err
        );
      }
    };

    fetchEducationLevels();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      document: e.target.files[0],
    }));
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      let userData = {
        email: formData.email,
        password: formData.password,
        role: userType === "client" ? 1 : 2,
        name: formData.name,
        phone: formData.phone,
        universityName:
          userType === "freelancer" ? formData.universityName : "",
        year: userType === "freelancer" ? formData.graduationYear : "",
        freelancerPhone: userType === "freelancer" ? formData.phone : "",
        documentBase64: "",
        documentFileName: "",
        freelancerDepartment: userType === "freelancer" ? formData.department : "",
      };

      if (userType === "freelancer" && formData.document) {
        try {
          userData.documentBase64 = await fileToBase64(formData.document);
          userData.documentFileName = formData.document.name;
        } catch (fileError) {
          console.error("Error converting file to base64:", fileError);
          setError("Error processing document file");
          setLoading(false);
          return;
        }
      }

      const response = await registerUser(userData);
      console.log("Registration successful:", response);

      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.data) {
        setError(
          err.response.data.message || "Registration failed. Please try again."
        );
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const educationLevelsArray = Object.entries(educationLevels).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white-100 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20">
              <img
                src="/public/image.png"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">Join as a client or freelancer</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-orange-50 text-gray-700 border border-orange-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setUserType("client")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  userType === "client"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUser />
                Client
              </button>
              <button
                type="button"
                onClick={() => setUserType("freelancer")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  userType === "freelancer"
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUserPlus />
                Freelancer
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {userType === "client"
                  ? "Email Address"
                  : "Email Address (should be academic email)"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder={
                    userType === "client"
                      ? "john@example.com"
                      : "john@university.edu"
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {userType === "client" ? (
              <div></div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUniversity className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="universityName"
                      value={formData.universityName}
                      onChange={handleInputChange}
                      required={userType === "freelancer"}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g., Tomsk State University"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaIdCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required={userType === "freelancer"}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"></div>
                    <input
                      type="date"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      required={userType === "freelancer"}
                      min="1900-01-01"
                      max={`${new Date().getFullYear() + 10}-12-31`}
                      className="w-full pl-2 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Select your expected graduation date
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Document (Proof of Enrollment/Graduation)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"></div>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                      required={userType === "freelancer"}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full pl-2 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                userType === "client"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  : "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
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
                  Creating Account...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Create {userType === "client" ? "Client" : "Freelancer"}{" "}
                  Account
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-orange-600 hover:text-orange-700 font-medium underline-offset-2 hover:underline flex items-center justify-center gap-1"
                >
                  <FaSignInAlt />
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
