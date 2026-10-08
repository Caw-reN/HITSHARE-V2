import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client';
import {
  Gift,
  Copy,
  Check,
  Building,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  HelpCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

const BANK_EWALLET_SECTIONS = [
  {
    title: 'Bank (Hanya BNI)',
    icon: Building,
    items: [
      { value: 'Bank BNI', label: 'Bank BNI', type: 'bank' },
    ],
  },
  {
    title: 'E-Wallet (Bisa Apa Saja)',
    icon: Wallet,
    items: [
      { value: 'DANA', label: 'DANA', type: 'ewallet' },
      { value: 'GoPay', label: 'GoPay', type: 'ewallet' },
      { value: 'OVO', label: 'OVO', type: 'ewallet' },
      { value: 'ShopeePay', label: 'ShopeePay', type: 'ewallet' },
      { value: 'LinkAja', label: 'LinkAja', type: 'ewallet' },
      { value: 'i.saku', label: 'i.saku', type: 'ewallet' },
      { value: 'OTHER_EWALLET', label: 'E-Wallet Lainnya...', type: 'ewallet' },
    ],
  },
];

const KNOWN_DESTINATIONS = ['Bank BNI', 'DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja', 'i.saku'];

function BankEwalletDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  let currentLabel = value;
  let currentType = 'ewallet';
  const isOther = value === 'OTHER_EWALLET';

  if (value === 'Bank BNI') {
    currentLabel = 'Bank BNI';
    currentType = 'bank';
  } else if (isOther) {
    currentLabel = 'E-Wallet Lainnya...';
    currentType = 'ewallet';
  } else {
    for (const section of BANK_EWALLET_SECTIONS) {
      const found = section.items.find((it) => it.value === value);
      if (found) {
        currentLabel = found.label;
        currentType = found.type;
        break;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-[#FBFBF9] border rounded-2xl text-left flex items-center justify-between min-h-[48px] transition-all cursor-pointer ${
          isOpen
            ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/5 shadow-xs'
            : 'border-[#DDDDCF] hover:border-neutral-400 focus:border-neutral-900 focus:bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              currentType === 'bank'
                ? 'bg-neutral-900 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentType === 'bank' ? (
              <Building className="w-3.5 h-3.5" />
            ) : (
              <Wallet className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
            {currentLabel || 'Pilih Bank / E-Wallet...'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentType === 'bank'
                ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {currentType === 'bank' ? 'Bank' : 'E-Wallet'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-neutral-900' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#E8E8DF] rounded-2xl shadow-2xl p-2 space-y-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {BANK_EWALLET_SECTIONS.map((section, idx) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.title} className={idx > 0 ? 'pt-1.5 border-t border-[#F0F0EB]' : ''}>
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <SectionIcon className="w-3 h-3 text-neutral-400" />
                  <span>{section.title}</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const isSelected = value === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          onChange(item.value);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-bold shadow-xs'
                            : 'text-neutral-700 hover:bg-[#F5F5EE] hover:text-neutral-900'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function resolveProofImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/payout_proofs/')) {
    return url.replace('/storage/payout_proofs/', '/uploads/payout_proofs/');
  }
  return url;
}

export default function UserAffiliateTab({ profile, toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subtab, setSubtab] = useState('referrals'); // 'referrals' | 'earnings' | 'payouts'
  const [copied, setCopied] = useState(false);

  // Subtab lists
  const [referrals, setReferrals] = useState([]);
  const [referralsPagination, setReferralsPagination] = useState(null);
  const [referralsLoading, setReferralsLoading] = useState(false);

  const [earnings, setEarnings] = useState([]);
  const [earningsPagination, setEarningsPagination] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);

  const [payouts, setPayoutsList] = useState([]);
  const [payoutsPagination, setPayoutsPagination] = useState(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Modals
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankError, setBankError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Bank BNI');
  const [customEwalletName, setCustomEwalletName] = useState('');

  const openBankModal = () => {
    if (bankName) {
      if (KNOWN_DESTINATIONS.includes(bankName)) {
        setSelectedMethod(bankName);
        setCustomEwalletName('');
      } else {
        setSelectedMethod('OTHER_EWALLET');
        setCustomEwalletName(bankName);
      }
    } else {
      setSelectedMethod('Bank BNI');
      setCustomEwalletName('');
    }
    setBankError('');
    setBankModalOpen(true);
  };

  // Image Proof Modal
  const [proofModalUrl, setProofModalUrl] = useState(null);

  // Fetch Affiliate Overview
  const fetchAffiliateData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/affiliate');
      setData(res.data);
      if (res.data?.bank_info) {
        const loadedBank = res.data.bank_info.bank_name || '';
        setBankName(loadedBank);
        setBankNumber(res.data.bank_info.bank_account_number || '');
        setBankHolder(res.data.bank_info.bank_account_holder || '');
        if (loadedBank) {
          if (KNOWN_DESTINATIONS.includes(loadedBank)) {
            setSelectedMethod(loadedBank);
            setCustomEwalletName('');
          } else {
            setSelectedMethod('OTHER_EWALLET');
            setCustomEwalletName(loadedBank);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching affiliate data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) fetchAffiliateData();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchAffiliateData]);

  // Fetch Referrals
  const fetchReferrals = useCallback(async (page = 1) => {
    setReferralsLoading(true);
    try {
      const res = await api.get(`/user/affiliate/referrals?page=${page}`);
      setReferrals(res.data.data || []);
      setReferralsPagination(res.data);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setReferralsLoading(false);
    }
  }, []);

  // Fetch Earnings
  const fetchEarnings = useCallback(async (page = 1) => {
    setEarningsLoading(true);
    try {
      const res = await api.get(`/user/affiliate/earnings?page=${page}`);
      setEarnings(res.data.data || []);
      setEarningsPagination(res.data);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setEarningsLoading(false);
    }
  }, []);

  // Fetch Payouts
  const fetchPayouts = useCallback(async (page = 1) => {
    setPayoutsLoading(true);
    try {
      const res = await api.get(`/user/affiliate/payouts?page=${page}`);
      setPayoutsList(res.data.data || []);
      setPayoutsPagination(res.data);
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data?.is_affiliate) return;
    let isMounted = true;
    Promise.resolve().then(() => {
      if (!isMounted) return;
      if (subtab === 'referrals') fetchReferrals();
      else if (subtab === 'earnings') fetchEarnings();
      else if (subtab === 'payouts') fetchPayouts();
    });
    return () => {
      isMounted = false;
    };
  }, [subtab, data?.is_affiliate, fetchReferrals, fetchEarnings, fetchPayouts]);

  // Copy referral link
  const handleCopyLink = () => {
    if (!data?.affiliate_code) return;
    const link = `${window.location.origin}/daftar?ref=${data.affiliate_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link referral berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Submit Bank Account
  const handleSaveBank = async (e) => {
    e.preventDefault();
    setBankError('');

    let finalBankName = selectedMethod;
    if (selectedMethod === 'OTHER_EWALLET') {
      finalBankName = customEwalletName.trim();
      if (!finalBankName) {
        setBankError('Silakan ketik nama e-wallet Anda.');
        return;
      }
    }

    if (!finalBankName || !bankNumber.trim() || !bankHolder.trim()) {
      setBankError('Semua kolom rekening wajib diisi.');
      return;
    }

    setBankSubmitting(true);
    try {
      const res = await api.put('/user/affiliate/bank-account', {
        bank_name: finalBankName,
        bank_account_number: bankNumber.trim(),
        bank_account_holder: bankHolder.trim(),
      });
      toast.success(res.data.message || 'Rekening penarikan berhasil diperbarui.');
      setBankName(finalBankName);
      setBankModalOpen(false);
      fetchAffiliateData();
    } catch (err) {
      setBankError(err.response?.data?.message || err.response?.data?.error || 'Gagal menyimpan rekening.');
    } finally {
      setBankSubmitting(false);
    }
  };

  // Submit Payout Request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    const amt = parseInt(withdrawAmount, 10);
    const minPayout = data?.min_payout || 50000;

    if (!amt || amt < minPayout) {
      setWithdrawError(`Minimal penarikan adalah Rp ${minPayout.toLocaleString('id-ID')}.`);
      return;
    }

    if (amt > (data?.affiliate_balance || 0)) {
      setWithdrawError('Nominal penarikan melebihi saldo komisi yang tersedia.');
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const res = await api.post('/user/affiliate/payout', {
        amount: amt,
        notes: withdrawNotes.trim(),
      });
      toast.success(res.data.message || 'Permohonan penarikan berhasil diajukan!');
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
      fetchAffiliateData();
      if (subtab === 'payouts') fetchPayouts();
    } catch (err) {
      setWithdrawError(err.response?.data?.error || err.response?.data?.message || 'Gagal mengajukan penarikan.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (loading) {
    return (
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
    );
  }

  // View: Non-affiliate user (Consistent Warm Bone style)
  if (!data?.is_affiliate) {
    return (
      <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Program Afiliasi HitShare</h2>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Dapatkan penghasilan tambahan untuk setiap pengguna baru yang Anda rekomendasikan.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Undangan Khusus
              </span>
            </div>

            <div className="p-5 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] space-y-3.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              <p className="font-bold text-neutral-900 text-sm">
                Keuntungan Bergabung Menjadi Mitra Afiliasi HitShare
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Komisi Flat per Member:</strong> Dapatkan komisi tetap (default <strong>Rp 20.000</strong>) seketika setelah referral melakukan pembelian paket pertama.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Kode Referral Eksklusif:</strong> Admin akan membuatkan kode unik sesuai brand Anda (cth: <code>ANDI20</code>) dengan link pendaftaran otomatis.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pencairan Fleksibel:</strong> Minimal penarikan hanya <strong>Rp 50.000</strong> langsung ditransfer ke BCA, Mandiri, BRI, BNI, atau e-wallet (GoPay, OVO, Dana).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dashboard Terbuka & Real-time:</strong> Pantau member terdaftar, pembelian, dan riwayat penarikan dana secara transparan 24/7.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 text-neutral-900">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold">Tertarik Menjadi Afiliator HitShare?</h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Untuk menjaga kualitas kemitraan dan integritas komunitas, aktivasi akun afiliator dilakukan secara eksklusif dan diverifikasi langsung oleh Admin Hitshare. Hubungi kami melalui WhatsApp untuk aktivasi akun afiliasi Anda.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${(profile?.settings?.support_whatsapp || '6281234567890').replace(/\D/g, '')}?text=Halo%20Admin%20HitShare,%20saya%20${encodeURIComponent(profile?.name || '')}%20(${encodeURIComponent(profile?.email || '')})%20ingin%20mendaftar%20sebagai%20afiliator.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-neutral-900 hover:bg-black text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <span>Hubungi Admin via WhatsApp</span>
                  <ExternalLink className="w-4 h-4 text-neutral-400" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
            <div className="flex items-center gap-2.5 text-neutral-900 font-bold text-sm">
              <HelpCircle className="w-4.5 h-4.5 text-neutral-700" />
              <h3>Ketentuan Program Afiliasi</h3>
            </div>
            <ul className="text-xs text-neutral-600 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span>Komisi diberikan 1 kali per pengguna baru pada pembelian paket langganan pertamanya.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span>Dilarang keras melakukan manipulasi self-referral (mendaftar akun tambahan untuk diri sendiri).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0"></span>
                <span>Pencairan saldo ditransfer manual oleh Admin dalam waktu 1x24 jam hari kerja.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const referralUrl = `${window.location.origin}/daftar?ref=${data.affiliate_code}`;
  const bankInfo = data.bank_info || {};
  const canWithdraw = (data.affiliate_balance || 0) >= (data.min_payout || 50000);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Top Section: 3/4 Link Card & 1/4 Saldo Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Left: Link Referral Card (3/4 Width on lg) */}
        <div className="md:col-span-8 lg:col-span-9 bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-center space-y-2.5 sm:space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Link Referral Anda
                </h2>
                <span className="font-mono text-xs font-bold text-neutral-800 bg-[#F1F1EB] border border-[#DDDDCF] px-2.5 py-0.5 rounded-lg">
                  Kode: {data.affiliate_code}
                </span>
              </div>
              <span className="text-xs text-neutral-500 font-medium hidden lg:inline">
                Komisi: <strong className="text-neutral-900 font-bold">Rp {Number(data.commission_rate || 0).toLocaleString('id-ID')}</strong> / member
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-normal leading-relaxed">
              Dapatkan komisi{' '}
              <strong className="text-neutral-900 font-bold">
                Rp {Number(data.commission_rate || 0).toLocaleString('id-ID')}
              </strong>{' '}
              untuk setiap pembelian pertama member baru yang mendaftar melalui link ini.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-0.5">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full px-3.5 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm text-neutral-900 font-mono shadow-2xs select-all focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-neutral-900 hover:bg-black text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Saldo Tersedia Card (1/4 Width on lg) */}
        <div className="md:col-span-4 lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-2.5 sm:space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-bold uppercase tracking-wider">Saldo Tersedia</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Rp {Number(data.affiliate_balance || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium">
                Min. penarikan Rp {Number(data.min_payout || 50000).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F0F0EB]">
            <button
              type="button"
              onClick={() => {
                if (!bankInfo.is_complete) {
                  openBankModal();
                  return;
                }
                setWithdrawModalOpen(true);
              }}
              disabled={!canWithdraw}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                canWithdraw
                  ? 'bg-neutral-900 hover:bg-black text-white active:scale-[0.98]'
                  : 'bg-[#F1F1EB] text-neutral-400 cursor-not-allowed border border-[#E0E0D8]'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tarik Saldo</span>
            </button>
          </div>
        </div>
      </div>



      {/* 3. Cara Kerja Komisi Afiliasi (Standalone Section) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">Cara Kerja Komisi Afiliasi</h3>
              <p className="text-xs text-neutral-500">Alur sederhana mendapatkan penghasilan dari setiap member yang Anda referensikan</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Step 1 */}
          <div className="p-4.5 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                1
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Langkah 1
              </span>
            </div>
            <div className="pt-1">
              <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Bagikan Link Referral</h4>
              <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed mt-1">
                Sebarkan link referral atau kode unik Anda ke rekan, komunitas, atau media sosial.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4.5 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                2
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Langkah 2
              </span>
            </div>
            <div className="pt-1">
              <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Member Beli Paket</h4>
              <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed mt-1">
                Pengguna mendaftar melalui link Anda dan menyelesaikan pembayaran paket pertama mereka.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4.5 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                3
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">
                Langkah 3
              </span>
            </div>
            <div className="pt-1">
              <h4 className="font-bold text-neutral-900 text-xs sm:text-sm">Komisi Cair Instan</h4>
              <p className="text-[11px] sm:text-xs text-neutral-500 leading-relaxed mt-1">
                Komisi Rp {Number(data.commission_rate || 0).toLocaleString('id-ID')} seketika masuk ke saldo akun Anda dan siap ditarik.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Grid: Left Column (4 cols) & Right Column (8 cols) */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Rekening Pencairan & FAQ Ketentuan */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Rekening Pencairan */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <Building className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Rekening Pencairan</h3>
                  <p className="text-[11px] text-neutral-500">Tujuan transfer penarikan</p>
                </div>
              </div>

              {bankInfo.is_complete ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3" />
                  Terdaftar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                  Belum Diatur
                </span>
              )}
            </div>

            {bankInfo.is_complete ? (
              <div className="p-4 sm:p-5 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-[#EAEAE3] text-neutral-800 font-bold text-xs uppercase tracking-wider">
                    {bankInfo.bank_name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    Bank / E-Wallet
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg font-black text-neutral-900 tracking-wider">
                    {bankInfo.bank_account_number}
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    a.n. <strong className="text-neutral-900 font-bold">{bankInfo.bank_account_holder}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ECECE5]">
                  <button
                    type="button"
                    onClick={() => {
                      openBankModal();
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-[#F2F2EC] text-neutral-800 border border-[#DDDDCF] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ubah Rekening</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-neutral-900">Rekening Belum Ditambahkan</div>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                    Lengkapi nomor rekening Bank BNI atau e-wallet (DANA, GoPay, OVO, ShopeePay, dll) agar Anda dapat mengajukan pencairan saldo komisi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openBankModal();
                  }}
                  className="w-full py-3 px-4 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-neutral-300" />
                  <span>+ Atur Rekening Sekarang</span>
                </button>
              </div>
            )}

            {data.has_pending_payout && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Permohonan Diproses</strong>
                  <p className="text-neutral-600 text-[11px] mt-0.5 leading-relaxed">
                    Anda memiliki penarikan yang sedang diproses oleh admin (maks. 1x24 jam kerja).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card: Tanya Jawab & Ketentuan Komisi (HitShare FAQ style) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
            <div className="flex items-center gap-2.5 text-neutral-900 font-bold">
              <HelpCircle className="w-5 h-5 text-neutral-700" />
              <h3>Ketentuan & Bantuan</h3>
            </div>
            <div className="space-y-4 text-xs sm:text-sm text-neutral-600">
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">Kapan komisi masuk ke saldo?</h4>
                <p className="leading-relaxed text-xs">
                  Komisi otomatis dikreditkan seketika (real-time) setelah member yang Anda referensikan menyelesaikan pembayaran QRIS paket pertamanya.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">Berapa minimal penarikan?</h4>
                <p className="leading-relaxed text-xs">
                  Minimal penarikan adalah Rp {Number(data.min_payout || 50000).toLocaleString('id-ID')} ke rekening bank terdaftar atau e-wallet tanpa biaya admin tambahan.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">Aturan Anti Self-Referral</h4>
                <p className="leading-relaxed text-xs">
                  Dilarang mereferensikan akun sendiri. Sistem kami memvalidasi device ID dan pola akun untuk menjamin kejujuran kemitraan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subtabs & Data Tables */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
          {/* Top Mini Stats Summary: Total Referral & Total Pendapatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Total Referral */}
            <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Total Referral
                </span>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight truncate">
                  {data.total_referrals || 0} Member
                </div>
                <div className="text-[11px] text-emerald-700 font-bold truncate">
                  {data.paid_referrals || 0} telah berlangganan
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Total Pendapatan */}
            <div className="p-4 bg-[#FBFBF9] border border-[#ECECE5] rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Total Pendapatan
                </span>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight truncate">
                  Rp {Number(data.total_earned || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-neutral-400 font-medium truncate">
                  Sudah ditarik: Rp {Number(data.total_withdrawn || 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

          {/* Subtab Segmented Pill Bar (HitShare Standard) */}
          <div className="w-full overflow-x-auto no-scrollbar pb-1">
            <div className="inline-flex items-center p-1.5 bg-[#EFEFE8] rounded-2xl border border-[#DDDDCF] shadow-xs gap-1 select-none shrink-0">
              <button
                type="button"
                onClick={() => setSubtab('referrals')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  subtab === 'referrals'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Daftar Referral ({data.total_referrals || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubtab('earnings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  subtab === 'earnings'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Riwayat Komisi</span>
              </button>

              <button
                type="button"
                onClick={() => setSubtab('payouts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  subtab === 'payouts'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Riwayat Penarikan</span>
              </button>
            </div>
          </div>

          {/* Subtab 1: Daftar Referrals */}
          {subtab === 'referrals' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EB]">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Daftar Pengguna Referral</h4>
                  <p className="text-xs text-neutral-500">Member yang mendaftar menggunakan link Anda</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchReferrals()}
                  disabled={referralsLoading}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-[#F1F1EB] transition-colors cursor-pointer"
                  title="Muat Ulang"
                >
                  <RefreshCw className={`w-4 h-4 ${referralsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {referralsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-neutral-400">Memuat daftar referral...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Users className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-600">Belum Ada Member Terdaftar</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Bagikan link referral Anda di atas untuk mulai mengundang pengguna baru ke HitShare.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ECECE5] text-neutral-400 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Member</th>
                        <th className="py-3 px-3">Email (Sensor)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EB]">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-[#FBFBF9] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#EAEAE3] text-neutral-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="font-bold text-neutral-900">{ref.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-neutral-500">{ref.masked_email}</td>
                          <td className="py-3 px-3">
                            {ref.has_purchased ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" /> Berlangganan
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F1EB] text-neutral-500">
                                Belum Berlangganan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-400 text-right">
                            {new Date(ref.registered_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {referralsPagination && referralsPagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EB] text-xs">
                  <span className="text-neutral-500">
                    Halaman {referralsPagination.current_page} dari {referralsPagination.last_page}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={referralsPagination.current_page <= 1}
                      onClick={() => fetchReferrals(referralsPagination.current_page - 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={referralsPagination.current_page >= referralsPagination.last_page}
                      onClick={() => fetchReferrals(referralsPagination.current_page + 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtab 3: Riwayat Komisi */}
          {subtab === 'earnings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EB]">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Riwayat Perolehan Komisi</h4>
                  <p className="text-xs text-neutral-500">Daftar transaksi referral yang menghasilkan komisi</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchEarnings()}
                  disabled={earningsLoading}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-[#F1F1EB] transition-colors cursor-pointer"
                  title="Muat Ulang"
                >
                  <RefreshCw className={`w-4 h-4 ${earningsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {earningsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-neutral-400">Memuat riwayat komisi...</p>
                </div>
              ) : earnings.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <DollarSign className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-600">Belum Ada Komisi Tercatat</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Komisi akan otomatis tercatat seketika setelah member referral Anda menyelesaikan pembayaran paket pertamanya.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ECECE5] text-neutral-400 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">Pembeli</th>
                        <th className="py-3 px-3">Total Belanja</th>
                        <th className="py-3 px-3">Komisi</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EB]">
                      {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-[#FBFBF9] transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] font-bold text-neutral-800">
                            #{e.order_id?.slice(-8)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-neutral-900">{e.buyer_name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">{e.buyer_email}</div>
                          </td>
                          <td className="py-3 px-3 text-neutral-600 font-medium">
                            Rp {Number(e.order_amount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 font-black text-emerald-600">
                            +Rp {Number(e.commission_amount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Masuk ke Saldo
                            </span>
                          </td>
                          <td className="py-3 px-3 text-neutral-400 text-right">
                            {new Date(e.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {earningsPagination && earningsPagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EB] text-xs">
                  <span className="text-neutral-500">
                    Halaman {earningsPagination.current_page} dari {earningsPagination.last_page}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={earningsPagination.current_page <= 1}
                      onClick={() => fetchEarnings(earningsPagination.current_page - 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={earningsPagination.current_page >= earningsPagination.last_page}
                      onClick={() => fetchEarnings(earningsPagination.current_page + 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtab 4: Riwayat Penarikan */}
          {subtab === 'payouts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EB]">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Riwayat Penarikan Saldo</h4>
                  <p className="text-xs text-neutral-500">Daftar permohonan pencairan komisi Anda</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchPayouts()}
                  disabled={payoutsLoading}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-[#F1F1EB] transition-colors cursor-pointer"
                  title="Muat Ulang"
                >
                  <RefreshCw className={`w-4 h-4 ${payoutsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {payoutsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-neutral-400">Memuat riwayat penarikan...</p>
                </div>
              ) : payouts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CreditCard className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-sm font-semibold text-neutral-600">Belum Ada Permohonan Penarikan</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Kumpulkan saldo komisi minimal Rp {Number(data.min_payout || 50000).toLocaleString('id-ID')} untuk mengajukan penarikan pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ECECE5] text-neutral-400 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">ID Payout</th>
                        <th className="py-3 px-3">Nominal</th>
                        <th className="py-3 px-3">Rekening Tujuan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Bukti / Keterangan</th>
                        <th className="py-3 px-3 text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EB]">
                      {payouts.map((p) => {
                        const isApproved = p.status === 'approved';
                        const isPending = p.status === 'pending';
                        const isRejected = p.status === 'rejected';

                        return (
                          <tr key={p.id} className="hover:bg-[#FBFBF9] transition-colors">
                            <td className="py-3 px-3 font-mono text-[11px] font-bold text-neutral-900">
                              {p.payout_id}
                            </td>
                            <td className="py-3 px-3 font-black text-neutral-900">
                              Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-neutral-800">{p.bank_name}</div>
                              <div className="text-[11px] text-neutral-500 font-mono">
                                {p.bank_account_number} ({p.bank_account_holder})
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Berhasil Ditransfer
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Menunggu Admin
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3 h-3" /> Ditolak
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {p.proof_image ? (
                                <button
                                  type="button"
                                  onClick={() => setProofModalUrl(p.proof_image)}
                                  className="text-neutral-900 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Lihat Bukti Transfer</span>
                                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                                </button>
                              ) : (
                                <span className="text-neutral-400">{p.admin_notes || '-'}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-neutral-400 text-right">
                              {new Date(p.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {payoutsPagination && payoutsPagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EB] text-xs">
                  <span className="text-neutral-500">
                    Halaman {payoutsPagination.current_page} dari {payoutsPagination.last_page}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={payoutsPagination.current_page <= 1}
                      onClick={() => fetchPayouts(payoutsPagination.current_page - 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={payoutsPagination.current_page >= payoutsPagination.last_page}
                      onClick={() => fetchPayouts(payoutsPagination.current_page + 1)}
                      className="px-3 py-1.5 rounded-xl border border-[#DDDDCF] hover:bg-[#F1F1EB] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      Berikutnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Ubah / Lengkapi Rekening Bank */}
      {bankModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setBankModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <Building className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Rekening Penarikan</h3>
                  <p className="text-xs text-neutral-400">Tujuan pencairan saldo komisi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F1EB] hover:bg-[#EAEAE3] text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bankError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bankError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBank} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Nama Bank / E-Wallet
                </label>
                <BankEwalletDropdown
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                />
              </div>

              {selectedMethod === 'OTHER_EWALLET' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Nama E-Wallet Lainnya
                  </label>
                  <input
                    type="text"
                    value={customEwalletName}
                    onChange={(e) => setCustomEwalletName(e.target.value)}
                    placeholder="Contoh: AstraPay, DOKU, PayPal, dll"
                    required
                    className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  {selectedMethod === 'Bank BNI'
                    ? 'Nomor Rekening Bank BNI'
                    : `Nomor HP / Akun ${selectedMethod === 'OTHER_EWALLET' ? (customEwalletName || 'E-Wallet') : selectedMethod}`}
                </label>
                <input
                  type="text"
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                  placeholder={
                    selectedMethod === 'Bank BNI'
                      ? 'Contoh: 1234567890 (No. Rekening BNI)'
                      : 'Contoh: 081234567890 (No. HP terdaftar)'
                  }
                  required
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm text-neutral-900 font-mono focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Nama Pemilik Rekening / Akun
                </label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder={
                    selectedMethod === 'Bank BNI'
                      ? 'Sesuai buku tabungan BNI'
                      : 'Sesuai nama terdaftar di aplikasi e-wallet'
                  }
                  required
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="w-1/2 py-3.5 bg-[#F1F1EB] hover:bg-[#EAEAE3] text-neutral-700 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bankSubmitting}
                  className="w-1/2 py-3.5 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                >
                  {bankSubmitting ? 'Menyimpan...' : 'Simpan Rekening'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Tarik Saldo Komisi */}
      {withdrawModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setWithdrawModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Tarik Saldo Komisi</h3>
                  <p className="text-xs text-neutral-400">Pencairan langsung ke rekening Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F1EB] hover:bg-[#EAEAE3] text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{withdrawError}</span>
              </div>
            )}

            {/* Target Bank Review Box */}
            <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-[#ECECE5] space-y-1.5 text-xs">
              <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                Rekening Tujuan Pencairan:
              </span>
              <div className="font-bold text-neutral-900 text-sm">
                {bankInfo.bank_name} - {bankInfo.bank_account_number}
              </div>
              <div className="text-neutral-500">
                a.n. <strong className="text-neutral-800">{bankInfo.bank_account_holder}</strong>
              </div>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Nominal Penarikan (Rp)
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(data?.affiliate_balance || 0))}
                    className="text-[11px] font-bold text-neutral-900 underline hover:text-black cursor-pointer"
                  >
                    Tarik Semua (Rp {Number(data?.affiliate_balance || 0).toLocaleString('id-ID')})
                  </button>
                </div>
                <input
                  type="number"
                  min={data?.min_payout || 50000}
                  max={data?.affiliate_balance || 0}
                  step={1000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Minimal Rp ${Number(data?.min_payout || 50000).toLocaleString('id-ID')}`}
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
                <p className="text-[11px] text-neutral-400">
                  Minimal penarikan saldo adalah Rp {Number(data?.min_payout || 50000).toLocaleString('id-ID')}.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Catatan untuk Admin (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white resize-none transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="w-1/2 py-3.5 bg-[#F1F1EB] hover:bg-[#EAEAE3] text-neutral-700 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawSubmitting}
                  className="w-1/2 py-3.5 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                >
                  {withdrawSubmitting ? 'Mengirim...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Bukti Transfer Lightbox */}
      {proofModalUrl && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setProofModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-[#E8E8DF] shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EB]">
              <h3 className="font-bold text-sm text-neutral-900">Bukti Transfer Pencairan</h3>
              <button
                type="button"
                onClick={() => setProofModalUrl(null)}
                className="w-8 h-8 rounded-full bg-[#F1F1EB] hover:bg-[#EAEAE3] text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-neutral-100 border border-[#ECECE5] min-h-[220px] flex items-center justify-center p-2">
              <img
                src={resolveProofImageUrl(proofModalUrl)}
                alt="Bukti Transfer"
                className="w-full max-h-[460px] object-contain mx-auto rounded-xl"
                onError={(e) => {
                  if (e.target.dataset.triedFallback) {
                    return;
                  }
                  e.target.dataset.triedFallback = 'true';
                  const currentSrc = e.target.src || '';
                  if (currentSrc.includes('/storage/payout_proofs/')) {
                    e.target.src = currentSrc.replace('/storage/payout_proofs/', '/uploads/payout_proofs/');
                  } else if (currentSrc.includes('/uploads/payout_proofs/')) {
                    e.target.src = currentSrc.replace('/uploads/payout_proofs/', '/storage/payout_proofs/');
                  }
                }}
              />
            </div>
            <div className="flex justify-end pt-1">
              <a
                href={resolveProofImageUrl(proofModalUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <span>Buka Gambar Asli</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
