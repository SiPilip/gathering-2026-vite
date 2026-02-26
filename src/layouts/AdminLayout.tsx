import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  UserPlus,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/admin/registrations",
    label: "Data Pendaftar",
    icon: Users,
    exact: false,
    match: (p: string) =>
      p.startsWith("/admin/registrations") || p.startsWith("/admin/payments"),
  },
  {
    to: "/admin/registrations/new",
    label: "Entri Baru",
    icon: UserPlus,
    exact: true,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const isActive = (link: (typeof NAV_LINKS)[0]) => {
    if (link.match) return link.match(location.pathname);
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
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
      {/* ========================= */}
      {/* DESKTOP SIDEBAR           */}
      {/* ========================= */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Users className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-lg">Admin GMI Wesley</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive(link)
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          ))}
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

      {/* ========================= */}
      {/* MOBILE OVERLAY SIDEBAR    */}
      {/* ========================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 text-slate-300 flex flex-col z-50 transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-bold">Admin GMI Wesley</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-base ${
                isActive(link)
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md hover:bg-slate-800 hover:text-white transition-colors text-left text-base"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* ========================= */}
      {/* MAIN CONTENT              */}
      {/* ========================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-slate-800 text-sm">
            Admin GMI Wesley
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
