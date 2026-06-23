import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../redux/slices/themeSlice";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((store) => store.theme);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative w-14 h-7 rounded-full bg-gray-300 dark:bg-gray-600 
                 transition-colors duration-300 cursor-pointer focus:outline-none
                 flex items-center"
    >
      {/* Sliding circle */}
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900
                    shadow-md transform transition-transform duration-300 
                    flex items-center justify-center
                    ${darkMode ? "translate-x-7" : "translate-x-0"}`}
      >
        {darkMode ? (
          <FiMoon size={14} className="text-yellow-400" />
        ) : (
          <FiSun size={14} className="text-yellow-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
