import { Outlet, Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/logo-gmi.png"
                  alt="Logo GMI Wesley"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text if image not found
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="font-bold text-xl text-slate-800">
                  Gathering GMI Wesley
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
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
          </div>
        </div>
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
