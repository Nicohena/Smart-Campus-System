import { useEffect, useState } from "react";
import { Sparkles, Calendar, ChevronDown, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StatCard } from "../../components/admin/StatCard";
import { apiRequest } from "../../api/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

interface DashboardStats {
  complaints: number;
  issues: number;
  inspections: number;
  clearances: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Mock data for charts matching backend schema output roughly
  const issuesData = [
    { name: 'Plumbing', value: 45, color: '#a855f7' },
    { name: 'Electrical', value: 30, color: '#9333ea' },
    { name: 'Carpentry', value: 15, color: '#7e22ce' },
    { name: 'Other', value: 10, color: '#6b21a8' },
  ];

  const clearanceData = [
    { name: 'Approved', value: 65, color: '#a855f7' },
    { name: 'Pending', value: 25, color: '#3b82f6' },
    { name: 'Rejected', value: 10, color: '#18181b' },
  ];

  const recentUsers = [
    { id: '#ZY9653', name: 'Arlene McCoy', role: 'Student', dept: 'Computer Science', status: 'Active', rate: '83%' },
    { id: '#ZY9652', name: 'Darlene Robertson', role: 'Student', dept: 'Engineering', status: 'Active', rate: '96%' },
    { id: '#ZY9651', name: 'Devon Lane', role: 'Staff', dept: 'Administration', status: 'Inactive', rate: '45%' },
    { id: '#ZY9650', name: 'Guy Hawkins', role: 'Student', dept: 'Business', status: 'Active', rate: '72%' },
  ];

  useEffect(() => {
    // In a real implementation this fetches from /api/analytics/dashboard
    // For now we simulate the load to match UI flow
    const loadStats = async () => {
      try {
        const res = await apiRequest<{data: DashboardStats}>("/analytics/dashboard");
        setStats(res.data);
      } catch (e) {
        // Fallback for demo if backend auth stops it
        setStats({ complaints: 142, issues: 84, inspections: 320, clearances: 1186 });
      }
    };
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Here is today's report and performances</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300">
            <Calendar size={14} className="text-zinc-500" />
            <span>Jun 1 - Jun 30</span>
            <ChevronDown size={14} className="ml-1 text-zinc-500" />
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
            <Sparkles size={14} /> AI Assistant
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats?.complaints || "0"} trend="~ +5%" />
        <StatCard title="Active Clearances" value={stats?.clearances || "0"} trend="~ +15%" />
        <StatCard title="Open Issues" value={stats?.issues || "0"} trend="~ +2%" isPositive={false} />
        <StatCard title="Dorm Inspections" value={stats?.inspections || "0"} trend="~ +12%" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium">Issues by Type</h3>
            <button className="flex items-center gap-1 text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg hover:text-white">
              Weekly <ChevronDown size={12} />
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {issuesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium">Clearance Requests</h3>
            <div className="text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
               <Calendar size={12} /> Today
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between h-[250px]">
            <div className="w-[200px] h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clearanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {clearanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-2xl font-bold text-white">100</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total req</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4 px-4 w-full mt-4 sm:mt-0">
              <div className="grid grid-cols-2 gap-4">
                {clearanceData.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center gap-2 mb-1 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </div>
                    <p className="text-lg font-semibold text-white ml-4">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-medium">Recent Users</h3>
          <button className="text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg hover:text-white flex items-center gap-1">
            All users <ChevronDown size={12} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 border-b border-white/5">
              <tr>
                <th className="font-normal py-3 px-4">ID</th>
                <th className="font-normal py-3 px-4">Name</th>
                <th className="font-normal py-3 px-4">Role</th>
                <th className="font-normal py-3 px-4">Department</th>
                <th className="font-normal py-3 px-4">Status</th>
                <th className="font-normal py-3 px-4 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-4 text-zinc-400">{user.id}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-zinc-400">{user.role}</td>
                  <td className="py-4 px-4 text-zinc-400">{user.dept}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                      <span className="text-zinc-300">{user.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3 justify-end">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: user.rate }}></div>
                      </div>
                      <span className="text-zinc-300 min-w-[3ch] text-right">{user.rate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
