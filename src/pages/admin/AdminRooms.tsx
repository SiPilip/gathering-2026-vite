import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Search, BedDouble, Building, Plus, Trash2, X,
  RefreshCw, CheckCircle2, ChevronRight, XCircle, ArrowRightLeft, Printer, Copy
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
}

interface Person {
  id: string; // "reg_xxx" or "fam_xxx"
  name: string;
  type: "HEAD" | "INDIVIDUAL" | "MEMBER";
  reg_id: string; // The root registration ID (for grouping)
  room_id: string | null;
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
export default function AdminRooms() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // UI state
  const [search, setSearch] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);
  
  // Custom Add Room Form
  const [nrName, setNrName] = useState("");
  const [nrBuilding, setNrBuilding] = useState("Boni");
  const [nrFloor, setNrFloor] = useState("Atas");
  const [nrCap, setNrCap] = useState(8);
  const [savingRoom, setSavingRoom] = useState(false);

  // Assignment state
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]); // Array of Person IDs
  const [movingIds, setMovingIds] = useState<string[]>([]); // Loading state for moves

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch rooms
      const { data: vData } = await supabase.from("rooms").select("*").order("name", { ascending: true });
      setRooms(vData ?? []);

      // 2. Fetch registrations
      const { data: rData } = await supabase
        .from("registrations")
        .select(`id, representative_name, type, room_id, status, family_members(id, member_name, room_id)`)
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
          room_id: reg.room_id,
        });
        // Family members
        if (reg.type === "FAMILY" && reg.family_members) {
          reg.family_members.forEach((fm: any) => {
            arr.push({
              id: `fam_${fm.id}`,
              name: fm.member_name,
              type: "MEMBER",
              reg_id: reg.id,
              room_id: fm.room_id,
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

  // Add Room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrName.trim() || nrCap < 1) return;
    setSavingRoom(true);
    await supabase.from("rooms").insert({ 
      name: nrName.trim(), 
      building: nrBuilding, 
      floor: nrFloor, 
      capacity: nrCap 
    });
    setSavingRoom(false);
    setNrName(""); setShowAddRoom(false);
    fetchData();
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kamar ${name}? Penumpang di dalamnya akan kembali ke daftar tak berkamar.`)) return;
    await supabase.from("rooms").delete().eq("id", id);
    fetchData();
  };

  // Move Selected People to Room (or null for Unassigned)
  const assignPeople = async (targetRoomId: string | null) => {
    if (selectedPeople.length === 0) return;
    setMovingIds([...selectedPeople]);

    // Group updates by table
    const regsToUpdate = selectedPeople.filter(id => id.startsWith("reg_")).map(id => id.replace("reg_", ""));
    const famsToUpdate = selectedPeople.filter(id => id.startsWith("fam_")).map(id => id.replace("fam_", ""));

    const promises = [];

    if (regsToUpdate.length > 0) {
      promises.push(supabase.from("registrations").update({ room_id: targetRoomId }).in("id", regsToUpdate));
    }

    if (famsToUpdate.length > 0) {
      promises.push(supabase.from("family_members").update({ room_id: targetRoomId }).in("id", famsToUpdate));
    }

    await Promise.all(promises);

    // Update local state for immediate feedback
    setPeople(prev => prev.map(p => {
      if (selectedPeople.includes(p.id)) return { ...p, room_id: targetRoomId };
      return p;
    }));

    setMovingIds([]);
    setSelectedPeople([]); // deselect after move
  };

  const toggleSelection = (id: string) => {
    setSelectedPeople(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Memoized groupings
  const { unassignedItems, assignedRooms } = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    // Exact match logic from AdminTransport
    const matchedRegIds = new Set<string>();
    if (q) {
      people.forEach(p => {
        if (p.name.toLowerCase().includes(q)) matchedRegIds.add(p.reg_id);
      });
    }

    // Filter people locally based on search
    const filteredPeople = people.filter(p => !q || matchedRegIds.has(p.reg_id));

    // Array of people unassigned
    const unassignedItems = filteredPeople.filter(p => p.room_id === null);

    // Group assigned by room matching the room capacity logic
    const rmGroups: Record<string, typeof people> = {};
    filteredPeople.forEach(p => {
      if (p.room_id) {
        if (!rmGroups[p.room_id]) rmGroups[p.room_id] = [];
        rmGroups[p.room_id].push(p);
      }
    });

    const assignedRooms = rooms.map(rm => ({
      ...rm,
      passengers: rmGroups[rm.id] || [],
      totalPassengers: (rmGroups[rm.id] || []).length
    })).filter(rm => {
       if (!q) return true;
       return rm.passengers.length > 0 || rm.name.toLowerCase().includes(q);
    });

    return { unassignedItems, assignedRooms };
  }, [people, search, rooms]);

  // Group rooms by Building & Floor
  const groupedRooms = useMemo(() => {
    const groups: Record<string, typeof assignedRooms> = {};
    const sortOrder = ["Boni - Atas", "Boni - Bawah", "Yosef - Atas", "Yosef - Bawah"];
    assignedRooms.forEach(rm => {
      const g = `${rm.building} - ${rm.floor}`;
      if (!groups[g]) groups[g] = [];
      groups[g].push(rm);
    });

    // Flatten it preserving sortOrder
    const sortedGroups = [];
    for (const key of sortOrder) {
      if (groups[key]) sortedGroups.push({ title: key, rooms: groups[key] });
    }
    // Add any others
    for (const key of Object.keys(groups)) {
      if (!sortOrder.includes(key)) sortedGroups.push({ title: key, rooms: groups[key] });
    }

    return sortedGroups;
  }, [assignedRooms]);

  const copyToClipboard = () => {
    let text = "📋 REKAP AKOMODASI (KAMAR)\n\n";

    if (unassignedItems.length > 0) {
      text += `❗️ BELUM DAPAT KAMAR (${unassignedItems.length} orang):\n`;
      unassignedItems.forEach((p, i) => {
        const typeStr = p.type === "HEAD" ? "Kepala Kel." : (p.type === "MEMBER" ? "Anggota" : "Individu");
        text += `${i + 1}. ${p.name} (${typeStr})\n`;
      });
      text += "\n";
    }

    groupedRooms.forEach(group => {
      text += `🏢 GEDUNG ${group.title.toUpperCase()}\n`;
      group.rooms.forEach(rm => {
        text += `\n🛏️ KAMAR: ${rm.name} (${rm.totalPassengers}/${rm.capacity} isi):\n`;
        if (rm.passengers.length === 0) {
          text += "- Kosong -\n";
        } else {
          rm.passengers.forEach((p, i) => {
            const typeStr = p.type === "HEAD" ? "Kepala Kel." : (p.type === "MEMBER" ? "Anggota" : "Individu");
            text += `${i + 1}. ${p.name} (${typeStr})\n`;
          });
        }
      });
      text += "\n-----------------------\n\n";
    });

    navigator.clipboard.writeText(text.trim()).then(() => {
      alert("Data akomodasi kamar berhasil disalin ke clipboard!");
    }).catch(err => {
      console.error("Gagal menyalin: ", err);
      alert("Gagal menyalin teks.");
    });
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BedDouble className="h-6 w-6 text-indigo-500" /> Penataan Kamar
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Atur asrama dan teman sekamar jemaat untuk penginapan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Copy className="h-4 w-4" /> Salin Data
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Printer className="h-4 w-4" /> Cetak PDF
          </button>
          <button onClick={() => setShowAddRoom(true)}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Tambah Kamar
          </button>
          <button onClick={fetchData}
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ── SEARCH & INSTRUCTIONS ── */}
      <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm p-3 relative flex items-center gap-3 print:hidden">
        <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
        <input type="text" placeholder="Cari nama peserta / kamar..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 outline-none text-slate-700 bg-transparent" />
        
        <div className="hidden md:flex border-l border-slate-200 pl-4 items-center gap-2 text-slate-500 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
          Klik untuk memilih orang, lalu klik kamar untuk memindahkannya.
        </div>
      </div>

      <div className="relative min-h-[50vh]">
        
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-50/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* ── TWO-COLUMN DRAG/DROP LAYOUT ── */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: Unassigned (Bus equivalent) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px] print:hidden">
              <div 
                onClick={() => { if (selectedPeople.length > 0) assignPeople(null); }}
                className={`p-4 sticky top-0 z-10 flex items-center justify-between transition-colors ${
                  selectedPeople.length > 0 ? "bg-indigo-100 hover:bg-indigo-200 cursor-pointer border-b border-indigo-200" : "bg-slate-50 border-b border-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BedDouble className={`h-5 w-5 ${selectedPeople.length > 0 ? "text-indigo-700 animate-pulse" : "text-indigo-600"}`} />
                  <h2 className={`font-bold ${selectedPeople.length > 0 ? "text-indigo-800" : "text-slate-800"}`}>
                    {selectedPeople.length > 0 ? `Keluarkan ${selectedPeople.length} orang dari Kamar` : "Belum Dapat Kamar"}
                  </h2>
                </div>
                {selectedPeople.length === 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unassignedItems.length}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                {movingIds.length > 0 && selectedPeople.length > 0 && movingIds.some(id => unassignedItems.find(p=>p.id === id)) && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20" />
                )}
                {unassignedItems.map(p => (
                  <PersonItem 
                    key={p.id} p={p} 
                    active={selectedPeople.includes(p.id)}
                    onClick={() => toggleSelection(p.id)}
                    actionIcon={selectedPeople.includes(p.id) ? ArrowRightLeft : ChevronRight}
                  />
                ))}
                {unassignedItems.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400">Loading.../Kosong</div>
                )}
              </div>
            </div>

            {/* RIGHT: Rooms Grid */}
            <div className="lg:col-span-8 print:col-span-12 grid grid-cols-1 gap-8 print:gap-6 print:block print:w-full">
              <style>{`@media print { .print-avoid-break { break-inside: avoid; } }`}</style>
              
              {groupedRooms.length === 0 ? (
                 <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
                   <Building className="h-8 w-8 text-slate-300" />
                   <p className="text-sm">Belum ada kamar dibuat.</p>
                 </div>
              ) : groupedRooms.map(group => (
                <div key={group.title} className="space-y-3">
                  <div className="border-b-2 border-slate-200 pb-2">
                     <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Building className="h-5 w-5 text-indigo-500"/> Gedung {group.title}
                     </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max print:grid-cols-3">
                    {group.rooms.map(rm => {
                      const isFull = rm.totalPassengers >= rm.capacity;
                      return (
                        <div key={rm.id} className={`print-avoid-break rounded-2xl border bg-white shadow-sm flex flex-col transition-all overflow-hidden ${selectedPeople.length > 0 ? "ring-2 ring-indigo-500/50 hover:ring-indigo-500 ring-offset-2 cursor-pointer print:ring-0" : "border-slate-200"}`}
                            onClick={() => {
                                if (selectedPeople.length > 0) assignPeople(rm.id);
                            }}>
                          
                          {/* Header */}
                          <div className={`p-3 border-b flex items-start justify-between ${selectedPeople.length > 0 ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100 rounded-t-2xl"}`}>
                            <div className="flex items-center gap-2 text-slate-800">
                              <BedDouble className={`h-4 w-4 ${selectedPeople.length > 0 ? "text-indigo-600" : "text-amber-500"}`} />
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{rm.name}</p>
                                <p className="text-[10px] text-slate-500">{rm.totalPassengers} / {rm.capacity} isi</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isFull ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {isFull ? "Full" : `${rm.capacity - rm.totalPassengers} sisa`}
                              </span>
                              {selectedPeople.length === 0 && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(rm.id, rm.name); }} 
                                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600 transition-colors print:hidden">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Passengers */}
                          <div className="p-2 space-y-1.5 min-h-[120px]">
                            {rm.passengers.map(p => (
                              <div key={p.id} className="relative group">
                                <PersonItem p={p} onClick={() => toggleSelection(p.id)} active={selectedPeople.includes(p.id)} />
                                {/* Kick out button */}
                                {selectedPeople.length === 0 && (
                                  <button onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setSelectedPeople([p.id]); 
                                      setTimeout(() => assignPeople(null), 0); 
                                    }}
                                    title="Keluarkan dari Kamar"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-50 text-red-500 hover:text-white hover:bg-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-red-100 flex items-center gap-1 z-10 print:hidden">
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {rm.totalPassengers === 0 && (
                              <div className="h-full flex items-center justify-center text-xs text-slate-400 py-6 italic">Kosong</div>
                            )}
                            {selectedPeople.length > 0 && !isFull && (
                              <div className="border border-indigo-200 border-dashed rounded-lg bg-indigo-50/50 p-2 text-center text-xs text-indigo-400 font-medium py-3 print:hidden">
                                Masukkan {selectedPeople.length} ke sini
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ADD ROOM MODAL ── */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-500" />
                Tambah Kamar Custom
              </h2>
              <button 
                onClick={() => setShowAddRoom(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddRoom} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Kamar (Contoh: Boni Atas 17)</label>
                <input 
                  type="text" required autoFocus
                  value={nrName} onChange={e => setNrName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nama Kamar..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gedung</label>
                  <select value={nrBuilding} onChange={(e) => setNrBuilding(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500">
                    <option value="Boni">Boni</option>
                    <option value="Yosef">Yosef</option>
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Lantai</label>
                  <select value={nrFloor} onChange={(e) => setNrFloor(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500">
                    <option value="Atas">Atas</option>
                    <option value="Bawah">Bawah</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Kapasitas Orang</label>
                <input 
                  type="number" required min="1" max="20"
                  value={nrCap} onChange={e => setNrCap(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddRoom(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">
                  Batal
                </button>
                <button type="submit" disabled={savingRoom || !nrName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white flex items-center justify-center rounded-lg hover:bg-indigo-700 font-medium">
                  {savingRoom ? <Loader2 className="h-5 w-5 animate-spin"/> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
