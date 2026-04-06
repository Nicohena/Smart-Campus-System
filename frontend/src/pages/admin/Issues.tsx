import { useEffect, useState } from "react";
import { Wrench, ChevronDown, RefreshCw } from "lucide-react";
import { apiRequest } from "../../api/client";

interface Issue {
  _id: string;
  studentId: string;
  issueType: string;
  description: string;
  block?: string;
  roomNumber?: number;
  status: string;
  reportedAt: string;
  remarks?: string;
}

const statusColors: Record<string, string> = {
  reported: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  assigned: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const typeIcons: Record<string, string> = {
  power: "⚡", water: "💧", furniture: "🪑", electrical: "🔌",
  internet: "🌐", plumbing: "🔧", other: "📋",
};

const statuses = ["reported", "assigned", "in_progress", "resolved", "closed"];

export function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { issues: Issue[] } }>("/issues");
      setIssues(res.data?.issues || []);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/issues/${id}/status`, { method: "PATCH", body: { status } });
      setIssues(prev => prev.map(i => i._id === id ? { ...i, status } : i));
    } catch (e) {
      console.error("Failed to update status:", e);
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
            <Wrench className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance Issues</h1>
          </div>
          <p className="text-zinc-500 text-sm">Track and manage campus maintenance reports</p>
        </div>
        <button
          onClick={fetchIssues}
          className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map(s => {
          const count = issues.filter(i => i.status === s).length;
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
        ) : issues.length === 0 ? (
          <div className="text-center py-20">
            <Wrench className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No maintenance issues found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="font-normal py-3 px-4">Student</th>
                  <th className="font-normal py-3 px-4">Type</th>
                  <th className="font-normal py-3 px-4">Location</th>
                  <th className="font-normal py-3 px-4">Description</th>
                  <th className="font-normal py-3 px-4">Status</th>
                  <th className="font-normal py-3 px-4">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{issue.studentId}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-2 text-zinc-300 capitalize">
                        <span>{typeIcons[issue.issueType] || "📋"}</span>
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400">
                      {issue.block ? `Block ${issue.block}` : "—"}
                      {issue.roomNumber ? `, Room ${issue.roomNumber}` : ""}
                    </td>
                    <td className="py-4 px-4 text-zinc-300 max-w-[200px] truncate">
                      {issue.description}
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative inline-block">
                        <select
                          value={issue.status}
                          onChange={(e) => updateStatus(issue._id, e.target.value)}
                          disabled={updatingId === issue._id}
                          className={`appearance-none cursor-pointer text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border ${statusColors[issue.status] || "bg-zinc-800 text-zinc-300"} bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500/50`}
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
                    <td className="py-4 px-4 text-zinc-500 text-xs">
                      {new Date(issue.reportedAt).toLocaleDateString()}
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
