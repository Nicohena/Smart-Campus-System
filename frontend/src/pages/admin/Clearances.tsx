import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Approval {
  status: boolean;
  date?: string;
}

interface ClearanceRecord {
  _id: string;
  studentId: string;
  academicYear: string;
  status: string;
  libraryApproval: Approval;
  cafeteriaApproval: Approval;
  proctorApproval: Approval;
  securityApproval: Approval;
  createdAt: string;
}

const approvalOrder = [
  { key: "library", label: "Library" },
  { key: "cafeteria", label: "Cafeteria" },
  { key: "proctor", label: "Proctor" },
  { key: "security", label: "Security" },
] as const;

export function Clearances() {
  const [records, setRecords] = useState<ClearanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ records: ClearanceRecord[] }>>("/clearance");
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

  const approve = async (recordId: string, section: string) => {
    setBusyKey(`${recordId}-${section}`);
    try {
      await apiRequest(`/clearance/${recordId}/${section}`, { method: "PATCH" });
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proctor Clearances"
        description="Review student clearance records from the proctor office and complete approvals in the backend sequence."
        actions={
          <ActionButton type="button" variant="primary" onClick={loadRecords} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Clearance actions need attention" description={error} /> : null}

      <Panel title="Clearance Records" description="Proctor approval depends on a valid dorm inspection, and security approval depends on all earlier checkpoints.">
        {records.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-white/5 text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Academic Year</th>
                  {approvalOrder.map((item) => (
                    <th key={item.key} className="pb-3 font-medium">
                      {item.label}
                    </th>
                  ))}
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-b border-white/5">
                    <td className="py-4 text-zinc-300">{record.studentId}</td>
                    <td className="py-4 text-zinc-300">{record.academicYear}</td>
                    {approvalOrder.map((item) => {
                      const approval = record[`${item.key}Approval` as keyof ClearanceRecord] as Approval;
                      return (
                        <td key={item.key} className="py-4">
                          {approval.status ? (
                            <StatusBadge tone="success">{formatDate(approval.date)}</StatusBadge>
                          ) : (
                            <ActionButton type="button" onClick={() => void approve(record._id, item.key)} disabled={busyKey === `${record._id}-${item.key}`}>
                              Approve
                            </ActionButton>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-4">
                      <StatusBadge>{titleCase(record.status)}</StatusBadge>
                    </td>
                    <td className="py-4 text-zinc-400">{formatDate(record.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No clearance requests found" description="Submitted clearance requests will appear here." />
        )}
      </Panel>
    </div>
  );
}
