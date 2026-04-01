import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Activity, 
  MessageSquare, 
  FileText, 
  Wallet, 
  Receipt, 
  PhoneCall, 
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
  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Calendar", path: "/admin/calendar", icon: Calendar },
    { name: "Teams", path: "/admin/teams", icon: Users },
    { name: "Activity", path: "/admin/activity", icon: Activity },
    { name: "Message", path: "/admin/message", icon: MessageSquare },
    { name: "Report", path: "/admin/report", icon: FileText },
  ];

  const paymentItems = [
    { name: "Payroll", path: "/admin/payroll", icon: Wallet },
    { name: "Billing", path: "/admin/billing", icon: Receipt },
    { name: "Contact", path: "/admin/contact", icon: PhoneCall },
  ];

  const bottomItems = [
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "User Management", path: "/admin/users", icon: UserCog },
    { name: "Help & Support", path: "/admin/help", icon: HelpCircle },
  ];

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
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Main Menu</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
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
              ))}
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Payments</p>
            <nav className="space-y-1">
              {paymentItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
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
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-[#1e1e24]">
          <nav className="space-y-1 mb-6">
            {bottomItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
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
            ))}
          </nav>
          
          {/* User profile snippet */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=a" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Austin Martin</p>
              <p className="text-[11px] text-zinc-500 truncate">austinm@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
