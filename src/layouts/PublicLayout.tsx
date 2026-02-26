import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { LogIn, Menu, X } from "lucide-react";

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center gap-2 min-w-0">
                <img
                  src="/logo-gmi.png"
                  alt="Logo GMI Wesley"
                  className="h-8 w-auto object-contain shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="font-bold text-slate-800 truncate">
                  <span className="hidden sm:inline text-xl">
                    Gathering GMI Wesley
                  </span>
                  <span className="sm:hidden text-base">GMI Wesley</span>
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/status"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                Cek Status
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 border border-slate-200 bg-white hover:bg-slate-100 h-9 px-4 py-2"
              >
                <LogIn className="h-4 w-4" />
                Admin Login
              </Link>
            </div>

            {/* Mobile: Hamburger */}
            <div className="flex sm:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2 shadow-md">
            <Link
              to="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Cek Status Pendaftaran
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              Admin Login
            </Link>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          &copy; 2026 Panitia Gathering GMI Wesley. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
