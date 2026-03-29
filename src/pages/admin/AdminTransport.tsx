import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Search, Bus, Car, Plus, Trash2, X,
  RefreshCw, CheckCircle2, ChevronRight, XCircle, ArrowRightLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Vehicle {
  id: string;
  name: string;
  capacity: number;
}

interface Person {
  id: string; // "reg_xxx" or "fam_xxx"
  name: string;
  type: "HEAD" | "INDIVIDUAL" | "MEMBER";
  reg_id: string; // The root registration ID (for grouping)
  vehicle_id: string | null;
  transport_mode: "BUS" | "OWN";
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(n: string) {
  return n.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700", "bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700",
];
function colorFor(n: string) {
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Item Passenger Card ──────────────────────────────────────────────────────
function PersonItem({ p, onClick, active, actionIcon: ActionIcon }: { p: Person, onClick?: () => void, active?: boolean, actionIcon?: any }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${onClick ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50/50" : ""} ${
        active ? "border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-400" : "bg-white border-slate-200"
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colorFor(p.name)}`}>
        {getInitials(p.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
        <p className="text-[10px] text-slate-400 truncate">
          {p.type === "HEAD" && "Kepala Keluarga"}
          {p.type === "MEMBER" && "Anggota KK"}
          {p.type === "INDIVIDUAL" && "Individu"}
        </p>
      </div>
      {ActionIcon && <ActionIcon className="h-4 w-4 text-slate-400 shrink-0" />}
    </div>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
export default function AdminTransport() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // UI state
  const [search, setSearch] = useState("");
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCarName, setNewCarName] = useState("");
  const [newCarCap, setNewCarCap] = useState(4);
  const [savingCar, setSavingCar] = useState(false);

  // Assignment state
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null); // Person ID
  const [movingId, setMovingId] = useState<string | null>(null); // Loading state for move

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch vehicles
      const { data: vData } = await supabase.from("vehicles").select("*").order("created_at");
      setVehicles(vData ?? []);

      // 2. Fetch registrations
      const { data: rData } = await supabase
        .from("registrations")
        .select(`id, representative_name, type, transport_mode, vehicle_id, status, family_members(id, member_name, vehicle_id)`)
        .neq("status", "CANCELLED")
        .order("representative_name");

      const arr: Person[] = [];
      (rData ?? []).forEach(reg => {
        // Representative
        arr.push({
          id: `reg_${reg.id}`,
          name: reg.representative_name,
          type: reg.type === "FAMILY" ? "HEAD" : "INDIVIDUAL",
          reg_id: reg.id,
          vehicle_id: reg.vehicle_id,
          transport_mode: reg.transport_mode,
        });
        // Family members
        if (reg.type === "FAMILY" && reg.family_members) {
          reg.family_members.forEach((fm: any) => {
            arr.push({
              id: `fam_${fm.id}`,
              name: fm.member_name,
              type: "MEMBER",
              reg_id: reg.id,
              vehicle_id: fm.vehicle_id,
              transport_mode: reg.transport_mode,
            });
          });
        }
      });
      setPeople(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Car
  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarName.trim() || newCarCap < 1) return;
    setSavingCar(true);
    await supabase.from("vehicles").insert({ name: newCarName.trim(), capacity: newCarCap });
    setSavingCar(false);
    setNewCarName(""); setShowAddCar(false);
    fetchData();
  };

  const handleDeleteCar = async (id: string, name: string) => {
    if (!window.confirm(`Hapus mobil ${name}? Semua penumpang di dalamnya akan kembali ke daftar Bus.`)) return;
    await supabase.from("vehicles").delete().eq("id", id);
    fetchData();
  };

  // Move Person to Vehicle (or null for Bus)
  const assignPerson = async (vehicleId: string | null) => {
    if (!selectedPerson) return;
    setMovingId(selectedPerson);

    const isReg = selectedPerson.startsWith("reg_");
    const dbId = selectedPerson.replace(/^(reg_|fam_)/, "");
    const table = isReg ? "registrations" : "family_members";

    // Set transport_mode to 'OWN' if assigning to a car, or 'BUS' if kicking out
    const updates: any = { vehicle_id: vehicleId };
    if (isReg) updates.transport_mode = vehicleId ? "OWN" : "BUS";

    const { error } = await supabase.from(table).update(updates).eq("id", dbId);

    if (!error) {
      // Also update local state for immediate feedback
      setPeople(prev => prev.map(p => {
        if (p.id === selectedPerson) {
          return { ...p, vehicle_id: vehicleId, transport_mode: isReg ? (vehicleId ? "OWN" : "BUS") : p.transport_mode };
        }
        return p;
      }));
    }

    setMovingId(null);
    setSelectedPerson(null); // deselect after move
  };

  // Memoized groupings
  const { unassignedBus, assignedCars } = useMemo(() => {
    const q = search.toLowerCase().trim();
    // Unassigned = no vehicle_id. We'll show all of them here (since transport_mode default is BUS).
    const un = people.filter(p => !p.vehicle_id && (!q || p.name.toLowerCase().includes(q)));
    
    // Group assigned by vehicle
    const cars = vehicles.map(v => ({
      ...v,
      // passengers in this car matching search
      passengers: people.filter(p => p.vehicle_id === v.id && (!q || p.name.toLowerCase().includes(q))),
      // total actual passengers in this car regardless of search
      totalPassengers: people.filter(p => p.vehicle_id === v.id).length, 
    }));

    return { unassignedBus: un, assignedCars: cars };
  }, [people, vehicles, search]);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="h-6 w-6 text-amber-500" /> Penataan Kendaraan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelompokkan jemaat ke dalam mobil, atau biarkan di Bus Gereja.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddCar(true)}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <Plus className="h-4 w-4" /> Tambah Mobil
          </button>
          <button onClick={fetchData}
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ── SEARCH & INSTRUCTIONS ── */}
      <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm p-3 relative flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
        <input type="text" placeholder="Cari nama peserta..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 outline-none text-slate-700 bg-transparent" />
        
        <div className="hidden md:flex border-l border-slate-200 pl-4 items-center gap-2 text-slate-500 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          Klik nama peserta, lalu klik mobil tujuan untuk memindahkannya.
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
      )}

      {/* ── TWO-COLUMN DRAG/DROP LAYOUT ── */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Unassigned (Bus) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-50 border-b border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-800">Bus / Belum Diatur</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {unassignedBus.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
              {movingId && selectedPerson && !unassignedBus.find(p=>p.id === movingId) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20" />
              )}
              {unassignedBus.map(p => (
                <PersonItem 
                  key={p.id} p={p} 
                  active={selectedPerson === p.id}
                  onClick={() => setSelectedPerson(p.id === selectedPerson ? null : p.id)}
                  actionIcon={selectedPerson === p.id ? ArrowRightLeft : ChevronRight}
                />
              ))}
              {unassignedBus.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">Kosong</div>
              )}
            </div>
          </div>

          {/* RIGHT: Vehicles Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedCars.map(car => {
              const isFull = car.totalPassengers >= car.capacity;
              return (
                <div key={car.id} className={`rounded-2xl border bg-white shadow-sm flex flex-col transition-all ${selectedPerson ? "ring-2 ring-indigo-500/50 hover:ring-indigo-500 ring-offset-2 cursor-pointer" : "border-slate-200"}`}
                     onClick={() => {
                        if (selectedPerson) assignPerson(car.id);
                     }}>
                  
                  {/* Car Header */}
                  <div className={`p-3 border-b flex items-start justify-between ${selectedPerson ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100 rounded-t-2xl"}`}>
                    <div className="flex items-center gap-2 text-slate-800">
                      <Car className={`h-4 w-4 ${selectedPerson ? "text-indigo-600" : "text-amber-500"}`} />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate pr-2">{car.name}</p>
                        <p className="text-[10px] text-slate-500">{car.totalPassengers} / {car.capacity} kursi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isFull ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {isFull ? "Penuh" : `${car.capacity - car.totalPassengers} sisa`}
                      </span>
                      {!selectedPerson && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id, car.name); }} 
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Car Passengers */}
                  <div className="p-2 space-y-1.5 min-h-[120px]">
                    {car.passengers.map(p => (
                      <div key={p.id} className="relative group">
                        <PersonItem p={p} onClick={() => setSelectedPerson(p.id === selectedPerson ? null : p.id)} active={selectedPerson === p.id} />
                        {/* Kick out button (only visible on hover, drops passenger back to bus) */}
                        {!selectedPerson && (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPerson(p.id); assignPerson(null); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white text-slate-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-slate-200">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {car.totalPassengers === 0 && (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 py-6 italic">Kosong</div>
                    )}
                    {selectedPerson && !isFull && !car.passengers.find(p=>p.id===selectedPerson) && (
                      <div className="border border-indigo-200 border-dashed rounded-lg bg-indigo-50/50 p-2 text-center text-xs text-indigo-400 font-medium py-3">
                        Klik untuk memasukkan {people.find(p=>p.id===selectedPerson)?.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State for Cars */}
            {!loading && assignedCars.length === 0 && (
              <div className="sm:col-span-2 xl:col-span-3 bg-white border border-dashed border-slate-300 rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Car className="h-8 w-8 text-slate-300" />
                <p className="text-sm">Belum ada mobil yang ditambahkan.</p>
                <button onClick={() => setShowAddCar(true)} className="text-amber-600 font-medium text-sm hover:underline mt-2">Tambah Mobil Baru</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD CAR MODAL ── */}
      {showAddCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-sm">Tambah Mobil</h2>
              <button onClick={() => setShowAddCar(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddCar} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nama/Info Mobil</label>
                <input type="text" autoFocus required value={newCarName} onChange={e => setNewCarName(e.target.value)}
                  placeholder="Misal: Mobil Pak Budi"
                  className="w-full text-sm border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Kapasitas Penumpang</label>
                <input type="number" required min={1} max={15} value={newCarCap} onChange={e => setNewCarCap(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <button type="submit" disabled={savingCar}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-xl text-sm transition-colors flex justify-center items-center">
                {savingCar ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Mobil"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
