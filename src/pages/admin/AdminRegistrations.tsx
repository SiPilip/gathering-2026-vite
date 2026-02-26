import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminRegistrations() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select(
          `
          id, type, representative_name, phone_number,
          total_fee, total_paid, status, created_at,
          registration_source, age_category,
          family_members (member_name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = registrations.filter((reg) => {
    const q = search.toLowerCase().trim();
    if (!q) return statusFilter === "ALL" ? true : reg.status === statusFilter;

    const matchRep =
      reg.representative_name.toLowerCase().includes(q) ||
      reg.phone_number.includes(q) ||
      reg.id.includes(q);

    // Also search through family member names
    const matchMember =
      reg.type === "FAMILY" &&
      (reg.family_members as { member_name: string }[])?.some((m) =>
        m.member_name.toLowerCase().includes(q),
      );

    const matchSearch = matchRep || matchMember;
    const matchStatus =
      statusFilter === "ALL" ? true : reg.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (amount: number) =>
    "Rp " + Number(amount).toLocaleString("id-ID");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_PAID":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            Lunas
          </span>
        );
      case "PARTIAL_PAID":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            Angsuran
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            Batal
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            Belum Bayar
          </span>
        );
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Tipe",
      "Nama Pendaftar",
      "No HP",
      "Kategori Umur (Individu)",
      "Jml Anggota",
      "Tagihan",
      "Terbayar",
      "Status",
      "Tanggal Daftar",
      "Sumber Input",
    ];
    const rows = filteredData.map((r) => [
      r.id,
      r.type,
      r.representative_name,
      r.phone_number,
      r.type === "INDIVIDUAL"
        ? r.age_category === "ADULT"
          ? "Dewasa"
          : r.age_category === "YOUTH"
            ? "Pemuda"
            : "Anak"
        : "-",
      r.type === "FAMILY" ? r.family_members?.length || 0 : 1,
      r.total_fee,
      r.total_paid,
      r.status,
      new Date(r.created_at).toLocaleDateString("id-ID"),
      r.registration_source,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `data_pendaftaran_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Data Pendaftar
          </h1>
          <p className="text-sm text-slate-500">
            Kelola semua data jemaat yang mendaftar gathering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <Link
            to="/admin/registrations/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Pendaftaran Manual</span>
            <span className="sm:hidden">Manual</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, no. HP, atau anggota keluarga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="w-full sm:w-44 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Belum Bayar</option>
            <option value="PARTIAL_PAID">Angsuran</option>
            <option value="FULLY_PAID">Lunas</option>
            <option value="CANCELLED">Batal</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredData.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-14 text-center text-slate-500 text-sm">
          Tidak ada data ditemukan.
        </div>
      )}

      {/* ========================= */}
      {/* MOBILE: Card List View    */}
      {/* ========================= */}
      {!loading && filteredData.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredData.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              {/* Top row: name + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {reg.representative_name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {reg.id.split("-")[0]}...
                  </p>
                </div>
                {getStatusBadge(reg.status)}
              </div>

              {/* Info row */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Kontak</span>
                  <span className="font-medium text-slate-800">
                    {reg.phone_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Tipe</span>
                  <span className="font-medium text-slate-800">
                    {reg.type === "FAMILY"
                      ? `Keluarga (${reg.family_members?.length || 0} org +)`
                      : `Individu ${
                          reg.age_category === "ADULT"
                            ? "(Dewasa)"
                            : reg.age_category === "YOUTH"
                              ? "(P3MI)"
                              : "(Anak)"
                        }`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Tagihan</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(reg.total_fee)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Terbayar</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(reg.total_paid)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Link
                to={`/admin/payments/${reg.id}`}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors"
              >
                <Eye className="h-4 w-4" /> Detail &amp; Pembayaran
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ========================= */}
      {/* DESKTOP: Table View       */}
      {/* ========================= */}
      {!loading && filteredData.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 uppercase text-xs">
                <tr>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Kontak</th>
                  <th className="px-5 py-4">Tipe / Anggota</th>
                  <th className="px-5 py-4">Tagihan &amp; Saldo</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {reg.representative_name}
                      </div>
                      <div
                        className="text-xs text-slate-400 font-mono mt-0.5"
                        title={reg.id}
                      >
                        {reg.id.split("-")[0]}...
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {reg.phone_number}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="font-medium">
                        {reg.type === "FAMILY" ? "Keluarga" : "Individu"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {reg.type === "FAMILY"
                          ? `${reg.family_members?.length || 0} org tambahan`
                          : reg.age_category === "ADULT"
                            ? "(Dewasa)"
                            : reg.age_category === "YOUTH"
                              ? "(P3MI)"
                              : "(Anak)"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-900 font-medium">
                        {formatCurrency(reg.total_fee)}
                      </div>
                      <div className="text-xs text-blue-600 font-semibold mt-0.5">
                        Terbayar: {formatCurrency(reg.total_paid)}
                      </div>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(reg.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/admin/payments/${reg.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium text-xs transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail Pembayaran
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>
              Menampilkan {filteredData.length} dari {registrations.length}{" "}
              total data.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
