// We reuse the exact same Registration form,
// but we could theoretically inject a different "source" here.
// For simplicity in planning, the public form works perfectly as a layout.
// To differentiate logic, we'll wrap it or just copy a modified version here if needed.

// Here is a modified version specifically for Admin fast-entry
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Trash2, Loader2, Save } from "lucide-react";
import { cn } from "../../lib/utils";

type RegType = "INDIVIDUAL" | "FAMILY";
type AgeCategory = "ADULT" | "YOUTH" | "CHILD";
type ShirtSize =
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "ANAK_2"
  | "ANAK_4"
  | "ANAK_6"
  | "ANAK_8"
  | "ANAK_10"
  | "ANAK_13";

const ADULT_SIZES: { value: ShirtSize; label: string; cm: number }[] = [
  { value: "S", label: "S", cm: 88 },
  { value: "M", label: "M", cm: 96 },
  { value: "L", label: "L", cm: 102 },
  { value: "XL", label: "XL", cm: 108 },
  { value: "XXL", label: "XXL", cm: 114 },
  { value: "XXXL", label: "XXXL", cm: 118 },
];

const CHILD_SIZES: { value: ShirtSize; label: string; cm: number }[] = [
  { value: "ANAK_2", label: "2", cm: 56 },
  { value: "ANAK_4", label: "4", cm: 62 },
  { value: "ANAK_6", label: "6", cm: 72 },
  { value: "ANAK_8", label: "8", cm: 76 },
  { value: "ANAK_10", label: "10", cm: 78 },
  { value: "ANAK_13", label: "13", cm: 80 },
];

function ShirtSizePicker({
  value,
  onChange,
}: {
  value: ShirtSize;
  onChange: (s: ShirtSize) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Kaos 30 — Dewasa
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ADULT_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              className={`flex flex-col items-center px-2.5 py-1 rounded-lg border-2 text-xs font-medium transition-all ${
                value === s.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-400">{s.cm}cm</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Anak
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CHILD_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              className={`flex flex-col items-center px-2.5 py-1 rounded-lg border-2 text-xs font-medium transition-all ${
                value === s.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 text-slate-600 hover:border-purple-300"
              }`}
            >
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-400">{s.cm}cm</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminNewRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<RegType>("INDIVIDUAL");
  const [repName, setRepName] = useState("");
  const [repAge, setRepAge] = useState<AgeCategory>("ADULT");
  const [repShirtSize, setRepShirtSize] = useState<ShirtSize>("M");
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState<
    { name: string; age: AgeCategory; shirt_size: ShirtSize }[]
  >([]);

  // Admin specific: Catat pembayaran awal
  const [initialPayment, setInitialPayment] = useState("");

  const addMember = () =>
    setMembers([...members, { name: "", age: "ADULT", shirt_size: "M" }]);
  const removeMember = (index: number) =>
    setMembers(members.filter((_, i) => i !== index));
  const updateMember = (
    index: number,
    field: "name" | "age" | "shirt_size",
    value: string,
  ) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!repName || !phone)
        throw new Error("Nama dan No WhatsApp wajib diisi.");

      const totalFee = type === "FAMILY" ? 450000 : 200000;
      const paymentAmount = Number(initialPayment) || 0;

      let status = "PENDING";
      if (paymentAmount > 0) {
        status = paymentAmount >= totalFee ? "FULLY_PAID" : "PARTIAL_PAID";
      }

      // 1. Insert Reg
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .insert([
          {
            type,
            age_category: repAge,
            shirt_size: repShirtSize,
            representative_name: repName,
            phone_number: phone,
            total_fee: totalFee,
            total_paid: paymentAmount,
            status: status,
            registration_source: "ADMIN", // Mark as from TU
          },
        ])
        .select()
        .single();
      if (regError) throw regError;

      // 2. Insert Fam
      if (type === "FAMILY" && members.length > 0) {
        const familyData = members.map((m) => ({
          registration_id: regData.id,
          member_name: m.name,
          age_category: m.age,
          shirt_size: m.shirt_size,
        }));
        await supabase.from("family_members").insert(familyData);
      }

      // 3. Insert Payment History if > 0
      if (paymentAmount > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from("payments").insert([
          {
            registration_id: regData.id,
            amount: paymentAmount,
            recorded_by: user?.id,
          },
        ]);
      }

      alert("Data berhasil diinput oleh Admin!");
      navigate("/admin/registrations");
    } catch (err: any) {
      setError(err.message || "Gagal input data pendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Entri Pendaftaran Baru
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
            Tipe Paket &amp; Harga
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setType("INDIVIDUAL");
                setMembers([]);
              }}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center",
                type === "INDIVIDUAL"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200",
              )}
            >
              <span className="font-semibold text-slate-800">Individu</span>
              <span className="text-sm text-slate-500">Rp 200.000 / orang</span>
            </button>
            <button
              type="button"
              onClick={() => setType("FAMILY")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center",
                type === "FAMILY"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200",
              )}
            >
              <span className="font-semibold text-slate-800">
                Keluarga (KK)
              </span>
              <span className="text-sm text-slate-500">Rp 450.000 / KK</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Data Utama
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Lengkap / KK
              </label>
              <input
                type="text"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {type === "INDIVIDUAL" && (
                <div className="w-full sm:w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Umur
                  </label>
                  <select
                    value={repAge}
                    onChange={(e) => setRepAge(e.target.value as AgeCategory)}
                    className="w-full rounded-lg border-slate-300 border px-3 py-2 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ADULT">Dewasa</option>
                    <option value="YOUTH">P3MI</option>
                    <option value="CHILD">Anak</option>
                  </select>
                </div>
              )}
            </div>

            {/* Ukuran Baju Pendaftar Utama */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ukuran Baju
              </label>
              <ShirtSizePicker
                value={repShirtSize}
                onChange={setRepShirtSize}
              />
            </div>
          </div>
        </div>

        {type === "FAMILY" && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Anggota Keluarga
              </h2>
              <button
                type="button"
                onClick={addMember}
                className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200"
              >
                + Tambah
              </button>
            </div>
            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) =>
                      updateMember(index, "name", e.target.value)
                    }
                    className="flex-1 rounded-md border-slate-300 border px-3 py-2 text-sm outline-none"
                    placeholder="Nama..."
                  />
                  <select
                    value={member.age}
                    onChange={(e) =>
                      updateMember(index, "age", e.target.value as AgeCategory)
                    }
                    className="w-28 rounded-md border-slate-300 border px-3 py-2 text-sm bg-white outline-none"
                  >
                    <option value="ADULT">Dewasa</option>
                    <option value="YOUTH">Pemuda (P3MI)</option>
                    <option value="CHILD">Anak (SM)</option>
                  </select>
                  <div className="flex-1 pt-1">
                    <ShirtSizePicker
                      value={member.shirt_size as ShirtSize}
                      onChange={(s) => updateMember(index, "shirt_size", s)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-indigo-50 border border-indigo-100 p-4 sm:p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-semibold text-indigo-900 mb-4 uppercase tracking-wider">
            Pembayaran Titipan Awal (Opsional)
          </h2>
          <label className="block text-sm font-medium text-indigo-800 mb-1">
            Duit yang diterima Admin saat ini (Rp)
          </label>
          <input
            type="number"
            value={initialPayment}
            onChange={(e) => setInitialPayment(e.target.value)}
            placeholder="Kosongkan jika belum bayar"
            className="w-full rounded-lg border-indigo-200 border px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-indigo-600 mt-2">
            Biaya seharusnya:{" "}
            <strong>
              Rp {(type === "FAMILY" ? 450000 : 200000).toLocaleString("id-ID")}
            </strong>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" /> Simpan Entri Baru
            </>
          )}
        </button>
      </form>
    </div>
  );
}
