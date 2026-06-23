import { FaArrowLeft, FaHome, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { MdErrorOutline } from "react-icons/md";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded-lg p-10 max-w-lg w-full text-center transition-colors duration-300">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="p-5 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FaSearch className="text-blue-500 dark:text-blue-400 text-4xl" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-red-500">
              <MdErrorOutline className="text-white text-lg" />
            </div>
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-black text-blue-500 dark:text-blue-400 select-none mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-gray-400 dark:bg-gray-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-gray-500 dark:hover:bg-gray-500 transition cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <FaArrowLeft /> Go Back
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 dark:hover:bg-blue-700 transition flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <FaHome /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
