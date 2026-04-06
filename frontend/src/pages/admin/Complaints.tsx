import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, RefreshCw } from "lucide-react";
import { apiRequest } from "../../api/client";

interface Complaint {
  _id: string;
  studentId: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  remarks?: string;
}

const statusColors: Record<string, string> = {
  submitted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statuses = ["submitted", "under_review", "in_progress", "resolved", "rejected"];
const priorities = ["low", "medium", "high"];

export function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { complaints: Complaint[] } }>("/complaints");
      setComplaints(res.data?.complaints || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/complaints/${id}/status`, { method: "PATCH", body: { status } });
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const updatePriority = async (id: string, priority: string) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/complaints/${id}/priority`, { method: "PATCH", body: { priority } });
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, priority } : c));
    } catch (e) {
      console.error("Failed to update priority:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Complaints</h1>
          </div>
          <p className="text-zinc-500 text-sm">Manage and review student complaints</p>
        </div>
        <button
          onClick={fetchComplaints}
          className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map(s => {
          const count = complaints.filter(c => c.status === s).length;
          return (
            <div key={s} className="bg-[#121216] border border-white/5 rounded-xl px-4 py-3">
              <p className="text-zinc-500 text-xs capitalize mb-1">{s.replace("_", " ")}</p>
              <p className="text-xl font-bold text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="font-normal py-3 px-4">Student</th>
                  <th className="font-normal py-3 px-4">Category</th>
                  <th className="font-normal py-3 px-4">Title</th>
                  <th className="font-normal py-3 px-4">Status</th>
                  <th className="font-normal py-3 px-4">Priority</th>
                  <th className="font-normal py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{c.studentId}</td>
                    <td className="py-4 px-4">
                      <span className="text-zinc-300 capitalize">{c.category}</span>
                    </td>
                    <td className="py-4 px-4 text-zinc-300 max-w-[200px] truncate">{c.title}</td>
                    <td className="py-4 px-4">
                      <div className="relative inline-block">
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c._id, e.target.value)}
                          disabled={updatingId === c._id}
                          className={`appearance-none cursor-pointer text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border ${statusColors[c.status] || "bg-zinc-800 text-zinc-300"} bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500/50`}
                        >
                          {statuses.map(s => (
                            <option key={s} value={s} className="bg-[#09090b] text-white">
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative inline-block">
                        <select
                          value={c.priority}
                          onChange={(e) => updatePriority(c._id, e.target.value)}
                          disabled={updatingId === c._id}
                          className={`appearance-none cursor-pointer text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border ${priorityColors[c.priority] || "bg-zinc-800 text-zinc-300"} bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500/50`}
                        >
                          {priorities.map(p => (
                            <option key={p} value={p} className="bg-[#09090b] text-white">{p}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">
                      {new Date(c.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
