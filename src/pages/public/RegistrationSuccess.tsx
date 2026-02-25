import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";

export default function RegistrationSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as { totalFee: number } | null;

  const totalFee = state?.totalFee || 0;

  const copyId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      alert("ID Pendaftaran berhasil disalin!");
    }
  };

  return (
    <div className="max-w-xl mx-auto text-center space-y-8 py-10">
      <div className="bg-green-50 text-green-600 p-6 rounded-full inline-flex items-center justify-center">
        <CheckCircle2 className="h-16 w-16" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Pendaftaran Berhasil!
        </h1>
        <p className="text-slate-600">
          Terima kasih telah mendaftar. Data Anda telah kami simpan.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              ID Pendaftaran Anda
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 px-3 py-2 rounded-lg text-sm font-mono text-slate-800 break-all select-all border border-slate-200">
                {id}
              </code>
              <button
                onClick={copyId}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent"
                title="Salin ID"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Simpan ID ini baik-baik untuk mengecek status pendaftaran &
              pembayaran Anda nanti.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">
              Total yang harus dibayar
            </p>
            <p className="text-3xl font-bold text-slate-900">
              Rp {totalFee.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left space-y-4">
        <h2 className="font-semibold text-slate-900">Instruksi Pembayaran</h2>
        <p className="text-sm text-slate-700">
          Untuk pelunasan atau cicilan, silakan transfer ke rekening berikut:
        </p>
        <div className="bg-white p-4 rounded-xl border border-blue-100 font-mono text-sm shadow-sm">
          BCA 1234567890
          <br />
          a.n. Panitia Gathering GMI Wesley
        </div>
        <p className="text-sm text-slate-700">
          Setelah transfer, harap melapor / konfirmasi ke Tata Usaha atau
          Panitia yang bertugas pada hari Minggu. Panitia (Admin) akan mencatat
          pembayaran Anda di sistem secara manual.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link
          to={`/status/${id}`}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Cek Status Pembayaran <ExternalLink className="h-4 w-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
