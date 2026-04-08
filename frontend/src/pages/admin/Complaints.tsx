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
  Select,
  StatusBadge,
  TextInput,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Complaint {
  _id: string;
  studentId: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  handledBy?: { _id: string; name: string } | null;
  remarks?: string;
}

const nextStatuses: Record<string, string[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["in_progress"],
  in_progress: ["resolved"],
  resolved: [],
  rejected: [],
};

export function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ complaints: Complaint[] }>>("/complaints");
      setComplaints(response.data.complaints);
    } catch (err) {
      setComplaints([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  const updateStatus = async (complaintId: string, status: string) => {
    setBusyId(complaintId);
    try {
      await apiRequest(`/complaints/${complaintId}/status`, { method: "PATCH", body: { status } });
      toast.success("Complaint status updated");
      await loadComplaints();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const updatePriority = async (complaintId: string, priority: string) => {
    setBusyId(complaintId);
    try {
      await apiRequest(`/complaints/${complaintId}/priority`, { method: "PATCH", body: { priority } });
      toast.success("Complaint priority updated");
      await loadComplaints();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const assignHandler = async (complaintId: string) => {
    const handledBy = assignments[complaintId]?.trim();
    if (!handledBy) return;

    setBusyId(complaintId);
    try {
      await apiRequest(`/complaints/${complaintId}/assign`, { method: "PATCH", body: { handledBy } });
      toast.success("Complaint assigned successfully");
      setAssignments((current) => ({ ...current, [complaintId]: "" }));
      await loadComplaints();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Union Complaints"
        description="Review submitted complaints, coordinate responses, and escalate cases through the student union workflow."
        actions={
          <ActionButton type="button" variant="primary" onClick={loadComplaints} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Complaint actions need attention" description={error} /> : null}

      <Panel title="Complaint Queue" description="Assign using handler MongoDB user ID, staff ID, or email.">
        {complaints.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-white/5 text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Complaint</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Handler</th>
                  <th className="pb-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id} className="border-b border-white/5 align-top">
                    <td className="py-4 text-zinc-300">{complaint.studentId}</td>
                    <td className="py-4">
                      <p className="font-medium text-white">{complaint.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{titleCase(complaint.category)}</p>
                      <p className="mt-2 max-w-md text-zinc-300">{complaint.description}</p>
                      {complaint.remarks ? <p className="mt-2 text-xs text-zinc-500">Remarks: {complaint.remarks}</p> : null}
                    </td>
                    <td className="py-4">
                      <Field label="Status">
                        <Select
                          value={complaint.status}
                          disabled={busyId === complaint._id || !nextStatuses[complaint.status]?.length}
                          onChange={(event) => void updateStatus(complaint._id, event.target.value)}
                        >
                          <option value={complaint.status}>{titleCase(complaint.status)}</option>
                          {nextStatuses[complaint.status]?.map((status) => (
                            <option key={status} value={status}>
                              {titleCase(status)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </td>
                    <td className="py-4">
                      <Field label="Priority">
                        <Select
                          value={complaint.priority}
                          disabled={busyId === complaint._id || complaint.status === "resolved" || complaint.status === "rejected"}
                          onChange={(event) => void updatePriority(complaint._id, event.target.value)}
                        >
                          {["low", "medium", "high"].map((priority) => (
                            <option key={priority} value={priority}>
                              {titleCase(priority)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </td>
                    <td className="py-4">
                      <div className="space-y-2">
                        <StatusBadge>{complaint.handledBy?.name ?? "Unassigned"}</StatusBadge>
                        <div className="flex gap-2">
                          <TextInput
                            value={assignments[complaint._id] ?? ""}
                            onChange={(event) => setAssignments((current) => ({ ...current, [complaint._id]: event.target.value }))}
                            placeholder="Handler ID or email"
                          />
                          <ActionButton type="button" onClick={() => void assignHandler(complaint._id)} disabled={busyId === complaint._id}>
                            Assign
                          </ActionButton>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-zinc-400">{formatDate(complaint.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No complaints found" description="Complaint records will appear here when students submit them." />
        )}
      </Panel>
    </div>
  );
}
