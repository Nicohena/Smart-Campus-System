import { Routes, Route, Link } from "react-router-dom";
import { Login } from "./components/Login";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";

import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import { Stats } from "./components/landing/Stats";
import { Team } from "./components/landing/Team";
import { Testimonials } from "./components/landing/Testimonials";
import { CTA } from "./components/landing/CTA";
import { GraduationCap } from "lucide-react";

function Landing() {
  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
      {/* Navigation - simple version for landing */}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        {/* We can add other admin pages here like Teams, Activity, etc. */}
      </Route>
    </Routes>
  );
}

export default App;
