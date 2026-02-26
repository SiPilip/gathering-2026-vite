import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Loader2, DollarSign, Save, Trash2 } from "lucide-react";

export default function AdminPayments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .select("*, family_members(*)")
        .eq("id", id)
        .single();

      if (regError) throw regError;
      setData(regData);

      const { data: payData, error: payError } = await supabase
        .from("payments")
        .select("*")
        .eq("registration_id", id)
        .order("payment_date", { ascending: false });

      if (payError) throw payError;
      setPayments(payData || []);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) return alert("Masukkan nominal yang valid");

    const newTotalPaid = Number(data.total_paid) + amount;
    const isLunas = newTotalPaid >= Number(data.total_fee);
    const newStatus = isLunas ? "FULLY_PAID" : "PARTIAL_PAID";

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insert payment
      const { error: payError } = await supabase.from("payments").insert([
        {
          registration_id: id,
          amount: amount,
          recorded_by: user?.id,
        },
      ]);

      if (payError) throw payError;

      // Update registration totals
      const { error: regError } = await supabase
        .from("registrations")
        .update({
          total_paid: newTotalPaid,
          status: newStatus,
        })
        .eq("id", id);

      if (regError) throw regError;

      setPaymentAmount("");
      fetchDetails(); // refresh data
      alert("Pembayaran berhasil dicatat!");
    } catch (error: any) {
      alert("Gagal mencatat pembayaran: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm("Yakin ingin membatalkan pendaftaran ini?")) return;
    try {
      setSubmitting(true);
      await supabase
        .from("registrations")
        .update({ status: "CANCELLED" })
        .eq("id", id);
      fetchDetails();
    } catch (error) {
      alert("Gagal membatalkan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (
    paymentId: string,
    paymentAmount: number,
  ) => {
    if (
      !confirm(
        `Hapus transaksi sebesar ${formatCur(paymentAmount)}? Jumlah ini akan dikurangi dari total pembayaran.`,
      )
    )
      return;

    try {
      setSubmitting(true);

      // 1. Delete the payment record
      const { error: delError } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);
      if (delError) throw delError;

      // 2. Recalculate total_paid from remaining payments
      const { data: remainingPayments, error: fetchError } = await supabase
        .from("payments")
        .select("amount")
        .eq("registration_id", id);
      if (fetchError) throw fetchError;

      const newTotalPaid = (remainingPayments || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      // 3. Determine new status
      let newStatus = "PENDING";
      if (newTotalPaid > 0) {
        newStatus =
          newTotalPaid >= Number(data.total_fee)
            ? "FULLY_PAID"
            : "PARTIAL_PAID";
      }

      // 4. Update registration
      const { error: updateError } = await supabase
        .from("registrations")
        .update({ total_paid: newTotalPaid, status: newStatus })
        .eq("id", id);
      if (updateError) throw updateError;

      fetchDetails(); // refresh
    } catch (err: any) {
      alert("Gagal menghapus transaksi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
      </div>
    );
  if (!data)
    return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  const remaining = Number(data.total_fee) - Number(data.total_paid);
  const formatCur = (num: number) => "Rp " + num.toLocaleString("id-ID");

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          Detail &amp; Pembayaran
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Detail Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 border-b pb-2 mb-4">
              Informasi Pendaftar
            </h2>
            <div className="space-y-2.5 text-sm">
              {[
                {
                  label: "ID Registrasi",
                  value: (
                    <span className="font-mono font-medium">
                      {data.id.split("-")[0]}
                    </span>
                  ),
                },
                { label: "Nama Lengkap", value: data.representative_name },
                { label: "No. WhatsApp", value: data.phone_number },
                {
                  label: "Sumber Input",
                  value: (
                    <span
                      className={`font-semibold ${data.registration_source === "ADMIN" ? "text-indigo-600" : "text-slate-700"}`}
                    >
                      {data.registration_source === "ADMIN"
                        ? "Entry Admin / TU"
                        : "Pendaftaran Mandiri"}
                    </span>
                  ),
                },
                {
                  label: "Status",
                  value: (
                    <span
                      className={`font-bold uppercase ${
                        data.status === "FULLY_PAID"
                          ? "text-green-600"
                          : data.status === "PARTIAL_PAID"
                            ? "text-yellow-600"
                            : data.status === "PENDING"
                              ? "text-slate-600"
                              : "text-red-600"
                      }`}
                    >
                      {data.status.replace("_", " ")}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className="font-medium text-slate-900 text-right min-w-0 break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.type === "FAMILY" && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-3">
                Anggota Keluarga
              </h2>
              {data.family_members?.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {data.family_members.map((m: any) => (
                    <li
                      key={m.id}
                      className="flex justify-between bg-slate-50 px-3 py-2 rounded border border-slate-100"
                    >
                      <span className="text-slate-800 font-medium">
                        {m.member_name}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {m.age_category}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  Tidak ada anggota keluarga terdaftar.
                </p>
              )}
            </div>
          )}

          {data.status !== "CANCELLED" && (
            <div className="pt-4 border-t">
              <button
                onClick={handleCancelRegistration}
                disabled={submitting}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Batalkan Pendaftaran Ini
              </button>
            </div>
          )}
        </div>

        {/* Pembayaran */}
        <div className="space-y-5">
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md">
            <h2 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">
              Rangkuman Tagihan
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Total Biaya</span>
                <span className="font-semibold text-white">
                  {formatCur(data.total_fee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sudah Dibayar</span>
                <span className="font-semibold text-green-400">
                  {formatCur(data.total_paid)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                <span className="font-medium text-slate-200">Kekurangan</span>
                <span className="text-2xl font-bold text-red-400">
                  {formatCur(remaining)}
                </span>
              </div>
            </div>
          </div>

          {data.status !== "CANCELLED" && remaining > 0 && (
            <form
              onSubmit={handleAddPayment}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
            >
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Catat Pembayaran Cicilan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Maks: ${remaining}`}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !paymentAmount}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Simpan Pembayaran
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* History List */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Histori Transaksi
              </h3>
              <span className="text-xs text-slate-400">
                {payments.length} transaksi
              </span>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                Belum ada pembayaran.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800">
                        {formatCur(p.amount)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.payment_date).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Right side: badge + delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                        Diterima
                      </span>
                      {data.status !== "CANCELLED" && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDeletePayment(p.id, p.amount)}
                          title="Hapus transaksi ini"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
