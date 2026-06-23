import { useEffect, useState, useRef } from "react";
import {
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUsers,
  FaSearch,
  FaQrcode,
  FaBuilding,
} from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { baseURL } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

const ModernCounterCard = ({ icon: Icon, title, value, gradientColor, textColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 flex items-center shadow-sm border border-slate-100 dark:border-gray-700/60 transition-all duration-300 hover:shadow-md group">
    <div className={`p-3.5 rounded-xl mr-4 bg-gradient-to-br ${gradientColor} text-white shadow-sm group-hover:scale-105 transition-transform duration-300`}>
      <Icon className="text-xl" />
    </div>
    <div>
      <p className="text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h2 className={`text-3xl font-black mt-0.5 tracking-tight ${textColor}`}>
        {value}
      </h2>
    </div>
  </div>
);

const InOut = () => {
  const [loading, setLoading] = useState(false);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const scanOutRef = useRef(null);

  const fetchVisitorLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}visitor/logs`, { withCredentials: true });
      if (res?.data?.success) {
        setVisitorLogs(res.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load live traffic logs");
    } finally {
      setLoading(false);
    }
  };

  const handleVisitorCheckout = async (passId) => {
    if (!passId || !passId.trim()) {
      toast.error("Please enter or scan a valid Pass ID.");
      return;
    }

    setLoading(true);
    try {
      const sanitizedPassId = passId.trim().toUpperCase();
      const res = await axios.post(`${baseURL}visitor/out`, { passId: sanitizedPassId }, { withCredentials: true });
      
      if (res?.data?.success) {
        toast.success(`Visitor exit successfully processed!`);
        if (scanOutRef.current) scanOutRef.current.value = ""; 
        await fetchVisitorLogs(); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Checkout execution halted.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorLogs();
    setTimeout(() => scanOutRef.current?.focus(), 500);
  }, []);

  // 🟢 SAFETY FILTER PATTERN: Prevents "Cannot read properties of null" errors
  const filteredVisitors = visitorLogs.filter((v) => {
    if (!v) return false; // Instantly ignores missing or corrupted documents cleanly
    
    const q = searchTerm.toLowerCase();
    const passIdentifier = v.passId || v.pass_id || "";
    const visitorName = v.visitor_name || v.name || "";
    
    return (
      visitorName.toLowerCase().includes(q) ||
      passIdentifier.toLowerCase().includes(q)
    );
  });

  const currentlyIn = filteredVisitors.filter(v => v && Number(v.status) === 1).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Panel Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/60 shadow-sm">
          <div>
            <span className="text-[10px] bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Gate Operator Desk
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 uppercase tracking-tight">
              Security Gate <span className="text-lime-500">Control</span>
            </h1>
          </div>
          
          {/* Live Action Search Bar */}
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input 
              type="text" 
              placeholder="Search by name, pass ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-lime-500 font-medium text-sm shadow-inner transition-all"
            />
          </div>
        </div>

        {/* Analytic Status Monitor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ModernCounterCard icon={FaUsers} title="Total Gate Logs" value={filteredVisitors.length} gradientColor="from-blue-500 to-indigo-600" textColor="text-slate-800 dark:text-white" />
          <ModernCounterCard icon={FaSignInAlt} title="Presently Inside" value={currentlyIn} gradientColor="from-lime-400 to-emerald-600" textColor="text-emerald-600 dark:text-emerald-400" />
          <ModernCounterCard icon={FaSignOutAlt} title="Cleared Out" value={filteredVisitors.length - currentlyIn} gradientColor="from-rose-500 to-red-600" textColor="text-slate-600 dark:text-slate-400" />
        </div>

        {/* Core Layout Split Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Container Side: Dedicated Terminal Box */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-t-4 border-red-500 shadow-sm space-y-4 dark:border-x-gray-700/60 dark:border-b-gray-700/60">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <FaQrcode className="text-lg animate-pulse" />
                <h3 className="font-extrabold text-xs uppercase tracking-widest">Active Exit Validator</h3>
              </div>
              <p className="text-slate-400 dark:text-slate-400 text-xs leading-relaxed">
                Scan barcode pass or type ID number to log automated gate checkout timestamp.
              </p>
              
              <div className="space-y-3 pt-2">
                <input 
                  ref={scanOutRef} 
                  type="text"
                  className="w-full p-3.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-red-500 font-mono text-center text-base font-bold tracking-widest uppercase transition-all shadow-inner" 
                  placeholder="SCAN PASS ID HERE..." 
                  onKeyDown={(e) => e.key === 'Enter' && handleVisitorCheckout(e.target.value)}
                />
                <button 
                  onClick={() => handleVisitorCheckout(scanOutRef.current?.value)} 
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-md shadow-red-500/10"
                >
                  Authorize Gate Exit (OUT)
                </button>
              </div>
            </div>
          </div>

          {/* Right Container Side: Live Activity Stream Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700/60 p-6 min-h-[500px]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-gray-700/60 mb-5">
              <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                Daily Log Pipeline
              </h3>
              <span className="text-[11px] font-bold px-3 py-1 bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg">
                Showing {filteredVisitors.length} Feed Objects
              </span>
            </div>

            {/* List Array Card View Loops */}
            <div className="space-y-4">
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((v, index) => {
                  const isInsideNow = Number(v.status) === 1;
                  const activePassId = v.passId || v.pass_id;
                  
                  return (
                    <div key={v._id || index} className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
                      isInsideNow 
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/30 via-transparent to-transparent shadow-sm' 
                        : 'border-slate-100 dark:border-gray-700/40 bg-white dark:bg-gray-800'
                    }`}>
                      
                      <div className="flex items-center gap-4">
                        {v.visitor_photo ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm flex-shrink-0 group relative bg-slate-100">
                            <img 
                              src={v.visitor_photo.startsWith('http') ? v.visitor_photo : `${BACKEND_URL}${v.visitor_photo}`} 
                              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                              onClick={() => setSelectedImage(v.visitor_photo.startsWith('http') ? v.visitor_photo : `${BACKEND_URL}${v.visitor_photo}`)}
                              alt=""
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-white bg-gradient-to-br from-slate-400 to-slate-500" style={{ display: 'none' }}>
                              {(v.visitor_name || v.name || "VI").substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-sm shadow-sm text-white flex-shrink-0 tracking-wider bg-gradient-to-br ${
                            isInsideNow ? 'from-emerald-400 to-teal-500' : 'from-slate-400 to-slate-500'
                          }`}>
                            {(v.visitor_name || v.name || "VI").substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 dark:text-white capitalize tracking-tight">{v.visitor_name || v.name}</h4>
                            <span className={`text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded ${
                              isInsideNow ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {isInsideNow ? "Inside" : "Checked Out"}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>ID: <span className="font-mono text-slate-600 dark:text-gray-300 font-bold">{activePassId}</span></span>
                            <span className="flex items-center gap-1 capitalize">
                              <FaBuilding className="text-[10px] text-slate-400" /> 
                              {v.employee_name || v.employee_to_visit || v.employeeTo || v.to_visit || "Staff"} 
                              <span className="text-slate-300 dark:text-gray-600 font-normal mx-0.5">|</span>
                              <span className="text-slate-500 dark:text-gray-300 font-bold uppercase">
                                {v.department_name || v.department_to_visit || v.departmentTo || "Operations"}
                              </span>
                            </span>
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                              IN: {v.check_in_time ? new Date(v.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "---"}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isInsideNow ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-slate-500 bg-slate-50 dark:bg-gray-700/60'
                            }`}>
                              OUT: {isInsideNow ? "Premises Active" : (v.check_out_time || v.exit_time ? new Date(v.check_out_time || v.exit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : "---")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (!activePassId) {
                            toast.error("Pass identification marker not found for this record.");
                            return;
                          }
                          navigate(`/visitor-pass-display/${activePassId}`);
                        }}
                        className="self-end sm:self-center text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        Reprint Pass
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-28 text-slate-400 dark:text-slate-500 italic text-sm border-2 border-dashed border-slate-100 dark:border-gray-700 rounded-2xl">
                  No gate entries registered for the current monitoring window.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-2xl transition-all transform scale-100">
            <img src={selectedImage} className="max-w-full max-h-[80vh] rounded-xl object-contain" alt="" />
          </div>
        </div>
      )}
    </div>
  );
};

export default InOut;