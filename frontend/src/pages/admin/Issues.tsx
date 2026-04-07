import { useEffect, useState } from "react";
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
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Issue {
  _id: string;
  studentId: string;
  issueType: string;
  description: string;
  block?: string;
  roomNumber?: number;
  status: string;
  reportedAt: string;
  assignedTechnician?: { _id: string; name: string } | null;
  remarks?: string;
}

const nextStatuses: Record<string, string[]> = {
  reported: [],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [technicians, setTechnicians] = useState<Record<string, string>>({});
  const [dormFilter, setDormFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadIssues = async (endpoint = "/issues") => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ issues: Issue[] }>>(endpoint);
      setIssues(response.data.issues);
    } catch (err) {
      setIssues([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadIssues();
  }, []);

  const assignTechnician = async (issueId: string) => {
    const assignedTechnician = technicians[issueId]?.trim();
    if (!assignedTechnician) return;

    setBusyId(issueId);
    try {
      await apiRequest(`/issues/${issueId}/assign`, { method: "PATCH", body: { assignedTechnician } });
      setTechnicians((current) => ({ ...current, [issueId]: "" }));
      await loadIssues();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const updateStatus = async (issueId: string, status: string) => {
    setBusyId(issueId);
    try {
      await apiRequest(`/issues/${issueId}/status`, { method: "PATCH", body: { status } });
      await loadIssues();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues"
        description="Assign technicians, progress issue states, and filter with the dedicated dorm issue endpoint."
        actions={
          <>
            <TextInput value={dormFilter} onChange={(event) => setDormFilter(event.target.value)} placeholder="Dorm id for dorm filter" />
            <ActionButton type="button" onClick={() => void loadIssues(dormFilter.trim() ? `/issues/dorm/${dormFilter.trim()}` : "/issues")}>
              Filter dorm
            </ActionButton>
            <ActionButton type="button" variant="primary" onClick={() => void loadIssues()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </ActionButton>
          </>
        }
      />

      {error ? <EmptyState title="Issue actions need attention" description={error} /> : null}

      <Panel title="Issue Queue" description="Technician assignment expects the backend `assignedTechnician` object id.">
        {issues.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-white/5 text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Issue</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Technician</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Reported</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id} className="border-b border-white/5 align-top">
                    <td className="py-4 text-zinc-300">{issue.studentId}</td>
                    <td className="py-4">
                      <p className="font-medium text-white">{titleCase(issue.issueType)}</p>
                      <p className="mt-2 max-w-md text-zinc-300">{issue.description}</p>
                      {issue.remarks ? <p className="mt-2 text-xs text-zinc-500">Remarks: {issue.remarks}</p> : null}
                    </td>
                    <td className="py-4 text-zinc-300">
                      Block {issue.block ?? "—"}
                      <br />
                      <span className="text-xs text-zinc-500">Room {issue.roomNumber ?? "—"}</span>
                    </td>
                    <td className="py-4">
                      <div className="space-y-2">
                        <StatusBadge>{issue.assignedTechnician?.name ?? "Unassigned"}</StatusBadge>
                        <div className="flex gap-2">
                          <TextInput
                            value={technicians[issue._id] ?? ""}
                            onChange={(event) => setTechnicians((current) => ({ ...current, [issue._id]: event.target.value }))}
                            placeholder="Technician user id"
                          />
                          <ActionButton type="button" onClick={() => void assignTechnician(issue._id)} disabled={busyId === issue._id || issue.status !== "reported"}>
                            Assign
                          </ActionButton>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Field label="Status">
                        <Select
                          value={issue.status}
                          disabled={busyId === issue._id || !nextStatuses[issue.status]?.length}
                          onChange={(event) => void updateStatus(issue._id, event.target.value)}
                        >
                          <option value={issue.status}>{titleCase(issue.status)}</option>
                          {nextStatuses[issue.status]?.map((status) => (
                            <option key={status} value={status}>
                              {titleCase(status)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </td>
                    <td className="py-4 text-zinc-400">{formatDate(issue.reportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No issues found" description="Issue records will appear here when students report them." />
        )}
      </Panel>
    </div>
  );
}
