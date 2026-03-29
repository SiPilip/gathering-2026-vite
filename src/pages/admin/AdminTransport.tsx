import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Search, Bus, Car, Users, User, CheckCircle2,
  RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type TransportMode = "BUS" | "OWN";

interface Registrant {
  id: string;
  representative_name: string;
  type: "FAMILY" | "INDIVIDUAL";
  transport_mode: TransportMode;
  age_category: string;
  family_members: { member_name: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Passenger Card ───────────────────────────────────────────────────────────
function PassengerCard({ name, isHead, type }: { name: string; isHead: boolean; type?: "FAMILY" | "INDIVIDUAL" }) {
  return (
    <div
      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
        isHead
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-slate-50 border-slate-100"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorFor(name)}`}
      >
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold truncate ${isHead ? "text-slate-900" : "text-slate-600"}`}>
          {name}
        </p>
        {isHead && type && (
          <p className="text-[10px] text-slate-400 leading-tight">
            {type === "FAMILY" ? "Kepala Keluarga" : "Individu"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Group Card (for family groups within bus/own) ────────────────────────────
function GroupCard({ reg }: { reg: Registrant }) {
  const memberCount = reg.family_members?.length ?? 0;
  if (reg.type === "INDIVIDUAL") {
    return <PassengerCard name={reg.representative_name} isHead type="INDIVIDUAL" />;
  }
  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
      {/* Family header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
        <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span className="text-xs font-bold text-indigo-700 truncate">{reg.representative_name}</span>
        <span className="ml-auto text-[10px] text-indigo-400 shrink-0">{memberCount + 1} org</span>
      </div>
      {/* Members */}
      <div className="p-2 space-y-1.5">
        <PassengerCard name={reg.representative_name} isHead />
        {(reg.family_members ?? []).map((m, i) => (
          <PassengerCard key={i} name={m.member_name} isHead={false} />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminTransport() {
  const [loading, setLoading] = useState(true);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | TransportMode>("ALL");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select(`
        id, representative_name, type, transport_mode, age_category, status,
        family_members ( member_name )
      `)
      .neq("status", "CANCELLED")
      .order("representative_name", { ascending: true });

    if (!error) setRegistrants((data as Registrant[]) ?? []);
    setLoading(false);
  };

  const toggleTransport = async (id: string, current: TransportMode) => {
    const next: TransportMode = current === "BUS" ? "OWN" : "BUS";
    setUpdatingId(id);
    const { error } = await supabase
      .from("registrations")
      .update({ transport_mode: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setRegistrants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, transport_mode: next } : r))
      );
    }
    setUpdatingId(null);
  };

  // Stats
  const busCount = registrants.reduce((n, r) => {
    if (r.transport_mode !== "BUS") return n;
    return n + 1 + (r.type === "FAMILY" ? (r.family_members?.length ?? 0) : 0);
  }, 0);
  const ownCount = registrants.reduce((n, r) => {
    if (r.transport_mode !== "OWN") return n;
    return n + 1 + (r.type === "FAMILY" ? (r.family_members?.length ?? 0) : 0);
  }, 0);
  const busGroups = registrants.filter((r) => r.transport_mode === "BUS").length;
  const ownGroups = registrants.filter((r) => r.transport_mode === "OWN").length;

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return registrants.filter((r) => {
      const matchMode = activeTab === "ALL" || r.transport_mode === activeTab;
      const matchSearch =
        !q ||
        r.representative_name.toLowerCase().includes(q) ||
        (r.family_members ?? []).some((m) => m.member_name.toLowerCase().includes(q));
      return matchMode && matchSearch;
    });
  }, [registrants, search, activeTab]);

  const busFiltered = filtered.filter((r) => r.transport_mode === "BUS");
  const ownFiltered = filtered.filter((r) => r.transport_mode === "OWN");

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bus className="h-6 w-6 text-blue-600" /> Manajemen Transportasi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Atur pilihan transportasi tiap pendaftar ke lokasi gathering.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Bus Gereja</p>
            <p className="text-3xl font-bold text-blue-900">{busCount}</p>
            <p className="text-xs text-blue-400 mt-0.5">{busGroups} keluarga/individu</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Kendaraan Sendiri</p>
            <p className="text-3xl font-bold text-amber-900">{ownCount}</p>
            <p className="text-xs text-amber-400 mt-0.5">{ownGroups} keluarga/individu</p>
          </div>
        </div>
      </div>

      {/* ── Search + Filter tab ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau anggota keluarga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
          />
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {(["ALL", "BUS", "OWN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-r last:border-r-0 border-slate-200 ${
                activeTab === t
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "ALL" && "Semua"}
              {t === "BUS" && <><Bus className="h-4 w-4" /> Bus</>}
              {t === "OWN" && <><Car className="h-4 w-4" /> Sendiri</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {/* ── Content: two-column or single ── */}
      {!loading && (
        <div className={`grid gap-5 ${activeTab === "ALL" ? "lg:grid-cols-2" : "grid-cols-1"}`}>

          {/* BUS SECTION */}
          {(activeTab === "ALL" || activeTab === "BUS") && (
            <div className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Bus className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-800">Bus Gereja</h2>
                <span className="ml-1 inline-flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5">
                  {busCount}
                </span>
                <span className="text-xs text-slate-400 ml-1">penumpang</span>
              </div>

              {busFiltered.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
                  Tidak ada pendaftar Bus.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {busFiltered.map((reg) => (
                    <div key={reg.id} className="relative group">
                      <GroupCard reg={reg} />
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleTransport(reg.id, reg.transport_mode)}
                        disabled={updatingId === reg.id}
                        title="Pindah ke Kendaraan Sendiri"
                        className="absolute top-2 right-2 p-1 rounded-md bg-white/80 border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-50"
                      >
                        {updatingId === reg.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Car className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OWN VEHICLE SECTION */}
          {(activeTab === "ALL" || activeTab === "OWN") && (
            <div className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Car className="h-4 w-4" />
                </div>
                <h2 className="font-bold text-slate-800">Kendaraan Sendiri</h2>
                <span className="ml-1 inline-flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5">
                  {ownCount}
                </span>
                <span className="text-xs text-slate-400 ml-1">orang</span>
              </div>

              {ownFiltered.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 text-sm">
                  Tidak ada pendaftar kendaraan sendiri.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ownFiltered.map((reg) => (
                    <div key={reg.id} className="relative group">
                      <GroupCard reg={reg} />
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleTransport(reg.id, reg.transport_mode)}
                        disabled={updatingId === reg.id}
                        title="Pindah ke Bus Gereja"
                        className="absolute top-2 right-2 p-1 rounded-md bg-white/80 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-50"
                      >
                        {updatingId === reg.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Bus className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      {!loading && (
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-400" /> = Kepala Keluarga
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" /> = Individu
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Hover kartu → ikon pindah mode
          </span>
        </div>
      )}
    </div>
  );
}
