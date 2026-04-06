import { useEffect, useState } from "react";
import { CreditCard, Check, X, RefreshCw, Shield, Coffee, BookOpen, GraduationCap, UserCheck } from "lucide-react";
import { apiRequest } from "../../api/client";

interface LostIdStamps {
  security: boolean;
  cafeteria: boolean;
  library: boolean;
  department: boolean;
  proctor: boolean;
}

interface LostIdRequest {
  _id: string;
  studentId: string;
  status: string;
  stamps: LostIdStamps;
  paymentStatus: boolean;
  temporaryIdIssued: boolean;
  requestDate: string;
  remarks?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const stampDepts = [
  { key: "security", label: "Security", icon: Shield },
  { key: "cafeteria", label: "Cafeteria", icon: Coffee },
  { key: "library", label: "Library", icon: BookOpen },
  { key: "department", label: "Dept", icon: GraduationCap },
  { key: "proctor", label: "Proctor", icon: UserCheck },
] as const;

export function LostIdRequests() {
  const [requests, setRequests] = useState<LostIdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { requests: LostIdRequest[] } }>("/lost-id");
      setRequests(res.data?.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStamp = async (id: string, stamp: string, value: boolean) => {
    setUpdatingId(`${id}-${stamp}`);
    try {
      await apiRequest(`/lost-id/${id}/stamp`, { method: "PATCH", body: { stamp, value } });
      setRequests(prev => prev.map(r =>
        r._id === id ? { ...r, stamps: { ...r.stamps, [stamp]: value } } : r
      ));
    } catch (e) {
      console.error("Failed to update stamp:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const approveRequest = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/lost-id/${id}/approve`, { method: "PATCH" });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "approved" } : r));
    } catch (e) {
      console.error("Failed to approve:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectRequest = async (id: string) => {
    const remarks = prompt("Enter rejection reason:");
    if (!remarks) return;
    setUpdatingId(id);
    try {
      await apiRequest(`/lost-id/${id}/reject`, { method: "PATCH", body: { remarks } });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "rejected", remarks } : r));
    } catch (e) {
      console.error("Failed to reject:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const issueTemporaryId = async (id: string) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/lost-id/${id}/temporary-id`, { method: "PATCH" });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, temporaryIdIssued: true } : r));
    } catch (e) {
      console.error("Failed to issue temp ID:", e);
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
            <CreditCard className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Lost ID Requests</h1>
          </div>
          <p className="text-zinc-500 text-sm">Process lost student ID replacement requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["pending", "approved", "rejected", "completed"].map(status => {
          const count = requests.filter(r => r.status === status).length;
          return (
            <div key={status} className="bg-[#121216] border border-white/5 rounded-xl px-4 py-3">
              <p className="text-zinc-500 text-xs capitalize mb-1">{status}</p>
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
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No lost ID requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="font-normal py-3 px-4">Student</th>
                  <th className="font-normal py-3 px-4">Status</th>
                  {stampDepts.map(d => (
                    <th key={d.key} className="font-normal py-3 px-3 text-center">{d.label}</th>
                  ))}
                  <th className="font-normal py-3 px-4 text-center">Temp ID</th>
                  <th className="font-normal py-3 px-4">Date</th>
                  <th className="font-normal py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{r.studentId}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border capitalize ${statusColors[r.status] || ""}`}>
                        {r.status}
                      </span>
                    </td>
                    {stampDepts.map(d => {
                      const stamped = r.stamps[d.key as keyof LostIdStamps];
                      const isUpdating = updatingId === `${r._id}-${d.key}`;
                      return (
                        <td key={d.key} className="py-4 px-3 text-center">
                          <button
                            onClick={() => updateStamp(r._id, d.key, !stamped)}
                            disabled={isUpdating}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-50 ${
                              stamped
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-800 text-zinc-500 hover:bg-purple-500/20 hover:text-purple-400"
                            }`}
                            title={`${stamped ? "Remove" : "Add"} ${d.label} stamp`}
                          >
                            {isUpdating ? (
                              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            ) : stamped ? (
                              <Check size={14} />
                            ) : (
                              <d.icon size={14} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-center">
                      {r.temporaryIdIssued ? (
                        <span className="text-emerald-400 text-xs font-medium">Issued</span>
                      ) : (
                        <button
                          onClick={() => issueTemporaryId(r._id)}
                          disabled={updatingId === r._id}
                          className="text-xs text-zinc-400 hover:text-purple-400 underline underline-offset-2 disabled:opacity-50"
                        >
                          Issue
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">
                      {new Date(r.requestDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => approveRequest(r._id)}
                              disabled={updatingId === r._id}
                              className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => rejectRequest(r._id)}
                              disabled={updatingId === r._id}
                              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
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
