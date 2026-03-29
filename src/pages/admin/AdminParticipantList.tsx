import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Users, User, FileSpreadsheet,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type AgeCategory = "ADULT" | "YOUTH" | "CHILD";
type SortKey = "no" | "name" | "shirt_size" | "age_category" | "group";
type SortDir = "asc" | "desc";

interface Row {
  no: number;
  name: string;
  shirt_size: string;
  age_category: AgeCategory;
  isHead: boolean;        // kepala keluarga / individu
  groupId: string;        // registration id for grouping
  groupType: "FAMILY" | "INDIVIDUAL";
  groupName: string;      // representative name (for grouping label)
}

// ── Helpers ────────────────────────────────────────────────────────────────
const SHIRT_DISPLAY: Record<string, string> = {
  S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL",
  ANAK_2: "Anak 2", ANAK_4: "Anak 4", ANAK_6: "Anak 6",
  ANAK_8: "Anak 8", ANAK_10: "Anak 10", ANAK_13: "Anak 13",
};

const AGE_DISPLAY: Record<AgeCategory, { label: string; color: string }> = {
  ADULT: { label: "Dewasa",        color: "bg-indigo-100 text-indigo-700" },
  YOUTH: { label: "Pemuda (P3MI)", color: "bg-sky-100 text-sky-700"      },
  CHILD: { label: "Anak (SM)",     color: "bg-emerald-100 text-emerald-700" },
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600 ml-1 inline" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600 ml-1 inline" />;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminParticipantList() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<"ALL" | AgeCategory>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FAMILY" | "INDIVIDUAL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
        // Kepala keluarga / individu
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

        // Anggota keluarga
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

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Filtered + sorted rows ────────────────────────────────────────────────
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

    // Sort while keeping family groups together when sortKey is "no" or "group"
    if (sortKey === "no" || sortKey === "group") {
      return sortDir === "asc" ? filtered : [...filtered].reverse();
    }

    return [...filtered].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "name") { va = a.name; vb = b.name; }
      if (sortKey === "shirt_size") { va = a.shirt_size; vb = b.shirt_size; }
      if (sortKey === "age_category") { va = a.age_category; vb = b.age_category; }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, search, ageFilter, typeFilter, sortKey, sortDir]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["No", "Nama", "Tipe Pendaftaran", "Kelompok KK", "Ukuran Baju", "Kategori"];
    const csvRows = displayed.map(r => [
      r.no,
      r.name,
      r.groupType === "FAMILY" ? "Keluarga" : "Individu",
      r.groupType === "FAMILY" ? r.groupName : "-",
      SHIRT_DISPLAY[r.shirt_size] ?? r.shirt_size,
      AGE_DISPLAY[r.age_category]?.label ?? r.age_category,
    ]);
    const content = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + csvRows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(content);
    a.download = `peserta_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ── Th component ──────────────────────────────────────────────────────────
  const Th = ({ label, col, className = "" }: { label: string; col: SortKey; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition-colors group ${className}`}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  // Assign sequential display numbers after filtering
  const numbered = displayed.map((r, i) => ({ ...r, displayNo: i + 1 }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Daftar Peserta</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Seluruh peserta gathering — individu &amp; anggota keluarga.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
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
        {/* Age filter */}
        <select
          value={ageFilter}
          onChange={e => setAgeFilter(e.target.value as any)}
          className="w-full sm:w-44 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="ADULT">Dewasa</option>
          <option value="YOUTH">Pemuda (P3MI)</option>
          <option value="CHILD">Anak (SM)</option>
        </select>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="w-full sm:w-44 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">Semua Tipe</option>
          <option value="FAMILY">Keluarga</option>
          <option value="INDIVIDUAL">Individu</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>
          Menampilkan <strong className="text-slate-800">{numbered.length}</strong> dari{" "}
          <strong className="text-slate-800">{rows.length}</strong> peserta
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {rows.filter(r => r.groupType === "FAMILY").length} keluarga
        </span>
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {rows.filter(r => r.groupType === "INDIVIDUAL").length} individu
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && numbered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          Tidak ada data yang cocok dengan filter.
        </div>
      )}

      {/* Table */}
      {!loading && numbered.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th label="No"    col="no"           className="w-14 text-center" />
                  <Th label="Nama"  col="name"         />
                  <Th label="Baju"  col="shirt_size"   className="w-28" />
                  <Th label="Kategori" col="age_category" className="w-40" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const elements: React.ReactNode[] = [];
                  let lastGroupId = "";

                  numbered.forEach((row, idx) => {
                    // Family group header row
                    if (row.groupType === "FAMILY" && row.isHead && row.groupId !== lastGroupId) {
                      lastGroupId = row.groupId;
                      // we'll use the row itself as head — just mark visually
                    } else if (row.groupType === "INDIVIDUAL") {
                      lastGroupId = "";
                    }

                    const isFirstOfGroup = row.isHead && row.groupType === "FAMILY";
                    const ageMeta = AGE_DISPLAY[row.age_category];

                    elements.push(
                      <tr
                        key={`${row.groupId}-${idx}`}
                        className={`transition-colors hover:bg-slate-50/70 ${
                          row.isHead && row.groupType === "FAMILY"
                            ? "bg-slate-50/50"
                            : ""
                        }`}
                      >
                        {/* No */}
                        <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs w-14">
                          {row.displayNo}
                        </td>

                        {/* Nama */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.groupType === "FAMILY" && !row.isHead && (
                              <span className="shrink-0 w-3 h-3 rounded-full border-2 border-slate-300 ml-2" />
                            )}
                            {row.isHead && row.groupType === "FAMILY" && (
                              <span className="shrink-0" title="Kepala Keluarga">
                                <Users className="h-4 w-4 text-indigo-400" />
                              </span>
                            )}
                            {row.groupType === "INDIVIDUAL" && (
                              <span className="shrink-0">
                                <User className="h-4 w-4 text-slate-400" />
                              </span>
                            )}
                            <span className={`font-medium ${row.isHead ? "text-slate-900" : "text-slate-600"}`}>
                              {row.name}
                            </span>
                            {isFirstOfGroup && (
                              <span className="ml-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                KK
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ukuran Baju */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row.shirt_size.startsWith("ANAK_")
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {SHIRT_DISPLAY[row.shirt_size] ?? row.shirt_size}
                          </span>
                        </td>

                        {/* Kategori Umur */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ageMeta?.color ?? "bg-slate-100 text-slate-600"}`}>
                            {ageMeta?.label ?? row.age_category}
                          </span>
                        </td>
                      </tr>
                    );
                  });

                  return elements;
                })()}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
            <span>Total {numbered.length} baris ditampilkan</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-indigo-400" /> = Kepala Keluarga
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 inline-block" /> = Anggota
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
