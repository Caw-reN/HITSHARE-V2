import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useAlert } from '../context/AlertContext';
import {
  Download,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Check,
  ChevronRight,
  Lock,
  Phone,
  HelpCircle,
  Tag,
  RotateCcw,
  Laptop,
  Settings,
  Receipt,
  Info,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Gift,
} from 'lucide-react';
import UserAffiliateTab from '../components/UserAffiliateTab';

export default function UserDashboardPage() {
  const { isAuthenticated, refreshUser, user: authUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast, showConfirm } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ekstensi';
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [nowMs] = useState(() => Date.now());

  // Check if current user is an affiliate member
  const isAffiliate = profile ? Boolean(profile.is_affiliate) : Boolean(authUser?.is_affiliate);

  const tabs = useMemo(() => {
    const list = [
      { id: 'ekstensi', label: 'Ekstensi Browser', icon: Download },
      { id: 'device', label: 'Kunci Perangkat', icon: Laptop },
      { id: 'langganan', label: 'Langganan & Pembayaran', icon: CreditCard },
    ];
    if (isAffiliate) {
      list.push({ id: 'afiliasi', label: 'Program Afiliasi', icon: Gift });
    }
    list.push({ id: 'pengaturan', label: 'Pengaturan Akun', icon: Settings });
    return list;
  }, [isAffiliate]);

  const setActiveTab = useCallback((tab) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // Redirect non-affiliate user if on affiliate tab
  useEffect(() => {
    if (!loading && profile && !isAffiliate && activeTab === 'afiliasi') {
      setActiveTab('ekstensi');
    }
  }, [loading, profile, isAffiliate, activeTab, setActiveTab]);

  useEffect(() => {
    const updateIndicator = () => {
      const currentTabEl = tabRefs.current[activeTab];
      if (currentTabEl) {
        setIndicatorStyle({
          left: currentTabEl.offsetLeft,
          width: currentTabEl.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const timeout = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, tabs]);

  // Checkout & Voucher state
  const [selectedPlan, setSelectedPlan] = useState('6months');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherResult, setVoucherResult] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Payment QRIS modal state
  const [activeOrder, setActiveOrder] = useState(null);
  const [, setPaymentPolling] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 mins
  const [orderContext, setOrderContext] = useState('extend'); // 'extend' | 'renew' | 'activate'

  // Change Plan / Cancel Order modal state
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [changePlanModalStep, setChangePlanModalStep] = useState('prompt'); // 'prompt' | 'change'
  const [targetPlanToChange, setTargetPlanToChange] = useState(null);
  const [cancelOrderLoading, setCancelOrderLoading] = useState(false);
  const [createPaymentLoading, setCreatePaymentLoading] = useState(false);

  // Pending payment order reminder (unpaid order)
  const pendingPaymentOrder = (() => {
    if (activeOrder && activeOrder.status === 'pending' && !paymentSuccess) {
      return activeOrder;
    }
    return history.find((o) => {
      if (o.status !== 'pending') return false;
      if (o.expires_at) {
        return new Date(o.expires_at).getTime() > nowMs;
      }
      return true;
    });
  })();

  const pendingPlanLabel = (() => {
    if (!pendingPaymentOrder) return '';
    const match = plans.find((p) => p.plan === pendingPaymentOrder.plan || p.key === pendingPaymentOrder.plan);
    return match ? match.label : pendingPaymentOrder.plan?.toUpperCase();
  })();

  // Profile edit state
  const [newPhone, setNewPhone] = useState('');

  // Password edit state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Real-time new password matching status
  const isConfirmNewFilled = confirmNewPassword.length > 0;
  const isNewPasswordMismatch = isConfirmNewFilled && newPassword !== confirmNewPassword;
  const isNewPasswordMatch = isConfirmNewFilled && newPassword.length >= 6 && newPassword === confirmNewPassword;

  // Device Reset state
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDeviceMsg, setResetDeviceMsg] = useState('');
  const [resetDeviceError, setResetDeviceError] = useState('');

  const loadDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [profRes, planRes, histRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/payment/plans'),
        api.get('/user/payment-history'),
      ]);
      setProfile(profRes.data);
      try {
        localStorage.setItem('hitshare_user', JSON.stringify(profRes.data));
      } catch {
        // ignore
      }
      setNewPhone(profRes.data.phone || '');
      setPlans(planRes.data || []);
      setHistory(histRes.data || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    Promise.all([
      api.get('/user/profile'),
      api.get('/payment/plans'),
      api.get('/user/payment-history'),
    ]).then(([profRes, planRes, histRes]) => {
      if (!isMounted) return;
      setProfile(profRes.data);
      try {
        localStorage.setItem('hitshare_user', JSON.stringify(profRes.data));
      } catch {
        // ignore
      }
      setNewPhone(profRes.data.phone || '');
      setPlans(planRes.data || []);
      setHistory(histRes.data || []);
    }).catch((err) => {
      console.error('Failed to load profile:', err);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  // 10-Minute Payment Countdown Timer
  useEffect(() => {
    if (!activeOrder || paymentSuccess) return;

    const initialSec = activeOrder.expires_at
      ? Math.max(0, Math.floor((new Date(activeOrder.expires_at).getTime() - Date.now()) / 1000))
      : 600;

    const timeout = setTimeout(() => {
      setCountdownSeconds(initialSec);
    }, 0);

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [activeOrder, paymentSuccess]);

  // Validate voucher
  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    setVoucherResult(null);

    try {
      const res = await api.post('/payment/validate-voucher', {
        code: voucherCode.trim(),
        plan: selectedPlan,
      });
      setVoucherResult(res.data);
    } catch (err) {
      setVoucherError(err.response?.data?.error || 'Voucher tidak valid');
    } finally {
      setVoucherLoading(false);
    }
  };

  // Real-time status polling
  const startPolling = useCallback((orderId) => {
    setPaymentPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/payment/status/${orderId}`);
        if (res.data.status === 'paid') {
          clearInterval(interval);
          setPaymentPolling(false);
          setPaymentSuccess(true);
          await refreshUser();
          await loadDashboardData();
        } else if (['expired', 'failed', 'cancelled'].includes(res.data.status)) {
          clearInterval(interval);
          setPaymentPolling(false);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshUser, loadDashboardData]);

  // Create payment order
  const handleCreatePayment = async (planOverride = null) => {
    if (createPaymentLoading) return;
    const planToUse = planOverride || selectedPlan;

    // If user has an unpaid pending order, show notification modal first with options:
    // 1) Bayar yang sekarang (tampilkan QRIS lama)
    // 2) Ganti paket (pilih paket baru & terbitkan QRIS baru)
    // 3) Tutup
    if (!planOverride && pendingPaymentOrder) {
      setTargetPlanToChange(planToUse);
      setChangePlanModalStep('prompt');
      setChangePlanModalOpen(true);
      return;
    }

    setCreatePaymentLoading(true);
    try {
      const payload = { plan: planToUse };
      if (voucherResult && voucherResult.code) {
        payload.voucher_code = voucherResult.code;
      }

      const currentStatus = profile?.account_status;
      if (currentStatus === 'active') {
        setOrderContext('extend');
      } else if (currentStatus === 'expired') {
        setOrderContext('renew');
      } else {
        setOrderContext('activate');
      }

      const res = await api.post('/payment/create', payload);
      setActiveOrder(res.data);
      setCountdownSeconds(600);
      setPaymentSuccess(false);
      startPolling(res.data.order_id);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat pembayaran');
    } finally {
      setCreatePaymentLoading(false);
    }
  };

  // Confirm cancel old pending order and create new one
  const handleConfirmChangePlan = async () => {
    if (!pendingPaymentOrder) return;
    setCancelOrderLoading(true);
    try {
      // 1. Cancel old pending order
      await api.post(`/payment/cancel/${pendingPaymentOrder.order_id}`);

      const newPlan = targetPlanToChange || selectedPlan;
      setSelectedPlan(newPlan);
      setVoucherResult(null);

      // 2. Determine order context
      const payload = { plan: newPlan };
      const currentStatus = profile?.account_status;
      if (currentStatus === 'active') {
        setOrderContext('extend');
      } else if (currentStatus === 'expired') {
        setOrderContext('renew');
      } else {
        setOrderContext('activate');
      }

      // 3. Create new payment order for the new plan
      const res = await api.post('/payment/create', payload);

      // 4. Set active order and close change plan modal at the exact same time
      setActiveOrder(res.data);
      setCountdownSeconds(600);
      setPaymentSuccess(false);
      startPolling(res.data.order_id);
      setChangePlanModalOpen(false);
      setChangePlanModalStep('prompt');

      await loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memproses pergantian paket');
    } finally {
      setCancelOrderLoading(false);
    }
  };


  // Helper to open QRIS payment modal for pending order
  const handleOpenPendingPayment = useCallback((order) => {
    if (order.expires_at) {
      const expTime = new Date(order.expires_at).getTime();
      const diff = Math.floor((expTime - Date.now()) / 1000);
      if (diff <= 0) {
        toast.error('Pesanan ini telah kedaluwarsa (batas waktu 10 menit telah habis). Silakan buat pesanan baru.');
        loadDashboardData();
        return;
      }
      setCountdownSeconds(diff);
    } else {
      setCountdownSeconds(600);
    }

    setActiveOrder(order);
    const currentStatus = profile?.account_status;
    if (currentStatus === 'active') {
      setOrderContext('extend');
    } else if (currentStatus === 'expired') {
      setOrderContext('renew');
    } else {
      setOrderContext('activate');
    }

    setPaymentSuccess(false);
    startPolling(order.order_id);
  }, [profile?.account_status, toast, loadDashboardData, startPolling]);

  // Handle phone update
  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi');
      return;
    }
    try {
      await api.put('/user/profile', { phone: newPhone });
      toast.success('Nomor WhatsApp berhasil diperbarui');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal update nomor HP');
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Password saat ini wajib diisi');
      return;
    }
    if (!newPassword) {
      toast.error('Password baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (!confirmNewPassword) {
      toast.error('Ulangi password baru wajib diisi');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    try {
      const res = await api.put('/user/change-password', { currentPassword, newPassword });
      const msg = res.data?.message || 'Password berhasil diubah. Seluruh sesi lain telah dicabut demi keamanan.';
      toast.success(msg);
      if (res.data?.token) {
        useAuthStore.getState().setAuth({ token: res.data.token, role: 'user', user: profile });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah password');
    }
  };

  // Handle Reset Device (Self-service)
  const handleResetDevice = async () => {
    const ok = await showConfirm({
      title: 'Reset Kunci Perangkat',
      message: 'Reset kunci perangkat Anda sekarang? Setelah direset, Anda dapat langsung login di perangkat/browser baru.',
      confirmText: 'Reset Perangkat',
      isDanger: true,
    });
    if (!ok) return;

    setResetLoading(true);
    setResetDeviceMsg('');
    setResetDeviceError('');
    try {
      const res = await api.post('/user/reset-device');
      const msg = res.data.message || 'Kunci perangkat berhasil direset!';
      setResetDeviceMsg(msg);
      toast.success(msg);
      setProfile((prev) => ({ ...prev, device_id: null }));
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Gagal mereset perangkat';
      setResetDeviceError(errText);
      toast.error(errText);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] text-neutral-800 flex flex-col">
        <Navbar />
        <main className="max-w-6xl mx-auto w-full px-4 py-8 space-y-8 flex-1 animate-pulse">
          {/* Top Header Section: 1/4 Profile Card & 3/4 Subscription Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Card 1: User Profile Skeleton (1/4 Width on lg) */}
            <div className="md:col-span-4 lg:col-span-3 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-20 bg-[#EBEBE4] rounded-md"></div>
                  <div className="h-5 w-14 bg-[#EBEBE4] rounded-full"></div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="h-6 sm:h-7 w-36 bg-[#EBEBE4] rounded-xl"></div>
                  <div className="h-4 w-44 bg-[#F1F1EB] rounded-lg"></div>
                  <div className="h-3.5 w-28 bg-[#F1F1EB] rounded"></div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-[#F0F0EB] flex items-center justify-between">
                <div className="h-4 w-28 bg-[#F1F1EB] rounded-lg"></div>
                <div className="h-4 w-12 bg-[#EBEBE4] rounded-lg"></div>
              </div>
            </div>

            {/* Card 2: Subscription Status Skeleton (3/4 Width on lg) */}
            <div className="md:col-span-8 lg:col-span-9 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#EBEBE4] rounded-md"></div>
                    <div className="h-3.5 w-32 bg-[#EBEBE4] rounded-md"></div>
                  </div>
                  <div className="h-5 w-24 bg-[#EBEBE4] rounded-full"></div>
                </div>

                <div className="flex items-baseline justify-between gap-4 flex-wrap pt-1">
                  <div className="h-7 sm:h-8 w-64 bg-[#EBEBE4] rounded-xl"></div>
                  <div className="h-5 w-32 bg-[#F1F1EB] rounded-lg"></div>
                </div>
              </div>

              {/* Progress bar skeleton */}
              <div className="pt-3.5 border-t border-[#F0F0EB] space-y-2.5">
                <div className="w-full h-5 sm:h-6 bg-[#EBEBE4] rounded-full"></div>
                <div className="flex items-center justify-between pt-0.5">
                  <div className="h-3.5 w-36 bg-[#F1F1EB] rounded-lg"></div>
                  <div className="h-3.5 w-32 bg-[#F1F1EB] rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Navigation Tabs Skeleton */}
          <div className="flex justify-center w-full overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-[#EFEFE8] rounded-2xl border border-[#DDDDCF] shadow-xs shrink-0">
              <div
                className={`h-9 w-36 rounded-xl ${
                  activeTab === 'ekstensi' ? 'bg-[#DDDDCF]' : 'bg-[#E5E5DC]'
                }`}
              ></div>
              <div
                className={`h-9 w-36 rounded-xl ${
                  activeTab === 'device' ? 'bg-[#DDDDCF]' : 'bg-[#E5E5DC]'
                }`}
              ></div>
              <div
                className={`h-9 w-48 rounded-xl ${
                  activeTab === 'langganan' ? 'bg-[#DDDDCF]' : 'bg-[#E5E5DC]'
                }`}
              ></div>
              {isAffiliate && (
                <div
                  className={`h-9 w-40 rounded-xl ${
                    activeTab === 'afiliasi' ? 'bg-[#DDDDCF]' : 'bg-[#E5E5DC]'
                  }`}
                ></div>
              )}
              <div
                className={`h-9 w-36 rounded-xl ${
                  activeTab === 'pengaturan' ? 'bg-[#DDDDCF]' : 'bg-[#E5E5DC]'
                }`}
              ></div>
            </div>
          </div>

          {/* Tab Content Skeleton */}
          {activeTab === 'langganan' ? (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Beli / Perpanjang Paket Skeleton */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#EBEBE4]"></div>
                      <div className="space-y-1.5">
                        <div className="h-4 w-44 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-3 w-56 bg-[#F1F1EB] rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-28 bg-[#EBEBE4] rounded-full"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-[#EBEBE4] rounded-md"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="h-28 bg-[#FBFBF9] border border-[#EAEAE3] rounded-2xl p-3.5 flex flex-col justify-between">
                        <div className="h-3.5 w-16 bg-[#EBEBE4] rounded"></div>
                        <div className="h-5 w-24 bg-[#EBEBE4] rounded"></div>
                        <div className="h-3 w-20 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="h-28 bg-[#FBFBF9] border border-[#EAEAE3] rounded-2xl p-3.5 flex flex-col justify-between">
                        <div className="h-3.5 w-16 bg-[#EBEBE4] rounded"></div>
                        <div className="h-5 w-24 bg-[#EBEBE4] rounded"></div>
                        <div className="h-3 w-20 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="h-28 bg-[#FBFBF9] border border-[#EAEAE3] rounded-2xl p-3.5 flex flex-col justify-between">
                        <div className="h-3.5 w-16 bg-[#EBEBE4] rounded"></div>
                        <div className="h-5 w-24 bg-[#EBEBE4] rounded"></div>
                        <div className="h-3 w-20 bg-[#F1F1EB] rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="h-12 bg-[#FBFBF9] border border-[#EAEAE3] rounded-2xl"></div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-4 w-36 bg-[#EBEBE4] rounded-lg"></div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <div className="h-3.5 w-24 bg-[#F1F1EB] rounded"></div>
                      <div className="h-3.5 w-20 bg-[#F1F1EB] rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3.5 w-28 bg-[#F1F1EB] rounded"></div>
                      <div className="h-3.5 w-16 bg-[#F1F1EB] rounded"></div>
                    </div>
                  </div>
                  <div className="h-12 w-full bg-[#EBEBE4] rounded-2xl mt-2"></div>
                </div>
              </div>

              {/* Right Column: Riwayat Pembayaran Skeleton */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#EBEBE4] rounded"></div>
                      <div className="h-4 w-36 bg-[#EBEBE4] rounded-lg"></div>
                    </div>
                    <div className="h-5 w-20 bg-[#EBEBE4] rounded-full"></div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="h-16 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-[#EBEBE4] rounded"></div>
                        <div className="h-3 w-24 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <div className="h-4 w-20 bg-[#EBEBE4] rounded ml-auto"></div>
                        <div className="h-3 w-14 bg-[#EBEBE4] rounded-full ml-auto"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-[#EBEBE4] rounded"></div>
                        <div className="h-3 w-24 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <div className="h-4 w-20 bg-[#EBEBE4] rounded ml-auto"></div>
                        <div className="h-3 w-14 bg-[#EBEBE4] rounded-full ml-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'afiliasi' && isAffiliate ? (
            /* Affiliate Tab Skeleton */
            <div className="space-y-6 sm:space-y-8 animate-pulse">
              {/* Row 1: 3/4 Link + 1/4 Saldo Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-8 lg:col-span-9 bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-center space-y-2.5 sm:space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-36 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-5 w-24 bg-[#EBEBE4] rounded-md"></div>
                      </div>
                      <div className="h-4 w-28 bg-[#F1F1EB] rounded-md hidden lg:block"></div>
                    </div>
                    <div className="h-3.5 w-72 sm:w-96 bg-[#F1F1EB] rounded"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-0.5">
                    <div className="h-10 flex-1 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl"></div>
                    <div className="h-10 w-28 bg-[#EBEBE4] rounded-2xl"></div>
                  </div>
                </div>

                <div className="md:col-span-4 lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-2.5 sm:space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-24 bg-[#EBEBE4] rounded"></div>
                      <div className="w-7 h-7 rounded-xl bg-[#EBEBE4]"></div>
                    </div>
                    <div>
                      <div className="h-7 w-28 bg-[#EBEBE4] rounded-lg"></div>
                      <div className="h-3 w-32 bg-[#F1F1EB] rounded mt-1"></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#F0F0EB]">
                    <div className="h-9 w-full bg-[#EBEBE4] rounded-xl"></div>
                  </div>
                </div>
              </div>

              {/* Row 2: Cara Kerja Skeleton */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EBEBE4]"></div>
                  <div className="space-y-1">
                    <div className="h-4 w-44 bg-[#EBEBE4] rounded-md"></div>
                    <div className="h-3 w-64 bg-[#F1F1EB] rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-[#EBEBE4]"></div>
                    <div className="h-4 w-32 bg-[#EBEBE4] rounded"></div>
                    <div className="h-3 w-full bg-[#F1F1EB] rounded"></div>
                  </div>
                  <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-[#EBEBE4]"></div>
                    <div className="h-4 w-32 bg-[#EBEBE4] rounded"></div>
                    <div className="h-3 w-full bg-[#F1F1EB] rounded"></div>
                  </div>
                  <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-[#EBEBE4]"></div>
                    <div className="h-4 w-32 bg-[#EBEBE4] rounded"></div>
                    <div className="h-3 w-full bg-[#F1F1EB] rounded"></div>
                  </div>
                </div>
              </div>

              {/* Row 3: 12-col Main Grid Skeleton */}
              <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                    <div className="h-5 w-36 bg-[#EBEBE4] rounded-lg"></div>
                    <div className="h-24 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                  </div>
                  <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-3">
                    <div className="h-5 w-40 bg-[#EBEBE4] rounded-lg"></div>
                    <div className="h-14 bg-[#FBFBF9] rounded-xl"></div>
                    <div className="h-14 bg-[#FBFBF9] rounded-xl"></div>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  {/* Top Mini Stats Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl flex items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-20 bg-[#EBEBE4] rounded"></div>
                        <div className="h-6 w-28 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-3 w-32 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#EBEBE4] shrink-0"></div>
                    </div>
                    <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl flex items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-24 bg-[#EBEBE4] rounded"></div>
                        <div className="h-6 w-28 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-3 w-36 bg-[#F1F1EB] rounded"></div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#EBEBE4] shrink-0"></div>
                    </div>
                  </div>

                  <div className="inline-flex gap-1.5 p-1.5 bg-[#EFEFE8] rounded-2xl border border-[#DDDDCF]">
                    <div className="h-8 w-28 bg-[#DDDDCF] rounded-xl"></div>
                    <div className="h-8 w-28 bg-[#E5E5DC] rounded-xl"></div>
                    <div className="h-8 w-28 bg-[#E5E5DC] rounded-xl"></div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Default Tab Content Skeleton (Ekstensi Browser, Device, Pengaturan) */
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EBEBE4]"></div>
                      <div className="space-y-1.5">
                        <div className="h-5 w-48 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-3.5 w-64 bg-[#F1F1EB] rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-[#EBEBE4] rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-[#F1F1EB] rounded"></div>
                    <div className="h-4 w-3/4 bg-[#F1F1EB] rounded"></div>
                  </div>
                  <div className="h-14 w-full bg-[#EBEBE4] rounded-2xl"></div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-44 bg-[#EBEBE4] rounded-lg"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-[#F1F1EB] rounded"></div>
                    <div className="h-4 w-5/6 bg-[#F1F1EB] rounded"></div>
                    <div className="h-4 w-4/5 bg-[#F1F1EB] rounded"></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-36 bg-[#EBEBE4] rounded-lg"></div>
                  <div className="space-y-3">
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                    <div className="h-12 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Calculate subscription progress details
  const subProgress = (() => {
    if (!profile?.expires_at || profile?.days_left === null) {
      return {
        percent: 0,
        daysLeft: 0,
        totalDays: 0,
        formattedExpiry: null,
        isExpiringSoon: false,
        isExpired: true,
      };
    }

    const daysLeft = Math.max(0, Number(profile.days_left));
    const isExpired = daysLeft === 0;

    // Calculate totalDays by accumulating duration_days of paid orders in the active subscription period
    let totalDays = 0;
    if (Array.isArray(history) && history.length > 0) {
      const paidOrders = history.filter((o) => (o.status === 'paid' || o.status === 'success') && o.duration_days);
      for (const order of paidOrders) {
        totalDays += Number(order.duration_days);
        if (totalDays >= daysLeft) {
          break;
        }
      }
    }

    // Fallback if history is empty or didn't reach daysLeft
    if (!totalDays || totalDays < daysLeft) {
      if (profile.created_at && profile.expires_at) {
        const start = new Date(profile.created_at).getTime();
        const end = new Date(profile.expires_at).getTime();
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diff >= daysLeft) totalDays = diff;
      }
    }

    if (!totalDays || totalDays < daysLeft) {
      totalDays = daysLeft;
    }

    const percent = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((daysLeft / totalDays) * 100))) : 0;
    const formattedExpiry = new Date(profile.expires_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return {
      percent,
      daysLeft,
      totalDays,
      formattedExpiry,
      isExpiringSoon: daysLeft > 0 && daysLeft <= 10,
      isExpired,
    };
  })();

  // Dynamic card styling that becomes increasingly red when daysLeft <= 10
  const cardExpiryStyle = (() => {
    const days = subProgress.daysLeft;
    if (subProgress.isExpired) {
      return {
        cardBg: 'bg-rose-50 border-rose-500 shadow-md shadow-rose-100 ring-2 ring-rose-400/40',
        textColor: 'text-rose-600',
        dotColor: 'bg-rose-600',
        statusText: 'Masa Aktif Habis',
        isCritical: true,
      };
    }

    if (days === null || days === undefined || days > 10) {
      return {
        cardBg: 'bg-white border-[#E8E8DF] shadow-bone',
        textColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
        statusText: 'Paket Aktif',
        isCritical: false,
      };
    }

    // Days left <= 10: Gradually becomes redder the closer to 0!
    if (days >= 8) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 border-rose-200/90 shadow-sm shadow-rose-50',
        textColor: 'text-rose-600',
        dotColor: 'bg-rose-500',
        statusText: 'Segera Berakhir',
        isCritical: false,
      };
    } else if (days >= 5) {
      return {
        cardBg: 'bg-gradient-to-br from-rose-100/50 via-rose-50/30 to-white border-rose-300 shadow-md shadow-rose-100/50',
        textColor: 'text-rose-600',
        dotColor: 'bg-rose-500',
        statusText: 'Segera Berakhir',
        isCritical: false,
      };
    } else if (days >= 2) {
      // 2 - 4 hari (e.g., 4 days left): Strong red tint
      return {
        cardBg: 'bg-gradient-to-br from-rose-100/80 via-rose-50/60 to-white border-rose-400 shadow-md shadow-rose-100 ring-1 ring-rose-300/60',
        textColor: 'text-rose-700 font-extrabold',
        dotColor: 'bg-rose-600',
        statusText: 'Segera Berakhir',
        isCritical: true,
      };
    } else {
      // 1 hari: Deep critical red
      return {
        cardBg: 'bg-gradient-to-br from-rose-100 via-rose-100/80 to-rose-50 border-rose-500 shadow-lg shadow-rose-200 ring-2 ring-rose-400/80',
        textColor: 'text-rose-700 font-extrabold',
        dotColor: 'bg-rose-600',
        statusText: 'Segera Berakhir (Kritis)',
        isCritical: true,
      };
    }
  })();

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-neutral-800 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 py-8 space-y-8 flex-1">
        {/* Top Header Section: 1/4 Profile Card & 3/4 Subscription Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: User Profile & Device (1/4 Width on lg) */}
          <div className="md:col-span-4 lg:col-span-3 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Profil Akun
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight truncate">
                  Halo, {profile?.name ? profile.name.trim().split(/\s+/)[0] : (profile?.email?.split('@')[0] || 'Member')}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 truncate" title={profile?.email}>
                  {profile?.email}
                </p>
                {profile?.phone && (
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    WA: {profile.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#F0F0EB] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Laptop className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="text-neutral-500">Device:</span>
                <span
                  className={`font-bold truncate ${
                    profile?.device_id ? 'text-amber-800' : 'text-emerald-700'
                  }`}
                >
                  {profile?.device_id ? 'Terkunci' : 'Bebas'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('device')}
                className="font-bold text-neutral-900 hover:underline cursor-pointer flex items-center gap-0.5 shrink-0 ml-1"
              >
                <span>Kelola</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Subscription Status & Progress Bar (3/4 Width on lg, increasingly red if <= 10 days) */}
          <div
            className={`md:col-span-8 lg:col-span-9 p-6 sm:p-7 rounded-3xl border flex flex-col justify-between space-y-5 transition-all duration-300 ${cardExpiryStyle.cardBg}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Status Langganan
                  </span>
                </div>

                {subProgress.formattedExpiry ? (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${cardExpiryStyle.textColor}`}>
                    <span className={`w-2 h-2 rounded-full ${cardExpiryStyle.dotColor}`}></span>
                    <span>{cardExpiryStyle.statusText}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-neutral-300"></span>
                    <span>Belum Aktif</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-neutral-900">
                    {subProgress.formattedExpiry
                      ? `Berlaku hingga ${subProgress.formattedExpiry}`
                      : 'Belum berlangganan'}
                  </div>
                  {!subProgress.formattedExpiry && (
                    <p className="text-xs text-neutral-500 font-medium">
                      Aktifkan paket untuk membuka seluruh fitur dan akses ekstensi Hitshare.
                    </p>
                  )}
                </div>

                {subProgress.formattedExpiry && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('langganan')}
                    className="text-xs sm:text-sm font-bold text-neutral-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{subProgress.isExpired ? 'Perpanjang Sekarang' : 'Perpanjang Paket'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Section: Single Big CTA Button if unsubscribed, or Zebra Progress Bar if subscribed */}
            {!subProgress.formattedExpiry ? (
              <div className="pt-3.5 border-t border-[#F0F0EB]">
                <button
                  type="button"
                  onClick={() => setActiveTab('langganan')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-black text-white text-sm sm:text-base font-extrabold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                >
                  <Sparkles className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>Mulai Berlangganan Sekarang</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="pt-3.5 border-t border-[#F0F0EB] space-y-2.5">
                <div className="w-full h-5 sm:h-6 bg-[#E8E8E0] rounded-full overflow-hidden p-1 border border-[#D5D5CA] shadow-inner relative flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                      subProgress.isExpired ? 'w-0' : 'zebra-stripes'
                    }`}
                    style={{
                      width: subProgress.isExpired ? '0%' : `${Math.max(subProgress.percent, 3)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                    <span>
                      Sisa masa aktif:{' '}
                      <strong className="font-extrabold text-neutral-900">
                        {subProgress.daysLeft} hari
                      </strong>
                    </span>
                  </span>
                  <span className="text-neutral-500 font-medium">
                    Total durasi: <strong className="font-bold text-neutral-700">{subProgress.totalDays} hari</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pending Payment Reminder Banner (Between Profile/Subscription cards and Nav Tabs) */}
        {pendingPaymentOrder && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-orange-50/50 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 shadow-sm shadow-amber-500/5 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Left Side: Icon & Details */}
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      Menunggu Pembayaran
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-400">
                      Order #{pendingPaymentOrder.order_id?.slice(-8)}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight leading-snug">
                    Segera Selesaikan Pembayaran Paket {pendingPlanLabel}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Pesanan Anda sebesar{' '}
                    <strong className="font-extrabold text-neutral-900">
                      Rp {Number(pendingPaymentOrder.amount || 0).toLocaleString('id-ID')}
                    </strong>{' '}
                    sedang menunggu pembayaran. Masa aktif akan otomatis bertambah setelah pembayaran terverifikasi.
                  </p>
                </div>
              </div>

              {/* Right Side: CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setTargetPlanToChange(null);
                    setChangePlanModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-white/90 hover:bg-white text-neutral-800 border border-amber-300 font-bold text-xs sm:text-sm rounded-2xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Ganti Paket</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPendingPayment(pendingPaymentOrder)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-4.5 h-4.5 text-white" />
                  <span>Bayar Sekarang (QRIS)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Navigation Tabs with Smooth Sliding Pill */}
        <div className="flex justify-center w-full overflow-x-auto no-scrollbar py-1">
          <div className="relative inline-flex items-center p-1.5 bg-[#EFEFE8] rounded-2xl border border-[#DDDDCF] shadow-xs shrink-0 select-none">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1.5 bottom-1.5 bg-neutral-900 rounded-xl shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                    isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-105' : 'text-neutral-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content with Smooth Transition */}
        <div key={activeTab} className="animate-tab-switch">
          {/* Tab 1: Ekstensi Browser */}
          {activeTab === 'ekstensi' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-sm">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Ekstensi Browser HitShare</h2>
                      <p className="text-sm text-neutral-500">Google Chrome, Microsoft Edge, Brave, Opera</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200">
                    v{profile?.settings?.extension_version || '2.0.0'}
                  </span>
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed">
                  Gunakan ekstensi resmi HitShare untuk mengakses akun-akun premium secara instan dengan 1-klik tanpa perlu memasukkan password secara manual.
                </p>

                <a
                  href={profile?.settings?.extension_download_url || '/downloads/extension.zip'}
                  download
                  className="w-full py-4 px-5 text-sm sm:text-base font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-neutral-300" />
                  Download Ekstensi Sekarang ({profile?.settings?.extension_file_size || '350 KB'})
                </a>
              </div>

              {/* Guide Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                <h3 className="text-base font-bold text-neutral-900">Panduan Pemasangan Cepat</h3>
                <ol className="text-sm text-neutral-600 space-y-3 list-decimal list-inside leading-relaxed font-normal">
                  <li className="pl-1"><span className="font-semibold text-neutral-800">Download</span> file <code className="bg-[#EAEAE3] px-2 py-0.5 rounded text-xs font-mono font-semibold">extension.zip</code> melalui tombol di atas.</li>
                  <li className="pl-1"><span className="font-semibold text-neutral-800">Ekstrak</span> file ZIP ke dalam folder di komputer/laptop Anda.</li>
                  <li className="pl-1">Buka browser, ketik <code className="bg-[#EAEAE3] px-2 py-0.5 rounded text-xs font-mono font-semibold">chrome://extensions</code> di address bar, lalu aktifkan <span className="font-semibold text-neutral-900">Developer mode</span> (di pojok kanan atas).</li>
                  <li className="pl-1">Klik tombol <span className="font-semibold text-neutral-900">Load unpacked</span> dan pilih folder ekstensi yang sudah diekstrak tadi.</li>
                  <li className="pl-1">Sematkan (pin) ikon HitShare di toolbar browser, buka lalu login dengan email dan password akun Anda.</li>
                </ol>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                <div className="flex items-center gap-2.5 text-neutral-900 font-bold">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3>Informasi Penting</h3>
                </div>
                <ul className="text-xs sm:text-sm text-neutral-600 space-y-3.5 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Pastikan selalu menggunakan browser berbasis Chromium versi terkini untuk kompatibilitas terbaik.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Satu akun hanya dapat aktif pada 1 perangkat. Jika berpindah perangkat, Anda dapat melakukan reset mandiri di tab <strong>Kunci Perangkat</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Jangan pernah membagikan password atau cookie ekstensi Anda kepada pihak lain untuk mencegah pemblokiran akun.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Kunci Perangkat */}
        {activeTab === 'device' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-sm">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Kunci Perangkat (Device Lock)</h2>
                      <p className="text-xs sm:text-sm text-neutral-500">1 Akun HitShare = 1 Perangkat / Browser Aktif</p>
                    </div>
                  </div>
                  {profile?.device_id ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Lock className="w-3.5 h-3.5" />
                      Terkunci
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      Bebas
                    </span>
                  )}
                </div>

                <div className="p-4.5 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] space-y-3">
                  <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Status Akses Login Ekstensi:
                  </div>
                  {profile?.device_id ? (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                        Akun Anda saat ini terkunci di perangkat browser yang aktif. Jika Anda berganti komputer/laptop, menginstal ulang browser, atau ekstensi menampilkan pesan <em>"Akun sudah terdaftar di perangkat lain"</em>, gunakan tombol reset di bawah.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 bg-[#EAEAE3] px-3 py-2 rounded-xl w-fit">
                        <span className="font-semibold text-neutral-800">Device ID Terdaftar:</span>
                        <span>{profile.device_id.slice(0, 24)}...</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                      Akun Anda saat ini <strong>Bebas</strong> (belum terikat ke perangkat mana pun). Saat Anda login di ekstensi browser, perangkat tersebut akan otomatis terdaftar dan terkunci untuk keamanan akun bersama.
                    </p>
                  )}
                </div>

                {resetDeviceMsg && (
                  <div className="p-3.5 rounded-2xl text-xs sm:text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>{resetDeviceMsg}</span>
                  </div>
                )}

                {resetDeviceError && (
                  <div className="p-3.5 rounded-2xl text-xs sm:text-sm bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2.5">
                    <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>{resetDeviceError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!profile?.device_id || resetLoading}
                  onClick={handleResetDevice}
                  className={`w-full py-4 px-5 text-sm sm:text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    profile?.device_id
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-[#F1F1EB] text-neutral-400 cursor-not-allowed border border-[#E0E0D8]'
                  }`}
                >
                  <RotateCcw className={`w-4.5 h-4.5 ${resetLoading ? 'animate-spin' : ''}`} />
                  {resetLoading ? 'Mereset Kunci Perangkat...' : 'Reset Kunci Perangkat Sendiri'}
                </button>
                {profile?.device_id && (
                  <p className="text-center text-xs text-neutral-400 -mt-2">
                    *Setelah klik reset, buka kembali ekstensi browser di perangkat baru Anda dan login seperti biasa.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                <div className="flex items-center gap-2.5 text-neutral-900 font-bold">
                  <HelpCircle className="w-5 h-5 text-neutral-700" />
                  <h3>Tanya Jawab Kunci Perangkat</h3>
                </div>
                <div className="space-y-4 text-xs sm:text-sm text-neutral-600">
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">Mengapa akun saya bisa terkunci?</h4>
                    <p className="leading-relaxed">
                      Untuk menjaga kualitas layanan dan akun bersama agar tidak disalahgunakan, sistem kami membatasi 1 user hanya aktif di 1 browser/laptop pada waktu yang sama.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">Kapan saya harus melakukan reset?</h4>
                    <p className="leading-relaxed">
                      Lakukan reset hanya jika Anda berganti komputer/laptop, selesai menginstal ulang browser/OS, atau jika ekstensi melaporkan perangkat tidak cocok.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">Apakah masa aktif langganan saya berkurang?</h4>
                    <p className="leading-relaxed">
                      Tidak sama sekali. Reset perangkat hanya mengosongkan identitas browser tanpa mempengaruhi sisa waktu langganan Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Langganan & Pembayaran */}
        {activeTab === 'langganan' && (
          <div className="animate-in fade-in duration-200">
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Beli / Perpanjang Paket */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                        <CreditCard className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-neutral-900">Perpanjang / Beli Paket</h2>
                        <p className="text-xs text-neutral-500">Pilih durasi paket langganan HitShare Anda</p>
                      </div>
                    </div>
                  </div>

                  {/* Plan Selector Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Pilihan Paket:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {plans.map((p) => {
                        const isSelected = selectedPlan === p.key;
                        const months = p.duration_days
                          ? Math.round(p.duration_days / 30)
                          : p.key === '6months'
                          ? 6
                          : p.key === '1year'
                          ? 12
                          : 1;
                        const perMonth = months > 1 ? Math.round(p.amount / months) : null;

                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => {
                              if (pendingPaymentOrder) {
                                setTargetPlanToChange(p.key);
                                setChangePlanModalStep('prompt');
                                setChangePlanModalOpen(true);
                              } else {
                                setSelectedPlan(p.key);
                                setVoucherResult(null);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer flex flex-col justify-between space-y-2 select-none ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-50/70 shadow-xs ring-1 ring-neutral-900'
                                : 'border-[#EAEAE0] bg-white hover:border-[#D5D5CA] hover:bg-[#FAFAF7]'
                            }`}
                          >
                            {(p.badge || p.key === '6months' || p.key === '1year') && (
                              <span className="absolute -top-2.5 right-2 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs bg-emerald-500 text-white">
                                {p.badge || (p.key === '6months' ? 'Hemat 20%' : 'Terbaik')}
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
                              <div className="text-base sm:text-lg font-black text-neutral-900">
                                Rp {p.amount?.toLocaleString('id-ID')}
                              </div>
                              {(p.original > p.amount || p.original_price > p.amount) && (
                                <div className="text-[11px] text-neutral-400 line-through">
                                  Rp {(p.original || p.original_price).toLocaleString('id-ID')}
                                </div>
                              )}
                            </div>

                            <div className="text-[11px] font-medium text-neutral-500 pt-1.5 border-t border-[#EDEDE6]">
                              {perMonth ? `~Rp ${perMonth.toLocaleString('id-ID')}/bln` : `${p.duration_days || 30} hari akses`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Voucher Code Box (Compact Inline Group) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Punya kode promo / voucher?"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm uppercase font-mono bg-[#FBFBF9] border border-[#DDDDCF] rounded-xl text-neutral-900 placeholder:normal-case placeholder:font-sans placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[42px] transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleValidateVoucher}
                        disabled={voucherLoading || !voucherCode.trim()}
                        className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shrink-0 min-h-[42px]"
                      >
                        {voucherLoading ? 'Cek...' : 'Terapkan'}
                      </button>
                    </div>

                    {voucherResult && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Voucher <strong>{voucherResult.code}</strong> aktif (Potongan Rp{' '}
                            {voucherResult.discount?.toLocaleString('id-ID')})
                          </span>
                        </div>
                        <button
                          onClick={() => setVoucherResult(null)}
                          className="text-xs text-emerald-700 underline font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                    {voucherError && <div className="text-xs text-rose-600 font-medium pl-1">{voucherError}</div>}
                  </div>

                  {/* Price Breakdown & CTA Receipt */}
                  <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] space-y-2.5">
                    {(() => {
                      const currentPlan = plans.find((p) => p.key === selectedPlan);
                      const subtotal = currentPlan ? currentPlan.amount : 25000;
                      const discount = voucherResult ? voucherResult.discount : 0;
                      const finalSubtotal = Math.max(0, subtotal - discount);
                      const adminFee = Math.ceil(finalSubtotal * 0.007) + 200;
                      const total = finalSubtotal + adminFee;

                      return (
                        <>
                          <div className="space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between text-neutral-500">
                              <span>Harga Paket ({currentPlan?.label || '1 Bulan'})</span>
                              <span className="font-medium text-neutral-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Diskon Promo Voucher</span>
                                <span>- Rp {discount.toLocaleString('id-ID')}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-neutral-500">
                              <span>Biaya Layanan QRIS (0.7% + Rp 200)</span>
                              <span className="font-medium text-neutral-800">Rp {adminFee.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2 border-t border-[#EAEAE3]">
                              <div>
                                <span className="text-sm font-bold text-neutral-900">Total Pembayaran</span>
                                <p className="text-[11px] text-neutral-400">Verifikasi instan otomatis 24/7</p>
                              </div>
                              <span className="text-xl font-black text-neutral-900">
                                Rp {total.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCreatePayment()}
                            disabled={createPaymentLoading}
                            className="w-full mt-2 py-3.5 px-5 text-sm sm:text-base font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
                          >
                            {createPaymentLoading ? (
                              <>
                                <RefreshCw className="w-4.5 h-4.5 text-neutral-300 animate-spin" />
                                <span>Memproses Pembayaran...</span>
                              </>
                            ) : (
                              <>
                                <QrCode className="w-4.5 h-4.5 text-neutral-300" />
                                <span>
                                  {pendingPaymentOrder
                                    ? 'Beli Lagi / Lanjutkan Pembayaran'
                                    : 'Bayar Sekarang dengan QRIS'}
                                </span>
                              </>
                            )}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column: Riwayat Pembayaran (Compact Transaction Feed) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                        <Receipt className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-neutral-900">Riwayat Pembayaran</h2>
                        <p className="text-xs text-neutral-500">Daftar transaksi akun Anda</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                      {history.length} Transaksi
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <Receipt className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-sm font-semibold text-neutral-600">Belum Ada Transaksi</p>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                        Paket yang Anda bayar akan otomatis tercatat dan dapat dilihat di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {history.map((order, idx) => {
                        const isPaid = order.status === 'paid' || order.status === 'success';
                        const isOrderExpired = !isPaid && order.status === 'pending' && order.expires_at && new Date(order.expires_at).getTime() <= nowMs;
                        const isPending = !isPaid && order.status === 'pending' && !isOrderExpired;
                        const isCancelled = order.status === 'cancelled';
                        const isExpired = order.status === 'expired' || isOrderExpired;
                        const isFailed = order.status === 'failed';
                        const formattedDate = order.created_at
                          ? new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-';

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-[#ECECE5] bg-[#FBFBF9] hover:bg-white hover:border-neutral-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-700'
                                    : isFailed
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-neutral-100 text-neutral-400'
                                }`}
                              >
                                {isPaid ? (
                                  <CheckCircle2 className="w-4.5 h-4.5" />
                                ) : isPending ? (
                                  <Clock className="w-4.5 h-4.5" />
                                ) : (
                                  <XCircle className="w-4.5 h-4.5" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                    Paket {order.plan?.toUpperCase()}
                                  </span>
                                  <span
                                    className="font-mono text-[10px] text-neutral-400 bg-[#EAEAE3] px-1.5 py-0.5 rounded cursor-pointer hover:text-neutral-700"
                                    title={`Klik untuk salin: ${order.order_id}`}
                                    onClick={() => {
                                      navigator.clipboard.writeText(order.order_id);
                                      toast.success(`Order ID disalin: ${order.order_id}`);
                                    }}
                                  >
                                    #{order.order_id?.slice(-8)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5">{formattedDate}</div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 space-y-1">
                              <div className="text-xs sm:text-sm font-black text-neutral-900">
                                Rp {order.amount?.toLocaleString('id-ID')}
                              </div>
                              <div>
                                {isPaid && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Lunas
                                  </span>
                                )}
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPendingPayment(order)}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors shadow-2xs"
                                    title="Buka QRIS untuk bayar"
                                  >
                                    <span>Bayar QR</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                                {isCancelled && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                                    Dibatalkan
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                                    Kedaluwarsa
                                  </span>
                                )}
                                {isFailed && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-200">
                                    Gagal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Afiliasi */}
        {activeTab === 'afiliasi' && isAffiliate && (
          <UserAffiliateTab profile={profile} toast={toast} showConfirm={showConfirm} />
        )}

        {/* Tab 4: Pengaturan Akun */}
        {activeTab === 'pengaturan' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-neutral-800" />
                  <h2 className="text-base font-bold text-neutral-900">Nomor WhatsApp / HP</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500">
                  Nomor WhatsApp digunakan untuk konfirmasi transaksi atau bantuan teknis seputar akun Anda.
                </p>

                <form onSubmit={handleUpdatePhone} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">No. WhatsApp</label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-colors cursor-pointer"
                  >
                    Simpan Nomor
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-neutral-800" />
                  <h2 className="text-base font-bold text-neutral-900">Ubah Password Akun</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500">
                  Gunakan password yang kuat dengan minimal 6 karakter. Password ini digunakan untuk login ke web dan ekstensi.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">

                  {/* Password Saat Ini */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Password Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passError) setPassError('');
                        }}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-11 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Password Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passError) setPassError('');
                        }}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-4 pr-11 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Ulangi Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">Ulangi Password Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          if (passError) setPassError('');
                        }}
                        placeholder="Ketik ulang password baru"
                        className={`w-full pl-4 pr-11 py-3 text-sm rounded-2xl text-neutral-900 focus:outline-none min-h-[46px] transition-all ${
                          isNewPasswordMismatch
                            ? 'bg-rose-50/30 border-2 border-rose-400 focus:border-rose-600 focus:bg-white ring-1 ring-rose-300/40'
                            : isNewPasswordMatch
                            ? 'bg-emerald-50/20 border-2 border-emerald-400 focus:border-emerald-600 focus:bg-white ring-1 ring-emerald-300/30'
                            : 'bg-[#FBFBF9] border border-[#DDDDCF] focus:border-neutral-900 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                        title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                    {isNewPasswordMismatch ? (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Password tidak cocok / tidak sesuai</span>
                      </p>
                    ) : isNewPasswordMatch ? (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold animate-in fade-in duration-150">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Password cocok</span>
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-colors cursor-pointer"
                  >
                    Ubah Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Dashboard User Footer */}
      <footer className="mt-auto border-t border-[#EAEAE3] bg-white py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white border border-[#E0E0D8] p-1 flex items-center justify-center shadow-2xs">
              <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-neutral-800">HitShare</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-neutral-400">Versi Portal:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F4F4EE] text-neutral-800 border border-[#E0E0D6]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              v2.0.0
            </span>
          </div>
        </div>
      </footer>

      {/* QRIS Payment Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#EAEAE3] max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
            {paymentSuccess ? (
              <div className="space-y-4 py-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {orderContext === 'extend'
                    ? 'Perpanjangan Berhasil!'
                    : orderContext === 'renew'
                    ? 'Langganan Aktif Kembali!'
                    : 'Pembayaran Berhasil!'}
                </h3>
                <p className="text-sm text-neutral-600">
                  {orderContext === 'extend'
                    ? 'Durasi langganan Anda telah berhasil ditambahkan. Silakan buka ekstensi HitShare dan klik tombol sinkronisasi untuk memperbarui masa aktif.'
                    : orderContext === 'renew'
                    ? 'Langganan Anda telah berhasil diperpanjang. Silakan buka ekstensi HitShare dan klik tombol sinkronisasi untuk mulai menggunakan kembali.'
                    : 'Akun Anda telah aktif secara otomatis. Silakan buka ekstensi HitShare dan klik tombol sinkronisasi.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="w-full py-3.5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-colors cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            ) : countdownSeconds === 0 ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Waktu Pembayaran Habis</h3>
                <p className="text-sm text-neutral-600">
                  Batas waktu pembayaran 10 menit telah kedaluwarsa. Silakan tutup dan buat pesanan baru.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOrder(null);
                    loadDashboardData();
                  }}
                  className="w-full py-3.5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-colors cursor-pointer"
                >
                  Buat Pesanan Baru
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 w-full">
                {/* Header */}
                <div className="space-y-1 w-full text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Scan QRIS untuk Bayar</span>
                  <h3 className="text-2xl font-black text-neutral-900">
                    Rp {activeOrder.amount?.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">Order: #{activeOrder.order_id?.slice(-12)}</p>
                </div>

                {/* Sisa Waktu Pembayaran (Clean & Simple) */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Sisa waktu pembayaran:</span>
                  <span className={`font-mono font-bold text-sm ${countdownSeconds < 120 ? 'text-rose-600' : 'text-neutral-900'}`}>
                    {String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:{String(countdownSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                {/* QR Display */}
                <div className="w-full flex justify-center">
                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-inner flex items-center justify-center">
                    {activeOrder.qr_url ? (
                      <img
                        src={activeOrder.qr_url}
                        alt="QRIS Payment"
                        className="w-52 h-52 object-contain rounded-xl block"
                      />
                    ) : activeOrder.qr_string ? (
                      <div className="w-52 h-52 flex items-center justify-center text-xs text-neutral-600 bg-white rounded-xl p-2 font-mono break-all">
                        {activeOrder.qr_string}
                      </div>
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center text-sm text-neutral-400">
                        QR Code sedang dimuat...
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="w-full text-center">
                  <p className="text-xs font-semibold text-neutral-700">
                    Silahkan melakukan pembayaran dengan QR diatas
                  </p>
                </div>

                {/* Rincian Pemesanan (Order Details Breakdown) */}
                {(() => {
                  const matchedPlan = plans.find((p) => p.key === activeOrder.plan || p.label === activeOrder.plan);
                  const planName = activeOrder.plan_label || matchedPlan?.label || (activeOrder.plan ? `Paket ${activeOrder.plan.toUpperCase()}` : 'Paket Langganan');
                  const durationText = activeOrder.duration_days ? `${activeOrder.duration_days} Hari Akses` : (matchedPlan ? `${matchedPlan.duration_days} Hari Akses` : '');

                  const originalPrice = activeOrder.original_amount 
                    || matchedPlan?.amount 
                    || (activeOrder.amount - (activeOrder.admin_fee || 0) + (activeOrder.discount_amount || 0));

                  const discount = Number(activeOrder.discount_amount || 0);
                  const voucherCode = activeOrder.voucher_code;

                  const subtotalAfterDiscount = Math.max(0, originalPrice - discount);
                  const adminFee = activeOrder.admin_fee != null 
                    ? Number(activeOrder.admin_fee) 
                    : Math.max(0, activeOrder.amount - subtotalAfterDiscount);

                  const totalAmount = activeOrder.amount;

                  return (
                    <div className="w-full p-3.5 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] text-left space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[#ECECE5]">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-700 text-[11px]">
                          <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Rincian Pemesanan</span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400">
                          #{activeOrder.order_id?.slice(-12)}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex justify-between text-neutral-600">
                          <span>Paket Langganan</span>
                          <span className="font-bold text-neutral-900 text-right">
                            {planName} {durationText && <span className="font-normal text-neutral-500">({durationText})</span>}
                          </span>
                        </div>

                        <div className="flex justify-between text-neutral-600">
                          <span>Harga Paket</span>
                          <span className="font-medium text-neutral-800">
                            Rp {originalPrice?.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex justify-between text-neutral-600">
                          <span>Voucher Promo</span>
                          {discount > 0 ? (
                            <span className="font-semibold text-emerald-600 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {voucherCode ? `(${voucherCode}) ` : ''}- Rp {discount.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium">-</span>
                          )}
                        </div>

                        <div className="flex justify-between text-neutral-600">
                          <span>Biaya Layanan QRIS (0.7% + Rp 200)</span>
                          <span className="font-medium text-neutral-800">
                            Rp {adminFee.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline pt-2 border-t border-[#ECECE5]">
                          <span className="font-bold text-neutral-900">Total Pembayaran</span>
                          <span className="text-base font-black text-neutral-900">
                            Rp {totalAmount?.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Close Button */}
                <div className="w-full pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    className="w-full py-3 text-sm font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors min-h-[44px] cursor-pointer"
                  >
                    Tutup / Bayar Nanti
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrder(null);
                        setTargetPlanToChange(null);
                        setChangePlanModalOpen(true);
                      }}
                      className="text-xs text-neutral-500 hover:text-rose-600 underline font-medium cursor-pointer transition-colors"
                    >
                      Ingin ganti paket atau batalkan pesanan ini?
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Ganti Paket / Batalkan Pesanan ── */}
      {changePlanModalOpen && pendingPaymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-neutral-200 relative animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Loading Overlay saat memproses pergantian paket */}
            {cancelOrderLoading && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3.5 z-30 animate-in fade-in duration-200 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-neutral-900 text-base sm:text-lg">
                    Menyiapkan QRIS Pembayaran...
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Membatalkan pesanan lama & menerbitkan kode QRIS baru untuk Anda
                  </p>
                </div>
              </div>
            )}

            {changePlanModalStep === 'prompt' ? (
              /* ── Step 1: Pemberitahuan & Penjelasan + 3 CTA Utama ── */
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                        Pesanan Menunggu Pembayaran
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Pemberitahuan status pesanan akun Anda
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChangePlanModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Kartu Informasi Paket */}
                <div className="p-4 sm:p-5 bg-neutral-50/90 rounded-2xl border border-neutral-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Pesanan Berjalan
                    </span>
                    <span className="font-mono text-xs text-neutral-400 font-semibold">
                      #{pendingPaymentOrder.order_id?.slice(-8)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-neutral-900">
                        Paket {pendingPlanLabel}
                      </h4>
                      <p className="text-xs text-neutral-500 font-medium">
                        {pendingPaymentOrder.duration_days ? `${pendingPaymentOrder.duration_days} hari masa aktif` : 'Akses HitShare'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-black text-neutral-900">
                        Rp {Number(pendingPaymentOrder.amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Penjelasan Terpisah */}
                <p className="text-xs text-neutral-500 leading-relaxed px-1">
                  Anda masih memiliki tagihan pesanan yang belum diselesaikan. Anda dapat <strong>melanjutkan pembayaran</strong> pesanan ini untuk langsung memunculkan kode QRIS, atau <strong>mengganti paket</strong> dengan pilihan baru.
                </p>

                {/* 3 Tombol CTA Sesuai Alur: Bayar yang sekarang, Ganti Paket, Tutup */}
                <div className="space-y-2.5 pt-1">
                  {/* CTA 1: Bayar Yang Sekarang (Muncul QR Sebelumnya) */}
                  <button
                    type="button"
                    onClick={() => {
                      setChangePlanModalOpen(false);
                      handleOpenPendingPayment(pendingPaymentOrder);
                    }}
                    disabled={cancelOrderLoading}
                    className="w-full py-3.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <QrCode className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-sm sm:text-base">Bayar yang Sekarang</div>
                        <div className="text-[11px] text-neutral-300 font-normal">Tampilkan QRIS pesanan sebelumnya</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm shrink-0 pl-2">
                      <span>Rp {Number(pendingPaymentOrder.amount || 0).toLocaleString('id-ID')}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>

                  {/* CTA 2: Ganti Paket */}
                  <button
                    type="button"
                    onClick={() => setChangePlanModalStep('change')}
                    disabled={cancelOrderLoading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 text-neutral-900 border-2 border-neutral-200 hover:border-neutral-300 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-neutral-500" />
                      <span className="font-extrabold">Ganti Paket</span>
                    </div>
                    <span className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
                      Pilih paket baru <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>

                  {/* CTA 3: Tutup */}
                  <button
                    type="button"
                    onClick={() => setChangePlanModalOpen(false)}
                    disabled={cancelOrderLoading}
                    className="w-full py-2.5 text-center text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              /* ── Step 2: Ganti Paket (Pilih Paket Baru & Konfirmasi QRIS Baru) ── */
              (() => {
                const validTargetPlans = plans.filter((p) => p.key !== pendingPaymentOrder.plan);
                const currentTargetKey =
                  targetPlanToChange && targetPlanToChange !== pendingPaymentOrder.plan
                    ? targetPlanToChange
                    : (selectedPlan !== pendingPaymentOrder.plan
                        ? selectedPlan
                        : validTargetPlans[0]?.key || selectedPlan);
                const targetPlanObj = plans.find(
                  (p) => p.key === currentTargetKey || p.plan === currentTargetKey
                ) || validTargetPlans[0] || {
                  label: currentTargetKey,
                  amount: 0,
                };

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChangePlanModalStep('prompt')}
                          className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Kembali"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                            Pilih Paket Baru
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Pesanan lama akan dibatalkan & QRIS baru diterbitkan
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangePlanModalOpen(false)}
                        className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Ringkasan Perubahan: Lama -> Baru */}
                    <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase block">Pesanan Lama (Dibatalkan)</span>
                        <span className="font-extrabold text-neutral-700">Paket {pendingPlanLabel}</span>
                        <span className="text-neutral-500 ml-1.5">(Rp {Number(pendingPaymentOrder.amount || 0).toLocaleString('id-ID')})</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400" />
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Pilihan Baru</span>
                        <span className="font-extrabold text-neutral-900">Paket {targetPlanObj.label}</span>
                        <span className="text-emerald-600 font-bold ml-1.5">Rp {Number(targetPlanObj.amount || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Grid Pilihan Paket */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        Pilih Durasi Paket:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {plans.map((p) => {
                          const isOld = pendingPaymentOrder.plan === p.key;
                          const isTarget = !isOld && currentTargetKey === p.key;

                          return (
                            <button
                              key={p.key}
                              type="button"
                              disabled={isOld}
                              onClick={() => !isOld && setTargetPlanToChange(p.key)}
                              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                isOld
                                  ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed opacity-60 select-none shadow-none'
                                  : isTarget
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm ring-1 ring-neutral-900 cursor-pointer'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full text-[11px] font-bold">
                                <span className="truncate">{p.label}</span>
                              </div>
                              <div
                                className={`text-xs font-extrabold mt-1 ${
                                  isOld
                                    ? 'text-neutral-400'
                                    : isTarget
                                    ? 'text-emerald-300'
                                    : 'text-neutral-900'
                                }`}
                              >
                                Rp {p.amount?.toLocaleString('id-ID')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Info Notice */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        Kode QRIS pesanan lama otomatis dibatalkan dan QRIS baru untuk <strong>Paket {targetPlanObj.label}</strong> akan langsung dibuat.
                      </p>
                    </div>

                    {/* Action Button: Lanjut ke Pembayaran */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmChangePlan}
                        disabled={cancelOrderLoading || currentTargetKey === pendingPaymentOrder.plan}
                        className="w-full py-4 px-5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                            {cancelOrderLoading ? (
                              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                            ) : (
                              <QrCode className="w-4.5 h-4.5 text-emerald-400" />
                            )}
                          </div>
                          <span className="font-extrabold text-white tracking-tight">
                            {cancelOrderLoading ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 font-black text-sm sm:text-base pl-2">
                          <span>Rp {Number(targetPlanObj.amount || 0).toLocaleString('id-ID')}</span>
                          <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
