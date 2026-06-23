import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import DateTimePicker from "../../components/ui/DateTimePicker";
import { baseURL } from "../../assets/assets";
import Loader from "../../components/ui/Loader";
import { FaPaperPlane, FaFileCsv, FaSearch, FaCalendarAlt, FaFilter } from "react-icons/fa";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [ydayLoading, setYdayLoading] = useState(false);
  const [todayLoading, setTodayLoading] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all"); 

  const formatDate = (date) => {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const fetchVisitorData = async (start, end, setLoader) => {
    try {
      setLoader(true);
      setVisitors([]);
      
      const res = await axios.get(`${baseURL}visitor/repot`, {
        params: { 
          startTime: start, 
          endTime: end,
          searchQuery: searchQuery,
          searchField: searchField
        },
        withCredentials: true 
      });
      if (res?.data?.success) setVisitors(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error("Failed to fetch visitor data.");
    } finally {
      setLoader(false);
    }
  };

  const fetchYdayVisitorData = () => {
    const now = new Date();
    const today8AM = new Date(now);
    today8AM.setHours(8, 0, 0, 0);
    const yesterday8AM = new Date(today8AM);
    yesterday8AM.setDate(today8AM.getDate() - 1);
    
    const sStr = formatDate(yesterday8AM);
    const eStr = formatDate(today8AM);
    setStartTime(sStr);
    setEndTime(eStr);
    fetchVisitorData(sStr, eStr, setYdayLoading);
  };

  const fetchTdayVisitorData = () => {
    const now = new Date();
    const today8AM = new Date(now);
    today8AM.setHours(8, 0, 0, 0);
    
    const sStr = formatDate(today8AM);
    const eStr = formatDate(now);
    setStartTime(sStr);
    setEndTime(eStr);
    fetchVisitorData(sStr, eStr, setTodayLoading);
  };

  const fetchMTDVisitorData = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 8, 0, 0);
    
    const sStr = formatDate(startOfMonth);
    const eStr = formatDate(now);
    setStartTime(sStr);
    setEndTime(eStr);
    fetchVisitorData(sStr, eStr, setMonthLoading);
  };

  const fetchVisitors = async () => {
    if (!startTime || !endTime) return toast.error("Please select the Time Range.");
    await fetchVisitorData(startTime, endTime, setLoading);
  };

  const handleDownloadCSV = () => {
    if (!startTime || !endTime) return toast.error("Please select a valid time range first.");
    if (!visitors.length) return toast.error("No active report lines found to export.");
    
    window.location.href = `${baseURL}visitor/repot?startTime=${startTime}&endTime=${endTime}&exportFormat=csv&searchQuery=${searchQuery}&searchField=${searchField}`;
    toast.success("Downloading spreadsheet report...");
  };

  const handleSendReport = async () => {
    if (!visitors.length) return toast.error("No report data to send.");
    try {
      const res = await axios.post(`${baseURL}visitor/send-report`, {
        visitors: visitors,
      }, { withCredentials: true });
      if (res?.data?.success) toast.success("Email report sent!");
    } catch (error) {
      toast.error("Failed to send email report.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Dynamic Premium Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700/50 shadow-sm">
          <div>
            <span className="text-[10px] bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-400 font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider">
              Management Intelligence Portal
            </span>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5 uppercase tracking-tight">
              Visitor <span className="text-blue-600 dark:text-blue-500">Analytics & Reports</span>
            </h1>
          </div>
        </div>

        {/* Premium Workstation Console */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-100 dark:border-gray-700/60 shadow-md overflow-hidden">
          
          {/* TIER 1: Unified Parameter Strip Line */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-gradient-to-b from-slate-50/50 to-white dark:from-gray-900/20 dark:to-gray-800">
            <div className="md:col-span-3 flex flex-col gap-1.5 relative group">
              <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                <FaCalendarAlt className="text-slate-400 text-[10px]" /> Start Timestamp
              </label>
              <div className="w-full text-xs font-bold text-slate-700 dark:text-white">
                <DateTimePicker label="" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1.5 relative">
              <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                <FaCalendarAlt className="text-slate-400 text-[10px]" /> End Timestamp
              </label>
              <div className="w-full text-xs font-bold text-slate-700 dark:text-white">
                <DateTimePicker label="" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                <FaFilter className="text-slate-400 text-[9px]" /> Search Parameter
              </label>
              <select 
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="w-full border border-slate-200 dark:border-gray-700 h-[44px] px-4 rounded-xl bg-white dark:bg-gray-900 text-slate-700 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm cursor-pointer hover:border-slate-300"
              >
                <option value="all">Search All Fields</option>
                <option value="name">Visitor Name</option>
                <option value="contactno">Mobile Number</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                <FaSearch className="text-slate-400 text-[10px]" /> Query Expression
              </label>
              <input 
                type="text"
                placeholder="Type name, phone or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-200 dark:border-gray-700 h-[44px] px-4 rounded-xl bg-white dark:bg-gray-900 text-slate-700 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-300 hover:border-slate-300"
              />
            </div>
          </div>

          {/* TIER 2: Command Controls Subbar */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-gray-900/30 border-t border-slate-100 dark:border-gray-700/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={fetchYdayVisitorData} className="text-[10px] font-black tracking-wider bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-300 px-4 h-[36px] rounded-xl transition border border-slate-200/80 dark:border-gray-700 shadow-sm active:scale-95">
                {ydayLoading ? "..." : "YESTERDAY"}
              </button>
              <button onClick={fetchTdayVisitorData} className="text-[10px] font-black tracking-wider bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-300 px-4 h-[36px] rounded-xl transition border border-slate-200/80 dark:border-gray-700 shadow-sm active:scale-95">
                {todayLoading ? "..." : "TODAY"}
              </button>
              <button onClick={fetchMTDVisitorData} className="text-[10px] font-black tracking-wider bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-300 px-4 h-[36px] rounded-xl transition border border-slate-200/80 dark:border-gray-700 shadow-sm active:scale-95">
                {monthLoading ? "..." : "MONTH TO DATE"}
              </button>
            </div>

            <div className="flex gap-2.5 w-full sm:w-auto justify-end">
              <button onClick={fetchVisitors} className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition font-black text-xs uppercase tracking-wider text-white px-8 h-[42px] rounded-xl flex items-center justify-center shadow-md shadow-blue-600/10 min-w-[150px]">
                {loading ? <Loader /> : "Generate Report"}
              </button>
              
              <button onClick={handleDownloadCSV} title="Download CSV Spreadsheet" className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition text-white px-4 h-[42px] rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/10 gap-2">
                <FaFileCsv className="text-base" /> Export CSV
              </button>

              
            </div>
          </div>
        </div>

        {/* Presentation Logging Table Frame */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700/60 shadow-xl overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/40 flex items-center">
            <span className="font-black text-slate-700 dark:text-white text-xs uppercase tracking-wider bg-slate-200/50 dark:bg-gray-700 px-3 py-1 rounded-lg">
              {visitors.length} Records Extracted
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-gray-900/80 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b dark:border-gray-700">
                <tr>
                  <th className="p-4">Sr.</th>
                  <th className="p-4">Visitor Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">To Visit</th>
                  <th className="p-4">Dept</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60 text-xs font-semibold text-slate-700 dark:text-gray-300">
                {visitors.length > 0 ? (
                  visitors.map((v, i) => {
                    // 🟢 SAFETY SHORT-CIRCUIT: Ignores null records to prevent front-end crashes
                    if (!v) return null;

                    return (
                      <tr key={v.id || v._id || i} className="hover:bg-slate-50/60 dark:hover:bg-gray-700/30 transition">
                        <td className="p-4 text-slate-400 font-mono font-normal">{i + 1}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">{v.visitor_name || v.name}</td>
                        <td className="p-4 font-mono text-slate-500">{v.visitor_contact_no || v.contact_no || v.contactNo}</td>
                        <td className="p-4 text-slate-600 dark:text-gray-400">{v.company || "—"}</td>
                        
                        <td className="p-4 font-bold text-slate-800 dark:text-gray-200 capitalize">
                          {v.employee_name || v.employee_to_visit || v.to_visit || "—"}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                          {v.department_name || v.department_to_visit || v.departmentTo || "—"}
                        </td>

                        <td className="p-4 text-[11px] font-mono font-bold text-slate-600 dark:text-gray-400">
                          {v.check_in_time ? new Date(v.check_in_time).toLocaleString("en-IN", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true}) : "—"}
                        </td>
                        <td className="p-4 text-[11px] font-mono font-bold text-slate-600 dark:text-gray-400">
                          {v.check_out_time || v.exit_time ? new Date(v.check_out_time || v.exit_time).toLocaleString("en-IN", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true}) : "—"}
                        </td>
                        <td className="p-4">
                          {v.status === "CHECKED OUT" || v.status === "COMPLETED" || Number(v.status) === 2 ? (
                            <span className="text-[10px] uppercase font-black tracking-wide text-slate-400">Completed</span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-black tracking-wide uppercase px-2 py-0.5 rounded">Inside</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-24 text-slate-400 dark:text-slate-500 italic font-medium">
                      Configure parameters and execute generate report to build data grids.
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

export default Reports;