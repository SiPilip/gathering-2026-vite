import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Search, Filter, FileSpreadsheet, Eye } from "lucide-react";
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
          family_members (count)
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
    const matchSearch =
      reg.representative_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.phone_number.includes(search) ||
      reg.id.includes(search);
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
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
            Lunas
          </span>
        );
      case "PARTIAL_PAID":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
            Nyicil
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
            Batal
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-semibold">
            Belum Bayar
          </span>
        );
    }
  };

  const exportToCSV = () => {
    // Basic CSV Export
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
      r.type === "FAMILY" ? r.family_members[0]?.count || 0 : 1,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Pendaftar</h1>
          <p className="text-sm text-slate-500">
            Kelola semua data jemaat yang mendaftar gathering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </button>
          <Link
            to="/admin/registrations/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            + Pendaftaran Manual
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, no HP, atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="w-full sm:w-48 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Belum Bayar</option>
            <option value="PARTIAL_PAID">Nyicil</option>
            <option value="FULLY_PAID">Lunas</option>
            <option value="CANCELLED">Batal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-5 py-4">Nama Lengkap</th>
                <th className="px-5 py-4">Kontak</th>
                <th className="px-5 py-4">Tipe / Anggota</th>
                <th className="px-5 py-4">Tagihan & Saldo</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
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
                          ? `${reg.family_members[0]?.count || 0} org tambahan`
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>
            Menampilkan {filteredData.length} dari {registrations.length} total
            data.
          </span>
        </div>
      </div>
    </div>
  );
}
