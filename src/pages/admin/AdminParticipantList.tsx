import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Users, User, FileSpreadsheet, ChevronDown as Collapse, LayoutList, Layers,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type AgeCategory = "ADULT" | "YOUTH" | "CHILD";
type SortKey = "no" | "name" | "shirt_size" | "age_category";
type SortDir = "asc" | "desc";
type ViewMode = "all" | "by-category";

interface Row {
  no: number;
  name: string;
  shirt_size: string;
  age_category: AgeCategory;
  isHead: boolean;
  groupId: string;
  groupType: "FAMILY" | "INDIVIDUAL";
  groupName: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const SHIRT_DISPLAY: Record<string, string> = {
  S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL",
  ANAK_2: "Anak 2", ANAK_4: "Anak 4", ANAK_6: "Anak 6",
  ANAK_8: "Anak 8", ANAK_10: "Anak 10", ANAK_13: "Anak 13",
};

const CATEGORIES: { key: AgeCategory; label: string; sub: string; color: string; bg: string; border: string; badge: string }[] = [
  {
    key: "ADULT",
    label: "Dewasa",
    sub: "Jemaat Umum",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "YOUTH",
    label: "Pemuda",
    sub: "P3MI",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    key: "CHILD",
    label: "Anak",
    sub: "Sekolah Minggu",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600 ml-1 inline" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600 ml-1 inline" />;
}

function ShirtBadge({ size }: { size: string }) {
  const isChild = size.startsWith("ANAK_");
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isChild ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
      {SHIRT_DISPLAY[size] ?? size}
    </span>
  );
}

// Simple mini table for category section
function CategoryTable({ rows, globalSearch }: { rows: Row[]; globalSearch: string }) {
  const [localSort, setLocalSort] = useState<SortKey>("name");
  const [localDir, setLocalDir] = useState<SortDir>("asc");

  const handleSort = (k: SortKey) => {
    if (localSort === k) setLocalDir(d => d === "asc" ? "desc" : "asc");
    else { setLocalSort(k); setLocalDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = globalSearch.toLowerCase().trim();
    return [...rows]
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.groupName.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = (a[localSort as keyof Row] as string ?? "").toString().toLowerCase();
        const vb = (b[localSort as keyof Row] as string ?? "").toString().toLowerCase();
        if (va < vb) return localDir === "asc" ? -1 : 1;
        if (va > vb) return localDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [rows, globalSearch, localSort, localDir]);

  const Th = ({ label, col, cls = "" }: { label: string; col: SortKey; cls?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition-colors ${cls}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={col} sortKey={localSort} sortDir={localDir} />
      </span>
    </th>
  );

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        {globalSearch ? "Tidak ada yang cocok dengan pencarian." : "Belum ada peserta di kategori ini."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">No</th>
            <Th label="Nama" col="name" />
            <Th label="Ukuran Baju" col="shirt_size" cls="w-32" />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Asal KK</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((row, i) => (
            <tr key={`${row.groupId}-${i}`} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {row.groupType === "FAMILY" && row.isHead && (
                    <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  )}
                  {row.groupType === "FAMILY" && !row.isHead && (
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 ml-1 shrink-0" />
                  )}
                  {row.groupType === "INDIVIDUAL" && (
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={`font-medium ${row.isHead ? "text-slate-900" : "text-slate-600"}`}>
                    {row.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3"><ShirtBadge size={row.shirt_size} /></td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {row.groupType === "FAMILY" ? (
                  <span>{row.isHead ? <span className="font-medium text-indigo-600">{row.groupName}</span> : row.groupName}</span>
                ) : (
                  <span className="italic text-slate-400">Individu</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Collapsible category section
function CategorySection({
  cat, rows, globalSearch, defaultOpen,
}: {
  cat: typeof CATEGORIES[0];
  rows: Row[];
  globalSearch: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border ${cat.border} overflow-hidden shadow-sm`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${cat.bg} transition-colors hover:brightness-95`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-start`}>
            <span className={`text-base font-bold ${cat.color}`}>{cat.label}</span>
            <span className="text-xs text-slate-500">{cat.sub}</span>
          </div>
          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-bold ${cat.badge}`}>
            {rows.length}
          </span>
          <span className="text-xs text-slate-500">peserta</span>
        </div>
        <Collapse className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Body */}
      {open && (
        <div className="bg-white">
          <CategoryTable rows={rows} globalSearch={globalSearch} />
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
            {rows.length} orang dalam kategori {cat.label}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminParticipantList() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<"ALL" | AgeCategory>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FAMILY" | "INDIVIDUAL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          id, type, representative_name, age_category, shirt_size, status,
          family_members ( id, member_name, age_category, shirt_size )
        `)
        .neq("status", "CANCELLED")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const built: Row[] = [];
      let counter = 1;

      (data ?? []).forEach((reg) => {
        built.push({
          no: counter++,
          name: reg.representative_name,
          shirt_size: reg.shirt_size ?? "M",
          age_category: (reg.age_category as AgeCategory) ?? "ADULT",
          isHead: true,
          groupId: reg.id,
          groupType: reg.type,
          groupName: reg.representative_name,
        });

        if (reg.type === "FAMILY") {
          (reg.family_members ?? []).forEach((fm: any) => {
            built.push({
              no: counter++,
              name: fm.member_name,
              shirt_size: fm.shirt_size ?? "M",
              age_category: (fm.age_category as AgeCategory) ?? "ADULT",
              isHead: false,
              groupId: reg.id,
              groupType: "FAMILY",
              groupName: reg.representative_name,
            });
          });
        }
      });

      setRows(built);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Filtered + sorted for "All" view
  const displayed = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = rows.filter(r => {
      const matchSearch = !q
        || r.name.toLowerCase().includes(q)
        || r.groupName.toLowerCase().includes(q)
        || SHIRT_DISPLAY[r.shirt_size]?.toLowerCase().includes(q)
        || r.shirt_size.toLowerCase().includes(q);
      const matchAge = ageFilter === "ALL" || r.age_category === ageFilter;
      const matchType = typeFilter === "ALL" || r.groupType === typeFilter;
      return matchSearch && matchAge && matchType;
    });

    if (sortKey === "no") return sortDir === "asc" ? filtered : [...filtered].reverse();

    return [...filtered].sort((a, b) => {
      const va = (a[sortKey as keyof Row] as string ?? "").toString().toLowerCase();
      const vb = (b[sortKey as keyof Row] as string ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, search, ageFilter, typeFilter, sortKey, sortDir]);

  const numbered = displayed.map((r, i) => ({ ...r, displayNo: i + 1 }));

  // Rows split by category for "by-category" view
  const byCategory = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = rows.filter(r => !q || r.name.toLowerCase().includes(q) || r.groupName.toLowerCase().includes(q));
    return {
      ADULT: base.filter(r => r.age_category === "ADULT"),
      YOUTH: base.filter(r => r.age_category === "YOUTH"),
      CHILD: base.filter(r => r.age_category === "CHILD"),
    };
  }, [rows, search]);

  const exportCSV = () => {
    const src = viewMode === "all" ? displayed : rows;
    const headers = ["No", "Nama", "Tipe", "Kelompok KK", "Ukuran Baju", "Kategori"];
    const csvRows = src.map((r, i) => [
      i + 1, r.name,
      r.groupType === "FAMILY" ? "Keluarga" : "Individu",
      r.groupType === "FAMILY" ? r.groupName : "-",
      SHIRT_DISPLAY[r.shirt_size] ?? r.shirt_size,
      CATEGORIES.find(c => c.key === r.age_category)?.label ?? r.age_category,
    ]);
    const content = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + csvRows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(content);
    a.download = `peserta_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const Th = ({ label, col, className = "" }: { label: string; col: SortKey; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition-colors ${className}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Daftar Peserta</h1>
          <p className="text-sm text-slate-500 mt-0.5">Seluruh peserta gathering — individu &amp; anggota keluarga.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === "all" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutList className="h-4 w-4" /><span className="hidden sm:inline">Semua</span>
            </button>
            <button
              onClick={() => setViewMode("by-category")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${viewMode === "by-category" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Layers className="h-4 w-4" /><span className="hidden sm:inline">Per Kategori</span>
            </button>
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" /><span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau kelompok keluarga..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {viewMode === "all" && (
          <>
            <select value={ageFilter} onChange={e => setAgeFilter(e.target.value as any)}
              className="w-full sm:w-44 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ALL">Semua Kategori</option>
              <option value="ADULT">Dewasa</option>
              <option value="YOUTH">Pemuda (P3MI)</option>
              <option value="CHILD">Anak (SM)</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full sm:w-44 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ALL">Semua Tipe</option>
              <option value="FAMILY">Keluarga</option>
              <option value="INDIVIDUAL">Individu</option>
            </select>
          </>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span>
          Total <strong className="text-slate-800">{rows.length}</strong> peserta
        </span>
        <span className="h-4 w-px bg-slate-200" />
        {CATEGORIES.map(c => (
          <span key={c.key} className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${c.badge}`} />
            <strong className="text-slate-700">{rows.filter(r => r.age_category === c.key).length}</strong> {c.label}
          </span>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW MODE: SEMUA                              */}
      {/* ══════════════════════════════════════════════ */}
      {!loading && viewMode === "all" && (
        <>
          {numbered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
              Tidak ada data yang cocok dengan filter.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <Th label="No" col="no" className="w-14" />
                      <Th label="Nama" col="name" />
                      <Th label="Baju" col="shirt_size" className="w-28" />
                      <Th label="Kategori" col="age_category" className="w-40" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {numbered.map((row, idx) => {
                      const ageMeta = CATEGORIES.find(c => c.key === row.age_category);
                      return (
                        <tr
                          key={`${row.groupId}-${idx}`}
                          className={`transition-colors hover:bg-slate-50/70 ${row.isHead && row.groupType === "FAMILY" ? "bg-slate-50/40" : ""}`}
                        >
                          <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{row.displayNo}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {row.groupType === "FAMILY" && !row.isHead && (
                                <span className="shrink-0 w-3 h-3 rounded-full border-2 border-slate-300 ml-2" />
                              )}
                              {row.isHead && row.groupType === "FAMILY" && (
                                <Users className="h-4 w-4 text-indigo-400 shrink-0" title="Kepala Keluarga" />
                              )}
                              {row.groupType === "INDIVIDUAL" && (
                                <User className="h-4 w-4 text-slate-400 shrink-0" />
                              )}
                              <span className={`font-medium ${row.isHead ? "text-slate-900" : "text-slate-600"}`}>
                                {row.name}
                              </span>
                              {row.isHead && row.groupType === "FAMILY" && (
                                <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase">KK</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3"><ShirtBadge size={row.shirt_size} /></td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ageMeta?.badge ?? "bg-slate-100 text-slate-600"}`}>
                              {ageMeta?.label ?? row.age_category}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
                <span>{numbered.length} baris ditampilkan</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 text-indigo-400" /> Kepala KK</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 inline-block" /> Anggota</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW MODE: PER KATEGORI                       */}
      {/* ══════════════════════════════════════════════ */}
      {!loading && viewMode === "by-category" && (
        <div className="space-y-4">
          {CATEGORIES.map((cat, i) => (
            <CategorySection
              key={cat.key}
              cat={cat}
              rows={byCategory[cat.key]}
              globalSearch={search}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
