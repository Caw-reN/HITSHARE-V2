import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import {
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Tv,
  Briefcase,
  Palette,
  GraduationCap,
  Headphones,
  MessageCircle,
  Layers,
  Flame,
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage() {
  const [settings, setSettings] = useState({});
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    // Fetch public settings
    api.get('/settings/public').then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const faqs = [
    {
      q: 'Bagaimana cara kerja HitShare?',
      a: 'HitShare menggunakan ekstensi browser (Chrome, Edge, Brave) yang secara otomatis menyinkronkan sesi login (cookies) akun premium ke browser kamu. Kamu cukup klik tombol "Buka Website", dan kamu langsung login tanpa perlu memasukkan username atau password manual.',
    },
    {
      q: 'Apakah password website akan terlihat oleh saya?',
      a: 'Tidak. Demi keamanan bersama, password tidak dibagikan. Sistem hanya mentransfer cookie sesi terenkripsi sehingga akun tetap aman dari penggantian password atau pencurian akun.',
    },
    {
      q: 'Apakah bisa digunakan di lebih dari 1 perangkat?',
      a: 'Untuk menjaga stabilitas akun bersama, satu langganan HitShare dikunci ke 1 perangkat (Device ID). Jika kamu berganti laptop/PC, kamu dapat meminta reset perangkat melalui admin WhatsApp.',
    },
    {
      q: 'Bagaimana jika salah satu akun logout atau limit?',
      a: 'Setiap website populer di HitShare memiliki beberapa opsi akun cadangan (Akun 1, Akun 2, dst). Jika satu akun penuh, kamu tinggal memilih akun cadangan lainnya. Admin juga memantau dan memperbarui cookie secara berkala.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami menerima pembayaran otomatis QRIS via Paymenku yang mendukung semua e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja) serta Mobile Banking (BCA, Mandiri, BRI, BNI, CIMB, dll). Akun langsung aktif otomatis setelah pembayaran berhasil.',
    },
  ];

  const featuredApps = [
    { name: 'Netflix Premium', category: 'Streaming', desc: '4K Ultra HD', icon: Tv },
    { name: 'Canva Pro', category: 'Desain', desc: 'Aset Lengkap & AI', icon: Palette },
    { name: 'ChatGPT Plus', category: 'AI Tools', desc: 'GPT-4o & Canvas', icon: Sparkles },
    { name: 'Prime Video', category: 'Streaming', desc: 'Film & Serial TV', icon: Tv },
    { name: 'Grammarly Premium', category: 'Produktivitas', desc: 'Cek Grammar AI', icon: Briefcase },
    { name: 'Spotify Premium', category: 'Musik', desc: 'Bebas Iklan & Offline', icon: Headphones },
    { name: 'Midjourney', category: 'AI Tools', desc: 'AI Image Generator', icon: Sparkles },
    { name: 'Coursera Plus', category: 'Edukasi', desc: 'Sertifikasi Global', icon: GraduationCap },
  ];

  const waNumber = settings.whatsapp_number || '6281234567890';
  const waMsg = encodeURIComponent(settings.contact_message || 'Halo Admin HitShare, saya mau tanya-tanya.');

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-neutral-800 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 px-4 overflow-hidden">
        {/* Ambient Glow Atmosphere */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] bg-gradient-to-tr from-amber-200/40 via-emerald-100/35 to-amber-100/40 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-8 left-1/4 w-60 h-60 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-60 h-60 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle Decorative Geometric Elements (Spring & Small Shapes - Bergerak Terbang Luas, Tanpa Efek Pulse) */}
        {/* 1. Spring Coil Shape (Kiri Atas - Bergerak Terbang Mengalir) */}
        <div className="absolute left-4 sm:left-10 lg:left-24 top-10 sm:top-14 pointer-events-none select-none z-10 opacity-75 animate-fly-1">
          <svg className="w-8 h-10 sm:w-10 sm:h-12 text-amber-500/85" viewBox="0 0 40 50" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
            <path d="M12 8 C28 5 36 13 24 18 C8 23 8 28 24 32 C36 36 28 44 14 46" />
            <circle cx="12" cy="8" r="2.5" fill="currentColor" />
            <circle cx="14" cy="46" r="2.5" fill="currentColor" />
          </svg>
        </div>

        {/* 2. Geometric Isometric Cube (Kanan Atas - Bergerak Melayang Melintasi Ruang) */}
        <div className="absolute right-5 sm:right-12 lg:right-28 top-12 sm:top-16 pointer-events-none select-none z-10 opacity-70 animate-fly-2">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill="currentColor" fillOpacity="0.08" />
            <path d="M16 3 L16 29" strokeOpacity="0.35" />
            <path d="M4 10 L28 22" strokeOpacity="0.25" />
            <path d="M28 10 L4 22" strokeOpacity="0.25" />
          </svg>
        </div>

        {/* 3. Wavy Ribbon Squiggle (Kiri Tengah - Melayang Berkelana) */}
        <div className="hidden sm:block absolute left-6 lg:left-20 top-72 lg:top-80 pointer-events-none select-none z-10 opacity-65 animate-fly-3">
          <svg className="w-9 h-5 sm:w-11 sm:h-6 text-emerald-600/75" viewBox="0 0 44 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M2 14 C10 2 16 2 22 10 C28 18 34 18 42 6" />
          </svg>
        </div>

        {/* 4. Dotted Torus Ring (Kanan Tengah - Berputar Melayang Bebas) */}
        <div className="hidden sm:block absolute right-6 lg:right-24 top-80 lg:top-96 pointer-events-none select-none z-10 opacity-70 animate-fly-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500/80" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="3" strokeDasharray="4 2" />
            <circle cx="16" cy="16" r="4.5" fill="currentColor" fillOpacity="0.35" />
          </svg>
        </div>

        {/* 5. Mini Geometric 4-Point Starlet (Atas Tengah - Melayang Bebas) */}
        <div className="hidden md:block absolute left-1/3 top-8 pointer-events-none select-none z-10 opacity-55 animate-fly-5">
          <svg className="w-5 h-5 text-amber-400/90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2 Z" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto text-center space-y-7 relative z-10">

          {/* Headline (Strictly 2 Lines + Font Kena Ombak) */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl xl:text-[5.25rem] font-black tracking-[-0.035em] text-neutral-900 leading-[1.1] sm:leading-[1.06]">
            {/* Baris 1 */}
            {/* Baris 1: Satu Akun, Satu Ekstensi (Animasi Ombak Mengalir Seirama Per-Huruf dari Kiri ke Kanan) */}
            <span className="block animate-hero-line-1">
              {/* Satu */}
              <span className="wave-word whitespace-nowrap">
                <span className="wave-char" style={{ animationDelay: '-2.40s' }}>S</span>
                <span className="wave-char" style={{ animationDelay: '-2.32s' }}>a</span>
                <span className="wave-char" style={{ animationDelay: '-2.24s' }}>t</span>
                <span className="wave-char" style={{ animationDelay: '-2.16s' }}>u</span>
                <span className="wave-underline" style={{ animationDelay: '0.35s, -2.28s' }} aria-hidden="true" />
              </span>{' '}
              {/* Akun, */}
              <span className="inline-block whitespace-nowrap">
                <span className="wave-char" style={{ animationDelay: '-2.04s' }}>A</span>
                <span className="wave-char" style={{ animationDelay: '-1.96s' }}>k</span>
                <span className="wave-char" style={{ animationDelay: '-1.88s' }}>u</span>
                <span className="wave-char" style={{ animationDelay: '-1.80s' }}>n</span>
                <span className="wave-char" style={{ animationDelay: '-1.72s' }}>,</span>
              </span>{' '}
              {/* Satu */}
              <span className="wave-word whitespace-nowrap">
                <span className="wave-char" style={{ animationDelay: '-1.60s' }}>S</span>
                <span className="wave-char" style={{ animationDelay: '-1.52s' }}>a</span>
                <span className="wave-char" style={{ animationDelay: '-1.44s' }}>t</span>
                <span className="wave-char" style={{ animationDelay: '-1.36s' }}>u</span>
                <span className="wave-underline" style={{ animationDelay: '0.55s, -1.48s' }} aria-hidden="true" />
              </span>{' '}
              {/* Ekstensi, */}
              <span className="inline-block whitespace-nowrap">
                <span className="wave-char" style={{ animationDelay: '-1.24s' }}>E</span>
                <span className="wave-char" style={{ animationDelay: '-1.16s' }}>k</span>
                <span className="wave-char" style={{ animationDelay: '-1.08s' }}>s</span>
                <span className="wave-char" style={{ animationDelay: '-1.00s' }}>t</span>
                <span className="wave-char" style={{ animationDelay: '-0.92s' }}>e</span>
                <span className="wave-char" style={{ animationDelay: '-0.84s' }}>n</span>
                <span className="wave-char" style={{ animationDelay: '-0.76s' }}>s</span>
                <span className="wave-char" style={{ animationDelay: '-0.68s' }}>i</span>
                <span className="wave-char" style={{ animationDelay: '-0.60s' }}>,</span>
              </span>
            </span>

            {/* Baris 2 */}
            <span className="block whitespace-nowrap text-neutral-900 mt-1 sm:mt-2 animate-hero-line-2">
              Puluhan Layanan{' '}
              <span className="relative inline-block whitespace-nowrap">
                <span className="bg-gradient-to-br from-amber-600 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
                  Premium
                </span>
                {/* Bintang-bintang kecil warna kuning emas (Melayang Halus, Tanpa Pulse) */}
                <span className="absolute -top-3 -right-6 sm:-top-4 sm:-right-8 pointer-events-none select-none text-amber-400 animate-drift-star">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.7)]" />
                </span>
                <span className="absolute -top-2 -left-3.5 sm:-top-2.5 sm:-left-4 pointer-events-none select-none text-yellow-400 text-xs sm:text-sm font-bold animate-drift-star-mini">
                  ✦
                </span>
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 leading-relaxed font-normal animate-hero-sub">
            Bebas ribet berbagi password. Akses puluhan tools AI, desain grafis, streaming, dan produktivitas secara instan dari browser Anda dengan 1-klik otomatis. Hemat hingga 90% biaya setiap bulan.
          </p>


          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 animate-hero-cta">
            <a
              href="#harga"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group cursor-pointer"
            >
              <span>Pilih Paket Langganan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-neutral-800 bg-white hover:bg-neutral-50 border border-[#DDDDCF] rounded-2xl transition-all shadow-sm hover:border-neutral-400 cursor-pointer"
            >
              <span>Masuk Dashboard</span>
            </Link>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium">
            Aktivasi instan via QRIS 24/7 otomatis • Mulai dari Rp 29.000
          </p>

          {/* ── Product Centerpiece Mockup (The HitShare Extension Experience) ── */}
          <div className="pt-8 sm:pt-12 max-w-4xl mx-auto relative">
            {/* Floating Chip Kiri (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E0E0D6] shadow-lg absolute -left-8 top-1/3 z-20 animate-in fade-in slide-in-from-left duration-500">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-neutral-900">1-Klik Akses Otomatis</div>
                <div className="text-[10px] text-neutral-500">Tanpa ketik password manual</div>
              </div>
            </div>

            {/* Floating Chip Kanan (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E0E0D6] shadow-lg absolute -right-8 top-1/2 z-20 animate-in fade-in slide-in-from-right duration-500">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                💎
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-neutral-900">Hemat Hingga 90%</div>
                <div className="text-[10px] text-neutral-500">Dibanding beli akun mandiri</div>
              </div>
            </div>

            {/* Browser / Extension Window Frame */}
            <div className="bg-white rounded-3xl border border-[#E2E2D8] shadow-2xl overflow-hidden text-left relative z-10">
              {/* Window Header */}
              <div className="px-4 py-3 bg-[#F4F4EE] border-b border-[#E5E5DB] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 inline-block"></span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500 ml-2 hidden sm:inline">
                    hitshare://extension/v2.0.5
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Ekstensi Aktif • Sesi Terverifikasi</span>
                </div>
              </div>

              {/* Extension UI Inside Mockup */}
              <div className="p-5 sm:p-7 bg-[#FAF9F5] space-y-5">
                {/* User Bar Simulation */}
                <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                      H
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900">HitShare Extension Portal</div>
                      <div className="text-xs text-neutral-500">25+ Akun Siap Digunakan Sekali Klik</div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    Member Pro
                  </span>
                </div>

                {/* 6 Grid App Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { name: 'Netflix', sub: 'Ultra HD 4K', color: 'from-rose-500 to-red-600', letter: 'N' },
                    { name: 'ChatGPT Plus', sub: 'GPT-4o & AI', color: 'from-emerald-500 to-teal-600', letter: 'AI' },
                    { name: 'Canva Pro', sub: 'Brand Kit', color: 'from-sky-500 to-blue-600', letter: 'C' },
                    { name: 'Midjourney', sub: 'v6 Fast Gen', color: 'from-violet-500 to-purple-600', letter: 'MJ' },
                    { name: 'Prime Video', sub: 'Film & Serial', color: 'from-indigo-500 to-blue-700', letter: 'PV' },
                    { name: 'Spotify Pro', sub: 'Bebas Iklan', color: 'from-emerald-600 to-green-700', letter: 'SP' },
                  ].map((app, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-2xl border border-[#EAEAE2] shadow-2xs hover:shadow-md hover:border-neutral-400 hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform`}>
                        {app.letter}
                      </div>
                      <div className="min-w-0 w-full">
                        <div className="text-xs font-bold text-neutral-900 truncate">{app.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{app.sub}</div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        Siap Pakai
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Highlights / Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-4">
            <div className="p-4 sm:p-5 bg-white/80 border border-[#EAEAE3] rounded-3xl text-center shadow-bone backdrop-blur-xs hover:border-neutral-300 transition-colors">
              <div className="font-display text-2xl sm:text-3xl font-black text-neutral-900">1-Klik</div>
              <div className="text-xs text-neutral-500 font-medium mt-1">Login Instan Otomatis</div>
            </div>
            <div className="p-4 sm:p-5 bg-white/80 border border-[#EAEAE3] rounded-3xl text-center shadow-bone backdrop-blur-xs hover:border-neutral-300 transition-colors">
              <div className="font-display text-2xl sm:text-3xl font-black text-neutral-900">25+</div>
              <div className="text-xs text-neutral-500 font-medium mt-1">Pilihan Tools Premium</div>
            </div>
            <div className="p-4 sm:p-5 bg-white/80 border border-[#EAEAE3] rounded-3xl text-center shadow-bone backdrop-blur-xs hover:border-neutral-300 transition-colors">
              <div className="font-display text-2xl sm:text-3xl font-black text-neutral-900">99.8%</div>
              <div className="text-xs text-neutral-500 font-medium mt-1">Uptime Sesi Fresh</div>
            </div>
            <div className="p-4 sm:p-5 bg-white/80 border border-[#EAEAE3] rounded-3xl text-center shadow-bone backdrop-blur-xs hover:border-neutral-300 transition-colors">
              <div className="font-display text-2xl sm:text-3xl font-black text-neutral-900">QRIS</div>
              <div className="text-xs text-neutral-500 font-medium mt-1">Aktivasi Otomatis 24/7</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apps Showcase */}
      <section id="koleksi" className="py-16 px-4 bg-[#F2F2EC] border-y border-[#E5E5DC]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Website & Akun Siap Pakai
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
              Semua akun terintegrasi dalam ekstensi browser HitShare. Cukup buka ekstensi dan langsung berselancar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredApps.map((app, i) => {
              const Icon = app.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-5 rounded-3xl border border-[#E8E8DF] shadow-bone hover:border-neutral-400 transition-all flex items-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F6F6F2] border border-[#EAEAE3] flex items-center justify-center text-neutral-800 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">{app.name}</h3>
                    <p className="text-xs text-neutral-500 truncate">{app.desc}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {app.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Kenapa Memilih HitShare?</span>
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Solusi Berbagi Akses Paling Praktis</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Tanpa Bagi Password</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Ekstensi bekerja dengan menyuntikkan sesi cookie secara aman. Tidak ada akun yang ganti password atau dibajak.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Multi-Akun Per Website</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Tersedia Akun 1, Akun 2, hingga Akun 5 untuk website dengan batas perangkat seperti Netflix dan Canva.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Auto Sync Berkala</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Admin mengupdate sesi secara otomatis. Ekstensi browser Anda akan selalu menerima cookie terbaru tanpa repot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-20 px-4 bg-[#F2F2EC] border-t border-[#E5E5DC]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Pilihan Investasi Terbaik</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">Harga Langganan Terjangkau</h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
              Pilih paket yang paling pas dengan kebutuhan Anda. Semua paket mendapatkan akses penuh ke seluruh koleksi akun.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Monthly */}
            <div className="bg-white p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900">1 Bulan</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">30 Hari</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-neutral-500 font-medium">Rp</span>
                    <span className="text-3xl font-extrabold text-neutral-900">25.000</span>
                  </div>
                  <span className="text-xs text-neutral-400 line-through">Rp 35.000</span>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-600 font-medium pt-2 border-t border-neutral-100">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Akses 25+ Website Premium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Ekstensi Chrome / Edge</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 1 Perangkat Aktif</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Support Update Cookie</li>
                </ul>
              </div>
              <Link
                to="/daftar?plan=monthly"
                className="w-full py-3 text-center text-xs font-semibold text-neutral-800 bg-[#F4F4ED] hover:bg-[#EAEAE1] border border-[#DDDDCF] rounded-2xl transition-all"
              >
                Pilih Paket 1 Bulan
              </Link>
            </div>

            {/* 6 Months - Highlighted */}
            <div className="bg-neutral-900 text-white p-7 rounded-3xl border-2 border-neutral-900 shadow-bone-lg flex flex-col justify-between space-y-6 relative scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-neutral-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-neutral-900" /> Paling Hemat
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">6 Bulan</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300">180 Hari</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-neutral-400 font-medium">Rp</span>
                    <span className="text-4xl font-black text-white">120.000</span>
                  </div>
                  <span className="text-xs text-neutral-500 line-through">Rp 150.000 (Hemat 20k/bln)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-300 font-medium pt-2 border-t border-neutral-800">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Akses 25+ Website Premium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Ekstensi Chrome / Edge</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Prioritas Update Cookie</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Support WhatsApp Cepat</li>
                </ul>
              </div>
              <Link
                to="/daftar?plan=6months"
                className="w-full py-3 text-center text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-2xl transition-all shadow"
              >
                Pilih Paket 6 Bulan
              </Link>
            </div>

            {/* Yearly */}
            <div className="bg-white p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900">1 Tahun</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">365 Hari</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-neutral-500 font-medium">Rp</span>
                    <span className="text-3xl font-extrabold text-neutral-900">200.000</span>
                  </div>
                  <span className="text-xs text-neutral-400 line-through">Rp 300.000</span>
                </div>
                <ul className="space-y-2.5 text-xs text-neutral-600 font-medium pt-2 border-t border-neutral-100">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Akses 25+ Website Premium</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Ekstensi Chrome / Edge</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Full Garansi 1 Tahun</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> VIP Support WhatsApp</li>
                </ul>
              </div>
              <Link
                to="/daftar?plan=yearly"
                className="w-full py-3 text-center text-xs font-semibold text-neutral-800 bg-[#F4F4ED] hover:bg-[#EAEAE1] border border-[#DDDDCF] rounded-2xl transition-all"
              >
                Pilih Paket 1 Tahun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-sm text-neutral-600">Semua yang perlu kamu ketahui tentang cara berlangganan dan ekstensi HitShare.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E8E8DF] rounded-3xl overflow-hidden shadow-bone transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-left font-semibold text-neutral-900 text-sm flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[#F0F0E8]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Floating WhatsApp */}
      <div className="py-12 px-4 bg-white border-t border-[#E8E8DF]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-[#F8F8F5] rounded-3xl border border-[#E5E5DC]">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-neutral-900">Masih ragu atau ada kendala?</h3>
            <p className="text-xs sm:text-sm text-neutral-600">Admin kami siap membantu kamu 24/7 melalui WhatsApp.</p>
          </div>
          <a
            href={`https://wa.me/${waNumber}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-sm transition-all shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Chat Admin WhatsApp
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#EAEAE3] bg-white pt-16 pb-12 text-sm text-neutral-600">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#EAEAE3]">
            {/* Col 1: Brand Info (2 cols wide) */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E0E0D8] p-1.5 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
                  <img src="/icon.png" alt="HitShare Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-neutral-900">HitShare</span>
                  <span className="block text-xs text-neutral-500 -mt-0.5 font-semibold tracking-wide">PREMIUM ACCESS</span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-sm">
                Solusi cerdas akses bersama tools &amp; website premium favorit tanpa bagi password. Mudah, aman, otomatis dengan ekstensi browser berteknologi tinggi.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Layanan Aktif 24/7
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Sistem Enkripsi
                </span>
              </div>
            </div>

            {/* Col 2: Navigasi Produk */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Produk &amp; Fitur</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#fitur" className="hover:text-emerald-700 transition-colors">Fitur Unggulan</a></li>
                <li><a href="#koleksi" className="hover:text-emerald-700 transition-colors">Koleksi Website</a></li>
                <li><a href="#harga" className="hover:text-emerald-700 transition-colors">Pilihan Paket</a></li>
                <li><a href="#faq" className="hover:text-emerald-700 transition-colors">Tanya Jawab (FAQ)</a></li>
                <li><Link to="/akun" className="hover:text-emerald-700 transition-colors">Download Ekstensi</Link></li>
              </ul>
            </div>

            {/* Col 3: Portal Pengguna */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Akun &amp; Layanan</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-emerald-700 transition-colors">Masuk Member</Link></li>
                <li><Link to="/daftar" className="hover:text-emerald-700 transition-colors">Daftar Akun Baru</Link></li>
                <li><Link to="/akun" className="hover:text-emerald-700 transition-colors">Dashboard Saya</Link></li>
                <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya butuh bantuan reset perangkat')}`} target="_blank" rel="noreferrer" className="hover:text-emerald-700 transition-colors">Reset Device ID</a></li>
                <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya ingin konfirmasi perpanjangan')}`} target="_blank" rel="noreferrer" className="hover:text-emerald-700 transition-colors">Perpanjangan Langganan</a></li>
              </ul>
            </div>

            {/* Col 4: Bantuan & Kontak */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Bantuan &amp; Dukungan</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href={`https://wa.me/${waNumber}?text=${waMsg}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Customer Support WhatsApp
                  </a>
                </li>
                <li><span className="text-neutral-500">Respon cepat: &lt; 15 menit</span></li>
                <li><span className="text-neutral-500">Monitoring status akun 24/7</span></li>
                <li><span className="text-neutral-500">Garansi cookie selalu aktif</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="HitShare" className="w-5 h-5 object-contain rounded-md" />
              <span>© {CURRENT_YEAR} <strong>HitShare</strong>. Seluruh hak cipta dilindungi undang-undang.</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-500">
              <a href="#fitur" className="hover:text-neutral-800 transition-colors">Keamanan</a>
              <span>•</span>
              <a href="#harga" className="hover:text-neutral-800 transition-colors">Ketentuan Layanan</a>
              <span>•</span>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="hover:text-neutral-800 transition-colors">Bantuan WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
