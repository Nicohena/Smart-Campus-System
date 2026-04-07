import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { StatCard } from "../../components/admin/StatCard";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface DashboardStats {
  complaints: number;
  issues: number;
  inspections: number;
  clearances: number;
}

interface Bucket {
  _id: string | null;
  count: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issueAnalytics, setIssueAnalytics] = useState<{ byType: Bucket[]; byStatus: Bucket[]; byBlock: Bucket[] } | null>(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState<{ byCategory: Bucket[]; byStatus: Bucket[]; byPriority: Bucket[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsRes, issueRes, complaintRes] = await Promise.all([
        apiRequest<ApiResponse<DashboardStats>>("/analytics/dashboard"),
        apiRequest<ApiResponse<{ byType: Bucket[]; byStatus: Bucket[]; byBlock: Bucket[] }>>("/analytics/issues"),
        apiRequest<ApiResponse<{ byCategory: Bucket[]; byStatus: Bucket[]; byPriority: Bucket[] }>>("/analytics/complaints"),
      ]);

      setStats(statsRes.data);
      setIssueAnalytics(issueRes.data);
      setComplaintAnalytics(complaintRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live operational analytics and overview."
        actions={
          <ActionButton type="button" onClick={loadDashboard} disabled={loading} variant="primary">
            {loading ? "Refreshing..." : "Refresh dashboard"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Dashboard unavailable" description={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Complaints" value={stats?.complaints ?? "—"} subtitle="Total records" />
        <StatCard title="Issues" value={stats?.issues ?? "—"} subtitle="Maintenance backlog" />
        <StatCard title="Dorm Inspections" value={stats?.inspections ?? "—"} subtitle="Inspection history" />
        <StatCard title="Clearances" value={stats?.clearances ?? "—"} subtitle="Submitted requests" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Issue Analytics" description="Breakdown by issue type, status, and dorm block.">
          {issueAnalytics ? (
            <div className="grid gap-5 md:grid-cols-3">
              <AnalyticsList title="By Type" items={issueAnalytics.byType} />
              <AnalyticsList title="By Status" items={issueAnalytics.byStatus} />
              <AnalyticsList title="By Block" items={issueAnalytics.byBlock} />
            </div>
          ) : (
            <EmptyState title="No issue analytics yet" description="Issue metrics will appear here once the request completes." />
          )}
        </Panel>

        <Panel title="Complaint Analytics" description="Category, status, and priority distribution.">
          {complaintAnalytics ? (
            <div className="grid gap-5 md:grid-cols-3">
              <AnalyticsList title="By Category" items={complaintAnalytics.byCategory} />
              <AnalyticsList title="By Status" items={complaintAnalytics.byStatus} />
              <AnalyticsList title="By Priority" items={complaintAnalytics.byPriority} />
            </div>
          ) : (
            <EmptyState title="No complaint analytics yet" description="Complaint metrics will appear here once the request completes." />
          )}
        </Panel>
      </div>

    </div>
  );
}

function AnalyticsList({ title, items }: { title: string; items: Bucket[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#09090b] p-4 shadow-lg">
      <p className="mb-3 text-sm font-medium text-white">{title}</p>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${title}-${item._id ?? "unknown"}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-300">{titleCase(item._id ?? "unknown")}</span>
              <StatusBadge>{item.count}</StatusBadge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No data</p>
      )}
    </div>
  );
}
