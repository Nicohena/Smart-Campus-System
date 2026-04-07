import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import { ActionButton, clearSession, getStoredUser } from "./adminShared";
import { titleCaseRole } from "../../lib/roles";

interface TopbarProps {
  setSidebarOpen: (value: boolean) => void;
}

export function Topbar({ setSidebarOpen }: TopbarProps) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear stale local state even if the server session is already gone.
    } finally {
      clearSession();
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/70 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-white/10 p-2 text-zinc-300 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="text-sm font-medium text-white">{user?.name ?? "Signed in"}</p>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
            {user ? titleCaseRole(user.role) : "Session"} {user?.studentId ? `• ${user.studentId}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-zinc-500 md:block">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <ActionButton type="button" onClick={handleLogout}>
          <span className="inline-flex items-center gap-2">
            <LogOut size={14} />
            Logout
          </span>
        </ActionButton>
      </div>
    </header>
  );
}
