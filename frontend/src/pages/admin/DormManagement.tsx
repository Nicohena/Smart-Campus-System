import { useEffect, useState } from "react";
import { Building, RefreshCw, Plus, Check, X } from "lucide-react";
import { apiRequest } from "../../api/client";

interface Inspection {
  _id: string;
  dormId: string;
  inspectedBy: string;
  cleanliness: boolean;
  approved: boolean;
  damages?: string;
  conditions: Record<string, unknown>;
  createdAt: string;
}

type ActiveTab = "inspections" | "allocate";

export function DormManagement() {
  const [tab, setTab] = useState<ActiveTab>("inspections");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Allocation form
  const [allocForm, setAllocForm] = useState({
    studentId: "", yearLevel: "", isSpecialNeeds: false, department: "",
  });
  const [allocating, setAllocating] = useState(false);
  const [allocResult, setAllocResult] = useState<string | null>(null);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { inspections: Inspection[] } }>("/dorm/inspections");
      setInspections(res.data?.inspections || []);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "inspections") fetchInspections();
  }, [tab]);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocating(true);
    setAllocResult(null);
    try {
      const res = await apiRequest<{ message: string }>("/dorm/allocate", {
        method: "POST",
        body: allocForm,
      });
      setAllocResult(res.message || "Dorm allocated successfully!");
      setAllocForm({ studentId: "", yearLevel: "", isSpecialNeeds: false, department: "" });
    } catch (e: unknown) {
      setAllocResult((e as Error).message || "Allocation failed");
    } finally {
      setAllocating(false);
    }
  };

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "inspections", label: "Inspections" },
    { key: "allocate", label: "Allocate Dorm" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Dorm Management</h1>
          </div>
          <p className="text-zinc-500 text-sm">Manage dormitory inspections and allocations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#121216] border border-white/5 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Inspections Tab */}
      {tab === "inspections" && (
        <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <h3 className="text-white font-medium">Inspection History</h3>
            <button
              onClick={fetchInspections}
              className="flex items-center gap-2 text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-20">
              <Building className="mx-auto text-zinc-600 mb-3" size={40} />
              <p className="text-zinc-500 text-sm">No inspection records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 border-b border-white/5">
                  <tr>
                    <th className="font-normal py-3 px-4">Dorm ID</th>
                    <th className="font-normal py-3 px-4">Inspector</th>
                    <th className="font-normal py-3 px-4 text-center">Cleanliness</th>
                    <th className="font-normal py-3 px-4 text-center">Approved</th>
                    <th className="font-normal py-3 px-4">Damages</th>
                    <th className="font-normal py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inspections.map((insp) => (
                    <tr key={insp._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 text-white font-medium font-mono text-xs">
                        {insp.dormId.slice(-6)}
                      </td>
                      <td className="py-4 px-4 text-zinc-300">{insp.inspectedBy || "—"}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          insp.cleanliness ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {insp.cleanliness ? <Check size={14} /> : <X size={14} />}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          insp.approved ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {insp.approved ? <Check size={14} /> : <X size={14} />}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-zinc-400 max-w-[200px] truncate">
                        {insp.damages || "None"}
                      </td>
                      <td className="py-4 px-4 text-zinc-500 text-xs">
                        {new Date(insp.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Allocate Tab */}
      {tab === "allocate" && (
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 max-w-lg">
          <h3 className="text-white font-medium mb-6 flex items-center gap-2">
            <Plus size={18} className="text-purple-400" />
            Allocate Dorm to Student
          </h3>

          {allocResult && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
              allocResult.includes("fail") || allocResult.includes("error")
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {allocResult}
            </div>
          )}

          <form onSubmit={handleAllocate} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Student ID</label>
              <input
                type="text" required value={allocForm.studentId}
                onChange={e => setAllocForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                placeholder="e.g. STU001"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Year Level</label>
              <select
                required value={allocForm.yearLevel}
                onChange={e => setAllocForm(f => ({ ...f, yearLevel: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                <option value="" className="bg-[#09090b]">Select year level</option>
                <option value="1" className="bg-[#09090b]">Year 1</option>
                <option value="2" className="bg-[#09090b]">Year 2</option>
                <option value="3" className="bg-[#09090b]">Year 3</option>
                <option value="4" className="bg-[#09090b]">Year 4</option>
                <option value="5" className="bg-[#09090b]">Year 5</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Department (optional)</label>
              <input
                type="text" value={allocForm.department}
                onChange={e => setAllocForm(f => ({ ...f, department: e.target.value }))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAllocForm(f => ({ ...f, isSpecialNeeds: !f.isSpecialNeeds }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  allocForm.isSpecialNeeds ? "bg-purple-600" : "bg-zinc-700"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  allocForm.isSpecialNeeds ? "left-5" : "left-1"
                }`} />
              </button>
              <label className="text-sm text-zinc-300">Special Needs Accommodation</label>
            </div>
            <button
              type="submit" disabled={allocating}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
            >
              {allocating ? "Allocating..." : "Allocate Dorm"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
