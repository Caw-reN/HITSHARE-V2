import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If user tries to access admin route, redirect to user dashboard, and vice-versa
    return <Navigate to={role === 'admin' ? '/admin' : '/akun'} replace />;
  }

  return children;
}
