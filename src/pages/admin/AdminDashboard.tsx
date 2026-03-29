import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, User, CreditCard, Wallet, TrendingUp, Loader2, Shirt, UserCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const SHIRT_LABEL: Record<string, string> = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
  ANAK_2: "Anak 2",
  ANAK_4: "Anak 4",
  ANAK_6: "Anak 6",
  ANAK_8: "Anak 8",
  ANAK_10: "Anak 10",
  ANAK_13: "Anak 13",
};

const ADULT_SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "XXXL"];
const CHILD_SIZE_ORDER = [
  "ANAK_2", "ANAK_4", "ANAK_6", "ANAK_8", "ANAK_10", "ANAK_13",
];

// Harga per ukuran baju (Rp)
const SHIRT_PRICE: Record<string, number> = {
  S: 40000, M: 40000, L: 40000, XL: 40000,
  XXL: 45000, XXXL: 50000,
  ANAK_2: 40000, ANAK_4: 40000, ANAK_6: 40000,
  ANAK_8: 40000, ANAK_10: 40000, ANAK_13: 40000,
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegistrants: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalUnpaid: 0,
    recentRegistrations: [] as any[],
    shirtSizes: {} as Record<string, number>,
    ageCategories: { ADULT: 0, YOUTH: 0, CHILD: 0 },
    regTypes: { FAMILY: 0, INDIVIDUAL: 0 },
    totalDonations: 0,
    donorCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get all registrations
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .select(
          "id, type, total_fee, total_paid, status, representative_name, created_at, shirt_size, age_category",
        )
        .order("created_at", { ascending: false });

      if (regError) throw regError;

      // Donors
      const { data: donorData } = await supabase.from("donors").select("amount");
      const totalDonations = (donorData ?? []).reduce((s: number, d: any) => s + Number(d.amount), 0);
      const donorCount = donorData?.length ?? 0;

      // Get all family members shirt sizes + age category
      const { data: famData } = await supabase
        .from("family_members")
        .select("shirt_size, age_category");

      let totalExpected = 0;
      let totalCollected = 0;
      const shirtSizes: Record<string, number> = {};
      const ageCategories = { ADULT: 0, YOUTH: 0, CHILD: 0 };
      const regTypes = { FAMILY: 0, INDIVIDUAL: 0 };

      regData.forEach((reg) => {
        if (reg.status !== "CANCELLED") {
          totalExpected += Number(reg.total_fee);
          totalCollected += Number(reg.total_paid);
          if (reg.shirt_size) {
            shirtSizes[reg.shirt_size] = (shirtSizes[reg.shirt_size] || 0) + 1;
          }
          const cat = reg.age_category as keyof typeof ageCategories;
          if (cat in ageCategories) ageCategories[cat] = ageCategories[cat] + 1;
          if (reg.type === "FAMILY") regTypes.FAMILY += 1;
          else regTypes.INDIVIDUAL += 1;
        }
      });

      // Count family members ages + shirts
      (famData ?? []).forEach((fm: any) => {
        if (fm.shirt_size) {
          shirtSizes[fm.shirt_size] = (shirtSizes[fm.shirt_size] || 0) + 1;
        }
        const cat = fm.age_category as keyof typeof ageCategories;
        if (cat && cat in ageCategories)
          ageCategories[cat] = ageCategories[cat] + 1;
      });

      setStats({
        totalRegistrants: regData.filter((r) => r.status !== "CANCELLED")
          .length,
        totalExpected,
        totalCollected,
        totalUnpaid: totalExpected - totalCollected,
        recentRegistrations: regData.slice(0, 5),
        shirtSizes,
        ageCategories,
        regTypes,
        totalDonations,
        donorCount,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
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

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
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

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
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

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
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

      {/* Reg Type Recap */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">Pendaftar Keluarga</p>
            <p className="text-3xl font-bold text-indigo-900">{stats.regTypes.FAMILY}</p>
            <p className="text-xs text-indigo-400 mt-0.5">KK × Rp 450.000</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Pendaftar Individu</p>
            <p className="text-3xl font-bold text-slate-800">{stats.regTypes.INDIVIDUAL}</p>
            <p className="text-xs text-slate-400 mt-0.5">Org × Rp 200.000</p>
          </div>
        </div>
      </div>

      {/* Donation card */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
          <Heart className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-rose-600">Total Donasi</p>
          <p className="text-2xl font-bold text-rose-700">{formatCurrency(stats.totalDonations)}</p>
          <p className="text-xs text-rose-400 mt-0.5">{stats.donorCount} donatur</p>
        </div>
        <Link to="/admin/donors" className="text-xs font-semibold text-rose-500 hover:text-rose-700 whitespace-nowrap transition-colors">
          Kelola →
        </Link>
      </div>

      {/* Age Category Recap */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">
            Rekap Kategori Peserta
          </h2>
          <span className="ml-auto text-xs text-slate-400">
            Termasuk anggota keluarga
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center bg-indigo-50 border border-indigo-100 rounded-2xl p-4 gap-1">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Dewasa
              </span>
              <span className="text-4xl font-bold text-indigo-900 mt-1">
                {stats.ageCategories.ADULT}
              </span>
              <span className="text-xs text-indigo-400">orang</span>
            </div>
            <div className="flex flex-col items-center bg-sky-50 border border-sky-100 rounded-2xl p-4 gap-1">
              <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
                Pemuda (P3MI)
              </span>
              <span className="text-4xl font-bold text-sky-900 mt-1">
                {stats.ageCategories.YOUTH}
              </span>
              <span className="text-xs text-sky-400">orang</span>
            </div>
            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-2xl p-4 gap-1">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                Anak (SM)
              </span>
              <span className="text-4xl font-bold text-emerald-900 mt-1">
                {stats.ageCategories.CHILD}
              </span>
              <span className="text-xs text-emerald-400">orang</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total Peserta</span>
            <span className="font-bold text-slate-800 text-lg">
              {stats.ageCategories.ADULT +
                stats.ageCategories.YOUTH +
                stats.ageCategories.CHILD}{" "}
              orang
            </span>
          </div>
        </div>
      </div>

      {/* Shirt Size Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center gap-2">
          <Shirt className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Rekap Ukuran Baju</h2>
          <span className="ml-auto text-xs text-slate-400">
            Termasuk seluruh anggota keluarga
          </span>
        </div>
        <div className="p-4 sm:p-6 space-y-5">
          {/* Adult sizes */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Kaos 30 — Dewasa
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ADULT_SIZE_ORDER.map((size) => (
                <div
                  key={size}
                  className="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-xl p-3 gap-1"
                >
                  <span className="text-xs font-semibold text-blue-700">
                    {size}
                  </span>
                  <span className="text-2xl font-bold text-blue-900">
                    {stats.shirtSizes[size] ?? 0}
                  </span>
                  <span className="text-[10px] text-blue-400">pcs</span>
                </div>
              ))}
            </div>
          </div>
          {/* Child sizes */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Anak
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CHILD_SIZE_ORDER.map((size) => (
                <div
                  key={size}
                  className="flex flex-col items-center bg-purple-50 border border-purple-100 rounded-xl p-3 gap-1"
                >
                  <span className="text-xs font-semibold text-purple-700">
                    {SHIRT_LABEL[size]}
                  </span>
                  <span className="text-2xl font-bold text-purple-900">
                    {stats.shirtSizes[size] ?? 0}
                  </span>
                  <span className="text-[10px] text-purple-400">pcs</span>
                </div>
              ))}
            </div>
          </div>
          {/* Total */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Total Baju</span>
            <span className="font-bold text-slate-800 text-lg">
              {Object.values(stats.shirtSizes).reduce((a, b) => a + b, 0)} pcs
            </span>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Pendaftar Terbaru</h2>
            <Link
              to="/admin/registrations"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {stats.recentRegistrations.length === 0 ? (
              <p className="px-4 py-8 text-center text-slate-500 text-sm">
                Belum ada data pendaftar terbaru.
              </p>
            ) : (
              stats.recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {reg.representative_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reg.type === "FAMILY" ? "Keluarga" : "Individu"} &bull;{" "}
                      {new Date(reg.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2 py-1 rounded-full text-xs font-semibold
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
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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

      {/* Estimasi Biaya Baju */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center gap-2">
          <Shirt className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Estimasi Biaya Baju</h2>
          <span className="ml-auto text-xs text-slate-400">Berdasarkan data ukuran peserta</span>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {/* Tabel rincian */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-2 text-left">Ukuran</th>
                  <th className="pb-2 text-center">Jumlah</th>
                  <th className="pb-2 text-right">Harga Satuan</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...ADULT_SIZE_ORDER, ...CHILD_SIZE_ORDER]
                  .filter(size => (stats.shirtSizes[size] ?? 0) > 0)
                  .map(size => {
                    const qty = stats.shirtSizes[size] ?? 0;
                    const price = SHIRT_PRICE[size] ?? 0;
                    const subtotal = qty * price;
                    return (
                      <tr key={size}>
                        <td className="py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            size.startsWith("ANAK_")
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {SHIRT_LABEL[size]}
                          </span>
                        </td>
                        <td className="py-2 text-center text-slate-700 font-medium">{qty} pcs</td>
                        <td className="py-2 text-right text-slate-500 text-xs">{formatCurrency(price)}</td>
                        <td className="py-2 text-right font-semibold text-slate-800">{formatCurrency(subtotal)}</td>
                      </tr>
                    );
                  })
                }
                {Object.values(stats.shirtSizes).every(v => v === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">Belum ada data ukuran baju.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Total */}
          <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-sm font-semibold text-slate-600">Total Estimasi</span>
              <p className="text-xs text-slate-400 mt-0.5">
                {Object.values(stats.shirtSizes).reduce((a, b) => a + b, 0)} baju
              </p>
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(
                [...ADULT_SIZE_ORDER, ...CHILD_SIZE_ORDER].reduce(
                  (total, size) => total + (stats.shirtSizes[size] ?? 0) * (SHIRT_PRICE[size] ?? 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
