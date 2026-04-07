import { useEffect, useState } from "react";
import { departmentApi } from "../services/departmentApi";
import { ActionButton, EmptyState, PageHeader, Panel, StatusBadge, getErrorMessage } from "../../../components/admin/adminShared";

export function DepartmentClearance() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await departmentApi.getClearances();
      setRecords(data.records || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const handleApproval = async (id: string, status: boolean) => {
    try {
      await departmentApi.updateClearance(id, status);
      await loadRecords(); // Refresh to catch updated state
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Clearance"
        description="Verify and approve the pre-clearance logic for your department's students."
        actions={
          <ActionButton onClick={loadRecords} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh list"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Unable to load clearances" description={error} /> : null}

      <Panel title="Pending Validations">
        {loading ? (
           <div className="text-center text-zinc-500 py-10">Fetching department queues...</div>
        ) : records.length === 0 ? (
          <EmptyState title="No clearances" description="There are no students requiring department clearance right now." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#141415] text-xs uppercase text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Clearance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => {
                  const hasApproved = r.departmentApproval?.status === true;
                  return (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{r.student?.name}</p>
                        <p className="text-xs text-zinc-500">{r.studentId}</p>
                      </td>
                      <td className="px-4 py-3">{r.academicYear}</td>
                      <td className="px-4 py-3">
                        {hasApproved ? <StatusBadge tone="success">Approved</StatusBadge> : <StatusBadge tone="warning">Pending Auth</StatusBadge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasApproved ? (
                          <span className="text-zinc-500 italic text-xs">Signed Off</span>
                        ) : (
                          <div className="flex justify-end gap-2">
                             <button
                                onClick={() => handleApproval(r._id, true)}
                                className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                             >
                               Approve
                             </button>
                             {/* Rejection implies the clearance shouldn't happen, adding basic flow structure here */}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
