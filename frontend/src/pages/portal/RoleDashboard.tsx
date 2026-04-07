import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dashboard } from "../admin/Dashboard";
import { apiRequest } from "../../api/client";
import { StatCard } from "../../components/admin/StatCard";
import {
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  titleCase,
  getErrorMessage,
  getStoredUser,
} from "../../components/admin/adminShared";
import { getNavItemsForRole } from "../../lib/portal";
import { titleCaseRole } from "../../lib/roles";

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

const roleDescriptions = {
  security: "Register, verify, block, and manage student devices.",
  proctor: "Own dorm allocation, inspections, clearance approvals, and maintenance follow-up.",
  department: "Register students, manage student records, and keep department assignments current.",
  student_union: "Receive complaints, manage responses, and escalate unresolved student concerns.",
  student: "Access your personal campus services, notices, navigation, and AI assistant.",
} as const;

export function RoleDashboard() {
  const user = getStoredUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issueAnalytics, setIssueAnalytics] = useState<{ byType: Bucket[]; byStatus: Bucket[]; byBlock: Bucket[] } | null>(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState<{ byCategory: Bucket[]; byStatus: Bucket[]; byPriority: Bucket[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role === "admin" || user.role === "student") {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const statsP = apiRequest<ApiResponse<DashboardStats>>("/analytics/dashboard").catch(() => null);
        let issuesP = Promise.resolve(null as any);
        let complaintsP = Promise.resolve(null as any);

        if (user.role === "proctor") {
          issuesP = apiRequest<ApiResponse<{ byType: Bucket[]; byStatus: Bucket[]; byBlock: Bucket[] }>>("/analytics/issues").catch(() => null);
        }
        if (user.role === "student_union") {
          complaintsP = apiRequest<ApiResponse<{ byCategory: Bucket[]; byStatus: Bucket[]; byPriority: Bucket[] }>>("/analytics/complaints").catch(() => null);
        }

        const [statsRes, issueRes, complaintRes] = await Promise.all([statsP, issuesP, complaintsP]);

        if (statsRes) setStats(statsRes.data);
        if (issueRes) setIssueAnalytics(issueRes.data);
        if (complaintRes) setComplaintAnalytics(complaintRes.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user?.role]);

  if (!user) {
    return <EmptyState title="No active session" description="Sign in to load your role dashboard." />;
  }

  // Admin and student dashboards are already customized standalone views
  if (user.role === "admin") {
    return <Dashboard />;
  }

  const navItems = getNavItemsForRole(user.role).filter((item) => !item.end);

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <PageHeader
          title={`${titleCaseRole(user.role)} Dashboard`}
          description={user.role in roleDescriptions ? roleDescriptions[user.role as keyof typeof roleDescriptions] : "Portal Overview"}
        />
        <div className="flex flex-wrap gap-2 md:mb-2">
          <StatusBadge>{titleCaseRole(user.role)}</StatusBadge>
          <StatusBadge tone="info">{user.studentId}</StatusBadge>
          {user.department ? <StatusBadge tone="success">{user.department}</StatusBadge> : null}
        </div>
      </div>

      {error ? <EmptyState title="Dashboard partially unavailable" description={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {user.role === "proctor" || user.role === "student_union" ? (
          <>
            <StatCard title="Complaints" value={stats?.complaints ?? (loading ? "..." : "—")} subtitle="Total records" />
            <StatCard title="Issues" value={stats?.issues ?? (loading ? "..." : "—")} subtitle="Maintenance backlog" />
            <StatCard title="Dorm Inspections" value={stats?.inspections ?? (loading ? "..." : "—")} subtitle="Inspection history" />
            <StatCard title="Clearances" value={stats?.clearances ?? (loading ? "..." : "—")} subtitle="Submitted requests" />
          </>
        ) : null}
      </div>

      {user.role === "proctor" && (
        <Panel title="Issue Analytics" description="Breakdown by issue type, status, and dorm block.">
          {issueAnalytics ? (
            <div className="grid gap-5 md:grid-cols-3">
              <AnalyticsList title="By Type" items={issueAnalytics.byType} />
              <AnalyticsList title="By Status" items={issueAnalytics.byStatus} />
              <AnalyticsList title="By Block" items={issueAnalytics.byBlock} />
            </div>
          ) : (
            <EmptyState title="Loading Issue Analytics" description={loading ? "Loading metrics..." : "Metrics are not available."} />
          )}
        </Panel>
      )}

      {user.role === "student_union" && (
        <Panel title="Complaint Analytics" description="Category, status, and priority distribution.">
          {complaintAnalytics ? (
            <div className="grid gap-5 md:grid-cols-3">
              <AnalyticsList title="By Category" items={complaintAnalytics.byCategory} />
              <AnalyticsList title="By Status" items={complaintAnalytics.byStatus} />
              <AnalyticsList title="By Priority" items={complaintAnalytics.byPriority} />
            </div>
          ) : (
            <EmptyState title="Loading Complaint Analytics" description={loading ? "Loading metrics..." : "Metrics are not available."} />
          )}
        </Panel>
      )}

      <Panel title="Role Workflows" description="This workspace only exposes the modules assigned to your role.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-3xl border border-white/5 bg-[#141415] p-5 shadow-lg overflow-hidden relative group transition-all hover:border-purple-500/30 hover:-translate-y-1 block"
            >
               <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-purple-900/10 rounded-full blur-[40px] pointer-events-none translate-x-1/2 -translate-y-1/2 group-hover:bg-purple-900/20 transition-all duration-500"></div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                <item.icon size={18} />
              </div>
              <h3 className="text-base font-semibold text-white relative z-10 group-hover:text-purple-300 transition-colors">{item.label}</h3>
              <p className="mt-2 text-sm text-zinc-400 relative z-10 group-hover:text-zinc-300 transition-colors">
                Open the {item.label.toLowerCase()} workspace for your current role.
              </p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsList({ title, items }: { title: string; items: Bucket[] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#141415] p-4 shadow-lg group hover:border-purple-500/20 transition-colors">
      <p className="mb-3 text-sm font-medium text-white">{title}</p>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${title}-${item._id ?? "unknown"}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-300 group-hover:text-white transition-colors">{titleCase(item._id ?? "unknown")}</span>
              <StatusBadge tone="neutral">{item.count}</StatusBadge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No data</p>
      )}
    </div>
  );
}
