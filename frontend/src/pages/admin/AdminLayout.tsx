import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { getStoredUser } from "../../components/admin/adminShared";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="min-h-screen lg:ml-72">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
