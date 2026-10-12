import { create } from 'zustand';
import api from '../api/client';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('hitshare_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse hitshare_user from localStorage:', e);
    localStorage.removeItem('hitshare_user');
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  role: localStorage.getItem('hitshare_role') || null,
  token: localStorage.getItem('hitshare_token') || null,
  isAuthenticated: !!localStorage.getItem('hitshare_token'),
  loading: false,

  setAuth: ({ token, role, user }) => {
    if (token) localStorage.setItem('hitshare_token', token);
    if (role) localStorage.setItem('hitshare_role', role);
    if (user) localStorage.setItem('hitshare_user', JSON.stringify(user));

    set({
      token: token || get().token,
      role: role || get().role,
      user: user || get().user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('hitshare_token');
    localStorage.removeItem('hitshare_role');
    localStorage.removeItem('hitshare_user');
    set({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
    });
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/user/profile');
      const updatedUser = res.data;
      localStorage.setItem('hitshare_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return updatedUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  },
}));
