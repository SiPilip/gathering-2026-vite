import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  UserPlus,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, [location.pathname]);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login", { replace: true });
    } else {
      setAuthenticated(true);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Users className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-lg">Admin GMI Wesley</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location.pathname === "/admin" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link
            to="/admin/registrations"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location.pathname.includes("/admin/registrations") ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <Users className="h-5 w-5" /> Registrations
          </Link>
          <Link
            to="/admin/registrations/new"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location.pathname === "/admin/registrations/new" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <UserPlus className="h-5 w-5" /> Manual Input
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <span className="font-bold text-slate-800">Admin GMI Wesley</span>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
