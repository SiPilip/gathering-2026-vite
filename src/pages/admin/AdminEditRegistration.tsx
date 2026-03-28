import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Loader2, Save, Trash2, ArrowLeft, UserCog, Users, User,
} from "lucide-react";
import { cn } from "../../lib/utils";

type AgeCategory = "ADULT" | "YOUTH" | "CHILD";
type ShirtSize =
  | "S" | "M" | "L" | "XL" | "XXL" | "XXXL"
  | "ANAK_2" | "ANAK_4" | "ANAK_6" | "ANAK_8" | "ANAK_10" | "ANAK_13";

const ADULT_SIZES: { value: ShirtSize; label: string; cm: number }[] = [
  { value: "S",    label: "S",    cm: 88  },
  { value: "M",    label: "M",    cm: 96  },
  { value: "L",    label: "L",    cm: 102 },
  { value: "XL",   label: "XL",   cm: 108 },
  { value: "XXL",  label: "XXL",  cm: 114 },
  { value: "XXXL", label: "XXXL", cm: 118 },
];

const CHILD_SIZES: { value: ShirtSize; label: string; cm: number }[] = [
  { value: "ANAK_2",  label: "2",  cm: 56 },
  { value: "ANAK_4",  label: "4",  cm: 62 },
  { value: "ANAK_6",  label: "6",  cm: 72 },
  { value: "ANAK_8",  label: "8",  cm: 76 },
  { value: "ANAK_10", label: "10", cm: 78 },
  { value: "ANAK_13", label: "13", cm: 80 },
];

function ShirtSizePicker({ value, onChange }: { value: ShirtSize; onChange: (s: ShirtSize) => void }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kaos 30 — Dewasa</p>
        <div className="flex flex-wrap gap-1.5">
          {ADULT_SIZES.map((s) => (
            <button key={s.value} type="button" onClick={() => onChange(s.value)}
              className={cn("flex flex-col items-center px-2.5 py-1 rounded-lg border-2 text-xs font-medium transition-all",
                value === s.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-blue-300"
              )}>
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-400">{s.cm}cm</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Anak</p>
        <div className="flex flex-wrap gap-1.5">
          {CHILD_SIZES.map((s) => (
            <button key={s.value} type="button" onClick={() => onChange(s.value)}
              className={cn("flex flex-col items-center px-2.5 py-1 rounded-lg border-2 text-xs font-medium transition-all",
                value === s.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 text-slate-600 hover:border-purple-300"
              )}>
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-400">{s.cm}cm</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminEditRegistration() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Registration fields
  const [regType, setRegType] = useState<"INDIVIDUAL" | "FAMILY">("INDIVIDUAL");
  const [repName, setRepName] = useState("");
  const [phone, setPhone] = useState("");
  const [repAge, setRepAge] = useState<AgeCategory>("ADULT");
  const [repShirt, setRepShirt] = useState<ShirtSize>("M");

  // Family members
  const [members, setMembers] = useState<
    { id?: string; member_name: string; age_category: AgeCategory; shirt_size: ShirtSize; isNew?: boolean }[]
  >([]);
  const [deletedMemberIds, setDeletedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (regId: string) => {
    try {
      setLoading(true);
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", regId)
        .single();
      if (regErr) throw regErr;

      setRegType(reg.type);
      setRepName(reg.representative_name);
      setPhone(reg.phone_number);
      setRepAge(reg.age_category as AgeCategory);
      setRepShirt((reg.shirt_size as ShirtSize) || "M");

      if (reg.type === "FAMILY") {
        const { data: fam } = await supabase
          .from("family_members")
          .select("id, member_name, age_category, shirt_size")
          .eq("registration_id", regId);
        setMembers(
          (fam || []).map((m) => ({
            id: m.id,
            member_name: m.member_name,
            age_category: (m.age_category as AgeCategory) || "ADULT",
            shirt_size: (m.shirt_size as ShirtSize) || "M",
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setMembers([...members, { member_name: "", age_category: "ADULT", shirt_size: "M", isNew: true }]);
  };

  const removeMember = (index: number) => {
    const m = members[index];
    if (m.id) setDeletedMemberIds([...deletedMemberIds, m.id]);
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof typeof members[0], value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // 1. Update registration
      const { error: upErr } = await supabase
        .from("registrations")
        .update({
          representative_name: repName,
          phone_number: phone,
          age_category: repAge,
          shirt_size: repShirt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (upErr) throw upErr;

      // 2. Delete removed members
      if (deletedMemberIds.length > 0) {
        await supabase.from("family_members").delete().in("id", deletedMemberIds);
      }

      // 3. Upsert existing + new members
      for (const m of members) {
        if (m.isNew || !m.id) {
          await supabase.from("family_members").insert({
            registration_id: id,
            member_name: m.member_name,
            age_category: m.age_category,
            shirt_size: m.shirt_size,
          });
        } else {
          await supabase.from("family_members").update({
            member_name: m.member_name,
            age_category: m.age_category,
            shirt_size: m.shirt_size,
          }).eq("id", m.id);
        }
      }

      setSuccess("Data berhasil disimpan!");
      setDeletedMemberIds([]);
      // Refresh member ids after save
      fetchData(id!);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/registrations" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="h-6 w-6 text-blue-600" /> Edit Profil Pendaftar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">ID: <span className="font-mono">{id}</span></p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tipe (read-only display) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
            {regType === "FAMILY" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {regType === "FAMILY" ? "Pendaftaran Keluarga" : "Pendaftaran Individu"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {regType === "FAMILY" ? "Nama Kepala Keluarga / Perwakilan" : "Nama Lengkap"}
              </label>
              <input
                type="text" required value={repName}
                onChange={(e) => setRepName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="tel" required value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Umur</label>
                <select value={repAge} onChange={(e) => setRepAge(e.target.value as AgeCategory)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                  <option value="ADULT">Dewasa</option>
                  <option value="YOUTH">Pemuda (P3MI)</option>
                  <option value="CHILD">Anak (SM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ukuran Baju</label>
              <ShirtSizePicker value={repShirt} onChange={setRepShirt} />
            </div>
          </div>
        </div>

        {/* Family members */}
        {regType === "FAMILY" && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Anggota Keluarga</h2>
              <button type="button" onClick={addMember}
                className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                + Tambah Anggota
              </button>
            </div>

            {members.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                Belum ada anggota keluarga.
              </p>
            ) : (
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500">Anggota {index + 1}</span>
                      <button type="button" onClick={() => removeMember(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nama</label>
                        <input type="text" required value={member.member_name}
                          onChange={(e) => updateMember(index, "member_name", e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="Nama anggota..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Kategori Umur</label>
                        <select value={member.age_category}
                          onChange={(e) => updateMember(index, "age_category", e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                          <option value="ADULT">Dewasa</option>
                          <option value="YOUTH">Pemuda (P3MI)</option>
                          <option value="CHILD">Anak (SM)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">Ukuran Baju</label>
                      <ShirtSizePicker
                        value={member.shirt_size as ShirtSize}
                        onChange={(s) => updateMember(index, "shirt_size", s)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/admin/registrations"
            className="flex-1 text-center py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
            Batal
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70 text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
