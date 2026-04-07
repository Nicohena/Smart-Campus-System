import {
  Bot,
  Building2,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  MapPinned,
  MessageSquareText,
  MonitorSmartphone,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "./roles";

export interface PortalNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const portalNavItems: Record<UserRole, PortalNavItem[]> = {
  admin: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Users", to: "/portal/users", icon: UserCog },
    { label: "Notices", to: "/portal/notices", icon: MessageSquareText },
    { label: "Locations", to: "/portal/locations", icon: MapPinned },
  ],
  security: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Devices", to: "/portal/devices", icon: MonitorSmartphone },
  ],
  proctor: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Dorms", to: "/portal/dorms", icon: Building2 },
    { label: "Clearances", to: "/portal/clearances", icon: ClipboardCheck },
    { label: "Issues", to: "/portal/issues", icon: TriangleAlert },
  ],
  department: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Students", to: "/portal/department/students", icon: Users },
    { label: "Add Student", to: "/portal/department/register", icon: UserPlus },
    { label: "Clearance", to: "/portal/department/clearances", icon: ClipboardCheck },
    { label: "Notices", to: "/portal/department/notices", icon: MessageSquareText },
  ],
  student_union: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Complaints", to: "/portal/complaints", icon: MessageSquareText },
  ],
  student: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard, end: true },
    { label: "Clearance", to: "/portal/my-clearance", icon: ClipboardCheck },
    { label: "Complaints", to: "/portal/my-complaints", icon: MessageSquareText },
    { label: "Maintenance", to: "/portal/my-issues", icon: TriangleAlert },
    { label: "Notices", to: "/portal/notices-feed", icon: ShieldCheck },
    { label: "Navigation", to: "/portal/navigation", icon: Compass },
    { label: "AI Assistant", to: "/portal/assistant", icon: Bot },
  ],
};

export function getDefaultRouteForRole(role: UserRole) {
  const defaultItem = portalNavItems[role][0];
  return defaultItem?.to ?? "/portal";
}

export function getNavItemsForRole(role: UserRole) {
  return portalNavItems[role] ?? [];
}
