import { NavLink } from "react-router-dom";
import {
  Building2,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  ShieldUser,
  Smartphone,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";
import { classNames } from "./adminShared";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/complaints", label: "Complaints", icon: TriangleAlert },
  { to: "/admin/issues", label: "Issues", icon: Wrench },
  { to: "/admin/clearances", label: "Clearances", icon: ClipboardCheck },
  { to: "/admin/lost-id", label: "Lost IDs", icon: CreditCard },
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/dorms", label: "Dorms", icon: Building2 },
  { to: "/admin/devices", label: "Devices", icon: Smartphone },
  { to: "/admin/locations", label: "Locations", icon: MapPinned },
  { to: "/admin/users", label: "Users", icon: ShieldUser },
];

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/8 bg-[#0a0a0a] px-5 py-6 transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[100px] h-[50px] bg-purple-900/40 rounded-full blur-[40px] pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Campus System</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Admin Console</h2>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-zinc-400 lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                classNames(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
                  isActive
                    ? "bg-purple-500/10 text-purple-400 shadow-[inset_0_0_0_1px_rgba(168,85,247,0.2)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
