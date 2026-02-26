import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Users,
  User,
  UserPlus,
  Trash2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";

type RegType = "INDIVIDUAL" | "FAMILY";
type AgeCategory = "ADULT" | "YOUTH" | "CHILD";

export default function RegistrationPage() {
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

  const addMember = () => {
    setMembers([...members, { name: "", age: "ADULT" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

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
      if (type === "FAMILY") {
        if (members.some((m) => !m.name))
          throw new Error("Semua nama anggota keluarga wajib diisi.");
      }

      const totalFee = (members.length + 1) * 100000;

      // 1. Insert Registration
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .insert([
          {
            type,
            age_category: repAge,
            representative_name: repName,
            phone_number: phone,
            total_fee: totalFee,
            registration_source: "SELF",
          },
        ])
        .select()
        .single();

      if (regError) throw regError;

      // 2. Insert Family Members
      if (type === "FAMILY" && members.length > 0) {
        const familyData = members.map((m) => ({
          registration_id: regData.id,
          member_name: m.name,
          age_category: m.age,
        }));

        const { error: famError } = await supabase
          .from("family_members")
          .insert(familyData);

        if (famError) throw famError;
      }

      // 3. Success -> Navigate
      navigate(`/success/${regData.id}`, { state: { totalFee } });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-0">
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Form Pendaftaran
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Isi data di bawah ini untuk mendaftar Gathering GMI Wesley.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* 1. Tipe Pendaftaran */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
              1
            </span>
            Jenis Pendaftaran
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setType("INDIVIDUAL");
                setMembers([]);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                type === "INDIVIDUAL"
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-600 ring-offset-2 ring-offset-white cursor-default"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 cursor-pointer",
              )}
            >
              <User
                className={cn(
                  "h-8 w-8",
                  type === "INDIVIDUAL" ? "text-blue-600" : "",
                )}
              />
              <div className="text-center">
                <div className="font-semibold text-slate-900">Individu</div>
                <div className="text-sm mt-1">Rp 100.000 / Org</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType("FAMILY")}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all",
                type === "FAMILY"
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-600 ring-offset-2 ring-offset-white cursor-default"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 cursor-pointer",
              )}
            >
              <Users
                className={cn(
                  "h-8 w-8",
                  type === "FAMILY" ? "text-blue-600" : "",
                )}
              />
              <div className="text-center">
                <div className="font-semibold text-slate-900">
                  Keluarga (1 KK)
                </div>
                <div className="text-sm mt-1">Rp 100.000 / Org</div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Data Pendaftar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
              2
            </span>
            Identitas Utama
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === "FAMILY"
                  ? "Nama Kepala Keluarga / Perwakilan"
                  : "Nama Lengkap"}
              </label>
              <input
                type="text"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={
                  type === "FAMILY" ? "Cth: Budi Santoso" : "Cth: Andi"
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No. WhatsApp{" "}
                  <span className="text-slate-500 font-normal">(Aktif)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Cth: 081234567890"
                />
              </div>

              {type === "INDIVIDUAL" && (
                <div className="w-full sm:w-1/3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kategori Umur
                  </label>
                  <select
                    value={repAge}
                    onChange={(e) => setRepAge(e.target.value as AgeCategory)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white transition-all"
                  >
                    <option value="ADULT">Dewasa</option>
                    <option value="YOUTH">Pemuda (P3MI)</option>
                    <option value="CHILD">Anak (SM)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Anggota Keluarga */}
        {type === "FAMILY" && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                  3
                </span>
                Anggota Keluarga{" "}
                <span className="text-sm font-normal text-slate-500">
                  (1 KK)
                </span>
              </h2>
              <button
                type="button"
                onClick={addMember}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <UserPlus className="h-4 w-4" /> Tambah Anggota
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-slate-500 text-sm">
                  Belum ada anggota keluarga ditambahkan.
                  <br />
                  Klik <strong>Tambah Anggota</strong> untuk mendaftarkan
                  Istri/Suami/Anak.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200"
                  >
                    <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={member.name}
                          onChange={(e) =>
                            updateMember(index, "name", e.target.value)
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                          placeholder={`Nama Anggota ${index + 1}`}
                        />
                      </div>
                      <div className="w-full sm:w-32 shrink-0">
                        <select
                          value={member.age}
                          onChange={(e) =>
                            updateMember(
                              index,
                              "age",
                              e.target.value as AgeCategory,
                            )
                          }
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                        >
                          <option value="ADULT">Dewasa</option>
                          <option value="YOUTH">Pemuda (P3MI)</option>
                          <option value="CHILD">Anak (SM)</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors self-start sm:self-center"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rangkuman */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div>
            <div className="text-slate-400 text-sm mb-1">
              Total Biaya Pendaftaran
            </div>
            <div className="text-3xl font-bold">
              Rp{" "}
              {(
                (members.length + (type === "FAMILY" ? 1 : 1)) *
                100000
              ).toLocaleString("id-ID")}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Kirim Form"
            )}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 flex items-center justify-center gap-1.5 mt-4">
          <ShieldCheck className="h-4 w-4 text-green-600" /> Data Anda aman &
          tersimpan secara privat.
        </p>
      </form>
    </div>
  );
}
