import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import CategoryNavbar from "./components/CategoryNavbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ResumeView from "./pages/ResumeView";
import ResumeForm from "./pages/ResumeForm";
import AdminDashboard from "./pages/AdminDashboard";
import JobPosts from "./pages/JobPosts";
import JobPostForm from "./pages/JobPostForm";
import JobPostDetails from "./pages/JobPostDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import MockPaymentCheckout from "./pages/MockPaymentCheckout";
import { getPublicFreelancers } from "./api/auth";
import {
  FaSearch,
  FaProjectDiagram,
  FaUserFriends,
  FaStar,
} from "react-icons/fa";

function Home() {
  return (
    <main className="">
      <CategoryNavbar />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-br from-white-50 to-orange-50 border-2 border-dashed border-orange-200 rounded-2xl h-96 p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to SWork
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Connect talented student freelancers with clients for affordable
              services and practical experience
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/jobs"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FaSearch />
                Browse Jobs
              </Link>
              <Link
                to="/jobs/new"
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FaProjectDiagram />
                Post a Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FeaturedFreelancers />

      <PopularServices />

      <Testimonials />

      <CTASection />
    </main>
  );
}

function FeaturedFreelancers() {
  const [freelancers, setFreelancers] = useState([]);

  useEffect(() => {
    const loadTopFreelancers = async () => {
      try {
        const data = await getPublicFreelancers();
        const topThree = [...(data || [])]
          .sort((a, b) => {
            const byRating = (b.averageRating || 0) - (a.averageRating || 0);
            if (byRating !== 0) {
              return byRating;
            }

            return (
              (b.completedProjectsCount || 0) - (a.completedProjectsCount || 0)
            );
          })
          .slice(0, 3);

        setFreelancers(topThree);
      } catch (error) {
        console.error("Failed to load top freelancers:", error);
      }
    };

    loadTopFreelancers();
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Top Freelancers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover talented professionals ready to bring your ideas to life
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {freelancers.map((freelancer) => (
            <div
              key={freelancer.freelancerId}
              className="bg-white-100 rounded-2xl shadow-lg overflow-hidden ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={freelancer.profilePhotoPath || "/image.png"}
                    alt={freelancer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {freelancer.name}
                    </h3>
                    <p className="text-gray-600">
                      {freelancer.department} • Year {freelancer.year}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-orange-500 mr-1">
                      <FaStar />
                    </span>
                    <span className="font-medium">
                      {Number(freelancer.averageRating || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({freelancer.completedProjectsCount || 0} projects)
                    </span>
                  </div>
                  <span className="text-orange-600 text-sm font-medium">
                    {freelancer.totalReviews || 0} reviews
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {freelancers.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 text-center text-gray-600">
            No freelancer profiles available yet.
          </div>
        )}
      </div>
    </section>
  );
}

function PopularServices() {
  const services = [
    {
      id: 1,
      title: "Website Development",
      description: "Custom websites built with modern technologies",
    },
    {
      id: 2,
      title: "Graphic Design",
      description: "Eye-catching designs for your brand identity",
    },
    {
      id: 3,
      title: "Content Writing",
      description: "Engaging content that resonates with your audience",
    },
    {
      id: 4,
      title: "Digital Marketing",
      description: "Boost your online presence and reach more customers",
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-white-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Popular Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our most sought-after freelance services
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white-100 rounded-2xl shadow-lg p-6 ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <button className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                Learn more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "John Doe",
      role: "CEO, TechStart",
      content:
        "SWork helped us find the perfect developer for our project. The quality of work exceeded our expectations!",
      avatar: "/public/image.png",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Marketing Director",
      content:
        "As a student freelancer, SWork has given me consistent work opportunities and fair compensation. Highly recommended!",
      avatar: "/public/image.png",
    },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from our satisfied clients and freelancers
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white-100 rounded-2xl shadow-lg p-8 ring-1 ring-black/5"
            >
              <div className="flex items-start">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="ml-6">
                  <p className="text-gray-700 italic mb-6">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-orange-600 to-orange-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-10">
          Join thousands of clients and freelancers already using SWork
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/jobs"
            className="bg-white text-orange-600 hover:bg-white-200 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FaSearch />
            Browse Jobs
          </Link>
          <Link
            to="/jobs/new"
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaUserFriends />
            Post a Project
          </Link>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-white-50 to-orange-50 ">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/jobs" element={<JobPosts />} />
          <Route path="/jobs/:id" element={<JobPostDetails />} />
          <Route path="/jobs/new" element={<JobPostForm />} />
          <Route path="/jobs/:id/edit" element={<JobPostForm />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/payment/:projectId" element={<MockPaymentCheckout />} />
          <Route path="/resume/:id" element={<ResumeView />} />
          <Route path="/resume-form" element={<ResumeForm />} />
          <Route path="/resume-form/:id" element={<ResumeForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
