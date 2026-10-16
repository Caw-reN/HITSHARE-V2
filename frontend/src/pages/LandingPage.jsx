import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import {
  ALL_TOOLS,
  CALCULATOR_TOOLS,
  TESTIMONIALS,
  ALL_FAQS,
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
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function LandingPage() {
  const [settings, setSettings] = useState({});
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Koleksi Tools State
  const [selectedToolModal, setSelectedToolModal] = useState(null);
  const [activeToolCategory, setActiveToolCategory] = useState('Semua');

  // Savings Calculator State
  const [selectedCalcTools, setSelectedCalcTools] = useState(
    new Set(CALCULATOR_TOOLS.filter((t) => t.defaultChecked).map((t) => t.id))
  );

  // Testimonial Carousel State
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  // FAQ State
  const [openFaq, setOpenFaq] = useState(0);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState('all');

  // Motion.dev Footer Reveal (https://motion.dev/examples/react-footer-reveal)
  const footerContainerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerContainerRef,
    offset: ['start end', 'end end'],
  });
  const footerOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.5, 1]);
  const footerY = useTransform(scrollYProgress, [0, 1], [-60, 0]);

  useEffect(() => {
    // Fetch public settings
    api.get('/settings/public').then((res) => setSettings(res.data)).catch(() => {});

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

  // Auto-slide testimonials carousel every 5s unless hovered
  useEffect(() => {
    if (isTestimonialHovered) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isTestimonialHovered]);

  // Calculator Calculations
  const calculatedSavings = useMemo(() => {
    const totalRetail = CALCULATOR_TOOLS.filter((t) => selectedCalcTools.has(t.id)).reduce(
      (sum, t) => sum + t.price,
      0
    );
    const hitsharePrice = 25000;
    const monthlySavings = Math.max(0, totalRetail - hitsharePrice);
    const percentSavings = totalRetail > 0 ? Math.round((monthlySavings / totalRetail) * 100) : 0;
    const yearlySavings = monthlySavings * 12;

    return { totalRetail, hitsharePrice, monthlySavings, percentSavings, yearlySavings };
  }, [selectedCalcTools]);

  const toggleCalculatorTool = (toolId) => {
    setSelectedCalcTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return ALL_FAQS.filter((f) => {
      const matchesCategory = activeFaqCategory === 'all' || f.category === activeFaqCategory;
      const matchesSearch =
        !faqSearch.trim() ||
        f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.a.toLowerCase().includes(faqSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeFaqCategory, faqSearch]);

  // Filtered tools for Category
  const filteredTools = useMemo(() => {
    if (activeToolCategory === 'Semua') return ALL_TOOLS;
    return ALL_TOOLS.filter((t) => t.category === activeToolCategory);
  }, [activeToolCategory]);

  const marqueeRow1 = ALL_TOOLS.slice(0, 10);
  const marqueeRow2 = ALL_TOOLS.slice(10);

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

      {/* ── 1. Infinite Marquee Showcase & Modal Preview ── */}
      <section id="koleksi" className="py-20 px-4 bg-[#F2F2EC] border-y border-[#E5E5DC] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-200/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Koleksi 25+ Layanan Premium
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Website &amp; Akun Siap Pakai
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
              Semua layanan telah terintegrasi dalam ekstensi HitShare. Klik kartu layanan di bawah ini untuk melihat detail fitur, kompatibilitas, dan ketersediaan akun cadangan.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {['Semua', 'AI Tools', 'Desain', 'Streaming', 'Produktivitas'].map((cat) => (
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
            </div>
          </div>

          {/* Marquee Container or Filtered Grid */}
          {activeToolCategory === 'Semua' ? (
            <div className="space-y-4 pt-4">
              {/* Row 1: Scrolling Left */}
              <div className="overflow-hidden w-full relative">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F2F2EC] to-transparent z-10 pointer-events-none" />
                <div className="animate-marquee-left flex gap-4 py-1">
                  {marqueeRow1.concat(marqueeRow1).map((app, idx) => (
                    <button
                      key={`r1-${idx}`}
                      onClick={() => setSelectedToolModal(app)}
                      className="group bg-white p-4 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-3.5 w-64 sm:w-72 shrink-0 cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                        {app.iconLetter}
                      </div>
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
                  {marqueeRow2.concat(marqueeRow2).map((app, idx) => (
                    <button
                      key={`r2-${idx}`}
                      onClick={() => setSelectedToolModal(app)}
                      className="group bg-white p-4 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-3.5 w-64 sm:w-72 shrink-0 cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                        {app.iconLetter}
                      </div>
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
            </div>
          ) : (
            /* Filtered Category Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {filteredTools.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedToolModal(app)}
                  className="group bg-white p-5 rounded-3xl border border-[#E5E5DC] shadow-bone hover:border-neutral-900 hover:shadow-bone-lg hover:-translate-y-1 transition-all text-left flex items-center gap-4 cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                    {app.iconLetter}
                  </div>
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
                </button>
              ))}
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-neutral-500">
              💡 <em>Tips:</em> Arahkan kursor pada kartu logo untuk menghentikan putaran animasi, atau klik kartu untuk informasi lengkap.
            </p>
          </div>
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
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedToolModal.color} text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0`}>
                    {selectedToolModal.iconLetter}
                  </div>
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
                  {selectedToolModal.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Injeksi cookie otomatis via Ekstensi HitShare (Chrome, Edge, Brave)</span>
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
                    Rp {new Intl.NumberFormat('id-ID').format(selectedToolModal.officialPrice)} / bln
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
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Mudah, Cepat &amp; Instan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              3 Langkah Sederhana Menggunakan HitShare
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
              Tidak perlu mengunduh aplikasi mencurigakan atau mengetik username dan password manual satu per satu.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-neutral-900 text-white font-display font-black text-sm flex items-center justify-center shadow-sm">
                    01
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Langkah Awal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                  Daftar &amp; Pasang Ekstensi
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Pilih paket langganan dan unduh ekstensi resmi HitShare. Pasang di browser Chrome, Edge, atau Brave kamu hanya dalam 1 menit.
                </p>
              </div>

              {/* Visual Mockup Step 1 */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5DC]">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="font-mono text-[11px] text-neutral-600">Browser Toolbar</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Terpasang
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-[#E8E8DE]">
                  <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs">
                    H
                  </div>
                  <div className="text-[11px] font-bold text-neutral-900">HitShare Extension v2.0.5</div>
                  <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-neutral-900 text-white font-display font-black text-sm flex items-center justify-center shadow-sm">
                    02
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Pilih Layanan
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                  Buka Ekstensi &amp; Pilih Tools
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Buka ikon HitShare di pojok kanan atas browser kamu. Telusuri lebih dari 25+ koleksi akun premium seperti Netflix, ChatGPT Plus, Canva Pro, dan lainnya.
                </p>
              </div>

              {/* Visual Mockup Step 2 */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5DC]">
                  <span className="font-semibold text-neutral-700 text-[11px]">Koleksi Siap Pakai</span>
                  <span className="text-[10px] text-neutral-500">25+ Pilihan</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 bg-white rounded-xl border border-[#E8E8DE]">
                    <div className="text-[10px] font-bold text-neutral-900">ChatGPT</div>
                    <span className="text-[9px] text-emerald-600 font-semibold">Siap</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-[#E8E8DE]">
                    <div className="text-[10px] font-bold text-neutral-900">Netflix</div>
                    <span className="text-[9px] text-emerald-600 font-semibold">Siap</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-[#E8E8DE]">
                    <div className="text-[10px] font-bold text-neutral-900">Canva</div>
                    <span className="text-[9px] text-emerald-600 font-semibold">Siap</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-neutral-900 text-white font-display font-black text-sm flex items-center justify-center shadow-sm">
                    03
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    Selesai
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">
                  1-Klik Langsung Login Otomatis
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Cukup klik tombol &quot;Buka Website&quot;. Ekstensi secara instan menyuntikkan sesi cookie terenkripsi. Tab baru terbuka dan Anda langsung masuk tanpa password!
                </p>
              </div>

              {/* Visual Mockup Step 3 */}
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] space-y-2.5">
                <div className="w-full py-2 px-3 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka Website (1-Klik)</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sesi Disinkronkan • Logged In</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Kalkulator Interaktif Hemat Biaya ── */}
      <section id="hemat" className="py-24 px-4 bg-[#F2F2EC] border-t border-[#E5E5DC] relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              Kalkulator Penghematan Real-Time
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Hitung Berapa Banyak Uang yang Anda Hemat
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
              Centang tools yang sering Anda gunakan di bawah ini dan bandingkan pengeluaran resmi bulanan dengan biaya langganan all-in-one di HitShare.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: Tool Checkbox Selector */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E5DC] shadow-bone space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEFE8]">
                <h3 className="text-sm font-bold text-neutral-900">
                  Pilih Layanan yang Anda Pakai ({selectedCalcTools.size} dipilih)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCalcTools(new Set(CALCULATOR_TOOLS.map((t) => t.id)))}
                    className="text-[11px] font-bold text-neutral-700 hover:text-neutral-900 hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-neutral-300">•</span>
                  <button
                    onClick={() => setSelectedCalcTools(new Set())}
                    className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {CALCULATOR_TOOLS.map((tool) => {
                  const isChecked = selectedCalcTools.has(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleCalculatorTool(tool.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-[#F9F9F6] border-neutral-900 shadow-2xs'
                          : 'bg-white border-[#EAEAE0] hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-neutral-900 text-white' : 'border border-[#D0D0C5]'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 truncate">{tool.name}</div>
                          <div className="text-[10px] text-neutral-500">{tool.category}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-neutral-800">
                          Rp {new Intl.NumberFormat('id-ID').format(tool.price)}
                        </div>
                        <div className="text-[9px] text-neutral-400">/ bulan</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Savings Summary Card */}
            <div className="lg:col-span-5 bg-neutral-900 text-white rounded-3xl p-7 sm:p-8 border-2 border-neutral-900 shadow-bone-lg space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-1 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Hasil Kalkulasi Penghematan
                </span>
                <h3 className="text-xl font-bold text-white">Ringkasan Biaya Bulanan</h3>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 pt-2 relative z-10 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Total Beli Sendiri (Resmi):</span>
                  <span className="line-through text-neutral-400 font-medium">
                    Rp {new Intl.NumberFormat('id-ID').format(calculatedSavings.totalRetail)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-semibold">Biaya HitShare (All-In-One):</span>
                  <span className="text-emerald-400 font-bold">
                    Hanya Rp {new Intl.NumberFormat('id-ID').format(calculatedSavings.hitsharePrice)} / bln
                  </span>
                </div>

                {/* Big Highlight Box */}
                <div className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700/80 space-y-2">
                  <div className="text-xs text-neutral-400 font-medium">Anda Berhemat Setiap Bulan:</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      Rp {new Intl.NumberFormat('id-ID').format(calculatedSavings.monthlySavings)}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      Hemat {calculatedSavings.percentSavings}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, calculatedSavings.percentSavings))}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-neutral-950/50 rounded-xl text-center text-xs text-neutral-300">
                  💰 Dalam 1 tahun, Anda dapat menyimpan hingga{' '}
                  <strong className="text-white">
                    Rp {new Intl.NumberFormat('id-ID').format(calculatedSavings.yearlySavings)}
                  </strong>
                  !
                </div>
              </div>

              <a
                href="#harga"
                className="w-full py-3.5 px-6 rounded-2xl bg-white text-neutral-900 font-bold text-xs hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-md relative z-10 cursor-pointer"
              >
                <span>Pilih Paket Langganan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Keunggulan & Keamanan (Bento Grid 5-Kartu Asimetris) ── */}
      <section id="fitur" className="py-24 px-4 bg-[#F8F8F5]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Arsitektur &amp; Keamanan Teruji
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Kenapa Ribuan Pengguna Memilih HitShare?
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
              Dibangun dengan teknologi sinkronisasi sesi browser modern untuk memastikan stabilitas akses tanpa risiko keamanan.
            </p>
          </div>

          {/* Asymmetric Bento Grid (1 Wide Hero Card + 4 Supporting Cards) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Wide Bento Card (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-4xl p-7 sm:p-9 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Zero-Password Sharing
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
                    Teknologi Injeksi Sesi Terenkripsi (Tanpa Bagi Password)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
                    Keamanan nomor satu. Kami tidak pernah membagikan username atau password asli kepada pengguna. Ekstensi HitShare bekerja dengan menyuntikkan cookie sesi terenkripsi 256-bit langsung ke browser Anda. Akun bebas dari risiko dibajak, diubah password, atau terkena banned sepihak.
                  </p>
                </div>
              </div>

              {/* Visual Workflow Diagram */}
              <div className="p-4 sm:p-5 bg-[#FAF9F5] rounded-3xl border border-[#EAEAE0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-2xl border border-[#E5E5DC] w-full sm:w-auto">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-700">
                    💻
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Browser Pengguna</div>
                    <div className="text-[10px] text-neutral-500">Ekstensi HitShare</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-bold">
                  <span>←</span>
                  <span className="px-2 py-0.5 bg-emerald-100/80 rounded-md border border-emerald-200">
                    Cookie Token Terenkripsi
                  </span>
                  <span>→</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-white rounded-2xl border border-[#E5E5DC] w-full sm:w-auto">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    🔒
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900">Website Premium</div>
                    <div className="text-[10px] text-neutral-500">Netflix, ChatGPT, Canva</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Multi-Server Cadangan */}
            <div className="bg-white rounded-4xl p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900">Multi-Akun Server Anti-Limit</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Tersedia pilihan Akun 1, Akun 2, hingga Akun 5 untuk website dengan batasan perangkat. Jika satu server limit, tinggal pindah server cadangan dalam 1 detik.
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] text-xs">
                <div className="flex items-center justify-between p-1.5 bg-white rounded-xl border border-[#E8E8DE]">
                  <span className="font-semibold text-neutral-800">Server Akun 1</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif Normal</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white rounded-xl border border-[#E8E8DE]">
                  <span className="font-semibold text-neutral-800">Server Akun 2</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Cadangan Siap</span>
                </div>
              </div>
            </div>

            {/* Card 3: Device Lock Security */}
            <div className="bg-white rounded-4xl p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                  <Smartphone className="w-6 h-6 text-sky-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900">Hardware Device Lock</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Satu langganan dikunci ke 1 perangkat (Device ID) demi menjaga stabilitas akun bersama dari pemakaian liar. Ganti laptop? Admin siap bantu reset kapan saja.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] flex items-center gap-3 text-xs">
                <Lock className="w-5 h-5 text-neutral-600 shrink-0" />
                <div>
                  <div className="font-bold text-neutral-900">1 Langganan = 1 Device ID</div>
                  <div className="text-[10px] text-neutral-500">Mencegah oversharing &amp; logout</div>
                </div>
              </div>
            </div>

            {/* Card 4: Live Cookie Health Sync */}
            <div className="bg-white rounded-4xl p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900">Live Health Sync 99.8%</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Sistem pemantau berkala dan admin memastikan validitas cookie setiap hari. Ekstensi Anda otomatis menerima sesi terbaru tanpa perlu install ulang.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-neutral-900">Uptime Sesi Fresh</span>
                </div>
                <span className="font-mono font-bold text-neutral-800 bg-white px-2 py-0.5 rounded-lg border border-[#E5E5DC]">
                  99.8%
                </span>
              </div>
            </div>

            {/* Card 5: Instant QRIS Activation 24/7 */}
            <div className="bg-white rounded-4xl p-7 border border-[#E8E8DF] shadow-bone hover:border-neutral-400 hover:shadow-bone-lg transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900">Aktivasi Instan QRIS 24/7</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    Didukung gateway Paymenku. Pembayaran langsung diverifikasi otomatis detik itu juga untuk semua e-wallet &amp; Mobile Banking tanpa nunggu admin.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#EAEAE0] flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900">QRIS • Semua Bank</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Instan &amp; Otomatis
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Pilihan Paket (Pricing Section) ── */}
      <section id="harga" className="py-24 px-4 bg-[#F2F2EC] border-t border-[#E5E5DC]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Pilihan Investasi Terbaik
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Biaya Langganan Terjangkau
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
              Pilih paket yang paling pas dengan kebutuhan Anda. Semua paket otomatis mendapatkan akses penuh ke seluruh koleksi akun dan update sesi berkala.
            </p>
          </div>

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
                  <div
                    key={p.plan || idx}
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
                          <span>Update Sesi &amp; Cookie Otomatis Berkala</span>
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Guarantee & Trust Badges */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6 text-center text-xs">
            <div className="p-4 bg-white rounded-2xl border border-[#E8E8DF] shadow-2xs flex items-center justify-center gap-2.5 text-neutral-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>100% Garansi Sesi Selama Berlangganan</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-[#E8E8DF] shadow-2xs flex items-center justify-center gap-2.5 text-neutral-700">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Aktivasi Instan Otomatis via QRIS 24/7</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-[#E8E8DF] shadow-2xs flex items-center justify-center gap-2.5 text-neutral-700">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span>Customer Support Cepat Tanggap via WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Carousel Testimoni Otomatis ── */}
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

      {/* ── 7. FAQ Interaktif & Pencarian ── */}
      <section id="faq" className="py-24 px-4 bg-[#F2F2EC] border-t border-[#E5E5DC]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white text-neutral-800 border border-[#DDDDCF] shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
              Tanya Jawab
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-lg mx-auto">
              Semua yang perlu kamu ketahui tentang cara berlangganan, ekstensi, dan keamanan akun HitShare.
            </p>
          </div>

          {/* Search Bar & Category Filter */}
          <div className="space-y-4">
            <div className="relative max-w-xl mx-auto">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Cari pertanyaan seputar password, perangkat, pembayaran..."
                className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl border border-[#E0E0D8] text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-900 shadow-2xs"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', label: 'Semua Pertanyaan' },
                { id: 'umum', label: 'Umum' },
                { id: 'keamanan', label: 'Keamanan' },
                { id: 'ekstensi', label: 'Ekstensi Browser' },
                { id: 'pembayaran', label: 'Pembayaran' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveFaqCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeFaqCategory === c.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 border border-[#E0E0D8] hover:bg-[#F8F8F5]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#E8E8DF] rounded-3xl overflow-hidden shadow-bone transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4.5 text-left font-bold text-neutral-900 text-sm sm:text-base flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-[#F0F0E8] animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E8DF] text-xs text-neutral-500">
                Tidak ada pertanyaan yang cocok dengan kata kunci pencarian Anda.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 8. Floating CTA WhatsApp Banner ── */}
      <div className="py-14 px-4 bg-[#F8F8F5] border-t border-[#E8E8DF]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 p-7 sm:p-9 bg-white rounded-4xl border border-[#E5E5DC] shadow-bone-lg">
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
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Admin WhatsApp</span>
          </a>
        </div>
      </div>

      {/* ── Sticky Reveal Footer Container (Motion.dev Sticky Reveal Pattern) ── */}
      <div
        ref={footerContainerRef}
        className="relative -mt-20 pt-20"
        style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
      >
        <div className="relative h-full min-h-[480px]">
          <div className="sticky bottom-0 left-0 right-0 z-0">
            <motion.footer
              style={{
                opacity: footerOpacity,
                y: footerY,
              }}
              className="bg-[#0D0E12] text-neutral-300 pt-16 pb-12 text-sm border-t border-neutral-800 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle ambient glow in footer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-emerald-500/10 blur-[90px] pointer-events-none rounded-full" />

              <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800/80">
                  {/* Col 1: Brand Info (2 cols wide) */}
                  <div className="lg:col-span-2 space-y-4">
                    <Link to="/" className="inline-flex items-center gap-2.5 group">
                      <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
                        <img src="/icon.png" alt="HitShare Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-xl font-black tracking-tight text-white">HitShare</span>
                        <span className="block text-[10px] text-neutral-400 font-bold tracking-wider">PREMIUM ACCESS PLATFORM</span>
                      </div>
                    </Link>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
                      Solusi cerdas akses bersama tools &amp; website premium favorit tanpa bagi password. Mudah, aman, otomatis dengan ekstensi browser berteknologi tinggi.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Layanan Aktif 24/7
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-neutral-300 border border-neutral-800">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Sistem Enkripsi 256-bit
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Navigasi Produk */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Navigasi Fitur</h4>
                    <ul className="space-y-2 text-xs">
                      <li><a href="#cara-kerja" className="text-neutral-400 hover:text-white transition-colors">Cara Kerja</a></li>
                      <li><a href="#koleksi" className="text-neutral-400 hover:text-white transition-colors">Koleksi 25+ Akun</a></li>
                      <li><a href="#hemat" className="text-neutral-400 hover:text-white transition-colors">Kalkulator Hemat</a></li>
                      <li><a href="#fitur" className="text-neutral-400 hover:text-white transition-colors">Keunggulan &amp; Keamanan</a></li>
                      <li><a href="#harga" className="text-neutral-400 hover:text-white transition-colors">Pilihan Paket</a></li>
                      <li><a href="#testimoni" className="text-neutral-400 hover:text-white transition-colors">Ulasan Pengguna</a></li>
                      <li><a href="#faq" className="text-neutral-400 hover:text-white transition-colors">Tanya Jawab (FAQ)</a></li>
                    </ul>
                  </div>

                  {/* Col 3: Portal Pengguna */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Akun &amp; Layanan</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link to="/login" className="text-neutral-400 hover:text-white transition-colors">Masuk Member</Link></li>
                      <li><Link to="/daftar" className="text-neutral-400 hover:text-white transition-colors">Daftar Akun Baru</Link></li>
                      <li><Link to="/akun" className="text-neutral-400 hover:text-white transition-colors">Dashboard Saya</Link></li>
                      <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya butuh bantuan reset perangkat')}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">Reset Device ID</a></li>
                      <li><a href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Halo Admin HitShare, saya ingin konfirmasi perpanjangan')}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">Perpanjangan Langganan</a></li>
                    </ul>
                  </div>

                  {/* Col 4: Bantuan & Kontak */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bantuan &amp; Dukungan</h4>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <a
                          href={`https://wa.me/${waNumber}?text=${waMsg}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp Customer Support
                        </a>
                      </li>
                      <li><span className="text-neutral-400">Respon cepat: &lt; 10 menit</span></li>
                      <li><span className="text-neutral-400">Monitoring status sesi 24/7</span></li>
                      <li><span className="text-neutral-400">100% Garansi aktif akun</span></li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <img src="/icon.png" alt="HitShare" className="w-5 h-5 object-contain rounded-md bg-white p-0.5" />
                    <span>© {CURRENT_YEAR} <strong className="text-white">HitShare</strong>. Seluruh hak cipta dilindungi undang-undang.</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-400">
                    <a href="#fitur" className="hover:text-white transition-colors">Keamanan</a>
                    <span>•</span>
                    <a href="#harga" className="hover:text-white transition-colors">Ketentuan Layanan</a>
                    <span>•</span>
                    <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Bantuan WhatsApp</a>
                  </div>
                </div>
              </div>
            </motion.footer>
          </div>
        </div>
      </div>
    </div>
  );
}
