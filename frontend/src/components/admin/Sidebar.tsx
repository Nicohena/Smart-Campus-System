import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Wrench, 
  ClipboardCheck, 
  Megaphone, 
  CreditCard, 
  Building, 
  Settings, 
  UserCog, 
  HelpCircle,
  X 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const overviewItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  ];

  const managementItems = [
    { name: "Complaints", path: "/admin/complaints", icon: AlertTriangle },
    { name: "Issues", path: "/admin/issues", icon: Wrench },
    { name: "Clearances", path: "/admin/clearances", icon: ClipboardCheck },
    { name: "Notices", path: "/admin/notices", icon: Megaphone },
    { name: "Lost ID Requests", path: "/admin/lost-id", icon: CreditCard },
    { name: "Dorm Management", path: "/admin/dorms", icon: Building },
  ];

  const systemItems = [
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "User Management", path: "/admin/users", icon: UserCog },
    { name: "Help & Support", path: "/admin/help", icon: HelpCircle },
  ];

  const renderNavItems = (items: typeof overviewItems) =>
    items.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}
        end={item.path === "/admin"}
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
          ${isActive 
            ? "bg-zinc-800/50 text-white border border-white/5" 
            : "text-zinc-400 hover:text-white hover:bg-zinc-900"}
        `}
      >
        <item.icon size={18} />
        {item.name}
      </NavLink>
    ));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-[260px] bg-[#09090b] border-r border-[#1e1e24] z-50
        transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo area */}
        <div className="h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">Campus Manager</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <div className="mb-8">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Overview</p>
            <nav className="space-y-1">
              {renderNavItems(overviewItems)}
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Management</p>
            <nav className="space-y-1">
              {renderNavItems(managementItems)}
            </nav>
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-[#1e1e24]">
          <nav className="space-y-1 mb-6">
            {renderNavItems(systemItems)}
          </nav>
          
          {/* User profile snippet */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=a" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">System Admin</p>
              <p className="text-[11px] text-zinc-500 truncate">admin@campus.edu</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
