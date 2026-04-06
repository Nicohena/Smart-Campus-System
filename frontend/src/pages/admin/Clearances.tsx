import { useEffect, useState } from "react";
import { ClipboardCheck, Check, X, RefreshCw } from "lucide-react";
import { apiRequest } from "../../api/client";

interface ClearanceApproval {
  status: boolean;
  date?: string;
}

interface Clearance {
  _id: string;
  studentId: string;
  academicYear: string;
  status: string;
  libraryApproval: ClearanceApproval;
  cafeteriaApproval: ClearanceApproval;
  proctorApproval: ClearanceApproval;
  securityApproval: ClearanceApproval;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const departments = [
  { key: "library", label: "Library" },
  { key: "cafeteria", label: "Cafeteria" },
  { key: "proctor", label: "Proctor" },
  { key: "security", label: "Security" },
] as const;

export function Clearances() {
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchClearances = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { clearances: Clearance[] } }>("/clearance");
      setClearances(res.data?.clearances || []);
    } catch {
      setClearances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClearances(); }, []);

  const approveDept = async (id: string, dept: string) => {
    setUpdatingId(`${id}-${dept}`);
    try {
      await apiRequest(`/clearance/${id}/${dept}`, { method: "PATCH" });
      await fetchClearances();
    } catch (e) {
      console.error(`Failed to approve ${dept}:`, e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getApproval = (c: Clearance, key: string): ClearanceApproval => {
    const map: Record<string, ClearanceApproval> = {
      library: c.libraryApproval,
      cafeteria: c.cafeteriaApproval,
      proctor: c.proctorApproval,
      security: c.securityApproval,
    };
    return map[key] || { status: false };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ClipboardCheck className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Clearance Requests</h1>
          </div>
          <p className="text-zinc-500 text-sm">Review and approve student clearance requests</p>
        </div>
        <button
          onClick={fetchClearances}
          className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(statusColors).map(([status]) => {
          const count = clearances.filter(c => c.status === status).length;
          return (
            <div key={status} className="bg-[#121216] border border-white/5 rounded-xl px-4 py-3">
              <p className="text-zinc-500 text-xs capitalize mb-1">{status.replace("_", " ")}</p>
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
        ) : clearances.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardCheck className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No clearance requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="font-normal py-3 px-4">Student</th>
                  <th className="font-normal py-3 px-4">Academic Year</th>
                  {departments.map(d => (
                    <th key={d.key} className="font-normal py-3 px-4 text-center">{d.label}</th>
                  ))}
                  <th className="font-normal py-3 px-4">Status</th>
                  <th className="font-normal py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clearances.map((c) => (
                  <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{c.studentId}</td>
                    <td className="py-4 px-4 text-zinc-300">{c.academicYear}</td>
                    {departments.map(d => {
                      const approval = getApproval(c, d.key);
                      const isUpdating = updatingId === `${c._id}-${d.key}`;
                      return (
                        <td key={d.key} className="py-4 px-4 text-center">
                          {approval.status ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400">
                              <Check size={16} />
                            </span>
                          ) : (
                            <button
                              onClick={() => approveDept(c._id, d.key)}
                              disabled={isUpdating}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-500 hover:bg-purple-500/20 hover:text-purple-400 transition-colors disabled:opacity-50"
                              title={`Approve ${d.label}`}
                            >
                              {isUpdating ? (
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <X size={14} />
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4 px-4">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${statusColors[c.status] || "bg-zinc-800 text-zinc-300"}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
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
