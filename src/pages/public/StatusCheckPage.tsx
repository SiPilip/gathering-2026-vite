import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { redis } from "../../lib/redis";
import {
  Search,
  Loader2,
  FileText,
  DollarSign,
  Ban,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function StatusCheckPage() {
  const { id: urlId } = useParams();

  const [searchId, setSearchId] = useState(urlId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (urlId) {
      handleSearch(urlId);
    }
  }, [urlId]);

  const handleSearch = async (idToSearch: string) => {
    if (!idToSearch) return;
    setLoading(true);
    setError("");
    setData(null);
    setPayments([]);

    try {
      // Redis Cache Check
      const cacheKey = `status:${idToSearch}`;
      if (redis) {
        try {
          const cachedData = await redis.get<any>(cacheKey);
          if (cachedData && cachedData.regData) {
            setData(cachedData.regData);
            setPayments(cachedData.payData || []);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Redis error:", e);
        }
      }

      // 1. Get Registration Data
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .select(
          `
          *,
          family_members (*)
        `,
        )
        .eq("id", idToSearch)
        .single();

      if (regError)
        throw new Error("Data pendaftaran tidak ditemukan. Pastikan ID benar.");
      setData(regData);

      // 2. Get Payment History
      const { data: payData, error: payError } = await supabase
        .from("payments")
        .select("*")
        .eq("registration_id", idToSearch)
        .order("payment_date", { ascending: false });

      if (!payError && payData) {
        setPayments(payData);
      }

      // Save to Redis Cache for 5 minutes
      if (redis) {
        try {
          await redis.setex(cacheKey, 300, { regData, payData });
        } catch (e) {
          console.warn("Redis set error:", e);
        }
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchId);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Lunas
          </span>
        );
      case "PARTIAL_PAID":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> Nyicil
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <Ban className="w-4 h-4" /> Batal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4" /> Belum Bayar
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Cek Status Pendaftaran
        </h1>
        <p className="text-slate-600">
          Masukkan ID Pendaftaran Anda utuk melihat tagihan, histori pembayaran,
          dan status lunas.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={onSubmit}
        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
            placeholder="Masukkan ID Pendaftaran..."
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchId}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Result Card */}
      {data && (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {data.representative_name}
                </h2>
                <p className="text-slate-500 text-sm">
                  {data.phone_number} • Tipe:{" "}
                  {data.type === "FAMILY" ? "Keluarga (KK)" : "Individu"}
                  {data.type === "INDIVIDUAL" &&
                    ` • (${
                      data.age_category === "ADULT"
                        ? "Dewasa"
                        : data.age_category === "YOUTH"
                          ? "Pemuda"
                          : "Anak"
                    })`}
                </p>
              </div>
              <div>{renderStatusBadge(data.status)}</div>
            </div>

            {/* Members (If Family) */}
            {data.type === "FAMILY" &&
              data.family_members &&
              data.family_members.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Daftar
                    Anggota Keluarga
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {data.family_members.map((m: any) => (
                      <div
                        key={m.id}
                        className="bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-sm flex justify-between"
                      >
                        <span className="font-medium text-slate-700">
                          {m.member_name}
                        </span>
                        <span className="text-slate-500">
                          {m.age_category === "ADULT"
                            ? "Dewasa"
                            : m.age_category === "YOUTH"
                              ? "Pemuda (P3MI)"
                              : "Anak (SM)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 grid sm:grid-cols-2 gap-8">
            {/* Tagihan Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" /> Rangkuman Biaya
              </h3>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-slate-600">Total Tagihan</span>
                  <span className="font-semibold text-slate-900">
                    Rp {Number(data.total_fee).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-green-50/50">
                  <span className="text-slate-600">Sudah Dibayar</span>
                  <span className="font-semibold text-green-700">
                    Rp {Number(data.total_paid).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center bg-blue-50/50 rounded-b-xl">
                  <span className="font-medium text-blue-900">
                    Sisa / Kurang
                  </span>
                  <span className="font-bold text-blue-700 text-lg">
                    Rp{" "}
                    {(
                      Number(data.total_fee) - Number(data.total_paid)
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                Histori Cicilan
              </h3>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                {payments.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    Belum ada data pembayaran/cicilan tercatat.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 px-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            Rp {Number(p.amount).toLocaleString("id-ID")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(p.payment_date).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                          Sukses
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
