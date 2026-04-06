import { useEffect, useState } from "react";
import { Megaphone, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { apiRequest } from "../../api/client";

interface Notice {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  priority: string;
  status: string;
  createdAt: string;
  expiryDate?: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  high: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  expired: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const categories = ["general", "department", "club", "security", "academic", "event"];
const audiences = ["all_students", "department_students", "dorm_students"];
const priorities = ["low", "normal", "high", "urgent"];

interface NoticeForm {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  priority: string;
  expiryDate: string;
}

const emptyForm: NoticeForm = {
  title: "", description: "", category: "general",
  targetAudience: "all_students", priority: "normal", expiryDate: "",
};

export function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NoticeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ data: { notices: Notice[] } }>("/notices");
      setNotices(res.data?.notices || []);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        title: form.title,
        description: form.description,
        category: form.category,
        targetAudience: form.targetAudience,
        priority: form.priority,
      };
      if (form.expiryDate) body.expiryDate = new Date(form.expiryDate).toISOString();
      await apiRequest("/notices", { method: "POST", body });
      setShowCreate(false);
      setForm(emptyForm);
      await fetchNotices();
    } catch (e) {
      console.error("Failed to create notice:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await apiRequest(`/notices/${id}`, { method: "DELETE" });
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      console.error("Failed to delete notice:", e);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "expired" : "active";
    try {
      await apiRequest(`/notices/${id}/status`, { method: "PATCH", body: { status: newStatus } });
      setNotices(prev => prev.map(n => n._id === id ? { ...n, status: newStatus } : n));
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Megaphone className="text-purple-400" size={24} />
            <h1 className="text-2xl font-bold text-white tracking-tight">Notices</h1>
          </div>
          <p className="text-zinc-500 text-sm">Create and manage campus-wide notices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotices}
            className="flex items-center gap-2 bg-[#121216] border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
          >
            <Plus size={14} />
            New Notice
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">Create Notice</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createNotice} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Title</label>
                <input
                  type="text" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  placeholder="Notice title..."
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Description</label>
                <textarea
                  required value={form.description} rows={3}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                  placeholder="Notice description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50">
                    {categories.map(c => <option key={c} value={c} className="bg-[#09090b]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Target Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50">
                    {audiences.map(a => <option key={a} value={a} className="bg-[#09090b]">{a.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50">
                    {priorities.map(p => <option key={p} value={p} className="bg-[#09090b]">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Expiry Date (optional)</label>
                  <input type="date" value={form.expiryDate}
                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Notice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-sm">No notices found. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="font-normal py-3 px-4">Title</th>
                  <th className="font-normal py-3 px-4">Category</th>
                  <th className="font-normal py-3 px-4">Audience</th>
                  <th className="font-normal py-3 px-4">Priority</th>
                  <th className="font-normal py-3 px-4">Status</th>
                  <th className="font-normal py-3 px-4">Date</th>
                  <th className="font-normal py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {notices.map((n) => (
                  <tr key={n._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium max-w-[200px] truncate">{n.title}</td>
                    <td className="py-4 px-4 text-zinc-300 capitalize">{n.category}</td>
                    <td className="py-4 px-4 text-zinc-400 capitalize text-xs">{n.targetAudience.replace(/_/g, " ")}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border capitalize ${priorityColors[n.priority] || ""}`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleStatus(n._id, n.status)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${statusColors[n.status] || ""}`}
                      >
                        {n.status}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => deleteNotice(n._id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete notice"
                      >
                        <Trash2 size={14} />
                      </button>
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
