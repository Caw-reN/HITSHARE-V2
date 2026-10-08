import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Shield, User } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/akun');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 bg-[#F8F8F5]/90 backdrop-blur-md border-b border-[#EAEAE3]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to={isDashboard ? '/akun' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-white border border-[#E0E0D8] p-1.5 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
            <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">HitShare</span>
            <span className="block text-xs font-semibold tracking-wide text-neutral-500 -mt-0.5">
              {isDashboard ? (
                <span className="text-emerald-700 font-bold">MEMBER DASHBOARD</span>
              ) : (
                'PREMIUM ACCESS'
              )}
            </span>
          </div>
        </Link>

        {/* Center Nav (Only on Landing / Marketing Page) */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600">
            <a href="/#fitur" className="hover:text-neutral-900 transition-colors">Fitur</a>
            <a href="/#koleksi" className="hover:text-neutral-900 transition-colors">Koleksi Akun</a>
            <a href="/#harga" className="hover:text-neutral-900 transition-colors">Harga Paket</a>
            <a href="/#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>
          </nav>
        )}

        {/* Auth CTA / User Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {isDashboard ? (
                /* Inside User Dashboard: Show User Email badge & Logout */
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#EFEFE8] border border-[#DDDDCF] text-xs font-semibold text-neutral-800">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="max-w-[150px] truncate">{user?.name ? user.name.trim().split(/\s+/)[0] : user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-semibold text-neutral-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Keluar dari akun"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              ) : (
                /* Inside Public Landing: Show Dashboard link & Logout icon */
                <div className="flex items-center gap-2">
                  {role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 px-4.5 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-neutral-900 bg-[#EFEFE8] hover:bg-[#E5E5DC] border border-[#DDDDCF] rounded-2xl transition-all shadow-sm"
                    >
                      <Shield className="w-4 h-4 text-neutral-800" />
                      Admin Panel
                    </Link>
                  ) : (
                    <Link
                      to="/akun"
                      className="inline-flex items-center gap-2 px-4.5 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-neutral-900 bg-[#EFEFE8] hover:bg-[#E5E5DC] border border-[#DDDDCF] rounded-2xl transition-all shadow-sm"
                    >
                      <LayoutDashboard className="w-4 h-4 text-neutral-800" />
                      Dashboard Saya
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4.5 py-2.5 min-h-[42px] inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="px-5 py-2.5 min-h-[42px] inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all shadow-sm hover:shadow"
              >
                Daftar Sekarang
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
