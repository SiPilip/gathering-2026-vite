import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Plus, Trash2, Pencil, X, Check,
  Heart, Search, FileSpreadsheet, Calendar, StickyNote,
} from "lucide-react";

interface Donor {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  donated_at: string;
  created_at: string;
}

const empty = (): Omit<Donor, "id" | "created_at"> => ({
  name: "",
  amount: 0,
  notes: "",
  donated_at: new Date().toISOString().slice(0, 10),
});

const formatCurrency = (n: number) =>
  "Rp " + Number(n).toLocaleString("id-ID");

export default function AdminDonors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty());

  useEffect(() => { fetchDonors(); }, []);

  const fetchDonors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .order("donated_at", { ascending: false });
    if (!error) setDonors(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(empty());
    setError("");
    setShowForm(true);
  };

  const openEdit = (d: Donor) => {
    setEditId(d.id);
    setForm({ name: d.name, amount: d.amount, notes: d.notes ?? "", donated_at: d.donated_at });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nama donatur harus diisi."); return; }
    if (form.amount <= 0) { setError("Jumlah donasi harus lebih dari 0."); return; }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount),
      notes: form.notes?.trim() || null,
      donated_at: form.donated_at,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = editId
      ? await supabase.from("donors").update(payload).eq("id", editId)
      : await supabase.from("donors").insert(payload);

    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false);
    closeForm();
    fetchDonors();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus donatur ini?")) return;
    setDeleting(id);
    await supabase.from("donors").delete().eq("id", id);
    setDeleting(null);
    fetchDonors();
  };

  const exportCSV = () => {
    const headers = ["No", "Nama Donatur", "Jumlah (Rp)", "Tanggal", "Keterangan"];
    const rows = filtered.map((d, i) => [
      i + 1, d.name, d.amount,
      new Date(d.donated_at).toLocaleDateString("id-ID"),
      d.notes ?? "",
    ]);
    const content = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(content);
    a.download = `donatur_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filtered = donors.filter(d =>
    !search.trim() || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAll = donors.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" /> Data Donatur
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola data donasi gathering gereja.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <FileSpreadsheet className="h-4 w-4" /><span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <Plus className="h-4 w-4" /> Tambah Donatur
          </button>
        </div>
      </div>

      {/* ── Summary card ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Total Donasi</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{formatCurrency(totalAll)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Jumlah Donatur</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{donors.length} orang</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rata-rata Donasi</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {donors.length ? formatCurrency(Math.round(totalAll / donors.length)) : "—"}
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Cari nama donatur..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">
                {editId ? "Edit Donatur" : "Tambah Donatur"}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Donatur <span className="text-red-500">*</span></label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Nama lengkap donatur..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah Donasi (Rp) <span className="text-red-500">*</span></label>
                  <input type="number" required min={1} value={form.amount || ""}
                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Tanggal
                  </label>
                  <input type="date" required value={form.donated_at}
                    onChange={e => setForm(f => ({ ...f, donated_at: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5" /> Keterangan
                </label>
                <textarea rows={2} value={form.notes ?? ""}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  placeholder="Opsional..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          {search ? "Tidak ada donatur yang cocok dengan pencarian." : "Belum ada data donatur."}
        </div>
      )}

      {/* ── Table ── */}
      {!loading && filtered.length > 0 && (
        <>
          {/* Mobile card */}
          <div className="md:hidden space-y-3">
            {filtered.map(d => (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{d.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(d.donated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <p className="font-bold text-rose-600 shrink-0">{formatCurrency(d.amount)}</p>
                </div>
                {d.notes && <p className="text-xs text-slate-500 italic">{d.notes}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(d)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                    {deleting === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">No</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Donatur</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Jumlah Donasi</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Tanggal</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-slate-400 text-xs font-mono text-center">{i + 1}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="px-5 py-4 text-right font-bold text-rose-600">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(d.donated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs italic">{d.notes || "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(d)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md font-medium text-xs transition-colors">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium text-xs transition-colors disabled:opacity-60">
                          {deleting === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-5 py-3.5 text-sm font-semibold text-slate-600">
                    Total ({donors.length} donatur)
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-rose-700 text-base">
                    {formatCurrency(totalAll)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
