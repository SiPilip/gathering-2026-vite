import { useState } from "react";
import { supabase } from "../lib/supabase";
import { BedDouble, Building, Loader2, ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface RoomResult {
  name: string;
  type: "HEAD" | "MEMBER" | "INDIVIDUAL";
  room_id?: string;
  room_name?: string;
  room_building?: string;
  room_floor?: string;
  roommates?: { name: string; type: string }[];
}

export default function CheckRoom() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<RoomResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q || q.length < 3) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // Search in registrations (Heads & Individuals)
      const { data: regData } = await supabase
        .from("registrations")
        .select(`
          representative_name, type, room_id,
          rooms(id, name, building, floor)
        `)
        .ilike("representative_name", `%${q}%`)
        .neq("status", "CANCELLED");

      // Search in family_members
      const { data: famData } = await supabase
        .from("family_members")
        .select(`
          member_name, room_id,
          rooms(id, name, building, floor),
          registrations!inner(status)
        `)
        .ilike("member_name", `%${q}%`)
        .neq("registrations.status", "CANCELLED");

      const combined: RoomResult[] = [];
      const roomIdsToFetch = new Set<string>();
      
      (regData || []).forEach((r: any) => {
        combined.push({
          name: r.representative_name,
          type: r.type === "FAMILY" ? "HEAD" : "INDIVIDUAL",
          room_id: r.room_id,
          room_name: r.rooms?.name,
          room_building: r.rooms?.building,
          room_floor: r.rooms?.floor,
        });
        if (r.room_id) roomIdsToFetch.add(r.room_id);
      });

      (famData || []).forEach((f: any) => {
        combined.push({
          name: f.member_name,
          type: "MEMBER",
          room_id: f.room_id,
          room_name: f.rooms?.name,
          room_building: f.rooms?.building,
          room_floor: f.rooms?.floor,
        });
        if (f.room_id) roomIdsToFetch.add(f.room_id);
      });

      // Fetch roommates for rooms found
      if (roomIdsToFetch.size > 0) {
        const rIds = Array.from(roomIdsToFetch);
        // Get all reg heads and individuals in these rooms
        const { data: rRegs } = await supabase.from("registrations")
            .select("representative_name, type, room_id").in("room_id", rIds).neq("status", "CANCELLED");
        // Get all members in these rooms
        const { data: rFams } = await supabase.from("family_members")
            .select("member_name, room_id, registrations!inner(status)").in("room_id", rIds).neq("registrations.status", "CANCELLED");

        const rmMap: Record<string, {name: string, type:string}[]> = {};
        rIds.forEach(id => rmMap[id] = []);

        (rRegs || []).forEach((r:any) => {
           rmMap[r.room_id].push({ name: r.representative_name, type: r.type === "FAMILY" ? "HEAD" : "INDIVIDUAL" });
        });
        (rFams || []).forEach((f:any) => {
           rmMap[f.room_id].push({ name: f.member_name, type: "MEMBER" });
        });

        // Attach to results, excluding themselves
        combined.forEach(c => {
           if (c.room_id && rmMap[c.room_id]) {
               c.roommates = rmMap[c.room_id].filter(p => p.name !== c.name);
           }
        });
      }

      setResults(combined);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-slate-800">Cek Penempatan Kamar</h1>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="bg-white p-5 sm:p-8 border border-slate-200 rounded-2xl shadow-sm text-center mb-6">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full mb-4">
            <BedDouble className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cari Kamar Asrama Anda</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Masukkan minimal 3 huruf nama Anda atau anggota keluarga untuk melihat info nomor kamar dan teman sekamar.
          </p>

          <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex gap-2">
            <input 
              type="text" 
              placeholder="Masukkan nama..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700"
            />
            <button 
              type="submit" 
              disabled={loading || search.length < 3}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari"}
            </button>
          </form>
        </div>

        {/* RESULTS */}
        {hasSearched && !loading && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 px-1">
              Hasil pencarian ({results.length}):
            </h3>
            
            {results.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                <p className="text-slate-500">Nama tidak ditemukan.</p>
                <p className="text-xs text-slate-400 mt-1">Coba gunakan nama panggilan atau pastikan nama sudah terdaftar.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {results.map((r, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Person Details */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {r.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {r.type === "HEAD" && "Kepala Keluarga"}
                          {r.type === "MEMBER" && "Anggota Keluarga"}
                          {r.type === "INDIVIDUAL" && "Peserta Individu"}
                        </p>
                      </div>

                      {/* Room Allocation */}
                      <div className="shrink-0 flex items-center gap-2.5 sm:self-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          r.room_name 
                            ? "bg-indigo-100 text-indigo-600" 
                            : "bg-amber-100 text-amber-600"
                        }`}>
                          {r.room_name ? <BedDouble className="h-5 w-5" /> : <Loader2 className="h-5 w-5" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            r.room_name ? "text-indigo-600" : "text-amber-600"
                          }`}>
                            {r.room_name ? "KAMAR:" : "STATUS:"}
                          </p>
                          <p className={`font-bold ${r.room_name ? "text-slate-800" : "text-amber-700"}`}>
                            {r.room_name || "Belum Ditentukan"}
                          </p>
                          {r.room_name && (
                            <p className="text-xs text-slate-500 font-medium">
                              Gedung {r.room_building} - Lt. {r.room_floor}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Roommates */}
                    {r.roommates && r.roommates.length > 0 && (
                      <div className="bg-slate-50 px-4 py-3 sm:px-5 border-t border-slate-100 flex gap-2 items-start">
                        <Building className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Teman Sekamar:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.roommates.map((p, j) => (
                              <span key={j} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-slate-600 border border-slate-200">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
