import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
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

interface DepartmentAnalytics {
  totalStudents: number;
  byYear: Bucket[];
  activeIssuesOrComplaintsStudents: number;
  clearanceCompletionRate: number;
  completedClearances: number;
  totalClearances: number;
}

interface IssueAnalytics {
  byType: Bucket[];
  byStatus: Bucket[];
  byBlock: Bucket[]
}

interface ComplaintAnalytics {
  byCategory: Bucket[];
  byStatus: Bucket[];
  byPriority: Bucket[]
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
  const user = useMemo(() => getStoredUser(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issueAnalytics, setIssueAnalytics] = useState<IssueAnalytics | null>(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalytics | null>(null);
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
        if (user.role === "department") {
          const departmentRes = await apiRequest<ApiResponse<DepartmentAnalytics>>("/analytics/department");
          setDepartmentAnalytics(departmentRes.data);
          return;
        }

        const requests: Promise<unknown>[] = [apiRequest<ApiResponse<DashboardStats>>("/analytics/dashboard")];

        if (user.role === "proctor") {
          requests.push(apiRequest<ApiResponse<IssueAnalytics>>("/analytics/issues"));
        }

        if (user.role === "student_union") {
          requests.push(apiRequest<ApiResponse<ComplaintAnalytics>>("/analytics/complaints"));
        }

        const results = await Promise.all(requests);
        const [statsRes, secondaryRes] = results as [
          ApiResponse<DashboardStats>,
          ApiResponse<IssueAnalytics> | ApiResponse<ComplaintAnalytics> | undefined,
        ];

        setStats(statsRes.data);

        if (user.role === "proctor" && secondaryRes) {
          setIssueAnalytics((secondaryRes as ApiResponse<IssueAnalytics>).data);
        }

        if (user.role === "student_union" && secondaryRes) {
          setComplaintAnalytics((secondaryRes as ApiResponse<ComplaintAnalytics>).data);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user?.role, user?._id]);

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
        {(user.role === "proctor" || user.role === "student_union") && (
          <>
            <StatCard title="Complaints" value={stats?.complaints ?? (loading ? "..." : "—")} subtitle="Total records" />
            <StatCard title="Issues" value={stats?.issues ?? (loading ? "..." : "—")} subtitle="Maintenance backlog" />
            <StatCard title="Dorm Inspections" value={stats?.inspections ?? (loading ? "..." : "—")} subtitle="Inspection history" />
            <StatCard title="Clearances" value={stats?.clearances ?? (loading ? "..." : "—")} subtitle="Submitted requests" />
          </>
        )}

        {user.role === "department" && (
          <>
            <StatCard title="Enrollment" value={departmentAnalytics?.totalStudents ?? (loading ? "..." : "—")} subtitle="Total students" />
            <StatCard title="Active Reports" value={departmentAnalytics?.activeIssuesOrComplaintsStudents ?? (loading ? "..." : "—")} subtitle="Issues/Complaints" />
            <StatCard title="Clearance Rate" value={departmentAnalytics?.clearanceCompletionRate ? `${departmentAnalytics.clearanceCompletionRate}%` : (loading ? "..." : "—")} subtitle="Completion stage" />
            <StatCard title="Requests" value={departmentAnalytics?.totalClearances ?? (loading ? "..." : "—")} subtitle="Total clearances" />
          </>
        )}
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

      {user.role === "department" && (
        <Panel title="Enrollment Analytics" description="Student distribution across academic years.">
          {departmentAnalytics ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#141415] p-5 shadow-lg overflow-hidden relative">
                <p className="text-sm font-medium text-white mb-6">Students per Academic Year</p>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentAnalytics.byYear}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="_id" 
                        stroke="#71717a" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'white', opacity: 0.03 }}
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#a855f7' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {departmentAnalytics.byYear.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index % 2 === 0 ? "#9333ea" : "#7c3aed"} 
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <AnalyticsList title="Enrollment Counts" items={departmentAnalytics.byYear} />
                
                <div className="rounded-2xl border border-white/5 bg-[#141415] p-5 shadow-lg group hover:border-purple-500/20 transition-colors">
                   <p className="text-sm font-medium text-white mb-2">Clearance Summary</p>
                   <div className="flex items-end gap-3 mt-1">
                      <span className="text-3xl font-bold text-white leading-none">{departmentAnalytics.completedClearances}</span>
                      <span className="text-zinc-500 mb-0.5 text-sm">/ {departmentAnalytics.totalClearances} Approved</span>
                   </div>
                   <div className="mt-5 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                        style={{ width: `${departmentAnalytics.clearanceCompletionRate}%` }}
                      ></div>
                   </div>
                   <p className="mt-3 text-xs text-zinc-500">{departmentAnalytics.clearanceCompletionRate}% Progress overall </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Loading Enrollment Analytics" description={loading ? "Loading metrics..." : "Metrics are not available."} />
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
