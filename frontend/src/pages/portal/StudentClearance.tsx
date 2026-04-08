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
  StatusBadge,
  TextInput,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface ClearanceRecord {
  _id: string;
  academicYear: string;
  status: string;
  createdAt: string;
  libraryApproval: { status: boolean };
  cafeteriaApproval: { status: boolean };
  proctorApproval: { status: boolean };
  securityApproval: { status: boolean };
}

type ApprovalStep = [string, boolean];

export function StudentClearance() {
  const [records, setRecords] = useState<ClearanceRecord[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ records: ClearanceRecord[] }>>("/clearance/my-clearance");
      setRecords(response.data.records);
    } catch (err) {
      setRecords([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ clearance: ClearanceRecord }>>("/clearance/request", {
        method: "POST",
        body: { academicYear },
      });
      setMessage(response.message);
      toast.success("Clearance request submitted");
      setAcademicYear("");
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Clearance" description="Submit a clearance request and track each approval checkpoint." />

      {message ? <EmptyState title="Request submitted" description={message} /> : null}
      {error ? <EmptyState title="Clearance needs attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Panel title="Request Clearance" description="Students can request one clearance record per academic year.">
          <form className="space-y-4" onSubmit={submitRequest}>
            <Field label="Academic Year">
              <TextInput value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="2025/2026" required />
            </Field>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Request clearance"}
            </ActionButton>
          </form>
        </Panel>

        <Panel title="My Clearance Records" description="Your approval progress updates here after proctor action.">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading clearance records...</p>
          ) : records.length ? (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-white">{record.academicYear}</p>
                    <StatusBadge>{titleCase(record.status)}</StatusBadge>
                    <span className="text-xs text-zinc-500">Requested {formatDate(record.createdAt)}</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-4">
                    {([
                      ["Library", record.libraryApproval.status],
                      ["Cafeteria", record.cafeteriaApproval.status],
                      ["Proctor", record.proctorApproval.status],
                      ["Security", record.securityApproval.status],
                    ] as ApprovalStep[]).map(([label, done]) => (
                      <div key={label} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                        <div className="flex items-center justify-between gap-3">
                          <span>{label}</span>
                          <StatusBadge tone={done ? "success" : "warning"}>{done ? "Done" : "Pending"}</StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No clearance requests yet" description="Submit your first clearance request from the panel on the left." />
          )}
        </Panel>
      </div>
    </div>
  );
}
