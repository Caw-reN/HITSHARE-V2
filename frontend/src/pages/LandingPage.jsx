import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import {
  ALL_TOOLS,
  TESTIMONIALS,
} from '../data/landingData';
import {
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Layers,
  Flame,
  Check,
  Star,
  Lock,
  RefreshCw,
  Smartphone,
  Search,
  X,
  Calculator,
  ShieldCheck,
  HelpCircle,
  MousePointerClick,
  Laptop,
  Download,
  Pin,
  MoreVertical,
  Settings,
} from 'lucide-react';

function ChromePuzzleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M 8.25 5.5 a 1.75 1.75 0 0 1 3.5 0 H 14.5 a 1.5 1.5 0 0 1 1.5 1.5 v 2.5 a 1.75 1.75 0 0 1 0 3.5 v 2.5 a 1.5 1.5 0 0 1 -1.5 1.5 H 5.5 a 1.5 1.5 0 0 1 -1.5 -1.5 v -2.5 a 1.75 1.75 0 0 0 0 -3.5 V 7 a 1.5 1.5 0 0 1 1.5 -1.5 z" />
    </svg>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

const FALLBACK_PALETTES = [
  'from-indigo-600 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-violet-600 to-purple-800',
  'from-rose-500 to-pink-700',
  'from-sky-500 to-cyan-700',
  'from-neutral-800 to-black',
];

function ToolIcon({ app, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);
  const isImage = Boolean(
    app?.icon &&
      !imgError &&
      (app.icon.startsWith('http://') || app.icon.startsWith('https://') || app.icon.startsWith('/'))
  );

  const containerSizes = size === 'lg' ? 'w-14 h-14 text-base' : 'w-12 h-12 text-sm';
  const imgSizes = size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';

  return (
    <div
      className={`${containerSizes} rounded-2xl bg-gradient-to-br ${app?.color || 'from-indigo-600 to-blue-700'} text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0 overflow-hidden p-1.5`}
    >
      {isImage ? (
        <img
          src={app.icon}
          alt={app?.name || 'Icon'}
          className={`${imgSizes} object-contain rounded-lg drop-shadow-xs`}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{app?.iconLetter || app?.name?.slice(0, 2).toUpperCase() || 'HS'}</span>
      )}
    </div>
  );
}

function formatDynamicTools(backendWebsites, catalogTools) {
  if (!Array.isArray(backendWebsites) || backendWebsites.length === 0) {
    return catalogTools;
  }

  return backendWebsites.map((w, idx) => {
    const wNameClean = (w.name || '').toLowerCase().trim();
    const match = catalogTools.find((t) => {
      const tNameClean = t.name.toLowerCase().trim();
      return (
        wNameClean === tNameClean ||
        wNameClean.includes(tNameClean) ||
        tNameClean.includes(wNameClean)
      );
    });

    const initials =
      (w.name || '')
        .split(' ')
        .map((s) => s[0])
        .join('')
        .slice(0, 3)
        .toUpperCase() || (w.name || 'HS').slice(0, 2).toUpperCase();

    if (match) {
      return {
        ...match,
        id: w.id || match.id,
        name: w.name,
        category: w.category || match.category,
        category_id: w.category_id,
        icon: w.icon || match.icon,
        servers: w.servers || match.servers || 1,
      };
    }

    return {
      id: w.id || `web-${idx}`,
      name: w.name,
      category: w.category || 'Lainnya',
      category_id: w.category_id,
      sub: w.category ? `${w.category} Siap Pakai` : 'Akses Layanan Premium',
      badge: 'Siap Pakai',
      color: FALLBACK_PALETTES[idx % FALLBACK_PALETTES.length],
      iconLetter: initials,
      icon: w.icon || null,
      servers: w.servers || 1,
      features: [
        `Akses akun ${w.name} siap pakai tanpa antri`,
        'Akses login otomatis via Ekstensi HitShare',
        'Server dipantau berkala & anti limit',
        'Garansi sesi aktif selama masa langganan',
      ],
      officialPrice: 150000,
    };
  });
}

// Set ke true untuk mengaktifkan kembali section testimoni kapan saja
const SHOW_TESTIMONIALS = false;

export default function LandingPage() {
  const [settings, setSettings] = useState({});
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Koleksi Tools State
  const [selectedToolModal, setSelectedToolModal] = useState(null);
  const [activeToolCategory, setActiveToolCategory] = useState('Semua');
  const [tools, setTools] = useState(ALL_TOOLS);
  const [categories, setCategories] = useState(['Semua', 'AI Tools', 'Desain', 'Streaming', 'Produktivitas']);

  // Testimonial Carousel State
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  useEffect(() => {
    // Fetch public settings
    api.get('/settings/public').then((res) => setSettings(res.data)).catch(() => {});

    // Fetch dynamic websites
    api
      .get('/websites/public')
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.websites;
        if (Array.isArray(list) && list.length > 0) {
          const formatted = formatDynamicTools(list, ALL_TOOLS);
          setTools(formatted);

          const cats = ['Semua'];
          const backendCats = Array.isArray(data?.categories) ? data.categories : [];
          backendCats.forEach((c) => {
            if (c && !cats.includes(c)) cats.push(c);
          });
          formatted.forEach((t) => {
            if (t.category && !cats.includes(t.category)) cats.push(t.category);
          });
          setCategories(cats);
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic websites, falling back to static catalog:', err);
      });

    // Fetch dynamic payment plans
    api
      .get('/payment/plans')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPlans(res.data);
        } else {
          setPlans([
            { plan: 'monthly', label: '1 Bulan', amount: 25000, original_price: 35000, duration_days: 30, badge: null },
            { plan: '6months', label: '6 Bulan', amount: 120000, original_price: 150000, duration_days: 180, badge: 'Paling Hemat' },
            { plan: 'yearly', label: '1 Tahun', amount: 200000, original_price: 300000, duration_days: 365, badge: 'Full Garansi' },
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
        setPlans([
          { plan: 'monthly', label: '1 Bulan', amount: 25000, original_price: 35000, duration_days: 30, badge: null },
          { plan: '6months', label: '6 Bulan', amount: 120000, original_price: 150000, duration_days: 180, badge: 'Paling Hemat' },
          { plan: 'yearly', label: '1 Tahun', amount: 200000, original_price: 300000, duration_days: 365, badge: 'Full Garansi' },
        ]);
      })
      .finally(() => setPlansLoading(false));
  }, []);

  // Auto-slide testimonials carousel every 5s unless hovered (hanya berjalan saat testimoni aktif)
  useEffect(() => {
    if (!SHOW_TESTIMONIALS || isTestimonialHovered) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isTestimonialHovered]);

  // Filtered tools for Category
  const filteredTools = useMemo(() => {
    if (activeToolCategory === 'Semua') return tools;
    return tools.filter((t) => t.category === activeToolCategory);
  }, [activeToolCategory, tools]);

  const { marqueeRow1, marqueeRow2 } = useMemo(() => {
    if (!tools || tools.length === 0) {
      return { marqueeRow1: [], marqueeRow2: [] };
    }
    const mid = Math.ceil(tools.length / 2);
    const row1 = tools.slice(0, mid);
    const row2 = tools.slice(mid);

    const makeSeamless = (arr) => {
      if (!arr || arr.length === 0) return [];
      let base = [...arr];
      while (base.length < 6) {
        base = base.concat(arr);
      }
      return base.concat(base);
    };

    return {
      marqueeRow1: makeSeamless(row1),
      marqueeRow2: makeSeamless(row2.length > 0 ? row2 : row1),
    };
  }, [tools]);

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

        </div>
      </section>

      {/* ── 1. Infinite Marquee Showcase & Modal Preview ── */}
      <section id="koleksi" className="py-20 px-4 bg-[#F2F2EC] border-y border-[#E5E5DC] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-200/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Website &amp; Akun Siap Pakai
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
              Semua layanan telah terintegrasi dalam ekstensi HitShare. Klik kartu layanan di bawah ini untuk melihat detail fitur, kompatibilitas, dan ketersediaan akun cadangan.
            </p>

            {/* Category Filter Pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-2 pt-3"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveToolCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeToolCategory === cat
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-white text-neutral-700 border border-[#E0E0D8] hover:bg-[#F8F8F5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Marquee Container or Filtered Grid */}
          {activeToolCategory === 'Semua' ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
              className="space-y-4 pt-4"
            >
              {/* Row 1: Scrolling Left */}
              <div className="overflow-hidden w-full relative">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="animate-marquee-left flex gap-4 py-1">
                  {marqueeRow1.map((app, idx) => (
                    <button
                      key={`r1-${idx}`}
                      onClick={() => setSelectedToolModal(app)}
                      className="group bg-white p-4 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-3.5 w-64 sm:w-72 shrink-0 cursor-pointer"
                    >
                      <ToolIcon app={app} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-neutral-900 truncate">{app.name}</h3>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{app.sub}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {app.servers} Server
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">Klik detail</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Scrolling Right */}
              <div className="overflow-hidden w-full relative">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="animate-marquee-right flex gap-4 py-1">
                  {marqueeRow2.map((app, idx) => (
                    <button
                      key={`r2-${idx}`}
                      onClick={() => setSelectedToolModal(app)}
                      className="group bg-white p-4 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-3.5 w-64 sm:w-72 shrink-0 cursor-pointer"
                    >
                      <ToolIcon app={app} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-neutral-900 truncate">{app.name}</h3>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{app.sub}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {app.servers} Server
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">Klik detail</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Filtered Category Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {filteredTools.map((app, idx) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  onClick={() => setSelectedToolModal(app)}
                  className="group bg-white p-5 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-4 cursor-pointer"
                >
                  <ToolIcon app={app} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 truncate">{app.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 shrink-0">
                        {app.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{app.sub}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0F0E8]">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {app.servers} Server Aktif
                      </span>
                      <span className="text-[11px] font-bold text-neutral-900 group-hover:text-amber-600 transition-colors flex items-center gap-0.5">
                        Lihat <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Modal / Drawer Preview Detail Akun ── */}
      <AnimatePresence>
        {selectedToolModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedToolModal(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5DC] relative z-10 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ToolIcon app={selectedToolModal} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-neutral-900">{selectedToolModal.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {selectedToolModal.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{selectedToolModal.sub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedToolModal(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-medium">Status Sesi</span>
                    <strong className="text-neutral-800">Aktif &amp; Terverifikasi</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-medium">Akun Cadangan</span>
                    <strong className="text-neutral-800">{selectedToolModal.servers} Server Anti-Limit</strong>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Fitur Akses Yang Termasuk
                </h4>
                <ul className="space-y-2 text-xs text-neutral-700">
                  {(selectedToolModal.features || []).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Akses login otomatis via Ekstensi HitShare (Chrome, Edge, Brave)</span>
                  </li>
                </ul>
              </div>

              {/* Price comparison highlight */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                    Harga Resmi Langganan
                  </div>
                  <div className="text-xs text-neutral-400 line-through">
                    Rp {new Intl.NumberFormat('id-ID').format(selectedToolModal.officialPrice || 150000)} / bln
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                    Di HitShare All-In-One
                  </div>
                  <div className="text-base font-black text-white">
                    Mulai Rp 25.000 <span className="text-xs font-normal text-neutral-400">/ bln</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="#harga"
                  onClick={() => setSelectedToolModal(null)}
                  className="flex-1 py-3 px-4 text-center text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Dapatkan Akses Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedToolModal(null)}
                  className="py-3 px-5 text-center text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. Cara Kerja 3-Langkah (How It Works) ── */}
      <section id="cara-kerja" className="py-24 px-4 bg-[#F8F8F5] relative">
        <div className="max-w-6xl mx-auto space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              3 Langkah Sederhana Menggunakan HitShare
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
              Tidak perlu mengunduh aplikasi mencurigakan atau mengetik username dan password manual satu per satu.
            </p>
          </motion.div>

          <div className="space-y-10 sm:space-y-12">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-4xl p-6 sm:p-10 lg:p-12 border border-[#E5E5DC] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all"
            >
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Text Col */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-display font-black text-base flex items-center justify-center shadow-sm">
                      01
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                    Daftar &amp; Pasang Ekstensi
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Pilih paket langganan sesuai kebutuhan Anda dan pasang ekstensi resmi HitShare ke browser dalam hitungan detik. Cukup satu kali klik, ekstensi langsung aktif dan siap digunakan.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-neutral-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pemasangan 1-klik praktis untuk Chrome, Edge, Brave, dan Opera</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ekstensi resmi berstandar aman tanpa instal aplikasi tambahan</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Langsung terhubung dengan akun langganan Anda secara instan</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Col */}
                <div className="lg:col-span-7 flex justify-center">
                  <div className="w-full max-w-xl bg-white p-6 sm:p-7 rounded-3xl border border-[#E5E5DC] shadow-xl hover:shadow-2xl transition-all space-y-4 relative overflow-hidden">
                    {/* Ambient subtle accent glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Row: Icon + Title (Left) and Add to Browser Button (Right) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-[#E0E0D8] p-2 flex items-center justify-center shadow-md overflow-hidden">
                            <img src="/icon.png" alt="HitShare Extension" className="w-full h-full object-contain" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h4 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                              HitShare Extension
                            </h4>
                            <span className="text-xs font-semibold text-neutral-400">
                              v2.0.5
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 leading-snug">
                            Akses puluhan akun premium instan langsung dari browser
                          </p>
                        </div>
                      </div>

                      {/* Add to Browser Button (like Chrome Web Store reference) */}
                      <div className="shrink-0 self-start sm:self-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-default"
                        >
                          Add to Browser
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Rating Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-neutral-500 border-t border-[#F0F0E8]">
                      <div className="flex items-center gap-1 text-blue-600 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>hitshare.web.id</span>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="font-bold text-neutral-900">5.0</span>
                        <div className="flex text-amber-400 text-xs">
                          {'★'.repeat(5)}
                        </div>
                        <span className="text-neutral-400 text-[11px]">(1.200+ rating)</span>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <span className="text-neutral-500 text-[11px]">Produktivitas</span>
                    </div>

                    {/* Supported Browsers Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-neutral-500 border-t border-[#F0F0E8]">
                      <span>Kompatibel dengan:</span>
                      <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 font-semibold text-[10px]">Chrome</span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 font-semibold text-[10px]">Edge</span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 font-semibold text-[10px]">Brave</span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 font-semibold text-[10px]">Opera</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 2 (Alternating: Visual Left, Text Right) */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-4xl p-6 sm:p-10 lg:p-12 border border-[#E5E5DC] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all"
            >
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Visual Col */}
                <div className="lg:col-span-7 flex justify-center order-2 lg:order-1">
                  <div className="w-full max-w-lg bg-white p-5 sm:p-7 rounded-3xl border border-[#E5E5DC] shadow-xl hover:shadow-2xl transition-all space-y-3 relative overflow-hidden">
                    {/* Ambient subtle accent glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Browser Toolbar Mockup */}
                    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-[#EDEDE8] border border-[#DDDDCF]">
                      {/* URL Bar */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#D5D5CA] text-xs font-medium text-neutral-600 flex-1 min-w-0 shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-neutral-800 font-semibold truncate">hitshare.web.id</span>
                      </div>

                      {/* Toolbar action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Pinned HitShare icon */}
                        <div className="w-7 h-7 rounded-lg bg-white border border-[#DDDDCF] p-1 flex items-center justify-center shadow-2xs">
                          <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
                        </div>

                        {/* Puzzle icon (Active) */}
                        <div className="w-7 h-7 rounded-lg bg-[#202124] text-white flex items-center justify-center shadow-xs">
                          <ChromePuzzleIcon className="w-3.5 h-3.5 text-white" />
                        </div>

                        {/* Three dots */}
                        <div className="text-neutral-500 px-0.5">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Chrome Extensions Floating Dark Popup */}
                    <div className="w-full max-w-[340px] ml-auto bg-[#202124] text-white rounded-2xl p-4 shadow-2xl border border-[#3C4043] space-y-3">
                      {/* Header: Extensions & Close */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white tracking-wide">Extensions</span>
                        <button type="button" className="text-[#9AA0A6] hover:text-white p-0.5 rounded transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-[#E8EAED]">No access needed</div>
                        <p className="text-[11px] text-[#9AA0A6] leading-snug">
                          These extensions don't need to see and change information on this site.
                        </p>
                      </div>

                      {/* Extension Item: HitShare */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#303134] border border-[#3C4043]/60 transition-all hover:bg-[#35363A]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                            <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xs font-medium text-white truncate">HitShare</span>
                        </div>

                        {/* Pin and Options */}
                        <div className="flex items-center gap-2 text-[#9AA0A6] shrink-0">
                          <div className="p-1 rounded-md text-[#8AB4F8] hover:bg-white/10 transition-colors" title="Sematkan ke toolbar">
                            <Pin className="w-4 h-4 rotate-45 fill-[#8AB4F8]" />
                          </div>
                          <div className="p-1 rounded-md text-[#9AA0A6] hover:bg-white/10 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Footer: Manage extensions */}
                      <div className="pt-2 border-t border-[#3C4043] flex items-center gap-2 text-xs text-[#E8EAED] hover:text-white transition-colors cursor-default">
                        <Settings className="w-3.5 h-3.5 text-[#9AA0A6]" />
                        <span>Manage extensions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Col */}
                <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-display font-black text-base flex items-center justify-center shadow-sm">
                      02
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                    Sematkan ke Toolbar Browser
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Buka menu ekstensi di toolbar browser Anda, lalu klik ikon pin pada HitShare. Ikon ekstensi akan selalu menetap di bar atas browser untuk akses cepat setiap saat.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-neutral-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Akses super cepat cukup 1 kali klik langsung dari bar navigasi</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ikon selalu standby dengan indikator status ekstensi aktif</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Rapi, teratur, dan tidak perlu repot mencari di menu pengaturan</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-4xl p-6 sm:p-10 lg:p-12 border border-[#E5E5DC] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all"
            >
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Text Col */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-display font-black text-base flex items-center justify-center shadow-sm">
                      03
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                    Pilih Layanan &amp; Login Otomatis
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Klik ikon HitShare di toolbar browser dan pilih akun premium yang ingin Anda gunakan. Tab baru akan otomatis terbuka dalam kondisi sudah login resmi tanpa perlu memasukkan email atau password.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-neutral-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Akses instan ke puluhan layanan AI, streaming, desain &amp; produktivitas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sinkronisasi sesi otomatis terenkripsi tanpa ketik password manual</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Didukung multi-server cadangan agar akses selalu stabil dan lancar</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Col */}
                <div className="lg:col-span-7 flex justify-center">
                  <div className="w-full max-w-lg bg-white p-5 sm:p-7 rounded-3xl border border-[#E5E5DC] shadow-xl hover:shadow-2xl transition-all space-y-3 relative overflow-hidden">
                    {/* Ambient subtle accent glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Browser Toolbar Mockup */}
                    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-[#EDEDE8] border border-[#DDDDCF]">
                      {/* URL Bar */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#D5D5CA] text-xs font-medium text-neutral-600 flex-1 min-w-0 shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-neutral-800 font-semibold truncate">hitshare.web.id</span>
                      </div>

                      {/* Toolbar action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Pinned HitShare icon - ACTIVE / CLICKED */}
                        <div className="w-7 h-7 rounded-lg bg-white border border-blue-400 p-1 flex items-center justify-center shadow-xs ring-2 ring-blue-500/30">
                          <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
                        </div>

                        {/* Chrome Puzzle icon */}
                        <div className="w-7 h-7 rounded-lg text-neutral-600 hover:text-neutral-900 flex items-center justify-center">
                          <ChromePuzzleIcon className="w-3.5 h-3.5 text-neutral-600" />
                        </div>

                        {/* Three dots */}
                        <div className="text-neutral-500 px-0.5">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* HitShare Extension Popup */}
                    <div className="w-full max-w-[360px] ml-auto rounded-2xl overflow-hidden border border-[#E5E5DC] shadow-2xl bg-white group/img transition-transform hover:scale-[1.01]">
                      <img
                        src="/steps/step-3-popup-clean.png"
                        alt="HitShare Portal Layanan Premium"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4. Pilihan Paket (Pricing Section) ── */}
      <section id="harga" className="py-24 px-4 bg-[#F2F2EC] border-t border-[#E5E5DC]">
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Biaya Langganan Terjangkau
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
              Pilih paket yang paling pas dengan kebutuhan Anda. Semua paket otomatis mendapatkan akses penuh ke seluruh koleksi akun dan update sesi berkala.
            </p>
          </motion.div>

          {plansLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            </div>
          ) : (
            <div className={`grid gap-6 items-stretch ${
              plans.length === 1 ? 'max-w-md mx-auto grid-cols-1' :
              plans.length === 2 ? 'max-w-3xl mx-auto md:grid-cols-2' :
              plans.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {plans.map((p, idx) => {
                const isHighlighted = p.plan === '6months' || p.badge?.toLowerCase().includes('hemat') || p.badge?.toLowerCase().includes('populer') || (plans.length > 2 && idx === 1);
                const originalPrice = p.original_price || p.original;
                const formattedPrice = new Intl.NumberFormat('id-ID').format(p.amount);
                const formattedOriginal = originalPrice ? new Intl.NumberFormat('id-ID').format(originalPrice) : null;
                const badgeLabel = p.badge || (isHighlighted ? 'Paling Hemat' : null);

                return (
                  <motion.div
                    key={p.plan || idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`rounded-4xl p-7 sm:p-8 flex flex-col justify-between space-y-6 transition-all relative ${
                      isHighlighted
                        ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-bone-lg md:scale-105 z-10'
                        : 'bg-white text-neutral-900 border border-[#E8E8DF] shadow-bone hover:border-neutral-400'
                    }`}
                  >
                    {badgeLabel && (
                      <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                        isHighlighted ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-white'
                      }`}>
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{badgeLabel}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xl font-bold ${isHighlighted ? 'text-white' : 'text-neutral-900'}`}>
                          {p.label || p.plan}
                        </h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isHighlighted ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {p.duration_days ? `${p.duration_days} Hari` : 'Akses Penuh'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-medium ${isHighlighted ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Rp
                          </span>
                          <span className={`font-black tracking-tight ${isHighlighted ? 'text-4xl sm:text-5xl text-white' : 'text-3xl sm:text-4xl text-neutral-900'}`}>
                            {formattedPrice}
                          </span>
                        </div>
                        {formattedOriginal && (
                          <span className={`text-xs line-through ${isHighlighted ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Rp {formattedOriginal}
                          </span>
                        )}
                        {p.description && (
                          <p className={`text-xs mt-1.5 ${isHighlighted ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {p.description}
                          </p>
                        )}
                      </div>

                      <ul className={`space-y-2.5 text-xs font-medium pt-4 border-t ${
                        isHighlighted ? 'text-neutral-300 border-neutral-800' : 'text-neutral-600 border-neutral-100'
                      }`}>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Akses Penuh Seluruh 25+ Website Premium</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Ekstensi Browser Chrome, Edge &amp; Brave</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>1 Perangkat Aktif (Device Lock Protection)</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Update Sesi Login Otomatis Berkala</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Multi-Akun Server Cadangan (Anti-Limit)</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span>Garansi Penuh Selama Masa Langganan</span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      to={`/daftar?plan=${encodeURIComponent(p.plan)}`}
                      className={`w-full py-3.5 text-center text-xs font-bold rounded-2xl transition-all cursor-pointer block ${
                        isHighlighted
                          ? 'text-neutral-900 bg-white hover:bg-neutral-100 shadow-md hover:shadow-lg'
                          : 'text-neutral-900 bg-[#F4F4ED] hover:bg-[#EAEAE1] border border-[#DDDDCF]'
                      }`}
                    >
                      Pilih Paket {p.label || p.plan}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Carousel Testimoni Otomatis (Hidden sementara, ubah SHOW_TESTIMONIALS = true untuk menampilkan) ── */}
      {SHOW_TESTIMONIALS && (
        <section
          id="testimoni"
          className="py-24 px-4 bg-[#F8F8F5] relative overflow-hidden"
          onMouseEnter={() => setIsTestimonialHovered(true)}
          onMouseLeave={() => setIsTestimonialHovered(false)}
        >
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Ulasan Pengguna Nyata
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Dipercaya Oleh Kreator, Mahasiswa, &amp; Profesional
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
                Simak pengalaman nyata dari mereka yang telah beralih ke cara cerdas mengakses tools premium.
              </p>
            </div>

            {/* Testimonial Card Display */}
            <div className="relative min-h-[300px] flex items-center">
              {TESTIMONIALS.map((testi, idx) => {
                if (idx !== activeTestimonial) return null;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full bg-white rounded-4xl p-8 sm:p-10 border border-[#E8E8DF] shadow-bone-lg space-y-6 relative"
                  >
                    {/* Rating Stars & Badge */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(testi.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi Member
                      </span>
                    </div>

                    {/* Quote */}
                    <blockquote className="text-base sm:text-lg text-neutral-800 font-medium leading-relaxed italic">
                      &ldquo;{testi.quote}&rdquo;
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center gap-4 pt-4 border-t border-[#F0F0E8]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border ${testi.avatarBg}`}>
                        {testi.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900">{testi.name}</div>
                        <div className="text-xs text-neutral-500">{testi.role} • {testi.city}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Controls: Prev/Next & Dots */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-2xl bg-white border border-[#E0E0D8] text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeTestimonial === i ? 'w-8 bg-neutral-900' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-2xl bg-white border border-[#E0E0D8] text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 8. Floating CTA WhatsApp Banner ── */}
      <div className="py-14 px-4 bg-[#F8F8F5] border-t border-[#E8E8DF]">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 p-7 sm:p-9 bg-white rounded-4xl border border-[#E5E5DC] shadow-bone-lg"
        >
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Customer Support 24/7
            </span>
            <h3 className="text-xl font-bold text-neutral-900">Masih ragu atau butuh panduan khusus?</h3>
            <p className="text-xs sm:text-sm text-neutral-600">
              Admin WhatsApp kami siap membantu reset device, pertanyaan teknis, dan panduan aktivasi (respon &lt; 10 menit).
            </p>
          </div>
          <a
            href={`https://wa.me/${waNumber}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Admin WhatsApp</span>
          </a>
        </motion.div>
      </div>

      {/* ── Retro-Modern Poster Footer (Clean Solid Dark Background) ── */}
      <footer
        className="relative bg-[#231815] text-[#FDF6E2] pt-16 sm:pt-20 pb-0 overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[3.5rem] lg:rounded-t-[4rem] border-t border-[#3A2823] shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
          {/* Top Grid: 3 Navigation Columns + CTA Register Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 sm:pb-16"
          >
            {/* Col 1: SHOP / PRODUK */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-xs sm:text-sm font-black text-[#FCE7A2] tracking-[0.2em] uppercase">
                PRODUK
              </h4>
              <ul className="space-y-2.5 text-xs font-bold tracking-wider uppercase text-[#FDF6E2]/80">
                <li><a href="#koleksi" className="hover:text-white transition-colors">KOLEKSI TOOLS</a></li>
                <li><a href="#cara-kerja" className="hover:text-white transition-colors">CARA KERJA</a></li>
                <li><a href="#harga" className="hover:text-white transition-colors">PILIHAN PAKET</a></li>
                {SHOW_TESTIMONIALS && (
                  <li><a href="#testimoni" className="hover:text-white transition-colors">ULASAN PENGGUNA</a></li>
                )}
                <li><a href="#koleksi" className="hover:text-white transition-colors">EKSTENSI CHROME</a></li>
              </ul>
            </div>

            {/* Col 2: ABOUT / LAYANAN */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-xs sm:text-sm font-black text-[#FCE7A2] tracking-[0.2em] uppercase">
                LAYANAN
              </h4>
              <ul className="space-y-2.5 text-xs font-bold tracking-wider uppercase text-[#FDF6E2]/80">
                <li><Link to="/login" className="hover:text-white transition-colors">MASUK MEMBER</Link></li>
                <li><Link to="/daftar" className="hover:text-white transition-colors">DAFTAR AKUN</Link></li>
                <li><Link to="/akun" className="hover:text-white transition-colors">DASHBOARD</Link></li>
                <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya ingin konfirmasi perpanjangan')}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">PERPANJANGAN</a></li>
              </ul>
            </div>

            {/* Col 3: LEGAL / BANTUAN */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-xs sm:text-sm font-black text-[#FCE7A2] tracking-[0.2em] uppercase">
                BANTUAN
              </h4>
              <ul className="space-y-2.5 text-xs font-bold tracking-wider uppercase text-[#FDF6E2]/80">
                <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya butuh bantuan reset perangkat')}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">RESET DEVICE</a></li>
                <li><a href={`https://wa.me/${waNumber}?text=${waMsg}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GARANSI SESI</a></li>
                <li><a href="#harga" className="hover:text-white transition-colors">KETENTUAN</a></li>
                <li><a href={`https://wa.me/${waNumber}?text=${waMsg}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">CHAT SUPPORT</a></li>
              </ul>
            </div>

            {/* Col 4: CTA DAFTAR SEKARANG */}
            <div className="col-span-2 md:col-span-4 lg:col-span-6 flex flex-col items-start lg:items-end">
              <div className="w-full max-w-md space-y-4">
                <h4 className="text-xs sm:text-sm font-black text-[#FCE7A2] tracking-[0.2em] uppercase text-left">
                  DAFTAR SEKARANG
                </h4>

                {/* Pill CTA Button to /daftar */}
                <Link
                  to="/daftar"
                  className="w-full bg-white hover:bg-[#FCE7A2] text-[#231815] rounded-full py-3.5 px-6 text-xs sm:text-sm font-extrabold flex items-center justify-between shadow-md hover:shadow-lg transition-all group cursor-pointer"
                >
                  <span className="font-bold tracking-wide">Daftar Akun HitShare</span>
                  <div className="w-8 h-8 rounded-full bg-[#231815] text-[#FCE7A2] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>

                {/* Social icons centered under the CTA button */}
                <div className="flex items-center justify-center gap-5 pt-1 text-[#FCE7A2]">
                  {/* Instagram */}
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-transform hover:scale-115 p-1"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-transform hover:scale-115 p-1"
                    aria-label="TikTok"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-transform hover:scale-115 p-1"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-transform hover:scale-115 p-1"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>

                {/* Copyright centered under CTA */}
                <div className="text-center text-xs font-semibold text-[#FDF6E2]/70 pt-1 tracking-wider">
                  © HitShare {CURRENT_YEAR}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Giant Typography 'HITSHARE' across the bottom (Slightly cropped at bottom edge) ── */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-center select-none pointer-events-none relative z-10 mt-6 sm:mt-10 overflow-hidden h-[11vw] sm:h-[11.5vw] lg:h-[12vw] flex items-start justify-center"
        >
          <div
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            className="font-black text-white uppercase tracking-tighter leading-none text-[16vw] sm:text-[17vw] lg:text-[18vw] whitespace-nowrap"
          >
            HITSHARE
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
