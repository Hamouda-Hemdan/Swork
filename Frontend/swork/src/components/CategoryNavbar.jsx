import { Link } from "react-router-dom";
import {
  FaPalette,
  FaLaptopCode,
  FaPenFancy,
  FaChartLine,
  FaVideo,
  FaEllipsisH,
} from "react-icons/fa";

const CategoryNavbar = () => {
  const categories = [
    { id: 1, name: "Designs", path: "/jobs?category=1", icon: <FaPalette /> },
    {
      id: 2,
      name: "Development & IT",
      path: "/jobs?category=2",
      icon: <FaLaptopCode />,
    },
    {
      id: 3,
      name: "Text & Translations",
      path: "/jobs?category=3",
      icon: <FaPenFancy />,
    },
    {
      id: 4,
      name: "Social Media & Marketing ",
      path: "/jobs?category=4",
      icon: <FaChartLine />,
    },
    {
      id: 5,
      name: "Audio, Video, Filming",
      path: "/jobs?category=5",
      icon: <FaVideo />,
    },
    { id: 6, name: "Other", path: "/jobs?category=6", icon: <FaEllipsisH /> },
  ];

  return (
    <nav className="bg-gradient-to-r from-white-50 to-orange-50 border-b border-gray-200 top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-3 space-x-6">
          {categories.map((category, index) => (
            <div key={category.id} className="flex items-center">
              <Link
                to={category.path}
                className="text-gray-700 hover:text-orange-700 font-medium whitespace-nowrap transition-all duration-200 pb-2 border-b-2 border-transparent hover:border-orange-500 flex items-center gap-2"
              >
                {category.icon}
                {category.name}
              </Link>
              {index < categories.length - 1 && (
                <span className="text-gray-300 mx-2">|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default CategoryNavbar;
