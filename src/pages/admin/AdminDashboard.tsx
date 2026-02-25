import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, CreditCard, Wallet, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegistrants: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalUnpaid: 0,
    recentRegistrations: [] as any[],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get all registrations to calculate totals
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .select(
          "id, type, total_fee, total_paid, status, representative_name, created_at",
        )
        .order("created_at", { ascending: false });

      if (regError) throw regError;

      let totalExpected = 0;
      let totalCollected = 0;

      regData.forEach((reg) => {
        if (reg.status !== "CANCELLED") {
          totalExpected += Number(reg.total_fee);
          totalCollected += Number(reg.total_paid);
        }
      });

      setStats({
        totalRegistrants: regData.filter((r) => r.status !== "CANCELLED")
          .length,
        totalExpected,
        totalCollected,
        totalUnpaid: totalExpected - totalCollected,
        recentRegistrations: regData.slice(0, 5), // take top 5 newest
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return "Rp " + amount.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Pendaftar
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {stats.totalRegistrants}{" "}
                <span className="text-sm font-normal text-slate-400">
                  orang/KK
                </span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Potensi Pendapatan
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalExpected)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Dana Terkumpul
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalCollected)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Sisa Piutang (Belum Lunas)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 text-red-600">
                {formatCurrency(stats.totalUnpaid)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Pendaftar Terbaru</h2>
          <Link
            to="/admin/registrations"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Lihat Semua &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Nama Pendaftar</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Tanggal Daftar</th>
                <th className="px-6 py-3">Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentRegistrations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada data pendaftar terbaru.
                  </td>
                </tr>
              ) : (
                stats.recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {reg.representative_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${reg.type === "FAMILY" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {reg.type === "FAMILY" ? "Keluarga" : "Individu"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(reg.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold
                         ${reg.status === "FULLY_PAID" ? "bg-green-100 text-green-700" : ""}
                         ${reg.status === "PARTIAL_PAID" ? "bg-yellow-100 text-yellow-700" : ""}
                         ${reg.status === "PENDING" ? "bg-slate-100 text-slate-700" : ""}
                         ${reg.status === "CANCELLED" ? "bg-red-100 text-red-700" : ""}
                       `}
                      >
                        {reg.status === "FULLY_PAID"
                          ? "Lunas"
                          : reg.status === "PARTIAL_PAID"
                            ? "Angsuran"
                            : reg.status === "PENDING"
                              ? "Belum Bayar"
                              : "Batal"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
