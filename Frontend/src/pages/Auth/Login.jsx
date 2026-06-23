import { useState } from "react";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setAuthUser } from "../../redux/slices/authSlice.js";
import { assets, baseURL } from "../../assets/assets.js";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    empcod: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.empcod || !formData.password) {
      toast.error("Please fill in both Employee Code and Password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${baseURL}auth/login`,
        { empcod: formData.empcod, password: formData.password },
        { withCredentials: true }
      );
      if (res?.data?.success) {
        dispatch(setAuthUser(res?.data?.user));
        toast.success("Login successful");
        navigate("/");
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Left Side - Background Image */}
      <div
        className="w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${assets.companyBg})`,
        }}
      >
        {/* Neutral Dark Overlay */}
        <div className="absolute inset-0 bg-gray-900 opacity-60"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12 text-center">
          <h1 className="text-6xl font-bold mb-4 tracking-tight">
            Mycem Cement
          </h1>
          <div className="h-1 w-24 bg-white opacity-40 mb-6 rounded-full"></div>
          <p className="text-xl font-light max-w-md opacity-80 leading-relaxed">
            Providing Quality Solutions for Modern Construction
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-10 border border-gray-100">
          <div className="flex flex-col items-center mb-10">
            {/* Text Branding with Normal Colors */}
            <div className="mb-2">
               <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                 Mycem Cement
               </h2>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-500 mb-1">Portal Login</h1>
              <p className="text-gray-400 text-sm">
                Authorized Personnel Only
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Code */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">
                Employee Code
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaUser size={16}/>
                </span>
                <input
                  type="text"
                  name="empcod"
                  placeholder="Enter code"
                  value={formData.empcod}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaLock size={16}/>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg bg-gray-800 hover:bg-gray-900 transform active:scale-[0.98] transition-all mt-4"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login"}
            </Button>
          </form>

          <p className="text-center mt-8 text-xs text-gray-400 font-medium">
            &copy; 2026 Mycem Cement Ltd.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;