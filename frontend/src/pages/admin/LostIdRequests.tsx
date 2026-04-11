import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  TextInput,
  formatDate,
  getErrorMessage,
  getStoredUser,
  titleCase,
} from "../../components/admin/adminShared";
import type { UserRole } from "../../lib/roles";

// ─── Types ────────────────────────────────────────────────────────────────────

type LostIdStatus =
  | "blocked" | "replacement_requested" | "payment_pending"
  | "payment_submitted" | "payment_verified" | "temporary_issued"
  | "completed" | "expired" | "rejected";

interface Student { name?: string; studentId?: string; email?: string; }

interface TemporaryId {
  idNumber: string; issuedAt: string; expiresAt: string; isActive: boolean;
}

interface HistoryEntry { action: string; actorRole: string; timestamp: string; remarks?: string; }

interface LostIdRecord {
  _id: string;
  studentId: string;
  student?: Student;
  reason: string;
  status: LostIdStatus;
  paymentAmount: number;
  penaltyAmount: number;
  repeatCount: number;
  paymentReference?: string;
  paymentDeadline?: string;
  isFraudSuspected: boolean;
  temporaryId?: TemporaryId;
  permanentIdNumber?: string;
  rejectionReason?: string;
  history: HistoryEntry[];
  createdAt: string;
}

interface Analytics {
  byReason: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  fraudCases: number;
  repeatOffenders: { _id: string; times: number }[];
}

// ─── Role permission helpers ──────────────────────────────────────────────────

const REJECT_ALLOWED: Partial<Record<LostIdStatus, UserRole[]>> = {
  blocked:               ["security","registrar"],
  replacement_requested: ["security","registrar"],
  payment_pending:       ["registrar"],
  payment_submitted:     ["registrar"],
  payment_verified:      ["registrar"],
  temporary_issued:      ["registrar"],
};

const can = (role: UserRole, action: string, status?: LostIdStatus) => {
  if (action === "reject") {
    return status ? (REJECT_ALLOWED[status] ?? []).includes(role) : false;
  }
  const map: Record<string, UserRole[]> = {
    requestPayment: ["registrar"],
    verifyPayment:  ["registrar"],
    issueTemp:      ["registrar"],
    issuePerm:      ["registrar"],
    bulkVerify:     ["registrar"],
  };
  return (map[action] ?? []).includes(role);
};

const STATUS_BADGE: Record<string, { tone?: "success" | "warning" | "info" | "neutral"; label: string }> = {
  // Current statuses
  blocked:               { tone: "warning",  label: "Blocked" },
  replacement_requested: { tone: "info",     label: "Replacement Req." },
  payment_pending:       { tone: "warning",  label: "Payment Pending" },
  payment_submitted:     { tone: "info",     label: "Receipt Submitted" },
  payment_verified:      { tone: "success",  label: "Payment Verified" },
  temporary_issued:      { tone: "success",  label: "Temp ID Issued" },
  completed:             { tone: "success",  label: "Completed" },
  expired:               { tone: "neutral",  label: "Expired" },
  rejected:              { tone: undefined,  label: "Rejected" },
  // Legacy statuses (old records before workflow redesign)
  pending:               { tone: "warning",  label: "Pending (Legacy)" },
  approved:              { tone: "success",  label: "Approved (Legacy)" },
};

const getBadge = (status: string) =>
  STATUS_BADGE[status] ?? { tone: "neutral" as const, label: titleCase(status) };

// ─── Component ────────────────────────────────────────────────────────────────

export function LostIdRequests() {
  const user     = getStoredUser();
  const userRole = (user?.role ?? "") as UserRole;

  const [records,    setRecords]    = useState<LostIdRecord[]>([]);
  const [analytics,  setAnalytics]  = useState<Analytics | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [busyId,     setBusyId]     = useState("");
  const [error,      setError]      = useState("");
  const [tab,        setTab]        = useState<"queue" | "analytics">("queue");
  const [filterStatus, setFilterStatus] = useState("");
  const [showHistory,  setShowHistory]  = useState<string | null>(null);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());

  // Per-record form state
  const [tempId,    setTempId]    = useState<Record<string, string>>({});
  const [permId,    setPermId]    = useState<Record<string, string>>({});
  const [rejRemark, setRejRemark] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true); setError("");
    try {
      const url = filterStatus ? `/lost-id?status=${filterStatus}` : "/lost-id";
      const res = await apiRequest<ApiResponse<{ requests: LostIdRecord[] }>>(url);
      setRecords(res.data.requests);
    } catch (err) {
      setRecords([]); setError(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  const loadAnalytics = async () => {
    try {
      const res = await apiRequest<ApiResponse<Analytics>>("/lost-id/analytics");
      setAnalytics(res.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => { void load(); }, [filterStatus]);
  useEffect(() => { if (tab === "analytics" && can(userRole, "bulkVerify")) loadAnalytics(); }, [tab]);

  const act = async (id: string, endpoint: string, body?: Record<string,unknown>, msg?: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/lost-id/${id}/${endpoint}`, { method: "PATCH", body });
      toast.success(msg ?? "Done");
      await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusyId(""); }
  };

  const bulkVerify = async () => {
    setBusyId("bulk");
    try {
      await apiRequest("/lost-id/bulk-verify", { method: "PATCH", body: { ids: [...selected] } });
      toast.success(`${selected.size} payments verified`);
      setSelected(new Set());
      await load();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusyId(""); }
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const STATUS_FILTER_OPTIONS: LostIdStatus[] = [
    "blocked","replacement_requested","payment_pending","payment_submitted",
    "payment_verified","temporary_issued","completed","expired","rejected",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lost ID Requests"
        description="Manage the replacement workflow, verify payments, and issue IDs."
        actions={
          <div className="flex gap-2">
            {can(userRole, "bulkVerify") && selected.size > 0 && (
              <ActionButton type="button" variant="primary" disabled={busyId === "bulk"} onClick={bulkVerify}>
                {busyId === "bulk" ? "Verifying..." : `Bulk Verify (${selected.size})`}
              </ActionButton>
            )}
            <ActionButton type="button" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </ActionButton>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 w-fit">
        {(["queue","analytics"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              tab === t ? "bg-purple-600 text-white font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            {titleCase(t)}
          </button>
        ))}
      </div>

      {error ? <EmptyState title="Error" description={error} /> : null}

      {/* ── Queue tab ── */}
      {tab === "queue" && (
        <Panel title="Request Queue">
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500">Filter:</span>
            <button onClick={() => setFilterStatus("")} className={`px-3 py-1 rounded-full text-xs transition-colors ${!filterStatus ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"}`}>All</button>
            {STATUS_FILTER_OPTIONS.map(s => (
              <button key={s} onClick={() => setFilterStatus(s === filterStatus ? "" : s)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${filterStatus === s ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-400 hover:text-white"}`}>
                {getBadge(s).label}
              </button>
            ))}
          </div>

          {loading && !records.length ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : records.length ? (
            <div className="space-y-4">
              {records.map(r => {
                const badge   = getBadge(r.status);
                const isBusy  = busyId === r._id;
                const name    = r.student?.name ?? r.studentId;
                const canSel  = r.status === "payment_submitted" && can(userRole, "bulkVerify");

                return (
                  <div key={r._id} className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                    r.isFraudSuspected ? "border-red-500/30 bg-red-950/20" : "border-white/5 bg-[#141415]"
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      {canSel && (
                        <input type="checkbox" className="h-4 w-4 rounded accent-purple-500"
                          checked={selected.has(r._id)} onChange={() => toggleSelect(r._id)} />
                      )}
                      <p className="text-base font-semibold text-white">{name}</p>
                      <span className="font-mono text-sm text-zinc-500">{r.studentId}</span>
                      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                      <span className="text-xs capitalize text-zinc-500">{r.reason}</span>
                      {r.isFraudSuspected && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400 font-medium">⚠ Fraud #{r.repeatCount}</span>
                      )}
                      <span className="ml-auto text-xs text-zinc-500">{formatDate(r.createdAt)}</span>
                    </div>

                    {/* Payment info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-zinc-400">Fee: <span className="text-white font-semibold">{r.paymentAmount} ETB</span></span>
                      {r.penaltyAmount > 0 && <span className="text-red-400 text-xs">+{r.penaltyAmount} ETB penalty</span>}
                      {r.paymentReference && <span className="text-zinc-400">Receipt: <span className="font-mono text-zinc-300">{r.paymentReference}</span></span>}
                      {r.paymentDeadline && r.status === "payment_pending" && (
                        <span className="text-amber-400 text-xs">Deadline: {formatDate(r.paymentDeadline)}</span>
                      )}
                      {r.temporaryId && <span className="text-emerald-300 font-mono text-xs">Temp: {r.temporaryId.idNumber}</span>}
                      {r.permanentIdNumber && <span className="text-purple-300 font-mono text-xs">Perm: {r.permanentIdNumber}</span>}
                    </div>
                    {r.rejectionReason && <p className="text-sm text-red-400">Rejected: {r.rejectionReason}</p>}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 items-end pt-1 border-t border-white/5">
                      {/* Step 3: Request payment */}
                      {r.status === "replacement_requested" && can(userRole, "requestPayment") && (
                        <ActionButton type="button" disabled={isBusy}
                          onClick={() => void act(r._id, "request-payment", {}, "Payment requested")}>
                          Request Payment ({r.paymentAmount} ETB)
                        </ActionButton>
                      )}

                      {/* Step 5: Verify payment */}
                      {r.status === "payment_submitted" && can(userRole, "verifyPayment") && (
                        <ActionButton type="button" variant="primary" disabled={isBusy}
                          onClick={() => void act(r._id, "verify-payment", {}, "Payment verified")}>
                          Verify Payment
                        </ActionButton>
                      )}

                      {/* Step 6: Issue temp ID */}
                      {r.status === "payment_verified" && can(userRole, "issueTemp") && (
                        <div className="flex items-end gap-2">
                          <Field label="Temp ID (optional)" className="w-48">
                            <TextInput placeholder="Auto-generated if blank"
                              value={tempId[r._id] ?? ""}
                              onChange={e => setTempId(p => ({ ...p, [r._id]: e.target.value }))} />
                          </Field>
                          <ActionButton type="button" variant="primary" disabled={isBusy}
                            onClick={() => void act(r._id, "issue-temporary", { temporaryIdNumber: tempId[r._id] ?? "" }, "Temporary ID issued")}>
                            Issue Temp ID
                          </ActionButton>
                        </div>
                      )}

                      {/* Step 7: Issue permanent ID */}
                      {r.status === "temporary_issued" && can(userRole, "issuePerm") && (
                        <div className="flex items-end gap-2">
                          <Field label="Permanent ID (optional)" className="w-48">
                            <TextInput placeholder="Auto-generated if blank"
                              value={permId[r._id] ?? ""}
                              onChange={e => setPermId(p => ({ ...p, [r._id]: e.target.value }))} />
                          </Field>
                          <ActionButton type="button" variant="primary" disabled={isBusy}
                            onClick={() => void act(r._id, "issue-permanent", { permanentIdNumber: permId[r._id] ?? "" }, "Permanent ID issued")}>
                            Issue Permanent ID
                          </ActionButton>
                        </div>
                      )}

                      {/* Reject */}
                      {can(userRole, "reject", r.status) && !["completed","expired","rejected"].includes(r.status) && (
                        <div className="flex items-end gap-2 ml-auto">
                          <Field label="Rejection reason" className="w-52">
                            <TextInput placeholder="Required"
                              value={rejRemark[r._id] ?? ""}
                              onChange={e => setRejRemark(p => ({ ...p, [r._id]: e.target.value }))} />
                          </Field>
                          <ActionButton type="button" variant="danger" disabled={isBusy}
                            onClick={() => void act(r._id, "reject", { remarks: rejRemark[r._id] ?? "" }, "Request rejected")}>
                            Reject
                          </ActionButton>
                        </div>
                      )}
                    </div>

                    {/* Audit trail */}
                    <div>
                      <button type="button" onClick={() => setShowHistory(showHistory === r._id ? null : r._id)}
                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                        {showHistory === r._id ? "▲ Hide" : "▼ View"} audit trail ({r.history.length})
                      </button>
                      {showHistory === r._id && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {[...r.history].reverse().map((h, i) => (
                            <div key={i} className="flex gap-3 items-start text-xs">
                              <span className="text-zinc-600 font-mono shrink-0">{formatDate(h.timestamp)}</span>
                              <span className="text-zinc-400">{h.action.replace(/_/g," ")}</span>
                              <StatusBadge>{h.actorRole}</StatusBadge>
                              {h.remarks && <span className="text-zinc-500 text-xs truncate max-w-xs">{h.remarks}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No requests found" description={filterStatus ? `No requests with status '${filterStatus}'.` : "Lost ID requests will appear here."} />
          )}
        </Panel>
      )}

      {/* ── Analytics tab (registrar/admin only) ── */}
      {tab === "analytics" && (
        <div className="grid gap-4 md:grid-cols-2">
          {analytics ? (
            <>
              <Panel title="By Reason">
                <div className="space-y-2">
                  {analytics.byReason.map(r => (
                    <div key={r._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="capitalize text-sm text-zinc-300">{r._id}</span>
                      <span className="font-bold text-white">{r.count}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="By Status">
                <div className="space-y-2">
                  {analytics.byStatus.map(s => (
                    <div key={s._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="capitalize text-sm text-zinc-300">{s._id.replace(/_/g," ")}</span>
                      <span className="font-bold text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Fraud Detection">
                <p className="text-4xl font-black text-red-400">{analytics.fraudCases}</p>
                <p className="text-sm text-zinc-400 mt-1">Requests flagged as suspicious (3+ reports by same student)</p>
              </Panel>
              <Panel title="Repeat Offenders">
                <div className="space-y-2">
                  {analytics.repeatOffenders.length ? analytics.repeatOffenders.map(o => (
                    <div key={o._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="font-mono text-sm text-zinc-300">{o._id}</span>
                      <span className="text-red-400 font-bold">{o.times}× reported</span>
                    </div>
                  )) : <p className="text-sm text-zinc-500">No repeat offenders found.</p>}
                </div>
              </Panel>
            </>
          ) : (
            <div className="md:col-span-2"><EmptyState title="Analytics unavailable" description="Only registrar and admin can view analytics." /></div>
          )}
        </div>
      )}
    </div>
  );
}
