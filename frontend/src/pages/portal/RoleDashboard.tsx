import { Link } from "react-router-dom";
import { Dashboard } from "../admin/Dashboard";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  getStoredUser,
} from "../../components/admin/adminShared";
import { getNavItemsForRole } from "../../lib/portal";
import { titleCaseRole } from "../../lib/roles";

const roleDescriptions = {
  security: "Register, verify, block, and manage student devices.",
  proctor: "Own dorm allocation, inspections, clearance approvals, and maintenance follow-up.",
  department: "Register students, manage student records, and keep department assignments current.",
  student_union: "Receive complaints, manage responses, and escalate unresolved student concerns.",
  student: "Access your personal campus services, notices, navigation, and AI assistant.",
} as const;

export function RoleDashboard() {
  const user = getStoredUser();

  if (!user) {
    return <EmptyState title="No active session" description="Sign in to load your role dashboard." />;
  }

  if (user.role === "admin") {
    return <Dashboard />;
  }

  const navItems = getNavItemsForRole(user.role).filter((item) => !item.end);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${titleCaseRole(user.role)} Dashboard`}
        description={roleDescriptions[user.role]}
      />

      <Panel title="Role Responsibilities" description="This workspace only exposes the modules assigned to your role.">
        <div className="flex flex-wrap gap-3">
          <StatusBadge>{titleCaseRole(user.role)}</StatusBadge>
          <StatusBadge tone="info">{user.studentId}</StatusBadge>
          {user.department ? <StatusBadge tone="success">{user.department}</StatusBadge> : null}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-3xl border border-white/5 bg-[#09090b] p-5 transition-all hover:border-purple-500/30 hover:bg-[#101014]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
              <item.icon size={18} />
            </div>
            <h3 className="text-base font-semibold text-white">{item.label}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Open the {item.label.toLowerCase()} workspace for your current role.
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
