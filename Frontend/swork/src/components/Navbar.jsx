import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUserRole, logout } from "../api/auth";
import {
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserPlus,
  FaChartBar,
  FaBriefcase,
  FaPlus,
  FaProjectDiagram,
} from "react-icons/fa";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("token");
      const role = getCurrentUserRole();
      setIsLoggedIn(!!token);
      setIsAdmin(role === "Admin");
      setIsClient(role === "Client");
    };

    syncAuthState();

    const handleStorageChange = () => {
      syncAuthState();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsClient(false);
  };

  return (
    <nav className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center group">
              <span className="text-orange-200 font-bold text-2xl transition-all duration-300 group-hover:text-white group-hover:mr-2">
                S
              </span>
              <span className="text-white font-bold text-xl transition-all duration-300">
                Work
              </span>
            </div>
          </Link>
          <div className="flex space-x-3">
            <Link
              to="/jobs"
              className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
            >
              <FaBriefcase />
              Jobs
            </Link>
            {isLoggedIn ? (
              <>
                {isClient && (
                  <Link
                    to="/jobs/new"
                    className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                  >
                    <FaPlus />
                    Post Job
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                  >
                    <FaChartBar />
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <FaUser />
                  Profile
                </Link>
                <Link
                  to="/projects"
                  className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <FaProjectDiagram />
                  Projects
                </Link>
                <button
                  onClick={handleLogout}
                  className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <FaSignInAlt />
                  Login
                </Link>
                <Link
                  to="/register"
                  className=" hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                >
                  <FaUserPlus />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
