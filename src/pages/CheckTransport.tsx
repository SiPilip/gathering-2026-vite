import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Search, Bus, Car, Loader2, ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface TransportResult {
  name: string;
  type: "HEAD" | "MEMBER" | "INDIVIDUAL";
  transport_mode: "BUS" | "OWN";
  vehicle_name?: string;
}

export default function CheckTransport() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<TransportResult[]>([]);

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
          representative_name, type, transport_mode,
          vehicles(name)
        `)
        .ilike("representative_name", `%${q}%`)
        .neq("status", "CANCELLED");

      // Search in family_members
      const { data: famData } = await supabase
        .from("family_members")
        .select(`
          member_name, 
          vehicles(name),
          registrations!inner(transport_mode, status)
        `)
        .ilike("member_name", `%${q}%`)
        .neq("registrations.status", "CANCELLED");

      const combined: TransportResult[] = [];
      
      (regData || []).forEach((r: any) => {
        combined.push({
          name: r.representative_name,
          type: r.type === "FAMILY" ? "HEAD" : "INDIVIDUAL",
          transport_mode: r.transport_mode,
          vehicle_name: r.vehicles?.name,
        });
      });

      (famData || []).forEach((f: any) => {
        combined.push({
          name: f.member_name,
          type: "MEMBER",
          // family members follow HEAD's transport_mode, but are practically OWN if they have a vehicle_id
          transport_mode: f.vehicles ? "OWN" : f.registrations.transport_mode,
          vehicle_name: f.vehicles?.name,
        });
      });

      setResults(combined);
    } catch (error) {
      console.error(error);
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
          <h1 className="text-lg font-bold text-slate-800">Cek Info Transportasi</h1>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="bg-white p-5 sm:p-8 border border-slate-200 rounded-2xl shadow-sm text-center mb-6">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-blue-50 text-blue-500 rounded-full mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cari Kendaraan Anda</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Masukkan minimal 3 huruf nama Anda atau anggota keluarga untuk melihat info mobil/bus keberangkatan.
          </p>

          <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex gap-2">
            <input 
              type="text" 
              placeholder="Masukkan nama..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
            />
            <button 
              type="submit" 
              disabled={loading || search.length < 3}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
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

                    <div className="shrink-0 flex items-center gap-2.5 sm:self-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        r.vehicle_name 
                          ? "bg-amber-100 text-amber-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {r.vehicle_name ? <Car className="h-5 w-5" /> : <Bus className="h-5 w-5" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-xs font-bold uppercase tracking-wide ${
                          r.vehicle_name ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {r.vehicle_name ? "KENDARAAN PRIBADI:" : "TRANSPORTASI:"}
                        </p>
                        <p className="font-bold text-slate-800">
                          {r.vehicle_name || "Bus Gereja"}
                        </p>
                      </div>
                    </div>

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
