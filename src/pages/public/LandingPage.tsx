import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CAROUSEL_IMAGES = [
  "/img/1.jpg",
  "/img/2.jpg",
  "/img/3.jpg",
  "/img/4.jpg",
];

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000); // Auto slide every 5s
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () =>
    setCurrentImageIndex((p) => (p + 1) % CAROUSEL_IMAGES.length);
  const prevSlide = () =>
    setCurrentImageIndex(
      (p) => (p - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length,
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 pb-12">
      <div className="space-y-6 mt-8">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-full mb-4 shadow-sm border border-slate-100 min-w-[5rem] min-h-[5rem]">
          <img
            src="/logo-gmi.png"
            alt="Logo GMI Wesley"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Pendaftaran Gathering{" "}
          <span className="text-blue-600">GMI Wesley</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4">
          Mari bergabung bersama mempererat kebersamaan dan pertumbuhan rohani
          dalam retreat gereja kita di tahun 2026.
        </p>
      </div>

      {/* Image Carousel Spotlight */}
      <div className="relative w-full max-w-5xl h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
        {CAROUSEL_IMAGES.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Retreat Location ${i + 1}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end justify-center pb-8">
          <span className="text-white font-medium text-lg tracking-wide drop-shadow-md">
            Pusat Retret & Suasana Alam yang Mendukung
          </span>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Event Details */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl text-left px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex gap-5 items-start transition-transform hover:-translate-y-1">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Waktu Pelaksanaan
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Sabtu & Minggu
              <br />
              <span className="text-blue-600 font-bold text-lg">
                4 - 5 April 2026
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex gap-5 items-start transition-transform hover:-translate-y-1">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <MapPin className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Lokasi</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Rumah Retret Podomoro
              <br />
              <span className="text-sm font-normal">
                Jl. Raya Diponegoro, Sukomoro, Kec. Talang Klp., Kab. Banyuasin,
                Sumatera Selatan 30961
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Map Embed */}
      <div className="w-full max-w-5xl px-4">
        <div className="bg-white p-2 rounded-3xl shadow-md border border-slate-200 overflow-hidden relative pb-[50%] md:pb-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63753.962021111845!2d104.56727027893069!3d-2.9243543422625167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e3b0b597cc04529%3A0xf7cd4ba89782e81d!2sRumah%20Retret%20Podomoro!5e0!3m2!1sen!2sid!4v1772026810520!5m2!1sen!2sid"
            className="absolute top-0 left-0 w-full h-full rounded-2xl"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* Pricing Information (Updated to reflect new requirements) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 max-w-4xl w-full text-center space-y-8 text-white shadow-xl mx-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Investasi Pendaftaran</h2>
          <p className="text-slate-300">
            Biaya untuk mengikuti acara retreat ini berlaku flat untuk semua
            kategori.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm max-w-md mx-auto">
          <div className="text-sm font-semibold tracking-widest text-blue-300 uppercase mb-2">
            Biaya Per Orang
          </div>
          <div className="text-5xl font-extrabold tracking-tight">
            Rp 100.000
          </div>
          <p className="text-slate-300 text-sm mt-4">
            Berlaku untuk pendaftar Individu dan juga per Anggota Keluarga.
            Total tagihan akan dihitung otomatis saat pengisian form.
          </p>
        </div>
      </div>

      <div className="pt-8 pb-16">
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-blue-500 transition-all shadow-xl hover:shadow-blue-500/25 hover:-translate-y-1"
        >
          Daftar Sekarang <ArrowRight className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
