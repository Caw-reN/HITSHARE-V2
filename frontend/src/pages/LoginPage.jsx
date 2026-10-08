import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.post('/unified-login', {
        email: email.trim(),
        password,
      });

      const data = res.data;
      setAuth({
        token: data.token,
        role: data.role,
        user: data.user || { username: data.username },
      });

      if (data.redirect === '/admin' || data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/akun');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.html || 'Gagal masuk. Periksa email dan password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0E0D8] p-2 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
              <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Masuk ke HitShare</h1>
          <p className="text-xs text-neutral-500">Kelola akun, akses ekstensi, dan perpanjangan langganan</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 text-sm sm:text-base font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-2xl min-h-[48px] transition-all shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              {!loading && <ArrowRight className="w-4.5 h-4.5" />}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F0F0E8] text-center text-sm text-neutral-500 space-y-2">
            <div>
              Belum punya akun?{' '}
              <Link to="/daftar" className="font-semibold text-neutral-900 hover:underline">
                Daftar di sini
              </Link>
            </div>
            <div>
              <Link to="/" className="text-neutral-500 hover:text-neutral-800 transition-colors">
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
