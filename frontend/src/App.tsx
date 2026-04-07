import type { ReactElement } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { Login } from "./components/Login";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { Complaints } from "./pages/admin/Complaints";
import { Issues } from "./pages/admin/Issues";
import { Clearances } from "./pages/admin/Clearances";
import { Notices } from "./pages/admin/Notices";
import { DormManagement } from "./pages/admin/DormManagement";
import { Devices } from "./pages/admin/Devices";
import { Locations } from "./pages/admin/Locations";
import { Users } from "./pages/admin/Users";
import { RoleDashboard } from "./pages/portal/RoleDashboard";
import { StudentClearance } from "./pages/portal/StudentClearance";
import { StudentIssues } from "./pages/portal/StudentIssues";
import { StudentComplaints } from "./pages/portal/StudentComplaints";
import { StudentNotices } from "./pages/portal/StudentNotices";
import { StudentNavigation } from "./pages/portal/StudentNavigation";
import { StudentAssistant } from "./pages/portal/StudentAssistant";

import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { Stats } from "./components/landing/Stats";
import { Team } from "./components/landing/Team";
import { Testimonials } from "./components/landing/Testimonials";
import { CTA } from "./components/landing/CTA";
import { GraduationCap } from "lucide-react";
import { EmptyState, getStoredUser } from "./components/admin/adminShared";
import type { UserRole } from "./lib/roles";
import { getDefaultRouteForRole } from "./lib/portal";

function Landing() {
  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-500" />
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Campus
            </div>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
            <a href="#team" className="hover:text-white transition-colors">Team</a>
          </div>
          <div className="flex items-center">
            <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/10 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section id="hero"><Hero /></section>
        <section id="features" className="scroll-mt-20"><Features /></section>
        <section id="stats" className="scroll-mt-20"><Stats /></section>
        <section id="team" className="scroll-mt-20"><Team /></section>
        <section id="testimonials" className="scroll-mt-20"><Testimonials /></section>
        <CTA />
      </main>

      <footer className="bg-black py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Campus System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function RoleRoute({ allowedRoles, element }: { allowedRoles: UserRole[]; element: ReactElement }) {
  const user = getStoredUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return element;
}

function PortalNotFound() {
  return <EmptyState title="Page not available" description="This workspace does not exist for your current role." />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<Navigate to="/portal" replace />} />
      <Route path="/portal" element={<AdminLayout />}>
        <Route index element={<RoleDashboard />} />
        <Route path="complaints" element={<RoleRoute allowedRoles={["student_union"]} element={<Complaints />} />} />
        <Route path="issues" element={<RoleRoute allowedRoles={["proctor"]} element={<Issues />} />} />
        <Route path="clearances" element={<RoleRoute allowedRoles={["proctor"]} element={<Clearances />} />} />
        <Route path="notices" element={<RoleRoute allowedRoles={["admin"]} element={<Notices />} />} />
        <Route path="dorms" element={<RoleRoute allowedRoles={["proctor"]} element={<DormManagement />} />} />
        <Route path="devices" element={<RoleRoute allowedRoles={["security"]} element={<Devices />} />} />
        <Route path="locations" element={<RoleRoute allowedRoles={["admin"]} element={<Locations />} />} />
        <Route path="users" element={<RoleRoute allowedRoles={["admin", "department"]} element={<Users />} />} />
        <Route path="my-clearance" element={<RoleRoute allowedRoles={["student"]} element={<StudentClearance />} />} />
        <Route path="my-issues" element={<RoleRoute allowedRoles={["student"]} element={<StudentIssues />} />} />
        <Route path="my-complaints" element={<RoleRoute allowedRoles={["student"]} element={<StudentComplaints />} />} />
        <Route path="notices-feed" element={<RoleRoute allowedRoles={["student"]} element={<StudentNotices />} />} />
        <Route path="navigation" element={<RoleRoute allowedRoles={["student"]} element={<StudentNavigation />} />} />
        <Route path="assistant" element={<RoleRoute allowedRoles={["student"]} element={<StudentAssistant />} />} />
        <Route path="*" element={<PortalNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
