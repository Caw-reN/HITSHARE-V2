import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import {
  Clock,
  Check,
  AlertTriangle,
  Receipt,
  Tag,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function RegisterPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(() => location.state?.order || null);
  const [loading, setLoading] = useState(() => !location.state?.order);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(600);

  const pollingRef = useRef(null);

  // Initial fetch if order was not passed via router state (e.g. page refresh or direct link)
  useEffect(() => {
    let isMounted = true;

    const fetchInitialOrder = async () => {
      if (!orderId) {
        setErrorMsg('ID Pesanan tidak valid.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/register/status/${orderId}`);
        if (!isMounted) return;

        setOrder(res.data);
        if (res.data.status === 'paid') {
          setPaymentSuccess(true);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load order status:', err);
        setErrorMsg(err.response?.data?.error || 'Pesanan tidak ditemukan atau telah kedaluwarsa.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (!order) {
      fetchInitialOrder();
    }

    return () => {
      isMounted = false;
    };
  }, [orderId, order]);

  // Polling for QRIS payment status every 2.5 seconds
  useEffect(() => {
    if (!orderId || paymentSuccess) return;

    const pollStatus = async () => {
      try {
        const res = await api.get(`/register/status/${orderId}`);
        if (res.data.status === 'paid') {
          setPaymentSuccess(true);
          setOrder((prev) => ({ ...prev, ...res.data, status: 'paid' }));
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Auto-redirect to dashboard after 2.5 seconds
          setTimeout(() => {
            navigate('/akun?status=registered');
          }, 2500);
        } else if (res.data.status === 'expired' || res.data.status === 'cancelled') {
          setOrder((prev) => ({ ...prev, ...res.data, status: res.data.status }));
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else {
          // Update order details if needed
          setOrder((prev) => (prev ? { ...prev, ...res.data } : res.data));
        }
      } catch (err) {
        console.warn('Registration payment polling error:', err);
      }
    };

    pollingRef.current = setInterval(pollStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, paymentSuccess, navigate]);

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (!order || paymentSuccess) return;

    const initialSec = order.expires_at
      ? Math.max(0, Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000))
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
  }, [order, paymentSuccess]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E8DF] shadow-bone max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-8 h-8 text-neutral-800 animate-spin mx-auto" />
          <h3 className="font-bold text-neutral-900 text-base">Memuat Tagihan QRIS...</h3>
          <p className="text-xs text-neutral-500">Menghubungkan ke gerbang pembayaran</p>
        </div>
      </div>
    );
  }

  // Error State (Invalid order)
  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E8DF] shadow-bone max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            {errorMsg || 'Data tagihan pendaftaran tidak ditemukan atau sudah tidak valid.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/daftar')}
              className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              Kembali ke Pendaftaran
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = !paymentSuccess && (countdownSeconds === 0 || order.status === 'expired');

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#E0E0D8] p-1.5 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
              <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-neutral-900">HitShare</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone text-center space-y-5">
          {paymentSuccess ? (
            /* ── SUCCESS STATE ── */
            <div className="space-y-5 py-4 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Pembayaran Berhasil!</h3>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-xs mx-auto leading-relaxed">
                  Akun HitShare Anda telah aktif seketika. Mengalihkan ke dashboard...
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/akun?status=registered')}
                  className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>Buka Dashboard Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isExpired ? (
            /* ── EXPIRED STATE ── */
            <div className="space-y-4 py-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neutral-900">Waktu Pembayaran Habis</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Batas waktu pembayaran 10 menit telah kedaluwarsa. Anda dapat langsung mendaftar ulang dengan email yang sama.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate('/daftar')}
                  className="w-full py-3.5 px-5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[46px] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Daftar Ulang / Buat Pesanan Baru</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── ACTIVE QRIS PAYMENT STATE ── */
            <div className="flex flex-col items-center space-y-5 w-full">
              {/* Header Info */}
              <div className="space-y-1 w-full text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Scan QRIS untuk Aktivasi Akun
                </span>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                  Rp {Number(order.amount || 0).toLocaleString('id-ID')}
                </h2>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Order: #{order.order_id?.slice(-12)}
                </p>
              </div>

              {/* Sisa Waktu Pembayaran (Clean & Simple) */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Sisa waktu pembayaran:</span>
                <span className={`font-mono font-bold text-sm ${countdownSeconds < 120 ? 'text-rose-600' : 'text-neutral-900'}`}>
                  {String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:{String(countdownSeconds % 60).padStart(2, '0')}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-[#FAF9F5] border border-[#E8E8DF] rounded-3xl shadow-inner flex items-center justify-center">
                {order.qr_url ? (
                  <img
                    src={order.qr_url}
                    alt="QRIS Payment"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl bg-white p-2 shadow-2xs block"
                  />
                ) : order.qr_string ? (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-xs text-neutral-600 bg-white rounded-2xl p-3 font-mono break-all">
                    {order.qr_string}
                  </div>
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-sm text-neutral-400">
                    QR Code sedang dimuat...
                  </div>
                )}
              </div>

              {/* Live Status Indicator */}
              <div className="w-full text-center">
                <p className="text-xs font-semibold text-neutral-700">
                  Silahkan melakukan pembayaran dengan QR diatas
                </p>
              </div>

              {/* Order Details Breakdown */}
              <div className="w-full p-4 bg-[#FAF9F5] rounded-2xl border border-[#ECECE5] text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECECE5]">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-700 text-[11px]">
                    <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Rincian Pembayaran</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">
                    #{order.order_id?.slice(-12)}
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>Paket Langganan</span>
                    <span className="font-bold text-neutral-900 text-right">
                      {order.plan_label || (order.plan ? `Paket ${order.plan.toUpperCase()}` : 'HitShare')}
                      {order.duration_days && (
                        <span className="font-normal text-neutral-500 ml-1">({order.duration_days} Hari)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Harga Paket</span>
                    <span className="font-medium text-neutral-800">
                      Rp {Number(order.original_amount || order.subtotal || order.amount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {Number(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Voucher Promo</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {order.voucher_code ? `(${order.voucher_code}) ` : ''}- Rp {Number(order.discount_amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-600">
                    <span>Biaya Layanan QRIS (0.7% + Rp 200)</span>
                    <span className="font-medium text-neutral-800">
                      Rp {Number(order.admin_fee || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#ECECE5]">
                    <span className="font-bold text-neutral-900">Total Pembayaran</span>
                    <span className="text-base font-black text-neutral-900">
                      Rp {Number(order.amount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Transaksi aman & terverifikasi</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
