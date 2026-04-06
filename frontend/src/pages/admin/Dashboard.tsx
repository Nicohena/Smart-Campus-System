import { useEffect, useState } from "react";
import { Sparkles, Calendar } from "lucide-react";
import { StatCard } from "../../components/admin/StatCard";
import { apiRequest } from "../../api/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

interface DashboardStats {
  complaints: number;
  issues: number;
  inspections: number;
  clearances: number;
}

interface AggBucket {
  _id: string | null;
  count: number;
}

interface IssuesAnalytics {
  byType: AggBucket[];
  byStatus: AggBucket[];
}

interface ComplaintsAnalytics {
  byCategory: AggBucket[];
  byStatus: AggBucket[];
}

const issueColors = ["#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#4c1d95"];
const complaintColors = ["#a855f7", "#3b82f6", "#18181b", "#6b21a8", "#9333ea", "#581c87", "#4c1d95"];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issuesData, setIssuesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [complaintsData, setComplaintsData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      // Fetch dashboard stats
      try {
        const res = await apiRequest<{ data: DashboardStats }>("/analytics/dashboard");
        setStats(res.data);
      } catch {
        setStats({ complaints: 0, issues: 0, inspections: 0, clearances: 0 });
      }

      // Fetch issues analytics
      try {
        const res = await apiRequest<{ data: IssuesAnalytics }>("/analytics/issues");
        const byType = (res.data?.byType || []).map((b, i) => ({
          name: b._id || "Unknown",
          value: b.count,
          color: issueColors[i % issueColors.length],
        }));
        setIssuesData(byType.length > 0 ? byType : [
          { name: "No data", value: 1, color: "#27272a" },
        ]);
      } catch {
        setIssuesData([{ name: "No data", value: 1, color: "#27272a" }]);
      }

      // Fetch complaints analytics
      try {
        const res = await apiRequest<{ data: ComplaintsAnalytics }>("/analytics/complaints");
        const byStatus = (res.data?.byStatus || []).map((b, i) => ({
          name: b._id || "Unknown",
          value: b.count,
          color: complaintColors[i % complaintColors.length],
        }));
        setComplaintsData(byStatus.length > 0 ? byStatus : [
          { name: "No data", value: 1, color: "#27272a" },
        ]);
      } catch {
        setComplaintsData([{ name: "No data", value: 1, color: "#27272a" }]);
      }
    };
    loadAll();
  }, []);

  const totalComplaints = complaintsData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Campus management overview and analytics</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300">
            <Calendar size={14} className="text-zinc-500" />
            <span>{new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
            <Sparkles size={14} /> AI Insights
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats?.complaints ?? "—"} trend="~ live" />
        <StatCard title="Active Clearances" value={stats?.clearances ?? "—"} trend="~ live" />
        <StatCard title="Open Issues" value={stats?.issues ?? "—"} trend="~ live" isPositive={false} />
        <StatCard title="Dorm Inspections" value={stats?.inspections ?? "—"} trend="~ live" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart — Issues by Type */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium">Issues by Type</h3>
            <div className="flex items-center gap-1 text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg">
              All time
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff' }} 
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

        {/* Donut Chart — Complaints by Status */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-medium">Complaints by Status</h3>
            <div className="text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
               <Calendar size={12} /> All time
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between h-[250px]">
            <div className="w-[200px] h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {complaintsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-2xl font-bold text-white">{totalComplaints}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4 px-4 w-full mt-4 sm:mt-0">
              <div className="grid grid-cols-2 gap-4">
                {complaintsData.filter(d => d.name !== "No data").map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center gap-2 mb-1 text-xs text-zinc-400">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="capitalize">{item.name.replace("_", " ")}</span>
                    </div>
                    <p className="text-lg font-semibold text-white ml-4">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
