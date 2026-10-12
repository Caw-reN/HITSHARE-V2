import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AlertProvider } from './context/AlertContext';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RegisterPaymentPage = lazy(() => import('./pages/RegisterPaymentPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col items-center justify-center text-neutral-400 gap-3">
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Memuat Halaman...</span>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/daftar" element={<RegisterPage />} />
            <Route path="/daftar/bayar/:orderId" element={<RegisterPaymentPage />} />
            <Route
              path="/akun"
              element={
                <ProtectedRoute allowedRole="user">
                  <UserDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AlertProvider>
    </ErrorBoundary>
  );
}

