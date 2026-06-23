import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios"; // 🟢 Fixed: Only one clean import statement from the correct package
import { baseURL } from "../../assets/assets"; // Double check if it needs to be "/src/assets/assets" based on your project structure
import toast from "react-hot-toast";
import { FaUsers, FaDoorOpen, FaCalendarAlt, FaChartBar, FaClock } from "react-icons/fa";

const Dashboard = () => {
  const { user } = useSelector((store) => store.auth);
  const [dashboardData, setDashboardData] = useState({
    totalVisitors: 0,
    activeVisitors: 0,
    todayVisits: 0,
    departments: [],
    recentVisitors: [],
    visitorTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const Filter = [
    { label: "Day", value: "day" },
    { label: "Month", value: "month" },
  ];
  const [filter, setFilter] = useState(Filter[0]);

  const formatEntryTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}visitor/dashboard-stats`, {
        params: { filter: filter.value },
        withCredentials: true 
      });

      if (res?.data?.success) {
        const data = res?.data?.stats || {}; 
        setDashboardData({
          activeVisitors: data.active || 0,
          totalVisitors: data.total || 0,
          todayVisits: data.completed || 0, 
          departments: data.departmentStats || [], 
          recentVisitors: data.recentVisitors || [],
          visitorTrend: data.visitorTrend || [],
        });
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) getDashboardStats();
  }, [filter, user]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Mycem <span className="text-lime-500">Dashboard</span>
          </h2>
          <p className="text-slate-500 text-sm">Welcome back,To HeidelbergCement</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm">
          {Filter.map((f) => (
            <button key={f.value} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filter.value === f.value ? "bg-lime-500 text-white shadow-md" : "text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* <DashboardCard icon={FaUsers} title="Total Visitors" value={dashboardData.totalVisitors} color="bg-blue-500" /> */}
        <DashboardCard icon={FaDoorOpen} title="Active Now" value={dashboardData.activeVisitors} color="bg-lime-500" />
        <DashboardCard icon={FaCalendarAlt} title="Today's Total" value={dashboardData.todayVisits} color="bg-purple-500" />
        <DashboardCard icon={FaChartBar} title="Depts" value={dashboardData?.departments?.length || 0} color="bg-orange-500" />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-slate-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Visitors</h3>
          <span className="text-xs font-bold text-lime-600 bg-lime-50 dark:bg-lime-900/20 px-3 py-1 rounded-full uppercase">Live Feed</span>
        </div>

        {dashboardData.recentVisitors?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Visitor name</th>
                  <th className="px-6 py-4">To meet</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">IN Time</th> 
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {dashboardData.recentVisitors.map((visitor, idx) => {
                  // 🟢 SAFETY CHECK: Ignore null data points from corrupt database history logs seamlessly
                  if (!visitor) return null;

                  return (
                    <tr key={visitor._id || idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200">
                        {visitor.visitor_name || visitor.visitorName || visitor.name || "Unknown"}
                      </td>

                      <td className="px-6 py-4 text-slate-600 dark:text-gray-400">
                        {typeof visitor.employee_to_visit === 'object' 
                          ? visitor.employee_to_visit?.name 
                          : (visitor.employee_name || visitor.employee_to_visit || visitor.employeeName || "Official Staff")}
                      </td>

                      <td className="px-6 py-4 text-slate-600 dark:text-gray-400 uppercase text-[10px] font-bold">
                        {typeof visitor.department_to_visit === 'object' 
                          ? visitor.department_to_visit?.name 
                          : (visitor.department_name || visitor.department_to_visit || visitor.departmentName || "General Operations")}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 font-mono text-xs">
                          <FaClock className="text-lime-500" size={12} />
                          {formatEntryTime(visitor.createdAt || visitor.check_in_time)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {Number(visitor.status) === 1 ? (
                          <span className="flex items-center gap-1.5 text-lime-600 font-black text-[10px] uppercase">
                            <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-ping"></span>
                            Inside
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Checked Out</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-slate-400 italic">No visitors recorded today.</div>
        )}
      </div>
    </div>
  );
};

const DashboardCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-slate-400 dark:text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h4>
    </div>
    <div className={`p-4 rounded-xl ${color} text-white shadow-lg`}>
      <Icon size={24} />
    </div>
  </div>
);

export default Dashboard;