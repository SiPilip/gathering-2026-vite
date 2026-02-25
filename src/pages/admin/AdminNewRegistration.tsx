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

export default function AdminNewRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<RegType>("INDIVIDUAL");
  const [repName, setRepName] = useState("");
  const [repAge, setRepAge] = useState<AgeCategory>("ADULT");
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState<{ name: string; age: AgeCategory }[]>(
    [],
  );

  // Admin specific: Catat pembayaran awal
  const [initialPayment, setInitialPayment] = useState("");

  const addMember = () => setMembers([...members, { name: "", age: "ADULT" }]);
  const removeMember = (index: number) =>
    setMembers(members.filter((_, i) => i !== index));
  const updateMember = (
    index: number,
    field: "name" | "age",
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

      const totalFee = (members.length + 1) * 100000;
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
            Tipe Paket & Harga
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
              <span className="text-sm text-slate-500">Rp 100.000</span>
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
              <span className="text-sm text-slate-500">Rp 100.000/org</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
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
            <div className="flex gap-4">
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
                <div className="w-1/3">
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
          </div>
        </div>

        {type === "FAMILY" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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
                    className="w-32 rounded-md border-slate-300 border px-3 py-2 text-sm bg-white outline-none"
                  >
                    <option value="ADULT">Dewasa</option>
                    <option value="YOUTH">Pemuda (P3MI)</option>
                    <option value="CHILD">Anak (SM)</option>
                  </select>
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

        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
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
              Rp {((members.length + 1) * 100000).toLocaleString("id-ID")}
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
