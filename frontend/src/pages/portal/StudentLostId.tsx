import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  TextInput,
  formatDate,
  titleCase,
} from "../../components/admin/adminShared";

// ─── Types ────────────────────────────────────────────────────────────────────

type LostIdStatus =
  | "blocked"
  | "replacement_requested"
  | "payment_pending"
  | "payment_submitted"
  | "payment_verified"
  | "temporary_issued"
  | "completed"
  | "expired"
  | "rejected";

type LostIdReason = "lost" | "damaged" | "stolen" | "other";

interface TemporaryId {
  idNumber: string;
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface HistoryEntry {
  action: string;
  actorRole: string;
  timestamp: string;
  remarks?: string;
}

interface LostIdRecord {
  _id: string;
  reason: LostIdReason;
  status: LostIdStatus;
  paymentAmount: number;
  penaltyAmount: number;
  repeatCount: number;
  paymentReference?: string;
  paymentDeadline?: string;
  isFraudSuspected: boolean;
  temporaryId?: TemporaryId;
  permanentIdNumber?: string;
  completedAt?: string;
  rejectedFromStatus?: LostIdStatus;
  rejectionReason?: string;
  rejectedAt?: string;
  history: HistoryEntry[];
  createdAt: string;
}

// ─── Workflow Steps ───────────────────────────────────────────────────────────

const STEPS: { status: LostIdStatus; label: string; desc: string }[] = [
  { status: "blocked",               label: "ID Blocked",       desc: "Your ID has been blocked to prevent misuse." },
  { status: "replacement_requested", label: "Replacement Req.",  desc: "You've requested a replacement ID." },
  { status: "payment_pending",       label: "Payment Required",  desc: "Pay the replacement fee and submit your receipt." },
  { status: "payment_submitted",     label: "Receipt Submitted", desc: "Awaiting registrar payment verification." },
  { status: "payment_verified",      label: "Payment Verified",  desc: "Payment confirmed. Your ID is being processed." },
  { status: "temporary_issued",      label: "Temp ID Issued",    desc: "Your temporary ID is ready." },
  { status: "completed",             label: "Completed",         desc: "Your permanent ID has been issued." },
];

const STEP_INDEX: Partial<Record<LostIdStatus, number>> = {
  blocked: 0, replacement_requested: 1, payment_pending: 2,
  payment_submitted: 3, payment_verified: 4, temporary_issued: 5, completed: 6,
};

const STATUS_COLOR: Record<LostIdStatus, string> = {
  blocked:               "text-amber-400",
  replacement_requested: "text-blue-400",
  payment_pending:       "text-amber-400",
  payment_submitted:     "text-blue-400",
  payment_verified:      "text-emerald-400",
  temporary_issued:      "text-emerald-400",
  completed:             "text-purple-400",
  expired:               "text-red-400",
  rejected:              "text-red-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DaysLeft({ deadline }: { deadline: string }) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return <span className="text-red-400 text-sm font-medium">Overdue!</span>;
  return (
    <span className={`text-sm font-medium ${diff <= 2 ? "text-red-400" : "text-amber-300"}`}>
      {diff} day{diff !== 1 ? "s" : ""} remaining
    </span>
  );
}

function QRCodeImage({ data, label }: { data: string; label: string }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(data)}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={url} alt="QR Code" className="rounded-xl border border-white/10 bg-white p-1" width={180} height={180} />
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentLostId() {
  const [records, setRecords] = useState<LostIdRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason,     setReason]     = useState<LostIdReason>("lost");
  const [paymentRef, setPaymentRef] = useState("");
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ApiResponse<{ requests: LostIdRecord[] }>>("/lost-id/my-requests");
      setRecords(res.data.requests);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const reportLost = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("/lost-id/report", { method: "POST", body: { reason } });
      toast.success("Lost ID reported. Your ID has been blocked immediately.");
      await load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const requestReplacement = async (id: string) => {
    setSubmitting(true);
    try {
      await apiRequest(`/lost-id/${id}/request-replacement`, { method: "PATCH" });
      toast.success("Replacement requested");
      await load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const submitPayment = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (!paymentRef.trim()) { toast.error("Receipt reference is required"); return; }
    setSubmitting(true);
    try {
      await apiRequest(`/lost-id/${id}/submit-payment`, { method: "PATCH", body: { paymentReference: paymentRef.trim() } });
      toast.success("Receipt submitted");
      setPaymentRef("");
      await load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const resubmit = async (id: string) => {
    setSubmitting(true);
    try {
      await apiRequest(`/lost-id/${id}/resubmit`, { method: "PATCH" });
      toast.success("Request resubmitted");
      await load();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const active  = records.find(r => !["completed","expired","rejected"].includes(r.status));
  const history = records.filter(r =>  ["completed","expired","rejected"].includes(r.status));
  const currentStep = active ? (STEP_INDEX[active.status] ?? -1) : -1;

  return (
    <div className="space-y-6">
      <PageHeader title="Lost ID" description="Report a lost ID and track your replacement through each step." />

      {/* Fraud warning */}
      {active?.isFraudSuspected && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-400">Repeated Loss Detected</p>
            <p className="text-sm text-zinc-400 mt-0.5">This is report #{active.repeatCount}. A penalty of {active.penaltyAmount} ETB has been added to your replacement fee.</p>
          </div>
        </div>
      )}

      {/* Report new lost ID — only when no active request */}
      {!active && (
        <Panel title="Report a Lost ID" description="Your ID will be blocked immediately upon submission.">
          <form onSubmit={reportLost} className="space-y-4">
            <Field label="Reason">
              <Select value={reason} onChange={e => setReason(e.target.value as LostIdReason)}>
                <option value="lost">Lost — 100 ETB</option>
                <option value="stolen">Stolen — 75 ETB</option>
                <option value="damaged">Damaged — 50 ETB</option>
                <option value="other">Other — 75 ETB</option>
              </Select>
            </Field>
            <p className="text-xs text-zinc-500">
              Fees increase by 50 ETB for each previous report. You will be notified about payment details.
            </p>
            <ActionButton type="submit" variant="primary" disabled={submitting || loading}>
              {submitting ? "Reporting..." : "Report my ID as lost"}
            </ActionButton>
          </form>
        </Panel>
      )}

      {/* Active request tracker */}
      {active && (
        <Panel title="Active Request" description={`Opened ${formatDate(active.createdAt)}${active.reason ? ` · Reason: ${titleCase(active.reason)}` : ""}`}>

          {/* Progress stepper */}
          {!["expired","rejected"].includes(active.status) && (
            <div className="mb-6 overflow-x-auto pb-2">
              <div className="flex min-w-max items-start gap-0">
                {STEPS.map((step, i) => {
                  const done    = currentStep > i;
                  const current = currentStep === i;
                  return (
                    <div key={step.status} className="flex items-start">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
                          ${done    ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                          : current ? "border-purple-400 bg-purple-500/20 text-purple-300 animate-pulse"
                                    : "border-white/10 bg-white/5 text-zinc-600"}`}>
                          {done ? "✓" : i + 1}
                        </div>
                        <p className={`mt-1.5 w-20 text-center text-[10px] leading-tight ${
                          current ? "text-purple-300 font-semibold" : done ? "text-zinc-400" : "text-zinc-600"
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`relative top-4 h-0.5 w-10 mx-1 transition-colors ${done ? "bg-purple-500" : "bg-white/8"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status-specific content */}
          {active.status === "rejected" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="font-semibold text-red-400">Request Rejected</p>
                {active.rejectionReason && <p className="mt-1 text-sm text-zinc-400">Reason: {active.rejectionReason}</p>}
                <p className="mt-1 text-xs text-zinc-500">Rejected {formatDate(active.rejectedAt ?? "")}</p>
              </div>
              {active.rejectedFromStatus && !["blocked"].includes(active.rejectedFromStatus) && (
                <ActionButton type="button" variant="primary" onClick={() => void resubmit(active._id)} disabled={submitting}>
                  {submitting ? "Resubmitting..." : "Resubmit Request"}
                </ActionButton>
              )}
            </div>
          )}

          {active.status === "expired" && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="font-semibold text-amber-400">Request Expired</p>
              <p className="mt-1 text-sm text-zinc-400">The payment deadline passed. Please submit a new report.</p>
            </div>
          )}

          {active.status === "blocked" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm font-semibold text-amber-300">Your ID has been blocked</p>
                <p className="mt-1 text-sm text-zinc-400">Click below to formally request a replacement. The registrar will then set up your payment.</p>
                <p className="mt-2 text-xs text-zinc-500">Estimated replacement fee: <span className="text-white font-semibold">{active.paymentAmount} ETB</span></p>
              </div>
              <ActionButton type="button" variant="primary" disabled={submitting} onClick={() => void requestReplacement(active._id)}>
                {submitting ? "Submitting..." : "Request Replacement ID"}
              </ActionButton>
            </div>
          )}

          {active.status === "replacement_requested" && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-300">Replacement request submitted</p>
              <p className="mt-1 text-sm text-zinc-400">The registrar will generate a payment request for <span className="text-white font-semibold">{active.paymentAmount} ETB</span>. You will be notified when payment details are ready.</p>
            </div>
          )}

          {active.status === "payment_pending" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-300">Payment Required</p>
                  {active.paymentDeadline && <DaysLeft deadline={active.paymentDeadline} />}
                </div>
                <p className="text-2xl font-bold text-white">{active.paymentAmount} ETB</p>
                {active.penaltyAmount > 0 && (
                  <p className="text-xs text-red-400">Includes {active.penaltyAmount} ETB penalty for repeated reports</p>
                )}
                <p className="text-xs text-zinc-400">Pay at the registrar office or campus portal, then enter your receipt/transaction number below.</p>
              </div>
              <form onSubmit={e => void submitPayment(e, active._id)} className="flex gap-2 items-end">
                <Field label="Receipt / Transaction Number" className="flex-1">
                  <TextInput
                    placeholder="e.g. TXN-20250411-001"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    required
                  />
                </Field>
                <ActionButton type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </ActionButton>
              </form>
            </div>
          )}

          {active.status === "payment_submitted" && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-300">Receipt Submitted</p>
              <p className="mt-1 text-sm text-zinc-400">Reference: <span className="font-mono text-white">{active.paymentReference}</span></p>
              <p className="mt-2 text-sm text-zinc-400">The registrar is verifying your payment. You will be notified once confirmed.</p>
            </div>
          )}

          {active.status === "payment_verified" && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-emerald-300">Payment Verified ✓</p>
              <p className="mt-1 text-sm text-zinc-400">Your payment has been confirmed. The registrar will issue your temporary ID shortly.</p>
            </div>
          )}

          {active.status === "temporary_issued" && active.temporaryId && (
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-semibold text-emerald-300">Temporary ID Issued 🪪</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-white">{active.temporaryId.idNumber}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    Issued: {formatDate(active.temporaryId.issuedAt)} · 
                    Expires: <span className={active.temporaryId.isActive ? "text-white" : "text-red-400"}>
                      {formatDate(active.temporaryId.expiresAt)}
                    </span>
                  </p>
                  {!active.temporaryId.isActive && (
                    <p className="mt-1 text-xs text-red-400 font-semibold">⚠ This temporary ID has expired</p>
                  )}
                </div>
                <p className="text-xs text-zinc-500">Your permanent ID will be issued after further processing. Keep this temporary ID until then.</p>
              </div>
              <QRCodeImage
                data={`CAMPUS-TEMP-${active.temporaryId.idNumber}`}
                label="Show this QR to security for verification"
              />
            </div>
          )}

          {active.status === "completed" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="text-sm font-semibold text-purple-300">✅ Permanent ID Issued</p>
                <p className="mt-2 font-mono text-2xl font-bold text-white">{active.permanentIdNumber}</p>
                <p className="mt-2 text-xs text-zinc-400">Completed {formatDate(active.completedAt ?? "")}</p>
              </div>
              {active.temporaryId && (
                <p className="text-xs text-zinc-500">Previous temp ID: <span className="font-mono">{active.temporaryId.idNumber}</span> (deactivated)</p>
              )}
            </div>
          )}

          {/* Audit history toggle */}
          <div className="mt-6 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => setShowHistory(showHistory === active._id ? null : active._id)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showHistory === active._id ? "▲ Hide" : "▼ Show"} audit history ({active.history.length} events)
            </button>
            {showHistory === active._id && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                {[...active.history].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 items-start text-xs">
                    <span className="text-zinc-600 font-mono shrink-0">{formatDate(h.timestamp)}</span>
                    <span className="text-zinc-400">{h.action.replace(/_/g, " ")}</span>
                    <StatusBadge>{h.actorRole}</StatusBadge>
                    {h.remarks && <span className="text-zinc-500 truncate">{h.remarks}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Past requests */}
      {history.length > 0 && (
        <Panel title="Past Requests" description="Completed, expired, and rejected requests.">
          <div className="space-y-3">
            {history.map(r => (
              <div key={r._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-[#141415] px-4 py-3">
                <span className={`text-sm font-semibold ${STATUS_COLOR[r.status]}`}>{r.status ? titleCase(r.status) : ""}</span>
                <span className="text-xs text-zinc-500 capitalize">{r.reason}</span>
                <span className="text-xs text-zinc-500">{formatDate(r.createdAt)}</span>
                {r.permanentIdNumber && <span className="font-mono text-sm text-purple-300">Perm: {r.permanentIdNumber}</span>}
                {r.rejectionReason && <span className="text-xs text-red-400">{r.rejectionReason}</span>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {loading && !records.length && (
        <EmptyState title="Loading..." description="Fetching your lost ID requests." />
      )}
    </div>
  );
}
