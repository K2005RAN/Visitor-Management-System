import { useSelector, useDispatch } from "react-redux";
import { assets, baseURL } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import { logoutUser } from "../redux/slices/authSlice";
import toast from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${baseURL}auth/logout`, {}, { withCredentials: true });
      dispatch(logoutUser());
      toast.success("Logout Successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  // 🛠️ ANTI-WHITE SCREEN GUARD (Perfectly aligned to brand styles)
  if (!user) {
    return (
      <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-3 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* 🟢 CORPORATE LOGO FOR GUARD STATE */}
          <div className="flex flex-col items-start select-none font-sans">
            <h1 className="text-xl font-extrabold tracking-tight text-[#047a3c] dark:text-[#10b981] leading-none uppercase">
              Heidelberg<span className="font-light text-[#111827] dark:text-white">cement</span>
            </h1>
            <span className="self-end text-[9px] font-bold tracking-widest text-[#4b5563] dark:text-gray-400 uppercase mt-0.5 mr-0.5">
              India
            </span>
          </div>

          {/* 🟢 FIXED: Fallback loading avatar uses 'S' instead of an animated block */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-500 dark:bg-lime-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md select-none animate-pulse">
              S
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-slate-400 dark:text-slate-500 font-bold leading-none mb-1 text-sm">
                Security Desk
              </div>
              <div className="text-slate-300 dark:text-slate-600 text-[10px] uppercase tracking-widest">
                Loading...
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-3 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <Link to="/" className="flex items-center group">
          
          {/* 🟢 CORPORATE LOGO FOR ACTIVE STATE */}
          <div className="flex flex-col items-start select-none font-sans">
            <h1 className="text-xl font-extrabold tracking-tight text-[#047a3c] dark:text-[#10b981] leading-none uppercase">
              Heidelberg<span className="font-light text-[#111827] dark:text-white">cement</span>
            </h1>
            
            <span className="self-end text-[9px] font-bold tracking-widest text-[#4b5563] dark:text-gray-400 uppercase mt-0.5 mr-0.5">
              India
            </span>
            
            {/* Elegant horizontal border accent */}
            <div className="h-0.5 w-full bg-[#047a3c]/10 dark:bg-[#10b981]/10 mt-1 group-hover:bg-[#047a3c] dark:group-hover:bg-[#10b981] transition-colors"></div>
          </div>

        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* 🟢 FIXED: Avatar initial systematically defaults to 'S' for Security Desk */}
          <div className="w-10 h-10 bg-lime-500 dark:bg-lime-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md select-none">
            {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
          </div>

          <div className="hidden sm:block">
            {/* 🟢 FIXED: Text descriptor falls back cleanly to Security Desk */}
            <div className="text-slate-900 dark:text-white font-bold leading-none mb-1">
              { "Security Desk"}
            </div>
            <div
              className={`${
                user?.role === "admin"
                  ? "text-lime-600 dark:text-lime-400 font-bold"
                  : "text-slate-400"
              } text-[10px] uppercase tracking-widest`}
            >
              {user?.role || "ADMIN"}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="ml-2 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
          >
            <FiLogOut size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;