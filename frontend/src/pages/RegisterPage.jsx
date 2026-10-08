import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Check,
  Tag,
  ShieldCheck,
  User,
  Gift,
} from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || '6months';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field input refs for auto focus on error
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Plans & Selection
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  // Referral code state
  const refParam = (searchParams.get('ref') || searchParams.get('aff') || '').trim();
  const [refCode, setRefCode] = useState(refParam.toUpperCase());
  const [refLoading, setRefLoading] = useState(false);
  const [refVerified, setRefVerified] = useState(null);
  const [refError, setRefError] = useState('');
  const [showRefInput, setShowRefInput] = useState(Boolean(refParam));

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherResult, setVoucherResult] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [showVoucherInput, setShowVoucherInput] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  // Real-time password matching status
  const isConfirmFilled = confirmPassword.length > 0;
  const isPasswordMismatch = isConfirmFilled && password !== confirmPassword;
  const isPasswordMatch = isConfirmFilled && password.length >= 6 && password === confirmPassword;

  // Load plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/payment/plans');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPlans(res.data);
          // If query param plan matches, keep it, otherwise default to 6months or first
          setSelectedPlan((prev) => {
            if (res.data.some((p) => p.plan === prev)) return prev;
            return res.data[0]?.plan || '6months';
          });
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
        // Fallback default plans
        setPlans([
          { plan: 'monthly', label: '1 Bulan', amount: 25000, duration_days: 30 },
          { plan: '6months', label: '6 Bulan', amount: 120000, duration_days: 180 },
          { plan: 'yearly', label: '1 Tahun', amount: 200000, duration_days: 365 },
        ]);
      }
    };
    fetchPlans();
  }, []);

  // Current selected plan data
  const currentPlan = plans.find((p) => p.plan === selectedPlan) || {
    plan: selectedPlan,
    label: selectedPlan === 'monthly' ? '1 Bulan' : selectedPlan === 'yearly' ? '1 Tahun' : '6 Bulan',
    amount: selectedPlan === 'monthly' ? 25000 : selectedPlan === 'yearly' ? 200000 : 120000,
    duration_days: selectedPlan === 'monthly' ? 30 : selectedPlan === 'yearly' ? 365 : 180,
  };

  // Pricing calculations
  const baseAmount = currentPlan.amount || 0;
  const discountAmount = voucherResult?.valid ? voucherResult.discount : 0;
  const subtotal = Math.max(0, baseAmount - discountAmount);
  const adminFee = Math.ceil(subtotal * 0.007) + 200;
  const totalPay = subtotal + adminFee;

  // Validate Referral Code
  const handleValidateReferral = useCallback(async (codeToTest) => {
    const clean = (typeof codeToTest === 'string' ? codeToTest : refCode).trim().toUpperCase();
    if (!clean) return;
    setRefLoading(true);
    setRefError('');
    try {
      const res = await api.get(`/affiliate/validate/${clean}`);
      if (res.data?.valid) {
        setRefVerified(res.data);
        setRefCode(res.data.code);
        setShowRefInput(true);
      } else {
        setRefError(res.data?.message || 'Kode referral tidak valid');
        setRefVerified(null);
      }
    } catch (err) {
      setRefError(err.response?.data?.message || 'Kode referral tidak ditemukan atau tidak aktif');
      setRefVerified(null);
    } finally {
      setRefLoading(false);
    }
  }, [refCode]);

  useEffect(() => {
    if (refParam) {
      handleValidateReferral(refParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam]);

  // Validate Voucher
  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setVoucherResult(null);

    try {
      const res = await api.post('/register/validate-voucher', {
        code: voucherCode.trim(),
        plan: selectedPlan,
      });
      setVoucherResult(res.data);
    } catch (err) {
      setVoucherError(err.response?.data?.error || 'Kode voucher tidak valid');
    } finally {
      setVoucherLoading(false);
    }
  };



  // Handle Submit: Create User + QRIS Order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const errors = {};
    const nameVal = name.trim();
    const emailVal = email.trim();
    const phoneVal = phone.trim();

    if (!nameVal) {
      errors.name = 'Nama lengkap wajib diisi.';
    } else if (nameVal.length < 2) {
      errors.name = 'Nama lengkap minimal 2 karakter.';
    }

    if (!emailVal) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errors.email = 'Format alamat email tidak valid.';
    }

    if (!phoneVal) {
      errors.phone = 'Nomor WhatsApp / HP wajib diisi.';
    } else if (phoneVal.replace(/\D/g, '').length < 8) {
      errors.phone = 'Nomor WhatsApp minimal 8 digit angka.';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Ulangi password wajib diisi.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        nameInputRef.current?.focus();
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.email) {
        emailInputRef.current?.focus();
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.phone) {
        phoneInputRef.current?.focus();
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.password) {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.confirmPassword) {
        confirmPasswordInputRef.current?.focus();
        confirmPasswordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        name: nameVal,
        email: emailVal.toLowerCase(),
        phone: phoneVal,
        password,
        plan: selectedPlan,
      };

      if (voucherResult?.code) {
        payload.voucher_code = voucherResult.code;
      }

      if (refVerified?.code || refCode.trim()) {
        payload.ref_code = refVerified?.code || refCode.trim().toUpperCase();
      }

      const res = await api.post('/register/checkout', payload);

      navigate(`/daftar/bayar/${res.data.order_id}`, { state: { order: res.data } });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.html || 'Gagal memproses pendaftaran. Coba lagi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0E0D8] p-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
              <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
            Daftar & Berlangganan HitShare
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Pilih paket, selesaikan pembayaran QRIS, dan akun serta langganan Anda langsung aktif seketika.
          </p>
        </div>

        {/* Main Registration Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Step 1: Data Akun Anda */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                1. Data Akun Anda
              </label>

              <div className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                        fieldErrors.name ? 'text-rose-500' : 'text-neutral-400'
                      }`}
                    >
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="Nama lengkap Anda"
                      className={`w-full pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none min-h-[48px] transition-all ${
                        fieldErrors.name
                          ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                          : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                        fieldErrors.email ? 'text-rose-500' : 'text-neutral-400'
                      }`}
                    >
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="nama@email.com"
                      className={`w-full pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none min-h-[48px] transition-all ${
                        fieldErrors.email
                          ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                          : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                    Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                        fieldErrors.phone ? 'text-rose-500' : 'text-neutral-400'
                      }`}
                    >
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="081234567890"
                      className={`w-full pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none min-h-[48px] transition-all ${
                        fieldErrors.phone
                          ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                          : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                          fieldErrors.password ? 'text-rose-500' : 'text-neutral-400'
                        }`}
                      >
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        placeholder="Min. 6 karakter"
                        className={`w-full pl-11 pr-11 py-3 sm:py-3.5 text-xs sm:text-sm rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none min-h-[48px] transition-all ${
                          fieldErrors.password
                            ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                            : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5">
                      Ulangi Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                          isPasswordMismatch || fieldErrors.confirmPassword
                            ? 'text-rose-500'
                            : isPasswordMatch
                            ? 'text-emerald-500'
                            : 'text-neutral-400'
                        }`}
                      >
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        ref={confirmPasswordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }}
                        placeholder="Ketik ulang password"
                        className={`w-full pl-11 pr-11 py-3 sm:py-3.5 text-xs sm:text-sm rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none min-h-[48px] transition-all ${
                          isPasswordMismatch || fieldErrors.confirmPassword
                            ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                            : isPasswordMatch
                            ? 'bg-emerald-50/20 border-2 border-emerald-400 focus:border-emerald-600 focus:bg-white ring-1 ring-emerald-300/30'
                            : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {isPasswordMismatch ? (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Password tidak cocok / tidak sesuai</span>
                      </p>
                    ) : isPasswordMatch ? (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Password cocok</span>
                      </p>
                    ) : fieldErrors.confirmPassword ? (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Pilih Paket Langganan */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                2. Pilih Paket Langganan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.plan;
                  const isPopular = p.plan === '6months';
                  return (
                    <div
                      key={p.plan}
                      onClick={() => {
                        setSelectedPlan(p.plan);
                        setVoucherResult(null); // Reset voucher on plan change
                        setVoucherError('');
                      }}
                      className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50/70 shadow-xs ring-1 ring-neutral-900'
                          : 'border-[#EAEAE0] bg-white hover:border-[#D5D5CA] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      {(p.badge || isPopular) && (
                        <span className="absolute -top-2.5 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-tight shadow-xs">
                          {p.badge || 'Populer'}
                        </span>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">{p.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-base font-black text-neutral-900">
                          Rp {p.amount?.toLocaleString('id-ID')}
                        </div>
                        {(p.original > p.amount || p.original_price > p.amount) && (
                          <div className="text-[11px] text-neutral-400 line-through">
                            Rp {(p.original || p.original_price).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-neutral-500 pt-1 border-t border-[#EDEDE6]">
                        {p.duration_days} hari akses
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Kode Referral & Afiliasi */}
            <div className="pt-1">
              {!showRefInput && !refVerified ? (
                <button
                  type="button"
                  onClick={() => setShowRefInput(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer group py-1"
                >
                  <Gift className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900" />
                  <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-neutral-900">
                    Punya kode referral / afiliasi?
                  </span>
                </button>
              ) : (
                <div className="space-y-2.5 p-3.5 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Kode Referral Afiliasi</span>
                    </label>
                    {!refVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRefInput(false);
                          setRefCode('');
                          setRefError('');
                        }}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  {!refVerified ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={refCode}
                          onChange={(e) => {
                            setRefCode(e.target.value.toUpperCase());
                            setRefError('');
                          }}
                          placeholder="Masukkan kode referral (cth: ANDI20)"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 placeholder-neutral-400 uppercase font-mono tracking-wider focus:outline-none focus:border-neutral-900 min-h-[42px] transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleValidateReferral(refCode)}
                        disabled={refLoading || !refCode.trim()}
                        className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-neutral-900 hover:bg-black text-white disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 min-h-[42px]"
                      >
                        {refLoading ? 'Mengecek...' : 'Terapkan'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-emerald-800">Direferensikan oleh: </span>
                          <span className="font-bold text-emerald-950">{refVerified.referrer_name}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 font-mono text-[10px] font-bold text-emerald-800">
                            {refVerified.code}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRefVerified(null);
                          setRefCode('');
                          setShowRefInput(false);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {refError && (
                    <p className="text-xs text-rose-600 font-medium">{refError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Kode Voucher (Dengan Tombol Buka/Tutup) */}
            <div className="pt-1">
              {!showVoucherInput && !voucherResult?.valid ? (
                <button
                  type="button"
                  onClick={() => setShowVoucherInput(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer group py-1"
                >
                  <Tag className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900" />
                  <span className="underline underline-offset-4 decoration-neutral-300 group-hover:decoration-neutral-900">
                    Punya kode voucher / promo?
                  </span>
                </button>
              ) : (
                <div className="space-y-2.5 p-3.5 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Kode Voucher Promo</span>
                    </label>
                    {!voucherResult?.valid && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowVoucherInput(false);
                          setVoucherCode('');
                          setVoucherError('');
                        }}
                        className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Masukkan kode promo"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 placeholder-neutral-400 uppercase font-mono tracking-wider focus:outline-none focus:border-neutral-900 min-h-[42px] transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidateVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-neutral-900 hover:bg-black text-white disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 min-h-[42px]"
                    >
                      {voucherLoading ? 'Mengecek...' : 'Terapkan'}
                    </button>
                  </div>

                  {voucherResult?.valid && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
                      <span className="font-semibold">
                        Voucher {voucherResult.code} diterapkan (-Rp {voucherResult.discount?.toLocaleString('id-ID')})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherResult(null);
                          setVoucherCode('');
                          setShowVoucherInput(false);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {voucherError && (
                    <p className="text-xs text-rose-600 font-medium">{voucherError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Ringkasan Biaya & Tombol Bayar */}
            <div className="pt-4 border-t border-[#F0F0EB] space-y-3">
              <div className="bg-[#F8F8F4] p-4 rounded-2xl border border-[#EAEAE0] space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Paket Langganan ({currentPlan.label})</span>
                  <span className="font-bold text-neutral-900">
                    Rp {baseAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Diskon Voucher</span>
                    <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-500">
                  <span>Biaya Layanan QRIS (0.7% + Rp 200)</span>
                  <span>Rp {adminFee.toLocaleString('id-ID')}</span>
                </div>

                <div className="pt-2 border-t border-[#E5E5DC] flex justify-between items-baseline text-sm">
                  <span className="font-bold text-neutral-900">Total Pembayaran</span>
                  <span className="text-lg font-black text-neutral-900">
                    Rp {totalPay.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 text-sm font-extrabold text-white bg-neutral-900 hover:bg-black disabled:opacity-50 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
              >
                {loading ? (
                  <span>Menyiapkan QRIS...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>Bayar via QRIS & Aktifkan Akun</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pembayaran aman otomatis via QRIS (BCA, Mandiri, GoPay, OVO, ShopeePay, DANA)</span>
              </div>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-[#F0F0E8] text-center text-xs text-neutral-500 space-y-2">
            <div>
              Sudah punya akun?{' '}
              <Link to="/login" className="font-bold text-neutral-900 hover:underline">
                Masuk di sini
              </Link>
            </div>
            <div>
              <Link to="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
