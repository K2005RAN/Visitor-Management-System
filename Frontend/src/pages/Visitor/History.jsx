import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FaUsers, FaSearch, FaTimes, FaChevronLeft, FaChevronRight, 
  FaBuilding, FaClock 
} from "react-icons/fa";
import { MdHistory } from "react-icons/md";
import { baseURL } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded-lg p-4 flex items-center transition-all">
    <div className={`mr-4 p-3 rounded-full ${color}`}>
      <Icon className="text-white text-2xl" />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h2>
    </div>
  </div>
);

const History = () => {
  const [allVisitors, setAllVisitors] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();
  const isFetching = useRef(false);

  const fetchVisitors = useCallback(async () => {
    if (isFetching.current) return; 
    isFetching.current = true;
    setLoading(true);
    
    try {
      const res = await axios.get(`${baseURL}visitor/history`, { 
        params: { limit, offset }, 
        withCredentials: true 
      });
      if (res.data?.success) {
        const data = res.data.data || [];
        setAllVisitors(data);
        setVisitors(data);
        setTotalCount(res.data.count || data.length || 0);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      isFetching.current = false; 
    }
  }, [limit, offset]);

  // SMART MULTI-FIELD SEARCH COMPATIBILITY
  useEffect(() => {
    let filtered = [...allVisitors];
    if (search) {
      const q = search.trim().toLowerCase();
      
      filtered = filtered.filter((v) => {
        if (!v) return false;

        const currentName = (v.visitor_name || v.name || "").toLowerCase();
        const currentCompany = (v.company || "").toLowerCase();
        const currentContact = (v.visitor_contact_no || v.contact_no || "").toLowerCase();
        const topLevelPassId = (v.passId || v.pass_id || v.latest_pass_id || "").toLowerCase();
        const rawMongoId = (v._id || v.id || "").toLowerCase();

        return (
          currentName.includes(q) ||
          currentCompany.includes(q) ||
          currentContact.includes(q) ||
          topLevelPassId.includes(q) ||
          rawMongoId.includes(q)
        );
      });
    }
    setVisitors(filtered);
  }, [search, allVisitors]);

  useEffect(() => { 
    fetchVisitors(); 
  }, [fetchVisitors]);

  const uniqueCompanies = [...new Set(visitors.filter(Boolean).map(v => v.company).filter(Boolean))].length;

  const formatDateTime = (rawDate) => {
    if (!rawDate) return "—";
    const date = new Date(rawDate);
    if (isNaN(date.getTime()) || date.getTime() === 0) return "—";

    const localDate = date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const localTime = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${localDate} | ${localTime}`;
  };

  // 🟢 CLEAN FILTER LAYER: Removes empty records to safeguard alignment layout constraints
  const cleanRenderList = visitors.filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Visitor <span className="text-lime-500">History</span>
          </h1>
          <p className="text-slate-500 text-sm">Manage and track unique visitor records</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={FaUsers} title="Total Visitors" value={totalCount} color="bg-blue-500" />
          <StatCard icon={MdHistory} title="Total Visits" value={totalCount} color="bg-lime-500" />
          <StatCard icon={FaBuilding} title="Companies" value={uniqueCompanies} color="bg-purple-500" />
          <StatCard icon={FaSearch} title="Filtered" value={cleanRenderList.length} color="bg-orange-500" />
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl p-6 mb-8 border border-slate-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              type="text" placeholder="Search by name, phone, company or pass ID..." value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full p-2.5 rounded-xl border dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-lime-500 text-sm"
            />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="p-2.5 rounded-xl border dark:bg-gray-700 dark:text-white text-sm" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="p-2.5 rounded-xl border dark:bg-gray-700 dark:text-white text-sm" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 dark:bg-gray-900/50 text-slate-500 text-xs uppercase font-black border-b border-slate-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 border-b dark:border-gray-700">Visitor</th>
                  <th className="px-6 py-4 border-b dark:border-gray-700">Company</th>
                  <th className="px-6 py-4 border-b dark:border-gray-700">To Visit / Dept</th> 
                  <th className="px-6 py-4 border-b dark:border-gray-700">Last Visit Time</th>
                  <th className="px-6 py-4 text-center border-b dark:border-gray-700">Status</th>
                  <th className="px-6 py-4 text-center border-b dark:border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {cleanRenderList.length > 0 ? (
                  cleanRenderList.map((v, index) => {
                    const isInsideNow = Number(v.status) === 1;

                    return (
                      <tr key={v._id || v.passId || index} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                              {(v.visitor_name || v.name || "V").split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white leading-tight">{v.visitor_name || v.name}</p>
                              <p className="text-xs font-mono text-slate-500 mt-0.5">{v.visitor_contact_no || v.contact_no || v.contactNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-300 whitespace-nowrap">
                          {v.company || "—"}
                        </td>
                        
                        {/* 🟢 FIXED SMART OBJECT RESOLUTION MATRIX DATA CELL */}
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-gray-300 whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-white capitalize">
                            {typeof v.employee_to_visit === "object" && v.employee_to_visit !== null
                              ? v.employee_to_visit.name
                              : typeof v.employeeTo === "object" && v.employeeTo !== null
                              ? v.employeeTo.name
                              : (v.employee_name || v.employee_to_visit || v.employeeTo || v.to_visit || "Official Staff")}
                          </div>
                          <div className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider mt-0.5">
                            {typeof v.employee_to_visit === "object" && v.employee_to_visit !== null && v.employee_to_visit.department_name
                              ? v.employee_to_visit.department_name
                              : typeof v.department_to_visit === "object" && v.department_to_visit !== null
                              ? v.department_to_visit.name || v.department_to_visit.department_name
                              : (v.department_name || v.department_to_visit || v.departmentTo || v.dept || "General Operations")}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-gray-300 font-mono whitespace-nowrap">
                          {formatDateTime(v.last_visit || v.createdAt || v.check_in_time)}
                        </td>
                        
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {isInsideNow ? (
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded text-[10px] uppercase tracking-wide inline-block">
                              Inside
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold text-[10px] uppercase">Checked Out</span>
                          )}
                        </td>  
                        
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const targetingPassToken = v.passId || v.pass_id || v.latest_pass_id || v._id;
                              navigate(`/visitor-pass-display/${targetingPassToken}`);
                            }}
                            className="bg-lime-500 hover:bg-lime-600 text-[#111827] text-xs font-black px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-20 text-slate-400 italic">
                      No matching history logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;