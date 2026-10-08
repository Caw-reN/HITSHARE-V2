import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useAlert } from '../context/AlertContext';
import {
  LayoutDashboard,
  Users,
  Globe,
  ShoppingCart,
  Tag,
  Settings,
  FileText,
  LogOut,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  ChevronDown,
  Cookie,
  FolderTree,
  ExternalLink,
  Check,
  CreditCard,
  Wallet,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Save,
  Package,
  Phone,
  AlertCircle,
  FlaskConical,
  Rocket,
  Key,
  Webhook,
  Info,
  CheckCircle2,
  Gift,
  TrendingUp,
  Clock,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import AdminAffiliateTab from '../components/AdminAffiliateTab';
import AdminRevenueChart from '../components/AdminRevenueChart';

const CURRENT_YEAR = new Date().getFullYear();
const TODAY_FORMATTED = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  disabled = false,
  className = '',
  buttonClassName = '',
}) {
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

  const selectedOption = options.find((opt) => String(opt.value) === String(value) && opt.value !== '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-sm bg-[#FBFBF9] border rounded-2xl text-left flex items-center justify-between min-h-[46px] transition-all cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-[#DDDDCF]'
            : isOpen
            ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/5 shadow-xs'
            : 'border-[#DDDDCF] hover:border-neutral-400 focus:border-neutral-900 focus:bg-white'
        } ${buttonClassName}`}
      >
        <span className={`truncate ${selectedOption ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 mt-1.5 bg-white border border-[#E8E8DF] rounded-2xl shadow-bone-lg p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-neutral-400 text-center">
              Tidak ada pilihan
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'text-neutral-700 hover:bg-[#F5F5EE] hover:text-neutral-900'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { role, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast, showConfirm } = useAlert();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Navigation dropdowns
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);
  const [transactionDropdownOpen, setTransactionDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);

  const websiteDropdownRef = useRef(null);
  const transactionDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (websiteDropdownRef.current && !websiteDropdownRef.current.contains(event.target)) {
        setWebsiteDropdownOpen(false);
      }
      if (transactionDropdownRef.current && !transactionDropdownRef.current.contains(event.target)) {
        setTransactionDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    status: 'active',
    expires_at: '',
    phone: '',
  });

  // Websites state
  const [websites, setWebsites] = useState([]);
  const [websiteSearch, setWebsiteSearch] = useState('');
  const [websiteCategoryFilter, setWebsiteCategoryFilter] = useState('');
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [websiteForm, setWebsiteForm] = useState({
    category_id: '',
    name: '',
    url: '',
    icon: 'Globe',
    is_active: true,
  });
  const [uploadingWebsiteIcon, setUploadingWebsiteIcon] = useState(false);
  const websiteIconInputRef = useRef(null);

  const isImageIcon = (icon) => {
    if (!icon || typeof icon !== 'string') return false;
    return (
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('/') ||
      icon.startsWith('data:image/')
    );
  };


  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'Tag',
    sort_order: 0,
  });

  // Cookie accounts state
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [editingCookie, setEditingCookie] = useState(null);
  const [cookieForm, setCookieForm] = useState({
    website_id: '',
    label: 'Akun 1',
    cookie_data: '[]',
    is_active: true,
  });
  const [cookieSearch, setCookieSearch] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherSubmitting, setVoucherSubmitting] = useState(false);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: 20,
    max_uses: 0,
    min_amount: 0,
    applies_to: 'all',
    is_active: true,
    description: '',
  });

  // Plans state
  const [plansList, setPlansList] = useState([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    label: '',
    plan: '',
    amount: 25000,
    duration_days: 30,
    original_price: 0,
    badge: '',
    description: '',
    is_active: true,
    sort_order: 1,
  });
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // Settings state
  const [settingsData, setSettingsData] = useState({});
  const [uploadExtVersion, setUploadExtVersion] = useState('');
  const [uploadingExt, setUploadingExt] = useState(false);
  const [showSandboxApiKey, setShowSandboxApiKey] = useState(false);
  const [showSandboxWebhookSecret, setShowSandboxWebhookSecret] = useState(false);
  const [showProdApiKey, setShowProdApiKey] = useState(false);
  const [showProdWebhookSecret, setShowProdWebhookSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Logs state
  const [logs, setLogs] = useState([]);

  const loadOverview = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWebsites = async (silent = false) => {
    if (!silent) setTabLoading(true);
    try {
      const [wRes, cRes] = await Promise.all([
        api.get('/admin/websites'),
        api.get('/admin/categories'),
      ]);
      setWebsites(wRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setTabLoading(false);
    }
  };

  const loadPlans = async (silent = false) => {
    if (!silent) setTabLoading(true);
    try {
      const res = await api.get('/admin/plans');
      setPlansList(res.data || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      if (!silent) setTabLoading(false);
    }
  };

  const loadVouchers = async (silent = false) => {
    if (!silent) setTabLoading(true);
    try {
      const res = await api.get('/admin/vouchers');
      setVouchers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setTabLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') {
      navigate('/login');
      return;
    }
    let isMounted = true;
    api.get('/admin/dashboard')
      .then((res) => {
        if (isMounted) setStats(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Prefetch counts so navbar badges and subnav tabs display accurate counts immediately
    Promise.resolve().then(() => {
      if (isMounted) {
        loadPlans(true);
        loadVouchers(true);
        loadWebsites(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, role, navigate]);

  const loadUsers = async () => {
    setTabLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadOrders = async (search = orderSearch, status = orderStatus, silent = false) => {
    if (!silent) setTabLoading(true);
    try {
      const res = await api.get('/admin/orders', { params: { search, status: status || '' } });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      if (!silent) setTabLoading(false);
    }
  };

  const handleOpenOrderDetail = async (orderOrId) => {
    const orderId = typeof orderOrId === 'object' ? orderOrId.id : orderOrId;
    if (typeof orderOrId === 'object') {
      setSelectedOrder(orderOrId);
    }
    setOrderDetailModalOpen(true);
    setOrderDetailLoading(true);
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const resetVoucherForm = () => {
    setVoucherForm({
      code: '',
      discount_type: 'percent',
      discount_value: 20,
      max_uses: 0,
      min_amount: 0,
      applies_to: 'all',
      is_active: true,
      description: '',
    });
    setEditingVoucher(null);
  };

  const openCreateVoucherModal = () => {
    resetVoucherForm();
    if (plansList.length === 0) loadPlans();
    setVoucherModalOpen(true);
  };

  const openEditVoucherModal = (voucher) => {
    setEditingVoucher(voucher);
    if (plansList.length === 0) loadPlans();
    setVoucherForm({
      code: voucher.code || '',
      discount_type: voucher.discount_type || 'percent',
      discount_value: voucher.discount_value ?? 20,
      max_uses: voucher.max_uses ?? 0,
      min_amount: voucher.min_amount ?? 0,
      applies_to: voucher.applies_to || 'all',
      is_active: voucher.is_active !== undefined ? Boolean(voucher.is_active) : true,
      description: voucher.description || '',
    });
    setVoucherModalOpen(true);
  };

  const handleSaveVoucher = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (voucherForm.code || '').trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Kode voucher wajib diisi');
      return;
    }
    if (voucherForm.discount_value <= 0) {
      toast.error('Nilai diskon harus lebih besar dari 0');
      return;
    }
    if (voucherForm.discount_type === 'percent' && voucherForm.discount_value > 100) {
      toast.error('Diskon persentase maksimal 100%');
      return;
    }

    setVoucherSubmitting(true);
    try {
      const payload = {
        ...voucherForm,
        code: cleanCode,
        description: (voucherForm.description || '').trim(),
        max_uses: Math.max(0, parseInt(voucherForm.max_uses) || 0),
        min_amount: Math.max(0, parseInt(voucherForm.min_amount) || 0),
      };

      if (editingVoucher) {
        await api.put(`/admin/vouchers/${editingVoucher.id}`, payload);
        toast.success('Voucher berhasil diperbarui');
      } else {
        await api.post('/admin/vouchers', payload);
        toast.success('Voucher berhasil ditambahkan');
      }
      setVoucherModalOpen(false);
      resetVoucherForm();
      loadVouchers();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan voucher');
    } finally {
      setVoucherSubmitting(false);
    }
  };

  const handleDeleteVoucher = async (voucher) => {
    const ok = await showConfirm({
      title: 'Hapus Voucher',
      message: `Hapus voucher "${voucher.code}"? Perhatian: Tindakan ini permanen.`,
      confirmText: 'Hapus Voucher',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/vouchers/${voucher.id}`);
      toast.success('Voucher berhasil dihapus');
      loadVouchers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus voucher');
    }
  };

  const handleToggleVoucher = async (voucher) => {
    try {
      await api.put(`/admin/vouchers/${voucher.id}`, {
        is_active: !voucher.is_active,
      });
      toast.success(`Voucher ${!voucher.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, is_active: !voucher.is_active } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status voucher');
    }
  };

  const loadSettings = async () => {
    setTabLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettingsData(res.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadLogs = async () => {
    setTabLoading(true);
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadCategories = async () => {
    setTabLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    const nextOrder = plansList.length > 0 ? Math.max(...plansList.map((p) => p.sort_order || 0)) + 1 : 1;
    setPlanForm({
      label: '',
      plan: '',
      amount: 25000,
      duration_days: 30,
      original_price: 0,
      badge: '',
      description: '',
      is_active: true,
      sort_order: nextOrder,
    });
    setPlanModalOpen(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      label: plan.label || '',
      plan: plan.plan || '',
      amount: plan.amount || 0,
      duration_days: plan.duration_days || 30,
      original_price: plan.original_price || 0,
      badge: plan.badge || '',
      description: plan.description || '',
      is_active: Boolean(plan.is_active),
      sort_order: plan.sort_order || 0,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setPlanSubmitting(true);
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, planForm);
        toast.success('Paket langganan berhasil diperbarui!');
      } else {
        await api.post('/admin/plans', planForm);
        toast.success('Paket langganan baru berhasil ditambahkan!');
      }
      setPlanModalOpen(false);
      setEditingPlan(null);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan paket langganan');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    const ok = await showConfirm({
      title: 'Hapus Paket Langganan',
      message: `Hapus paket "${plan.label}" (${plan.plan})? Perhatian: Tindakan ini permanen.`,
      confirmText: 'Hapus Paket',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/plans/${plan.id}`);
      toast.success('Paket langganan berhasil dihapus');
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus paket');
    }
  };

  const handleTogglePlan = async (plan) => {
    try {
      const res = await api.post(`/admin/plans/${plan.id}/toggle`);
      setPlansList((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: res.data.is_active } : p))
      );
      toast.success(res.data.is_active ? `Paket "${plan.label}" diaktifkan` : `Paket "${plan.label}" dinonaktifkan`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status paket');
    }
  };

  // Tab switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setWebsiteDropdownOpen(false);
    setTransactionDropdownOpen(false);
    setSettingsDropdownOpen(false);
    if (tab === 'overview') loadOverview();
    if (tab === 'users') loadUsers();
    if (tab === 'websites') {
      loadWebsites();
      loadCategories(true);
    }
    if (tab === 'categories') {
      loadCategories();
      loadWebsites(true);
    }
    if (tab === 'cookies') {
      loadWebsites();
      loadCategories(true);
    }
    if (tab === 'orders') {
      loadOrders();
      loadPlans(true);
      loadVouchers(true);
    }
    if (tab === 'plans') {
      loadPlans();
      loadVouchers(true);
    }
    if (tab === 'vouchers') {
      loadVouchers();
      loadPlans(true);
    }
    if (['settings', 'payment', 'uploads'].includes(tab)) loadSettings();
    if (tab === 'logs') loadLogs();
  };

  // Manual activate order
  const handleManualActivate = async (orderId) => {
    const ok = await showConfirm({
      title: 'Aktivasi Order Manual',
      message: 'Aktifkan order ini secara manual? Masa aktif user akan bertambah sesuai durasi paket.',
      confirmText: 'Aktifkan Order',
    });
    if (!ok) return;

    try {
      await api.post(`/admin/orders/${orderId}/activate`);
      toast.success('Order berhasil diaktivasi!');
      loadOrders();
      setSelectedOrder((prev) => {
        if (prev && (prev.id === orderId || prev.order_id === orderId)) {
          return {
            ...prev,
            status: 'paid',
            paid_at: new Date().toISOString(),
          };
        }
        return prev;
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal aktivasi order');
    }
  };

  // Reset user device
  const handleResetDevice = async (userId) => {
    const ok = await showConfirm({
      title: 'Reset Device ID',
      message: 'Reset device ID untuk user ini? Pengguna dapat login kembali di perangkat baru.',
      confirmText: 'Reset Device',
      isDanger: true,
    });
    if (!ok) return;

    try {
      const res = await api.post(`/admin/users/${userId}/reset-device`);
      toast.success(res.data.message || 'Device ID berhasil direset');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal reset device');
    }
  };

  // Open Edit User modal
  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      status: user.status || 'active',
      expires_at: user.expires_at ? user.expires_at.split('T')[0] : '',
      phone: user.phone || '',
    });
    setUserModalOpen(true);
  };

  // Save User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, userForm);
      toast.success('Data pengguna berhasil diperbarui');
      setUserModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui pengguna');
    }
  };

  // Quick Activate User (+30 days)
  const handleQuickActivate = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { status: 'active' });
      toast.success(`User ${user.email} berhasil diaktifkan (+30 hari)`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengaktifkan user');
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    const ok = await showConfirm({
      title: 'Hapus Pengguna',
      message: `Hapus pengguna ${user.email}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Pengguna',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success('User berhasil dihapus');
      loadUsers();
    } catch {
      toast.error('Gagal menghapus user');
    }
  };

  // Helper to add days to expiry date
  const addDaysToExpiry = (days) => {
    setUserForm((prev) => {
      const now = new Date();
      const base = prev.expires_at ? new Date(prev.expires_at) : now;
      const startDate = base > now ? base : now;
      startDate.setDate(startDate.getDate() + days);
      return {
        ...prev,
        expires_at: startDate.toISOString().split('T')[0],
        status: 'active',
      };
    });
  };

  // Save general settings
  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', {
        site_name: settingsData.site_name,
        whatsapp_number: settingsData.whatsapp_number,
        contact_message: settingsData.contact_message,
      });
      toast.success('Pengaturan umum berhasil disimpan');
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengaturan umum');
    } finally {
      setSavingSettings(false);
    }
  };

  // Save payment settings (Paymenku Dual Mode)
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const payload = {
        paymenku_is_production: (settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true) ? 'true' : 'false',
        paymenku_sandbox_api_key: settingsData.paymenku_sandbox_api_key ?? '',
        paymenku_sandbox_webhook_secret: settingsData.paymenku_sandbox_webhook_secret ?? '',
        paymenku_prod_api_key: settingsData.paymenku_prod_api_key ?? '',
        paymenku_prod_webhook_secret: settingsData.paymenku_prod_webhook_secret ?? '',
      };

      await api.put('/admin/settings', payload);
      toast.success('Konfigurasi Paymenku (Sandbox & Produksi) berhasil disimpan');
      await loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan konfigurasi pembayaran');
    } finally {
      setSavingPayment(false);
    }
  };

  // Save minimum extension version policy
  const handleSaveExtensionVersion = async (e) => {
    e.preventDefault();
    setSavingVersion(true);
    try {
      await api.put('/admin/settings', {
        extension_version: settingsData.extension_version,
      });
      toast.success('Versi minimal ekstensi berhasil diperbarui');
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui versi ekstensi');
    } finally {
      setSavingVersion(false);
    }
  };

  // Copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/payment/webhook/paymenku`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    toast.success('URL Webhook Paymenku berhasil disalin!');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  // Upload Brand Image (Logo / Favicon)
  const handleUploadBrand = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = type === 'logo';
    if (isLogo) setUploadingLogo(true);
    else setUploadingFavicon(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/admin/upload/brand/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || `${type === 'logo' ? 'Logo' : 'Favicon'} berhasil diunggah`);
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || `Gagal mengunggah ${type}`);
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingFavicon(false);
      e.target.value = '';
    }
  };


  // Upload Extension ZIP
  const handleUploadExtension = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (uploadExtVersion.trim()) {
      formData.append('version', uploadExtVersion.trim());
    }

    setUploadingExt(true);
    try {
      const res = await api.post('/admin/upload/extension', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'File ekstensi berhasil diunggah');
      setUploadExtVersion('');
      if (res.data.version) {
        setSettingsData((prev) => ({
          ...prev,
          extension_version: res.data.version,
          extension_file_size: res.data.size,
          extension_updated_at: new Date().toISOString(),
        }));
      }
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal upload file');
    } finally {
      setUploadingExt(false);
      e.target.value = '';
    }
  };

  // Toggle website active status
  const handleToggleWebsiteActive = async (w) => {
    try {
      const newStatus = !w.is_active;
      setWebsites((prev) =>
        prev.map((item) => (item.id === w.id ? { ...item, is_active: newStatus } : item))
      );
      await api.put(`/admin/websites/${w.id}`, { is_active: newStatus });
      toast.success(newStatus ? `Website "${w.name}" diaktifkan` : `Website "${w.name}" dinonaktifkan`);
    } catch {
      toast.error('Gagal mengubah status website');
      loadWebsites();
    }
  };

  // Upload Website Icon
  const handleUploadWebsiteIcon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|gif|svg|ico|webp)$/i)) {
      toast.error('Format file harus berupa gambar (PNG, JPG, SVG, ICO, WEBP)');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran icon maksimal 2MB');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingWebsiteIcon(true);
    try {
      const res = await api.post('/admin/upload/website-icon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.url) {
        setWebsiteForm((prev) => ({ ...prev, icon: res.data.url }));
        toast.success('Icon website berhasil diupload!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal upload icon website');
    } finally {
      setUploadingWebsiteIcon(false);
      if (e.target) e.target.value = '';
    }
  };

  // Website CRUD handlers
  const handleOpenCreateWebsite = () => {
    setEditingWebsite(null);
    setWebsiteForm({
      category_id: categories.length > 0 ? categories[0].id : '',
      name: '',
      url: '',
      icon: 'Globe',
      is_active: true,
    });
    setWebsiteModalOpen(true);
  };

  const handleOpenEditWebsite = (website) => {
    setEditingWebsite(website);
    setWebsiteForm({
      category_id: website.category_id,
      name: website.name,
      url: website.url,
      icon: website.icon || 'Globe',
      is_active: website.is_active !== undefined ? Boolean(website.is_active) : true,
    });
    setWebsiteModalOpen(true);
  };

  const handleSaveWebsite = async (e) => {
    e.preventDefault();
    if (!websiteForm.name || !websiteForm.category_id) {
      toast.error('Nama website dan kategori wajib diisi');
      return;
    }
    try {
      if (editingWebsite) {
        await api.put(`/admin/websites/${editingWebsite.id}`, websiteForm);
        toast.success('Website berhasil diperbarui');
      } else {
        await api.post('/admin/websites', websiteForm);
        toast.success('Website baru berhasil ditambahkan');
      }
      setWebsiteModalOpen(false);
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan website');
    }
  };

  const handleDeleteWebsite = async (website) => {
    const ok = await showConfirm({
      title: 'Hapus Website',
      message: `Hapus website "${website.name}" beserta semua akun dan cookies-nya?`,
      confirmText: 'Hapus Website',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/websites/${website.id}`);
      toast.success('Website berhasil dihapus');
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus website');
    }
  };

  // Category CRUD handlers
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon: 'Tag',
      sort_order: categories.length + 1,
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      icon: cat.icon || 'Tag',
      sort_order: cat.sort_order || 0,
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, categoryForm);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await api.post('/admin/categories', categoryForm);
        toast.success('Kategori baru berhasil ditambahkan');
      }
      setCategoryModalOpen(false);
      loadCategories();
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await showConfirm({
      title: 'Hapus Kategori',
      message: `Hapus kategori "${cat.name}"? Semua website di kategori ini akan tetap tersimpan.`,
      confirmText: 'Hapus Kategori',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/categories/${cat.id}`);
      toast.success('Kategori berhasil dihapus');
      loadCategories();
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus kategori');
    }
  };

  // Cookie CRUD handlers
  const handleOpenCreateCookie = (preselectedWebsiteId = null) => {
    const targetWebId = preselectedWebsiteId ? String(preselectedWebsiteId) : (websites[0]?.id ? String(websites[0].id) : '');
    const targetWeb = websites.find((w) => String(w.id) === String(targetWebId));
    setEditingCookie(null);
    setCookieForm({
      website_id: targetWebId,
      label: `Akun ${(targetWeb?.accounts?.length || 0) + 1}`,
      cookie_data: '[]',
      is_active: true,
    });
    setCookieModalOpen(true);
  };

  const handleOpenEditCookie = (website, acc) => {
    setEditingCookie({ ...acc, website_id: website.id });
    setCookieForm({
      website_id: String(website.id),
      label: acc.label,
      cookie_data: acc.cookie_data || '[]',
      is_active: Boolean(acc.is_active),
    });
    setCookieModalOpen(true);
  };

  const handleSaveCookie = async (e) => {
    e.preventDefault();
    if (!cookieForm.website_id) {
      toast.error('Pilih website terlebih dahulu');
      return;
    }
    if (!cookieForm.label.trim()) {
      toast.error('Label akun wajib diisi');
      return;
    }
    try {
      if (editingCookie) {
        await api.put(`/admin/websites/${cookieForm.website_id}/accounts/${editingCookie.id}`, {
          label: cookieForm.label,
          cookie_data: cookieForm.cookie_data,
          is_active: cookieForm.is_active,
        });
        toast.success('Cookie akun berhasil diperbarui');
      } else {
        await api.post(`/admin/websites/${cookieForm.website_id}/accounts`, {
          label: cookieForm.label,
          cookie_data: cookieForm.cookie_data,
          is_active: cookieForm.is_active,
        });
        toast.success('Cookie akun baru berhasil ditambahkan');
      }
      setCookieModalOpen(false);
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan cookie akun');
    }
  };

  const handleDeleteCookie = async (websiteId, accId, label) => {
    const ok = await showConfirm({
      title: 'Hapus Akun Cookie',
      message: `Hapus ${label || 'akun ini'} beserta data cookie-nya?`,
      confirmText: 'Hapus Akun',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/websites/${websiteId}/accounts/${accId}`);
      toast.success('Cookie akun berhasil dihapus');
      loadWebsites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus cookie akun');
    }
  };

  const handleToggleCookieActive = async (websiteId, acc) => {
    try {
      const newStatus = !acc.is_active;
      setWebsites((prev) =>
        prev.map((w) => {
          if (w.id !== websiteId) return w;
          return {
            ...w,
            accounts: (w.accounts || []).map((a) =>
              a.id === acc.id ? { ...a, is_active: newStatus } : a
            ),
          };
        })
      );
      await api.put(`/admin/websites/${websiteId}/accounts/${acc.id}`, { is_active: newStatus });
      toast.success(newStatus ? `Akun ${acc.label} diaktifkan` : `Akun ${acc.label} dinonaktifkan`);
    } catch {
      toast.error('Gagal mengubah status aktif cookie');
      loadWebsites();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-neutral-800 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#EAEAE3] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-2xl bg-white border border-[#E0E0D8] p-1.5 flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
          </Link>
          <div>
            <span className="text-base font-bold text-neutral-900">HitShare Admin</span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Control Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/akun" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900">
            Lihat Portal User
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 px-4.5 py-2.5 text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-colors min-h-[40px] cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            Keluar
          </button>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className="bg-[#FFFFFF] border-b border-[#EAEAE3] px-6 py-2.5 relative z-40 overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-600 overflow-visible relative flex-wrap sm:flex-nowrap">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs' : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs' : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
            }`}
          >
            <Users className="w-4 h-4" /> Pengguna
          </button>
          {/* Dropdown Menu for Website, Kategori, Cookie */}
          <div className="relative" ref={websiteDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setWebsiteDropdownOpen((prev) => !prev);
                setTransactionDropdownOpen(false);
                setSettingsDropdownOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
                ['websites', 'categories', 'cookies'].includes(activeTab)
                  ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs'
                  : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
              }`}
            >
              {activeTab === 'categories' ? (
                <FolderTree className="w-4 h-4 text-neutral-800" />
              ) : activeTab === 'cookies' ? (
                <Cookie className="w-4 h-4 text-neutral-800" />
              ) : (
                <Globe className="w-4 h-4 text-neutral-800" />
              )}
              <span className="whitespace-nowrap">
                {activeTab === 'categories'
                  ? 'Kategori'
                  : activeTab === 'cookies'
                  ? 'Cookie Akun'
                  : 'Website & Cookie'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  websiteDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {websiteDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E8E8DF] p-2 z-[999] space-y-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('websites')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'websites'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Globe className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Website</div>
                    <div className="text-xs text-neutral-500 leading-tight">Daftar & Konfigurasi URL</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('categories')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'categories'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <FolderTree className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Kategori</div>
                    <div className="text-xs text-neutral-500 leading-tight">Kelola Kategori Layanan</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('cookies')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'cookies'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Cookie className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Cookie Akun</div>
                    <div className="text-xs text-neutral-500 leading-tight">Grouping Website & Toggle</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          {/* Dropdown Menu for Transaksi, Paket Langganan, Voucher */}
          <div className="relative" ref={transactionDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTransactionDropdownOpen((prev) => !prev);
                setWebsiteDropdownOpen(false);
                setSettingsDropdownOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
                ['orders', 'plans', 'vouchers'].includes(activeTab)
                  ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs'
                  : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
              }`}
            >
              {activeTab === 'plans' ? (
                <CreditCard className="w-4 h-4 text-neutral-800" />
              ) : activeTab === 'vouchers' ? (
                <Tag className="w-4 h-4 text-neutral-800" />
              ) : (
                <ShoppingCart className="w-4 h-4 text-neutral-800" />
              )}
              <span className="whitespace-nowrap">
                {activeTab === 'plans'
                  ? 'Paket Langganan'
                  : activeTab === 'vouchers'
                  ? 'Voucher Diskon'
                  : activeTab === 'orders'
                  ? 'Transaksi'
                  : 'Transaksi & Paket'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  transactionDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {transactionDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E8E8DF] p-2 z-[999] space-y-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('orders')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'orders'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Transaksi</div>
                    <div className="text-xs text-neutral-500 leading-tight">Daftar Pesanan & Status</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('plans')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'plans'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Paket Langganan</div>
                    <div className="text-xs text-neutral-500 leading-tight">Harga, Durasi & Fitur</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('vouchers')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'vouchers'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Tag className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Voucher Diskon</div>
                    <div className="text-xs text-neutral-500 leading-tight">Kupon & Potongan Harga</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Afiliasi Menu */}
          <button
            type="button"
            onClick={() => handleTabChange('affiliates')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
              activeTab === 'affiliates'
                ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs'
                : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
            }`}
          >
            <Gift className="w-4 h-4 text-neutral-800" />
            <span>Afiliasi</span>
          </button>

          {/* Dropdown Menu for Pengaturan, Pembayaran, Upload, Logs */}
          <div className="relative" ref={settingsDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsDropdownOpen((prev) => !prev);
                setWebsiteDropdownOpen(false);
                setTransactionDropdownOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
                ['payment', 'settings', 'uploads', 'logs'].includes(activeTab)
                  ? 'bg-[#F2F2EC] text-neutral-900 font-bold shadow-2xs'
                  : 'hover:text-neutral-900 hover:bg-[#F9F9F6]'
              }`}
            >
              {activeTab === 'payment' ? (
                <Wallet className="w-4 h-4 text-neutral-800" />
              ) : activeTab === 'uploads' ? (
                <Upload className="w-4 h-4 text-neutral-800" />
              ) : activeTab === 'logs' ? (
                <FileText className="w-4 h-4 text-neutral-800" />
              ) : (
                <Settings className="w-4 h-4 text-neutral-800" />
              )}
              <span className="whitespace-nowrap">
                {activeTab === 'payment'
                  ? 'Pembayaran'
                  : activeTab === 'uploads'
                  ? 'Upload Ekstensi'
                  : activeTab === 'logs'
                  ? 'Activity Logs'
                  : activeTab === 'settings'
                  ? 'Pengaturan Umum'
                  : 'Pengaturan & Sistem'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  settingsDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {settingsDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E8E8DF] p-2 z-[999] space-y-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('payment')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'payment'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Gerbang Pembayaran</div>
                    <div className="text-xs text-neutral-500 leading-tight">Paymenku Gateway & Webhook</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('settings')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'settings'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Settings className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Pengaturan Umum</div>
                    <div className="text-xs text-neutral-500 leading-tight">Info Situs & Kontak WhatsApp</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('uploads')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'uploads'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <Upload className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Upload Ekstensi</div>
                    <div className="text-xs text-neutral-500 leading-tight">Distribusi ZIP & Update Versi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('logs')}
                  className={`w-full px-3.5 py-2.5 text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer min-h-[40px] ${
                    activeTab === 'logs'
                      ? 'bg-[#F2F2EC] text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:bg-[#F9F9F6] hover:text-neutral-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-neutral-600 shrink-0" />
                  <div>
                    <div className="font-bold text-sm leading-tight">Activity Logs</div>
                    <div className="text-xs text-neutral-500 leading-tight">Audit Log Aktivitas Pengguna</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* AFILIASI TAB */}
        {activeTab === 'affiliates' && (
          <AdminAffiliateTab toast={toast} showConfirm={showConfirm} />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          loading || !stats ? (
            <div className="space-y-6 animate-pulse">
              {/* Header Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-6 w-52 bg-[#E2E2D9] rounded-lg"></div>
                  <div className="h-4 w-80 max-w-full bg-[#F1F1EB] rounded-md"></div>
                </div>
                <div className="h-7 w-32 bg-[#EBEBE4] rounded-full"></div>
              </div>

              {/* 1. Bento Command Center Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* Hero Card Skeleton (Col 7) */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-64 bg-[#E2E2D9] rounded-lg"></div>
                      <div className="h-4 w-24 bg-[#EBEBE4] rounded-md"></div>
                    </div>
                    {/* Big Value */}
                    <div className="space-y-2 pt-1">
                      <div className="h-10 sm:h-12 w-64 bg-[#E2E2D9] rounded-xl"></div>
                      <div className="h-3.5 w-80 max-w-full bg-[#F1F1EB] rounded-md"></div>
                    </div>
                    {/* Flow & Margin Skeleton */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-3">
                      <div className="grid grid-cols-3 gap-2.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white border border-[#EBEBE2] space-y-2">
                            <div className="h-3 w-16 bg-[#EBEBE4] rounded"></div>
                            <div className="h-4 w-24 bg-[#E2E2D9] rounded"></div>
                            <div className="h-2.5 w-20 bg-[#F1F1EB] rounded"></div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-1.5 border-t border-[#EFEFE8]">
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-32 bg-[#EBEBE4] rounded"></div>
                          <div className="h-4 w-20 bg-[#E2E2D9] rounded"></div>
                        </div>
                        <div className="h-2.5 w-full bg-[#E8E8DF] rounded-full"></div>
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="h-3 w-48 bg-[#F1F1EB] rounded"></div>
                          <div className="h-3 w-28 bg-[#F1F1EB] rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Velocity Shelf */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 mt-5 border-t border-[#F0F0E8]">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#EBEBE2] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-3.5 w-28 bg-[#EBEBE4] rounded"></div>
                          <div className="h-3.5 w-12 bg-[#F1F1EB] rounded"></div>
                        </div>
                        <div className="h-6 w-36 bg-[#E2E2D9] rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Stacked Column Skeleton (Col 5) */}
                <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
                  {/* Card 1: Affiliate Wallet Skeleton */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="h-6 w-52 bg-[#E2E2D9] rounded-lg"></div>
                        <div className="h-4 w-20 bg-[#EBEBE4] rounded-md"></div>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3 w-44 bg-[#F1F1EB] rounded"></div>
                        <div className="h-7 w-36 bg-[#E2E2D9] rounded-xl"></div>
                        <div className="h-3 w-60 max-w-full bg-[#F1F1EB] rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F0F0E8]">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-1.5">
                          <div className="h-2.5 w-20 bg-[#EBEBE4] rounded"></div>
                          <div className="h-4 w-24 bg-[#E2E2D9] rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Operational Queue Skeleton */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-52 bg-[#E2E2D9] rounded-lg"></div>
                      <div className="h-3 w-28 bg-[#F1F1EB] rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-3 w-20 bg-[#EBEBE4] rounded"></div>
                            <div className="h-3 w-3 bg-[#EBEBE4] rounded-full"></div>
                          </div>
                          <div className="h-6 w-10 bg-[#E2E2D9] rounded-lg"></div>
                          <div className="h-2.5 w-24 bg-[#F1F1EB] rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Platform & Infrastructure Tiles Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-4.5 rounded-3xl border border-[#E8E8DF] shadow-bone flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-[#EBEBE4] rounded"></div>
                      <div className="h-5 w-32 bg-[#E2E2D9] rounded-lg"></div>
                      <div className="h-3 w-28 bg-[#F1F1EB] rounded"></div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#F4F4EE]"></div>
                  </div>
                ))}
              </div>

              {/* Revenue Chart Skeleton */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-52 bg-[#E2E2D9] rounded-lg"></div>
                    <div className="h-3.5 w-72 bg-[#F1F1EB] rounded-md"></div>
                  </div>
                  <div className="h-8 w-44 bg-[#EBEBE4] rounded-2xl"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#EFEFE8]">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-20 bg-[#EBEBE4] rounded"></div>
                      <div className="h-5 w-28 bg-[#E2E2D9] rounded-lg"></div>
                    </div>
                  ))}
                </div>
                <div className="h-48 sm:h-64 bg-[#F8F8F4] rounded-2xl"></div>
              </div>

              {/* Plan Distribution & Member Retention Widgets Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-48 bg-[#E2E2D9] rounded-lg"></div>
                  <div className="h-32 bg-[#F6F6F2] rounded-2xl"></div>
                </div>
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-44 bg-[#E2E2D9] rounded-lg"></div>
                  <div className="h-32 bg-[#F6F6F2] rounded-2xl"></div>
                </div>
              </div>

              {/* Dual Tables Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-40 bg-[#E2E2D9] rounded-lg"></div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-[#F6F6F2] rounded-xl"></div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="h-5 w-40 bg-[#E2E2D9] rounded-lg"></div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-[#F6F6F2] rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Overview Dashboard</h2>
                  <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                    Ringkasan performa penjualan harian, tren transaksi, dan status operasional sistem.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sistem Realtime
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-500 bg-[#F4F4EE] border border-[#E4E4DC]">
                    {TODAY_FORMATTED}
                  </span>
                </div>
              </div>

              {/* 1. BENTO COMMAND CENTER: HERO FINANCIALS & AFFILIATE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* [HERO CARD - COL SPAN 7] : Omset Bersih Admin & Rincian Profit */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone relative overflow-hidden flex flex-col justify-between">
                  {/* Decorative soft ambient glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/60 via-emerald-50/20 to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20"></div>

                  <div className="space-y-4 relative z-10">
                    {/* Header Title & Action */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                          Omset Bersih Admin <span className="text-xs sm:text-sm font-semibold text-neutral-400 font-normal">(Net Profit)</span>
                        </h3>
                      </div>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Semua Pesanan</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Main Massive Number */}
                    <div className="pt-1">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight">
                        Rp {(stats.ordersStats?.totalRevenue ?? 0).toLocaleString('id-ID')}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
                        Total laba bersih all-time setelah dipotong fee payment gateway dan komisi afiliasi
                      </p>
                    </div>

                    {/* Alur Finansial & Rasio Efisiensi Profit Margin */}
                    {(() => {
                      const grossRev = stats.ordersStats?.totalGrossRevenue || 0;
                      const netRev = stats.ordersStats?.totalRevenue || 0;
                      const feeRev = stats.ordersStats?.totalFees || 0;
                      const commRev = stats.ordersStats?.totalCommissions || 0;

                      const netPct = grossRev > 0 ? ((netRev / grossRev) * 100).toFixed(1) : '100';
                      const commPct = grossRev > 0 ? ((commRev / grossRev) * 100).toFixed(1) : '0';
                      const feePct = grossRev > 0 ? ((feeRev / grossRev) * 100).toFixed(1) : '0';

                      return (
                        <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-3">
                          {/* 3 Alur Dana Breakdown */}
                          <div className="grid grid-cols-3 gap-2.5 text-xs">
                            <div className="p-3 rounded-xl bg-white border border-[#EBEBE2] space-y-1">
                              <span className="text-[11px] font-medium text-neutral-400 block">Total Penjualan</span>
                              <div className="font-bold text-neutral-900 text-xs sm:text-sm">
                                Rp {grossRev.toLocaleString('id-ID')}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-medium block">
                                {stats.ordersStats?.totalPaid ?? 0} pesanan sukses
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-white border border-[#EBEBE2] space-y-1">
                              <span className="text-[11px] font-medium text-neutral-400 block">Fee Gateway</span>
                              <div className="font-semibold text-rose-600 text-xs sm:text-sm">
                                - Rp {feeRev.toLocaleString('id-ID')}
                              </div>
                              <span className="text-[10px] text-rose-500 font-medium block">
                                {feePct}% potongan
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-white border border-[#EBEBE2] space-y-1">
                              <span className="text-[11px] font-medium text-neutral-400 block">Komisi Afiliasi</span>
                              <div className="font-bold text-purple-600 text-xs sm:text-sm">
                                - Rp {commRev.toLocaleString('id-ID')}
                              </div>
                              <span className="text-[10px] text-purple-500 font-medium block">
                                {commPct}% hak mitra
                              </span>
                            </div>
                          </div>

                          {/* Visual Profit Margin Efficiency Bar */}
                          <div className="space-y-1.5 pt-1.5 border-t border-[#EFEFE8]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                Efisiensi Margin Bersih
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                                {netPct}% Margin Laba
                              </span>
                            </div>

                            {/* Multi-segment Segmented Bar */}
                            <div className="w-full h-2.5 bg-[#E8E8DF] rounded-full overflow-hidden flex">
                              <div
                                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                                style={{ width: `${Math.max(5, parseFloat(netPct))}%` }}
                                title={`Omset Bersih Admin: ${netPct}%`}
                              />
                              <div
                                className="bg-purple-500 h-full transition-all duration-500"
                                style={{ width: `${parseFloat(commPct)}%` }}
                                title={`Komisi Afiliasi: ${commPct}%`}
                              />
                              <div
                                className="bg-rose-400 h-full rounded-r-full transition-all duration-500"
                                style={{ width: `${parseFloat(feePct)}%` }}
                                title={`Fee Gateway: ${feePct}%`}
                              />
                            </div>

                            {/* Legend & AOV */}
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5 flex-wrap gap-1">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 font-medium text-neutral-700">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Bersih ({Math.round(parseFloat(netPct))}%)
                                </span>
                                <span className="flex items-center gap-1 font-medium text-purple-700">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  Afiliasi ({Math.round(parseFloat(commPct))}%)
                                </span>
                                <span className="flex items-center gap-1 font-medium text-rose-600">
                                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                  Fee ({Math.round(parseFloat(feePct))}%)
                                </span>
                              </div>
                              <div className="font-medium text-neutral-500">
                                Rata-rata: <strong className="text-neutral-800 font-bold">Rp {(stats.ordersStats?.avgOrderValue ?? 0).toLocaleString('id-ID')}</strong>/order
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Velocity Shelf: Hari Ini vs Bulan Ini */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-3 border-t border-[#F0F0E8] relative z-10">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#EBEBE2] space-y-1">
                      <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                        <span className="flex items-center gap-1.5 font-semibold text-neutral-700">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Hari Ini ({stats.ordersStats?.todayPaidCount ?? 0} trx)
                        </span>
                        <span className="text-emerald-700 font-bold text-[11px]">
                          Lunas
                        </span>
                      </div>
                      <div className="text-lg sm:text-xl font-black text-neutral-900">
                        Rp {(stats.ordersStats?.todayRevenue ?? 0).toLocaleString('id-ID')}
                      </div>
                      {(stats.ordersStats?.todayCommissions ?? 0) > 0 && (
                        <div className="text-[11px] text-purple-700 font-semibold pt-0.5">
                          Komisi: - Rp {(stats.ordersStats?.todayCommissions ?? 0).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#EBEBE2] space-y-1">
                      <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                        <span className="flex items-center gap-1.5 font-semibold text-neutral-700">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> Bulan Ini ({stats.ordersStats?.monthPaidCount ?? 0} trx)
                        </span>
                        <span className="text-blue-700 font-bold text-[11px]">
                          Lunas
                        </span>
                      </div>
                      <div className="text-lg sm:text-xl font-black text-neutral-900">
                        Rp {(stats.ordersStats?.monthRevenue ?? 0).toLocaleString('id-ID')}
                      </div>
                      {(stats.ordersStats?.monthCommissions ?? 0) > 0 && (
                        <div className="text-[11px] text-purple-700 font-semibold pt-0.5">
                          Komisi: - Rp {(stats.ordersStats?.monthCommissions ?? 0).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* [RIGHT STACKED COLUMN - COL SPAN 5] : 2 Cards (Affiliate Wallet & Operational Queue) */}
                <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
                  {/* CARD 1: Saldo Khusus Afiliasi */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E8DF] shadow-bone hover:border-purple-300 transition-all space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2 tracking-tight">
                          <Wallet className="w-5 h-5 text-purple-600" />
                          <span>Dompet & Saldo Afiliasi</span>
                        </h3>
                        <button
                          onClick={() => handleTabChange('affiliates')}
                          className="text-xs sm:text-sm font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Kelola Payout</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <span className="text-xs text-neutral-400 font-medium block">Saldo Siap Ditarik (Kewajiban Admin)</span>
                        <div className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight pt-0.5">
                          Rp {(stats.affiliateStats?.unpaidBalance ?? 0).toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-neutral-500 font-medium mt-0.5">
                          Milik {stats.affiliateStats?.activeAffiliates ?? 0} member afiliasi yang dapat dicairkan kapan saja
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F0F0E8] text-xs">
                      <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#EFEFE8]">
                        <span className="text-[11px] text-neutral-400 block font-medium">Total Komisi Diberikan</span>
                        <span className="font-bold text-neutral-800">
                          Rp {(stats.affiliateStats?.totalEarnings ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#EFEFE8]">
                        <span className="text-[11px] text-neutral-400 block font-medium">Sudah Ditransfer</span>
                        <span className="font-bold text-emerald-700">
                          Rp {(stats.affiliateStats?.totalPaidPayouts ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Antrean & Status Perlu Perhatian */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E8DF] shadow-bone hover:border-neutral-300 transition-all space-y-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2 tracking-tight">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <span>Antrean & Perlu Tindakan</span>
                      </h3>
                      <span className="text-xs font-medium text-neutral-400">
                        Rata-rata Order: <strong className="text-neutral-800">Rp {(stats.ordersStats?.avgOrderValue ?? 0).toLocaleString('id-ID')}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Antrean Pesanan Pending */}
                      <div className={`p-3.5 rounded-2xl border transition-colors ${
                        (stats.ordersStats?.totalPending ?? 0) > 0
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-[#FAF9F5] border-[#EFEFE8] text-neutral-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Pesanan Pending</span>
                          <ShoppingCart className="w-3.5 h-3.5 opacity-60" />
                        </div>
                        <div className="text-2xl font-black">
                          {stats.ordersStats?.totalPending ?? 0}
                        </div>
                        <span className="text-[11px] opacity-75 font-medium block">
                          {(stats.ordersStats?.totalPending ?? 0) > 0 ? 'Menunggu pembayaran' : 'Semua lunas'}
                        </span>
                      </div>

                      {/* Antrean Payout Afiliasi */}
                      <div className={`p-3.5 rounded-2xl border transition-colors ${
                        (stats.affiliateStats?.pendingPayoutsCount ?? 0) > 0
                          ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                          : 'bg-[#FAF9F5] border-[#EFEFE8] text-neutral-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">Payout Pending</span>
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                        </div>
                        <div className="text-2xl font-black">
                          {stats.affiliateStats?.pendingPayoutsCount ?? 0}
                        </div>
                        <span className="text-[11px] opacity-75 font-medium block">
                          {(stats.affiliateStats?.pendingPayoutsCount ?? 0) > 0
                            ? `Rp ${(stats.affiliateStats?.pendingPayoutsAmount ?? 0).toLocaleString('id-ID')}`
                            : 'Tidak ada antrean'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. PLATFORM & INFRASTRUCTURE TILES (Compact 3-Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {/* Total Pengguna */}
                <div className="bg-white p-4.5 rounded-3xl border border-[#E8E8DF] shadow-bone flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Pengguna Sistem</span>
                    <div className="text-xl font-black text-neutral-900">
                      {stats.totalUsers} <span className="text-xs font-normal text-neutral-400">Total User</span>
                    </div>
                    <div className="text-xs text-emerald-600 font-bold">
                      {stats.activeUsers} Aktif • {stats.expiredUsers} Expired
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F4F4EE] flex items-center justify-center text-neutral-700">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* Website Aktif */}
                <div className="bg-white p-4.5 rounded-3xl border border-[#E8E8DF] shadow-bone flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Tools / Website</span>
                    <div className="text-xl font-black text-neutral-900">
                      {stats.activeWebsites} <span className="text-xs font-normal text-neutral-400">/ {stats.totalWebsites} Aktif</span>
                    </div>
                    <div className="text-xs text-neutral-500 font-medium">
                      {stats.totalCategories} Kategori Katalog
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F4F4EE] flex items-center justify-center text-neutral-700">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>

                {/* Status Cookie */}
                <div className="bg-white p-4.5 rounded-3xl border border-[#E8E8DF] shadow-bone flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Kesehatan Cookie</span>
                    <div className="text-xl font-black text-emerald-600">
                      {stats.cookieFresh} Fresh
                    </div>
                    <div className="text-xs text-amber-600 font-semibold">
                      {stats.cookieStale} Perlu Cek • {stats.cookieEmpty} Kosong
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F4F4EE] flex items-center justify-center text-neutral-700">
                    <Cookie className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* 3. SECTION: Area Chart Tren Pendapatan (30 Hari / 7 Hari) */}
              <AdminRevenueChart
                trendLast7Days={stats.trendLast7Days}
                trendLast30Days={stats.trendLast30Days}
              />

              {/* 4. SECTION: Distribusi Paket & Retensi Member */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* Widget 1: Distribusi Paket Langganan */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-neutral-700" />
                        Distribusi Paket Terjual
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">
                        Breakdown paket langganan yang paling diminati
                      </p>
                    </div>
                    <span className="text-xs font-bold text-neutral-500 bg-[#F4F4EE] px-2.5 py-1 rounded-full border border-[#E4E4DC]">
                      {stats.ordersStats?.totalPaid ?? 0} Total Sukses
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {(() => {
                      const plans = stats.planBreakdown || [];
                      const totalPaidCount = stats.ordersStats?.totalPaid || 1;
                      if (plans.length === 0) {
                        return (
                          <div className="py-8 text-center text-xs text-neutral-400">
                            Belum ada transaksi paket
                          </div>
                        );
                      }
                      return plans.slice(0, 4).map((p) => {
                        const count = Number(p.count || 0);
                        const pct = Math.min(Math.round((count / totalPaidCount) * 100), 100);
                        return (
                          <div key={p.plan} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-neutral-800 uppercase tracking-wide">
                                {p.plan}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900">
                                  Rp {Number(p.revenue || 0).toLocaleString('id-ID')}
                                </span>
                                <span className="text-neutral-400 font-medium">
                                  ({count} order • {pct}%)
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-[#F1F1EB] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Widget 2: Retensi & Siklus Masa Aktif Pengguna */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-700" />
                        Siklus & Status Member
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">
                        Kondisi masa aktif akun pelanggan
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange('users')}
                      className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Kelola Member <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    {/* Progress Bar Status Member */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-neutral-600">
                        <span>Rasio Member Aktif</span>
                        <span className="font-bold text-emerald-600">
                          {Math.round(((stats.activeUsers || 0) / (stats.totalUsers || 1)) * 100)}% aktif
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#F1F1EB] rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((stats.activeUsers || 0) / (stats.totalUsers || 1)) * 100)
                            )}%`,
                          }}
                        ></div>
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((stats.expiringIn7 || 0) / (stats.totalUsers || 1)) * 100)
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                      <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Aktif
                        </span>
                        <span className="text-lg font-black text-emerald-800">
                          {stats.activeUsers || 0}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                          Habis &lt; 7 Hari
                        </span>
                        <span className="text-lg font-black text-amber-800">
                          {stats.expiringIn7 || 0}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                          Expired
                        </span>
                        <span className="text-lg font-black text-neutral-700">
                          {stats.expiredUsers || 0}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 font-medium text-center pt-1">
                      💡 Pantau member yang akan habis dalam 7 hari untuk pengingat perpanjangan akun.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. SECTION: Dual Table (Transaksi Terbaru & Pengguna Baru) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* 5 Transaksi Terbaru */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">Transaksi Terbaru</h3>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">5 pesanan terakhir</p>
                    </div>
                    <button
                      onClick={() => handleTabChange('orders')}
                      className="text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer transition-colors"
                    >
                      Lihat Semua Pesanan →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3">Order ID</th>
                          <th className="pb-3">Paket</th>
                          <th className="pb-3">Nominal</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F6F2]">
                        {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
                          <tr>
                            <td colSpan="4" className="py-6 text-center text-xs text-neutral-400">
                              Belum ada pesanan terbaru
                            </td>
                          </tr>
                        ) : (
                          stats.recentOrders.map((o) => (
                            <tr
                              key={o.id || o.order_id}
                              onClick={() => handleOpenOrderDetail(o)}
                              className="hover:bg-[#FAF9F6] cursor-pointer transition-colors group"
                            >
                              <td className="py-3 font-semibold text-neutral-900 text-xs sm:text-sm">
                                <div className="font-mono text-neutral-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                  <span>{o.order_id}</span>
                                  <Eye className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[11px] text-neutral-400 font-normal truncate max-w-[140px]">
                                  {o.email}
                                </div>
                              </td>
                              <td className="py-3 uppercase font-bold text-neutral-700 text-xs">
                                {o.plan}
                              </td>
                              <td className="py-3 font-bold text-neutral-900 text-xs sm:text-sm">
                                Rp {Number(o.amount || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="py-3 text-right">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    o.status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : o.status === 'pending'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5 Pengguna Baru Mendaftar */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">Pengguna Baru Mendaftar</h3>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">5 member terbaru</p>
                    </div>
                    <button
                      onClick={() => handleTabChange('users')}
                      className="text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer transition-colors"
                    >
                      Lihat Semua User →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                          <th className="pb-3">Email</th>
                          <th className="pb-3">WhatsApp</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Terdaftar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F6F2]">
                        {(!stats.recentUsers || stats.recentUsers.length === 0) ? (
                          <tr>
                            <td colSpan="4" className="py-6 text-center text-xs text-neutral-400">
                              Belum ada pengguna
                            </td>
                          </tr>
                        ) : (
                          stats.recentUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-[#FAF9F6]">
                              <td className="py-3 font-semibold text-neutral-900 text-xs sm:text-sm">
                                <div className="truncate max-w-[130px] sm:max-w-none">{u.name || u.email}</div>
                                {u.name && <div className="text-[11px] text-neutral-400 font-normal truncate max-w-[130px]">{u.email}</div>}
                              </td>
                              <td className="py-3 text-neutral-600 text-xs">{u.phone || '-'}</td>
                              <td className="py-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    u.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </td>
                              <td className="py-3 text-right text-neutral-400 text-xs">
                                {new Date(u.created_at).toLocaleDateString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari email / nomor HP..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadUsers}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-800 bg-[#EFEFE8] hover:bg-[#E5E5DC] rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Cari
                </button>
                <a
                  href="/api/admin/users/export"
                  download
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-900 bg-white border border-[#DDDDCF] hover:bg-neutral-50 rounded-2xl min-h-[44px] transition-all shadow-2xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </a>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3.5">ID</th>
                    <th className="pb-3.5">Email & WhatsApp</th>
                    <th className="pb-3.5">Device Lock</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5">Sisa Hari</th>
                    <th className="pb-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F6F2]">
                  {tabLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 w-6 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5 space-y-1">
                          <div className="h-4.5 w-36 bg-[#EBEBE4] rounded"></div>
                          <div className="h-3.5 w-24 bg-[#F1F1EB] rounded"></div>
                        </td>
                        <td className="py-3.5"><div className="h-4 w-14 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5"><div className="h-6 w-14 bg-[#EBEBE4] rounded-full"></div></td>
                        <td className="py-3.5"><div className="h-4 w-16 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5 text-right"><div className="h-8 w-8 bg-[#F1F1EB] rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-neutral-400">Tidak ada data pengguna</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-3.5 text-neutral-400 font-mono text-xs">{u.id}</td>
                        <td className="py-3.5">
                          <div className="font-bold text-neutral-900 text-sm sm:text-base">{u.name || u.email}</div>
                          {u.name && <div className="text-xs text-neutral-500">{u.email}</div>}
                          <div className="text-xs text-neutral-400">{u.phone}</div>
                        </td>
                        <td className="py-3.5">
                          {u.device_id ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold">Terkunci</span>
                          ) : (
                            <span className="text-neutral-400 text-xs">Bebas</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              title="Klik untuk ubah status atau masa aktif"
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                u.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : u.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : u.status === 'expired'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                              }`}
                            >
                              <span>{u.status}</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>

                            {u.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleQuickActivate(u)}
                                title="Aktifkan langsung (+30 hari)"
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Aktifkan
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 font-bold text-neutral-800 text-sm">
                          {u.days_left !== null ? `${u.days_left} hari` : '-'}
                        </td>
                        <td className="py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            title="Edit User & Masa Aktif"
                            className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetDevice(u.id)}
                            title="Reset Device ID"
                            className="p-2 text-neutral-500 hover:text-amber-600 rounded-xl hover:bg-neutral-100 transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Hapus Pengguna"
                            className="p-2 text-neutral-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-NAV PILLS for Website, Kategori, and Cookie */}
        {['websites', 'categories', 'cookies'].includes(activeTab) && (
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 p-2 bg-white border border-[#E8E8DF] rounded-2xl shadow-bone w-fit">
              <button
                onClick={() => handleTabChange('websites')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'websites'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Globe className="w-4.5 h-4.5" />
                <span>Website</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'websites' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {websites.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('categories')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <FolderTree className="w-4.5 h-4.5" />
                <span>Kategori</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'categories' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('cookies')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'cookies'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Cookie className="w-4.5 h-4.5" />
                <span>Cookie Akun</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'cookies' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {websites.reduce((acc, w) => acc + (w.accounts?.length || 0), 0)}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* WEBSITES TAB */}
        {activeTab === 'websites' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Daftar Website</h3>
                  <p className="text-xs text-neutral-500">Kelola nama website, icon, URL target, kategori, dan toggle status aktif</p>
                </div>
                <button
                  onClick={handleOpenCreateWebsite}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl flex items-center gap-2 self-start sm:self-auto transition-all shadow-sm min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Tambah Website
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari website atau URL..."
                    value={websiteSearch}
                    onChange={(e) => setWebsiteSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
                <CustomSelect
                  value={websiteCategoryFilter}
                  onChange={(val) => setWebsiteCategoryFilter(val)}
                  placeholder="Semua Kategori"
                  className="w-full sm:w-56"
                  buttonClassName="py-2.5 min-h-[44px] text-xs sm:text-sm"
                  options={[
                    { value: '', label: 'Semua Kategori' },
                    ...categories.map((c) => ({ value: c.name, label: c.name }))
                  ]}
                />
              </div>

              {tabLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border border-[#E8E8DF] bg-[#FBFBF9] space-y-3 animate-pulse"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-28 bg-[#EBEBE4] rounded-lg"></div>
                        <div className="h-4 w-20 bg-[#F1F1EB] rounded-full"></div>
                      </div>
                      <div className="h-3 w-44 bg-[#F1F1EB] rounded"></div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#EAEAE3]">
                        <div className="h-3.5 w-20 bg-[#EBEBE4] rounded"></div>
                        <div className="h-7 w-36 bg-[#EBEBE4] rounded-xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filtered = websites.filter((w) => {
                  const matchSearch =
                    w.name?.toLowerCase().includes(websiteSearch.toLowerCase()) ||
                    w.url?.toLowerCase().includes(websiteSearch.toLowerCase());
                  const matchCat =
                    !websiteCategoryFilter || w.category_name === websiteCategoryFilter;
                  return matchSearch && matchCat;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-neutral-700">Tidak ada website yang cocok</div>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Coba ubah kata kunci pencarian atau filter kategori, atau tambahkan website baru.
                      </p>
                      <button
                        onClick={handleOpenCreateWebsite}
                        className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl inline-flex items-center gap-2 transition-all shadow-sm min-h-[44px] cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Website
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((w) => (
                      <div
                        key={w.id}
                        className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
                          w.is_active
                            ? 'border-[#E8E8DF] bg-[#FBFBF9] hover:bg-white hover:shadow-md'
                            : 'border-neutral-200 bg-neutral-50/70 opacity-75'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 font-bold text-neutral-900 text-sm">
                              <span className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 text-sm font-mono shadow-2xs overflow-hidden shrink-0">
                                {isImageIcon(w.icon) ? (
                                  <img
                                    src={w.icon}
                                    alt={w.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span>{w.icon ? w.icon.charAt(0).toUpperCase() : '🌐'}</span>
                                )}
                              </span>
                              <span>{w.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-700">
                                {w.category_name}
                              </span>
                              <button
                                onClick={() => handleOpenEditWebsite(w)}
                                title="Edit Website"
                                className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWebsite(w)}
                                title="Hapus Website"
                                className="p-2 text-neutral-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 truncate">
                            <a
                              href={w.url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate hover:text-neutral-900 hover:underline inline-flex items-center gap-1.5"
                            >
                              {w.url}
                              <ExternalLink className="w-3.5 h-3.5 inline text-neutral-400 shrink-0" />
                            </a>
                          </div>

                          {/* Toggle Active status */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-semibold text-neutral-500">Status Website</span>
                            <button
                              type="button"
                              onClick={() => handleToggleWebsiteActive(w)}
                              className="flex items-center gap-2.5 cursor-pointer focus:outline-none group"
                            >
                              <span className={`text-xs font-bold ${w.is_active ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                {w.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                              <div
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                  w.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    w.is_active ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#EAEAE3]">
                          <span className="text-xs font-bold text-emerald-700">
                            {w.account_count || 0} Akun Cookie
                          </span>
                          <button
                            onClick={() => {
                              handleTabChange('cookies');
                              setCookieSearch(w.name);
                            }}
                            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                          >
                            <Cookie className="w-4 h-4" />
                            Kelola Cookie
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Kategori Layanan</h3>
                  <p className="text-xs text-neutral-500">Kelola kategori untuk mengelompokkan website dan filter di ekstensi</p>
                </div>
                <button
                  onClick={handleOpenCreateCategory}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl flex items-center gap-2 self-start sm:self-auto transition-all shadow-sm min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Tambah Kategori
                </button>
              </div>

              {tabLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl"></div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-neutral-700">Belum ada kategori</div>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Buat kategori pertama untuk mulai mengelompokkan website (misal: AI, Streaming, Musik).
                  </p>
                  <button
                    onClick={handleOpenCreateCategory}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl inline-flex items-center gap-2 transition-all shadow-sm min-h-[44px] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Kategori
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F0F0E8] text-neutral-400 font-semibold">
                        <th className="pb-3.5">ID</th>
                        <th className="pb-3.5">Nama Kategori</th>
                        <th className="pb-3.5">Icon</th>
                        <th className="pb-3.5">Urutan</th>
                        <th className="pb-3.5">Jumlah Website Terhubung</th>
                        <th className="pb-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F6F2]">
                      {categories.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-3.5 text-neutral-400 font-mono text-xs">{c.id}</td>
                          <td className="py-3.5 font-bold text-neutral-900 text-sm">{c.name}</td>
                          <td className="py-3.5 font-mono text-neutral-500 text-xs">{c.icon || '-'}</td>
                          <td className="py-3.5 font-semibold text-neutral-700 text-xs">{c.sort_order ?? 0}</td>
                          <td className="py-3.5">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
                              {c.websites_count || 0} Website
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenEditCategory(c)}
                              title="Edit Kategori"
                              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors min-h-[34px] min-w-[34px] inline-flex items-center justify-center cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c)}
                              title="Hapus Kategori"
                              className="p-2 text-neutral-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors min-h-[34px] min-w-[34px] inline-flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COOKIES TAB - Grouped by Website */}
        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Manajemen Cookie Akun</h3>
                  <p className="text-xs text-neutral-500">
                    Cookie dikelompokkan berdasarkan website yang dipilih. Dilengkapi toggle ON / OFF langsung untuk tiap akun.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreateCookie()}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl flex items-center gap-2 self-start sm:self-auto transition-all shadow-sm min-h-[44px] cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Tambah Cookie Baru
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari website atau label akun..."
                  value={cookieSearch}
                  onChange={(e) => setCookieSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                />
              </div>

              {tabLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-5 rounded-3xl border border-[#E8E8DF] bg-[#FBFBF9] space-y-3">
                      <div className="h-5 w-40 bg-[#EBEBE4] rounded-lg"></div>
                      <div className="h-16 bg-white rounded-2xl border border-[#ECECE5]"></div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filteredWebsites = websites.filter((w) => {
                  if (!cookieSearch.trim()) return true;
                  const q = cookieSearch.toLowerCase();
                  const matchWeb = w.name?.toLowerCase().includes(q) || w.url?.toLowerCase().includes(q);
                  const matchAcc = (w.accounts || []).some((a) => a.label?.toLowerCase().includes(q));
                  return matchWeb || matchAcc;
                });

                if (filteredWebsites.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                        <Cookie className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-neutral-700">Tidak ada website yang ditemukan</div>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Pastikan Anda telah menambahkan website terlebih dahulu sebelum mengelola cookie.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredWebsites.map((w) => {
                      const accountsList = w.accounts || [];
                      return (
                        <div
                          key={w.id}
                          className="rounded-3xl border border-[#E8E8DF] bg-[#FBFBF9] p-5 sm:p-6 space-y-5 shadow-2xs hover:border-[#DDDDCF] transition-all"
                        >
                          {/* Group Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAE3]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                {w.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-neutral-900 text-base">{w.name}</h4>
                                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                                    {w.category_name}
                                  </span>
                                  {!w.is_active && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                                      Website Nonaktif
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-neutral-400 truncate">{w.url}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-700 bg-white border border-[#DDDDCF] px-3 py-1.5 rounded-xl min-h-[36px] inline-flex items-center">
                                {accountsList.length} Akun Cookie
                              </span>
                              <button
                                onClick={() => handleOpenCreateCookie(w.id)}
                                className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white border border-[#DDDDCF] hover:bg-neutral-100 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Tambah Cookie
                              </button>
                            </div>
                          </div>

                          {/* Accounts in this Website Group */}
                          {accountsList.length === 0 ? (
                            <div className="p-6 rounded-2xl border border-dashed border-[#DDDDCF] bg-white text-center text-xs text-neutral-400">
                              Belum ada akun cookie untuk website ini.{' '}
                              <button
                                onClick={() => handleOpenCreateCookie(w.id)}
                                className="font-bold text-neutral-900 underline hover:no-underline cursor-pointer"
                              >
                                Tambahkan sekarang
                              </button>
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {accountsList.map((acc) => (
                                <div
                                  key={acc.id}
                                  className={`p-5 sm:p-6 rounded-2xl border bg-white space-y-4 transition-all flex flex-col justify-between ${
                                    acc.is_active
                                      ? 'border-[#E8E8DF] shadow-xs hover:shadow-md'
                                      : 'border-neutral-200 bg-neutral-50 opacity-70'
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-bold text-sm text-neutral-900 flex items-center gap-2 min-w-0">
                                        <Cookie className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span className="truncate">{acc.label}</span>
                                      </div>
                                      <span className="text-xs font-mono text-neutral-400 shrink-0">
                                        {(acc.cookie_bytes || acc.cookie_data?.length || 0).toLocaleString()} B
                                      </span>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-xs text-neutral-500 font-semibold">Status Cookie</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCookieActive(w.id, acc)}
                                        className="flex items-center gap-2 cursor-pointer focus:outline-none group"
                                      >
                                        <span className={`text-xs font-bold ${acc.is_active ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                          {acc.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        <div
                                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                            acc.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
                                          }`}
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                              acc.is_active ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                          />
                                        </div>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-3.5 border-t border-[#F0F0E8] mt-2">
                                    <button
                                      onClick={() => handleOpenEditCookie(w, acc)}
                                      className="px-3.5 py-1.5 text-xs font-bold text-neutral-800 bg-[#F5F5EE] hover:bg-[#EAEAE0] rounded-xl transition-all flex items-center gap-1.5 min-h-[34px] cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" /> Edit Cookie
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCookie(w.id, acc.id, acc.label)}
                                      title="Hapus Akun Cookie"
                                      className="p-2 text-neutral-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SUB-NAV PILLS for Transaksi, Paket Langganan, and Voucher Diskon */}
        {['orders', 'plans', 'vouchers'].includes(activeTab) && (
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 p-2 bg-white border border-[#E8E8DF] rounded-2xl shadow-bone w-fit flex-wrap">
              <button
                onClick={() => handleTabChange('orders')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                <span>Transaksi</span>
              </button>

              <button
                onClick={() => handleTabChange('plans')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <CreditCard className="w-4.5 h-4.5" />
                <span>Paket Langganan</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'plans' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {plansList.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('vouchers')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'vouchers'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Tag className="w-4.5 h-4.5" />
                <span>Voucher Diskon</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'vouchers' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {vouchers.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari order ID atau email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadOrders(e.target.value, orderStatus)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
                <CustomSelect
                  value={orderStatus}
                  onChange={(val) => {
                    setOrderStatus(val);
                    loadOrders(orderSearch, val);
                  }}
                  placeholder="Semua Status"
                  className="w-full sm:w-48"
                  buttonClassName="py-2.5 min-h-[44px] text-xs sm:text-sm"
                  options={[
                    { value: '', label: 'Semua Status' },
                    { value: 'paid', label: 'Paid (Sukses)' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
              <button
                onClick={() => loadOrders(orderSearch, orderStatus)}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-800 bg-[#EFEFE8] hover:bg-[#E5E5DC] rounded-2xl min-h-[44px] transition-colors cursor-pointer w-full sm:w-auto"
              >
                Filter / Cari
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3.5">Order ID</th>
                    <th className="pb-3.5">Customer Email</th>
                    <th className="pb-3.5">Paket</th>
                    <th className="pb-3.5">Nominal</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F6F2]">
                  {tabLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 w-28 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-4.5 w-36 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-4 w-16 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5"><div className="h-4.5 w-20 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-6 w-14 bg-[#F1F1EB] rounded-full"></div></td>
                        <td className="py-3.5 text-right"><div className="h-8 w-24 bg-[#EBEBE4] rounded-lg ml-auto"></div></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-neutral-400">Tidak ada transaksi</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => handleOpenOrderDetail(o)}
                        className="hover:bg-[#FAF9F6] cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 font-mono text-xs sm:text-sm text-neutral-900">
                          <span className="font-semibold group-hover:text-blue-600 transition-colors">
                            {o.order_id}
                          </span>
                          <div className="text-[11px] text-neutral-400 font-normal">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </div>
                        </td>
                        <td className="py-3.5 text-neutral-800 text-sm font-semibold">
                          <div>{o.email}</div>
                          {o.user?.phone && (
                            <div className="text-[11px] text-neutral-400 font-normal">{o.user.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 uppercase font-bold text-neutral-800 text-xs sm:text-sm">{o.plan}</td>
                        <td className="py-3.5">
                          <div className="font-bold text-neutral-900 text-sm sm:text-base">
                            Rp {(Number(o.amount || 0) - Number(o.admin_fee || 0)).toLocaleString('id-ID')}
                          </div>
                          {Number(o.admin_fee || 0) > 0 && (
                            <div className="text-[11px] font-normal text-neutral-400">
                              Bruto: Rp {Number(o.amount || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            o.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : o.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenOrderDetail(o)}
                              className="px-3.5 py-1.5 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors min-h-[36px] cursor-pointer inline-flex items-center gap-1.5"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Detail</span>
                            </button>
                            {o.status !== 'paid' && (
                              <button
                                onClick={() => handleManualActivate(o.id)}
                                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors min-h-[36px] cursor-pointer"
                              >
                                Aktivasi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Manajemen Paket Langganan</h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Kelola nama paket, harga, durasi aktif hari, badge promo, dan urutan tampil yang dapat dipilih oleh pengguna saat daftar maupun perpanjang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreatePlanModal}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm min-h-[44px] cursor-pointer shrink-0"
                >
                  <Plus className="w-4.5 h-4.5" /> Tambah Paket Baru
                </button>
              </div>

              {/* Plans Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3.5">Urutan</th>
                      <th className="pb-3.5">Nama Paket</th>
                      <th className="pb-3.5">Kode (Slug)</th>
                      <th className="pb-3.5">Harga</th>
                      <th className="pb-3.5">Durasi</th>
                      <th className="pb-3.5">Badge Promo</th>
                      <th className="pb-3.5">Status</th>
                      <th className="pb-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F6F2]">
                    {tabLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="h-4 w-8 bg-[#EBEBE4] rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-28 bg-[#EBEBE4] rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-20 bg-[#F1F1EB] rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-24 bg-[#EBEBE4] rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-16 bg-[#F1F1EB] rounded"></div></td>
                          <td className="py-4"><div className="h-4 w-20 bg-[#F1F1EB] rounded"></div></td>
                          <td className="py-4"><div className="h-5 w-16 bg-[#EBEBE4] rounded-full"></div></td>
                          <td className="py-4 text-right"><div className="h-8 w-20 bg-[#EBEBE4] rounded-xl ml-auto"></div></td>
                        </tr>
                      ))
                    ) : plansList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-neutral-400">
                          Belum ada paket langganan. Klik tombol "+ Tambah Paket Baru" di atas.
                        </td>
                      </tr>
                    ) : (
                      plansList.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="py-4 font-mono font-bold text-xs text-neutral-400">
                            #{p.sort_order || 0}
                          </td>
                          <td className="py-4">
                            <div className="font-bold text-neutral-900 text-sm">{p.label}</div>
                            {p.description && (
                              <div className="text-xs text-neutral-400 truncate max-w-xs">{p.description}</div>
                            )}
                          </td>
                          <td className="py-4 font-mono text-xs text-neutral-600">
                            <span className="bg-[#F0F0EB] px-2 py-0.5 rounded-md font-semibold">{p.plan}</span>
                          </td>
                          <td className="py-4">
                            <div className="font-black text-neutral-900 text-sm sm:text-base">
                              Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                            </div>
                            {p.original_price > 0 && (
                              <div className="text-xs text-neutral-400 line-through">
                                Rp {Number(p.original_price).toLocaleString('id-ID')}
                              </div>
                            )}
                          </td>
                          <td className="py-4 font-bold text-neutral-800 text-sm">
                            {p.duration_days} hari
                          </td>
                          <td className="py-4">
                            {p.badge ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-tight">
                                {p.badge}
                              </span>
                            ) : (
                              <span className="text-neutral-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePlan(p)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                p.is_active
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-300'
                              }`}
                            >
                              {p.is_active ? '● Aktif' : '○ Nonaktif'}
                            </button>
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditPlanModal(p)}
                                title="Edit Paket"
                                className="p-2 rounded-xl text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlan(p)}
                                title="Hapus Paket"
                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="bg-[#FAF9F6] p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Live Preview Tampilan Pengguna
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Berikut adalah tampilan pilihan paket di halaman Registrasi dan Dashboard Pengguna
                  </p>
                </div>
                <span className="text-xs font-bold text-neutral-600 bg-white border border-[#DDDDCF] px-3 py-1 rounded-full">
                  {plansList.filter((p) => p.is_active).length} Paket Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plansList
                  .filter((p) => p.is_active)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2.5 bg-white ${
                        idx === 0
                          ? 'border-neutral-900 bg-neutral-50/70 ring-1 ring-neutral-900'
                          : 'border-[#EAEAE0]'
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute -top-2.5 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-tight shadow-xs">
                          {p.badge}
                        </span>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">{p.label}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              idx === 0 ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
                            }`}
                          >
                            {idx === 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-lg font-black text-neutral-900">
                          Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                        </div>
                        {p.original_price > 0 && (
                          <div className="text-xs text-neutral-400 line-through">
                            Rp {Number(p.original_price).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-neutral-500 pt-2 border-t border-[#EDEDE6]">
                        {p.duration_days} hari akses
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* VOUCHERS TAB */}
        {activeTab === 'vouchers' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">Voucher & Kupon Diskon</h3>
                <p className="text-xs text-neutral-500">Kelola kupon promo, besaran potongan diskon, dan batas kuota pemakaian</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari kode voucher..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 min-h-[42px] w-48 sm:w-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={openCreateVoucherModal}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl flex items-center gap-2 transition-all shadow-sm min-h-[42px] cursor-pointer"
                >
                  <Plus className="w-4.5 h-4.5" /> Buat Voucher
                </button>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#FAF9F6] border border-[#EAEAE0] rounded-2xl">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Voucher</div>
                <div className="text-xl font-black text-neutral-900 mt-1">{vouchers.length}</div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] border border-[#EAEAE0] rounded-2xl">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Voucher Aktif</div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {vouchers.filter((v) => v.is_active).length}
                </div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] border border-[#EAEAE0] rounded-2xl">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Terbatas Kuota</div>
                <div className="text-xl font-black text-amber-700 mt-1">
                  {vouchers.filter((v) => Number(v.max_uses) > 0).length}
                </div>
              </div>
              <div className="p-3.5 bg-[#FAF9F6] border border-[#EAEAE0] rounded-2xl">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Kuota Habis</div>
                <div className="text-xl font-black text-rose-700 mt-1">
                  {vouchers.filter((v) => Number(v.max_uses) > 0 && (Number(v.used_count) || 0) >= Number(v.max_uses)).length}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3.5">Kode Voucher</th>
                    <th className="pb-3.5">Diskon</th>
                    <th className="pb-3.5">Paket</th>
                    <th className="pb-3.5">Pemakaian / Batas Kuota</th>
                    <th className="pb-3.5">Status</th>
                    <th className="pb-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F6F2]">
                  {tabLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 w-24 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-3.5 w-16 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-3.5 w-16 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5"><div className="h-3.5 w-24 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5"><div className="h-5 w-16 bg-[#EBEBE4] rounded-full"></div></td>
                        <td className="py-3.5 text-right"><div className="h-7 w-16 bg-[#EBEBE4] rounded-xl ml-auto"></div></td>
                      </tr>
                    ))
                  ) : vouchers.filter((v) => (v.code || '').toLowerCase().includes(voucherSearch.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Tag className="w-8 h-8 mx-auto text-neutral-300" />
                          <p className="text-sm font-semibold text-neutral-700">
                            {voucherSearch ? 'Tidak ada voucher sesuai pencarian' : 'Belum ada voucher dibuat'}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {voucherSearch
                              ? 'Coba gunakan kata kunci pencarian yang berbeda'
                              : 'Klik tombol "Buat Voucher" untuk membuat kode diskon baru dengan kuota pemakaian.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vouchers
                      .filter((v) => (v.code || '').toLowerCase().includes(voucherSearch.toLowerCase()))
                      .map((v) => {
                        const maxUses = Number(v.max_uses) || 0;
                        const usedCount = Number(v.used_count) || 0;
                        const isExhausted = maxUses > 0 && usedCount >= maxUses;

                        return (
                          <tr key={v.id} className="hover:bg-[#FAF9F6] transition-colors">
                            {/* Kode */}
                            <td className="py-4">
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 bg-[#F6F6F2] border border-[#DDDDCF] px-2.5 py-1 rounded-xl">
                                  <span className="font-mono font-bold text-neutral-900 text-sm tracking-wider">
                                    {v.code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(v.code);
                                      toast.success(`Kode ${v.code} disalin`);
                                    }}
                                    title="Salin Kode Voucher"
                                    className="text-neutral-400 hover:text-neutral-800 transition-colors p-0.5 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {v.description && (
                                  <p className="text-[11px] text-neutral-500 max-w-[200px] truncate" title={v.description}>
                                    {v.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Diskon */}
                            <td className="py-4">
                              <div className="font-bold text-neutral-900 text-sm sm:text-base">
                                {v.discount_type === 'percent'
                                  ? `${v.discount_value}%`
                                  : `Rp ${Number(v.discount_value || 0).toLocaleString('id-ID')}`}
                              </div>
                              {v.min_amount > 0 && (
                                <div className="text-[11px] text-neutral-400">
                                  Min. Rp {Number(v.min_amount).toLocaleString('id-ID')}
                                </div>
                              )}
                            </td>

                            {/* Paket */}
                            <td className="py-4">
                              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#F6F6F2] text-neutral-700 border border-[#EAEAE0] uppercase">
                                {v.applies_to === 'all' ? 'Semua Paket' : v.applies_to}
                              </span>
                            </td>

                            {/* Batas Pemakaian (Kuota) */}
                            <td className="py-4">
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                  <span>{usedCount}</span>
                                  <span className="text-neutral-400 font-normal">/</span>
                                  <span>{maxUses > 0 ? `${maxUses} kali` : '∞ Unlimited'}</span>
                                </div>
                                <div>
                                  {maxUses > 0 ? (
                                    isExhausted ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-tight">
                                        Kuota Habis
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                        Sisa {maxUses - usedCount} kali lagi
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Tanpa Batas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4">
                              <button
                                type="button"
                                onClick={() => handleToggleVoucher(v)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  v.is_active
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-300'
                                }`}
                                title={v.is_active ? 'Klik untuk nonaktifkan voucher' : 'Klik untuk aktifkan voucher'}
                              >
                                {v.is_active ? '● Aktif' : '○ Nonaktif'}
                              </button>
                            </td>

                            {/* Aksi */}
                            <td className="py-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => openEditVoucherModal(v)}
                                  title="Edit Voucher & Kuota"
                                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl text-neutral-800 bg-white hover:bg-neutral-100 border border-[#DDDDCF] hover:border-neutral-400 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVoucher(v)}
                                  title="Hapus Voucher"
                                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-NAV PILLS for Pembayaran, Pengaturan Umum, Upload Ekstensi, Logs */}
        {['payment', 'settings', 'uploads', 'logs'].includes(activeTab) && (
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 p-2 bg-white border border-[#E8E8DF] rounded-2xl shadow-bone w-fit flex-wrap">
              <button
                onClick={() => handleTabChange('payment')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'payment'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Wallet className="w-4.5 h-4.5" />
                <span>Gerbang Pembayaran</span>
                {settingsData.paymenku_api_key_masked && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Key Aktif" />
                )}
              </button>

              <button
                onClick={() => handleTabChange('settings')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Pengaturan Umum</span>
              </button>

              <button
                onClick={() => handleTabChange('uploads')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'uploads'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Upload className="w-4.5 h-4.5" />
                <span>Upload Ekstensi</span>
                {settingsData.extension_version && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                    activeTab === 'uploads' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    v{settingsData.extension_version}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('logs')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all min-h-[42px] cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <FileText className="w-4.5 h-4.5" />
                <span>Activity Logs</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. GERBANG PEMBAYARAN TAB */}
        {activeTab === 'payment' && (
          <div className="space-y-6 max-w-4xl">
            {/* Main Container Card */}
            <div className="bg-white rounded-3xl border border-[#E8E8DF] shadow-bone overflow-hidden">
              
              {/* Header Banner */}
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#FAF9F5] to-white border-b border-[#EFEFE8]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Gerbang Pembayaran</h3>
                      <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                        Integrasi gateway Paymenku QRIS otomatis dengan enkripsi data sensitif
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>AES-256 At-Rest</span>
                    </span>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      (settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                        ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50/80 text-amber-800 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        (settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      {(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                        ? 'Mode Produksi Aktif'
                        : 'Mode Sandbox Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 space-y-7">
                {/* 1. Webhook Section */}
                <div className="rounded-2xl border border-[#E8E8DF] bg-[#FAF9F5] p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E2D6] flex items-center justify-center text-neutral-700 shadow-2xs">
                        <Webhook className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900">URL Callback Webhook</h4>
                        <p className="text-[11px] text-neutral-500">Menerima notifikasi instan saat QRIS pengguna berhasil terbayar</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#DDDDCF] hover:bg-neutral-100 hover:border-neutral-400 rounded-xl text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Salin URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-white border border-[#E2E2D6] rounded-xl font-mono text-xs text-neutral-800 select-all overflow-x-auto">
                    <span className="text-neutral-400 select-none">POST</span>
                    <span className="font-semibold text-neutral-900 break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/payment/webhook/paymenku` : '/api/payment/webhook/paymenku'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>
                      Masukkan URL di atas ke menu <strong>Webhook Settings</strong> pada dashboard Paymenku Anda agar pesanan otomatis diverifikasi tanpa konfirmasi manual.
                    </span>
                  </div>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSavePaymentSettings} className="space-y-6">
                  {/* 2. Environment Switcher */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-neutral-900">
                        Pilih Lingkungan Gateway
                      </label>
                      <span className="text-xs text-neutral-500 font-medium">
                        Kredensial tersimpan independen
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Sandbox Option */}
                      <button
                        type="button"
                        onClick={() => setSettingsData({ ...settingsData, paymenku_is_production: 'false' })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex items-start gap-3.5 ${
                          !(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                            ? 'border-neutral-900 bg-amber-50/20 shadow-xs ring-2 ring-neutral-900'
                            : 'border-[#E8E8DF] bg-white hover:bg-[#FBFBF9] hover:border-neutral-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          !(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-500 group-hover:text-neutral-700'
                        }`}>
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-bold text-neutral-900">Sandbox (Testing)</span>
                            {!(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" /> Dipilih
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 leading-normal">
                            Simulasi pembayaran QRIS uji coba tanpa melibatkan saldo uang riil.
                          </p>
                        </div>
                      </button>

                      {/* Production Option */}
                      <button
                        type="button"
                        onClick={() => setSettingsData({ ...settingsData, paymenku_is_production: 'true' })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex items-start gap-3.5 ${
                          (settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                            ? 'border-neutral-900 bg-emerald-50/20 shadow-xs ring-2 ring-neutral-900'
                            : 'border-[#E8E8DF] bg-white hover:bg-[#FBFBF9] hover:border-neutral-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          (settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-500 group-hover:text-neutral-700'
                        }`}>
                          <Rocket className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-bold text-neutral-900">Produksi (Live)</span>
                            {(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Dipilih
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1 leading-normal">
                            Transaksi QRIS nyata langsung terhubung dengan rekening merchant.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Environment Notice Banner */}
                    {!(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true) ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2.5">
                        <FlaskConical className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          <strong>Mode Sandbox Aktif:</strong> Menggunakan API & Webhook Secret testing. Pembayaran tidak memotong saldo asli.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-center gap-2.5">
                        <Rocket className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          <strong>Mode Produksi Aktif:</strong> Menggunakan API & Webhook Secret resmi live. QRIS memproses dana nyata pengguna.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. Conditional Credential Inputs */}
                  {!(settingsData.paymenku_is_production === 'true' || settingsData.paymenku_is_production === true) ? (
                    /* ── SANDBOX CREDENTIALS ── */
                    <div className="p-6 rounded-2xl border border-amber-200 bg-[#FCFBF8] shadow-xs space-y-5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <span>Kredensial Mode Sandbox</span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          Testing Mode
                        </span>
                      </div>

                      {/* Sandbox API Key */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Sandbox API Key</span>
                          </label>
                          {settingsData.paymenku_sandbox_api_key_masked && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {settingsData.paymenku_sandbox_api_key_masked}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showSandboxApiKey ? 'text' : 'password'}
                            placeholder="sk_test_..."
                            value={settingsData.paymenku_sandbox_api_key || ''}
                            onChange={(e) => setSettingsData({ ...settingsData, paymenku_sandbox_api_key: e.target.value })}
                            className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSandboxApiKey(!showSandboxApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            title={showSandboxApiKey ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showSandboxApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Kunci API sandbox dari dashboard Paymenku (biasanya diawali <code className="text-neutral-700 font-mono bg-neutral-100 px-1 py-0.5 rounded">sk_test_</code>).
                        </p>
                      </div>

                      {/* Sandbox Webhook Secret */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <Webhook className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Sandbox Webhook Secret</span>
                          </label>
                          {settingsData.paymenku_sandbox_webhook_secret_masked && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {settingsData.paymenku_sandbox_webhook_secret_masked}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showSandboxWebhookSecret ? 'text' : 'password'}
                            placeholder="whsec_test_..."
                            value={settingsData.paymenku_sandbox_webhook_secret || ''}
                            onChange={(e) => setSettingsData({ ...settingsData, paymenku_sandbox_webhook_secret: e.target.value })}
                            className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSandboxWebhookSecret(!showSandboxWebhookSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            title={showSandboxWebhookSecret ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showSandboxWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Secret key untuk memvalidasi tanda tangan webhook pada transaksi simulasi.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* ── PRODUKSI CREDENTIALS ── */
                    <div className="p-6 rounded-2xl border border-emerald-200 bg-[#F8FCFA] shadow-xs space-y-5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                        <div className="flex items-center gap-2.5 font-bold text-sm text-neutral-900">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                            <Rocket className="w-4 h-4" />
                          </div>
                          <span>Kredensial Mode Produksi</span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          Live Mode
                        </span>
                      </div>

                      {/* Prod API Key */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Production API Key</span>
                          </label>
                          {settingsData.paymenku_prod_api_key_masked && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {settingsData.paymenku_prod_api_key_masked}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showProdApiKey ? 'text' : 'password'}
                            placeholder="sk_live_..."
                            value={settingsData.paymenku_prod_api_key || ''}
                            onChange={(e) => setSettingsData({ ...settingsData, paymenku_prod_api_key: e.target.value })}
                            className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProdApiKey(!showProdApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            title={showProdApiKey ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showProdApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Kunci API live resmi dari Paymenku (biasanya diawali <code className="text-neutral-700 font-mono bg-neutral-100 px-1 py-0.5 rounded">sk_live_</code>).
                        </p>
                      </div>

                      {/* Prod Webhook Secret */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <Webhook className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Production Webhook Secret</span>
                          </label>
                          {settingsData.paymenku_prod_webhook_secret_masked && (
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {settingsData.paymenku_prod_webhook_secret_masked}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showProdWebhookSecret ? 'text' : 'password'}
                            placeholder="whsec_..."
                            value={settingsData.paymenku_prod_webhook_secret || ''}
                            onChange={(e) => setSettingsData({ ...settingsData, paymenku_prod_webhook_secret: e.target.value })}
                            className="w-full pl-4 pr-12 py-2.5 text-xs sm:text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProdWebhookSecret(!showProdWebhookSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            title={showProdWebhookSecret ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showProdWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Secret key untuk verifikasi signature HMAC-SHA256 pada transaksi uang riil.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-[#F0F0E8]">
                    <p className="text-xs text-neutral-500">
                      Pastikan Anda menekan tombol simpan setelah mengubah mode atau memperbarui kunci.
                    </p>
                    <button
                      type="submit"
                      disabled={savingPayment}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs active:scale-98"
                    >
                      <Save className="w-4 h-4" />
                      {savingPayment ? 'Menyimpan...' : 'Simpan Konfigurasi Pembayaran'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 2. PENGATURAN UMUM TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
              {/* Header Title */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#F0F0E8]">
                <div className="w-11 h-11 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Pengaturan Umum & Sistem</h3>
                  <p className="text-sm text-neutral-500">Konfigurasi identitas layanan, nomor kontak customer care WhatsApp, dan branding situs</p>
                </div>
              </div>

              {settingsSuccess && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-sm font-semibold">
                  {settingsSuccess}
                </div>
              )}

              <form onSubmit={handleSaveGeneralSettings} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-1.5">Nama Layanan / Situs</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hitshare"
                    value={settingsData.site_name || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, site_name: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Nama situs yang tampil pada header aplikasi, email, dan portal pengguna.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-1.5">Nomor WhatsApp Dukungan / Admin</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-sm">
                      <Phone className="w-4 h-4 text-neutral-400 inline mr-1" />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: 6281234567890"
                      value={settingsData.whatsapp_number || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, whatsapp_number: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] font-mono transition-all"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Gunakan format kode negara tanpa tanda plus atau strip (contoh: 628123456789).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-1.5">Template Pesan WhatsApp</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Halo admin Hitshare, saya butuh bantuan mengenai akun langganan saya..."
                    value={settingsData.contact_message || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, contact_message: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[80px] transition-all resize-y"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Pesan otomatis yang akan langsung terisi saat pengguna mengklik tombol 'Hubungi Bantuan' di dashboard.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Umum'}
                  </button>
                </div>
              </form>

              {/* Branding Section */}
              <div className="pt-6 border-t border-[#F0F0E8] space-y-4 max-w-2xl">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Aset Visual & Branding</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Unggah logo dan favicon website (format PNG, JPG, SVG, ICO maksimal 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo */}
                  <div className="p-4 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700">Logo Website</span>
                      {settingsData.logo_url && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Terpasang</span>
                      )}
                    </div>
                    <div className="h-16 flex items-center justify-center bg-white border border-[#E8E8DF] rounded-xl overflow-hidden p-2">
                      {settingsData.logo_url ? (
                        <img src={settingsData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-neutral-400">Belum ada logo khusus</span>
                      )}
                    </div>
                    <label className="block">
                      <span className="sr-only">Pilih Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingLogo}
                        onChange={(e) => handleUploadBrand('logo', e)}
                        className="block w-full text-xs text-neutral-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 file:cursor-pointer disabled:opacity-50"
                      />
                    </label>
                    {uploadingLogo && <p className="text-[11px] text-neutral-500 animate-pulse">Mengunggah logo...</p>}
                  </div>

                  {/* Favicon */}
                  <div className="p-4 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700">Favicon Browser</span>
                      {settingsData.favicon_url && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Terpasang</span>
                      )}
                    </div>
                    <div className="h-16 flex items-center justify-center bg-white border border-[#E8E8DF] rounded-xl overflow-hidden p-2">
                      {settingsData.favicon_url ? (
                        <img src={settingsData.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-xs text-neutral-400">Favicon default browser</span>
                      )}
                    </div>
                    <label className="block">
                      <span className="sr-only">Pilih Favicon</span>
                      <input
                        type="file"
                        accept="image/*,.ico"
                        disabled={uploadingFavicon}
                        onChange={(e) => handleUploadBrand('favicon', e)}
                        className="block w-full text-xs text-neutral-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 file:cursor-pointer disabled:opacity-50"
                      />
                    </label>
                    {uploadingFavicon && <p className="text-[11px] text-neutral-500 animate-pulse">Mengunggah favicon...</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. UPLOAD & EKSTENSI TAB */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0F0E8]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Distribusi & Rilis Ekstensi Chrome</h3>
                    <p className="text-sm text-neutral-500">Kelola paket file ZIP ekstensi Chrome, nomor versi semver, dan monitoring update</p>
                  </div>
                </div>
                {settingsData.extension_download_url && (
                  <a
                    href={settingsData.extension_download_url}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F2EC] hover:bg-[#E8E8DF] text-neutral-900 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-4 h-4" /> Unduh File Aktif (ZIP)
                  </a>
                )}
              </div>

              {/* 3 Metric Cards for current package status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-1.5">
                  <span className="text-xs text-neutral-500 font-semibold">Versi Rilis Saat Ini</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-neutral-900">
                      v{settingsData.extension_version || '2.0.0'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">Versi aktif yang digunakan klien</p>
                </div>

                <div className="p-4 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-1.5">
                  <span className="text-xs text-neutral-500 font-semibold">Ukuran Paket ZIP</span>
                  <div className="text-xl font-bold font-mono text-neutral-900">
                    {settingsData.extension_file_size || '-'}
                  </div>
                  <p className="text-[11px] text-neutral-400">Dioptimalkan untuk browser Chrome</p>
                </div>

                <div className="p-4 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-1.5">
                  <span className="text-xs text-neutral-500 font-semibold">Terakhir Diperbarui</span>
                  <div className="text-sm font-bold text-neutral-800 truncate">
                    {settingsData.extension_updated_at
                      ? new Date(settingsData.extension_updated_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Belum pernah diunggah'}
                  </div>
                  <p className="text-[11px] text-neutral-400">Waktu build/upload terakhir</p>
                </div>
              </div>

              {/* Upload ZIP Form Card */}
              <div className="p-6 bg-[#FBFBF9] border border-[#E8E8DF] rounded-2xl space-y-4 max-w-2xl">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" /> Upload File Ekstensi Baru (ZIP)
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    File ZIP ini akan otomatis diunduh oleh pengguna pada portal dashboard atau saat ekstensi mendeteksi pembaruan versi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nomor Versi Rilis Baru (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: ${settingsData.extension_version ? '2.1.0' : '2.0.1'}`}
                      value={uploadExtVersion}
                      onChange={(e) => setUploadExtVersion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 min-h-[40px] font-mono"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Jika dikosongkan, nomor versi otomatis dibaca dari file <code className="bg-neutral-200/60 px-1 py-0.5 rounded text-neutral-800 font-mono font-bold">manifest.json</code> di dalam file ZIP.
                    </p>
                  </div>

                  <div className="p-6 border-2 border-dashed border-[#DDDDCF] hover:border-neutral-800 rounded-2xl bg-white text-center transition-all">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-neutral-800">Pilih File Ekstensi (.zip)</p>
                    <p className="text-xs text-neutral-500 mb-4">Maksimal ukuran file 50 MB</p>

                    <label className="inline-flex cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        disabled={uploadingExt}
                        onChange={handleUploadExtension}
                        className="sr-only"
                        id="zip-upload-input"
                      />
                      <span
                        onClick={() => document.getElementById('zip-upload-input')?.click()}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-2 ${
                          uploadingExt ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingExt ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sedang Mengunggah & Memvalidasi...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Pilih & Unggah File ZIP</span>
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Semver Enforcement Section */}
              <div className="pt-6 border-t border-[#F0F0E8] space-y-4 max-w-2xl">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Kebijakan Versi Minimal Ekstensi (Semver)
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Atur versi terendah yang masih diizinkan mengakses injeksi cookie. Ekstensi dengan versi di bawah ini otomatis diblokir.
                  </p>
                </div>

                <form onSubmit={handleSaveExtensionVersion} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Contoh: 2.0.0"
                      value={settingsData.extension_version || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, extension_version: e.target.value })}
                      className="w-full sm:w-48 px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 min-h-[42px] font-mono"
                    />
                    <button
                      type="submit"
                      disabled={savingVersion}
                      className="px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-900 bg-[#F2F2EC] hover:bg-[#E8E8DF] rounded-xl min-h-[42px] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {savingVersion ? 'Menyimpan...' : 'Perbarui Versi Minimal'}
                    </button>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong>Catatan Keamanan:</strong> Ketika Anda menaikkan versi minimal (misal dari 2.0.0 ke 2.1.0), pengguna yang masih membuka ekstensi versi 2.0.0 tidak akan bisa mengakses cookie lagi dan akan muncul tampilan instruksi & tombol untuk mengunduh versi terbaru.
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="bg-white p-6 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-4">
            <h3 className="text-base font-bold text-neutral-900">User Activity Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0E8] text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3.5">User</th>
                    <th className="pb-3.5">Aksi</th>
                    <th className="pb-3.5">Detail</th>
                    <th className="pb-3.5 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F6F2]">
                  {tabLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 w-32 bg-[#EBEBE4] rounded"></div></td>
                        <td className="py-3.5"><div className="h-3.5 w-20 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5"><div className="h-3.5 w-64 bg-[#F1F1EB] rounded"></div></td>
                        <td className="py-3.5 text-right"><div className="h-3.5 w-28 bg-[#EBEBE4] rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-neutral-400">Belum ada catatan aktivitas</td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr key={l.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-3.5 font-semibold text-neutral-900 text-sm">{l.email}</td>
                        <td className="py-3.5 font-mono text-xs text-neutral-700">{l.action}</td>
                        <td className="py-3.5 text-neutral-600 max-w-md truncate text-sm">{l.detail || '-'}</td>
                        <td className="py-3.5 text-right text-neutral-400 text-xs sm:text-sm">
                          {new Date(l.created_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Admin Dashboard Footer */}
      <footer className="mt-auto border-t border-[#EAEAE3] bg-white py-4 px-6 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-6 h-6 rounded-lg bg-white border border-[#E0E0D8] p-1 flex items-center justify-center shadow-2xs shrink-0">
              <img src="/icon.png" alt="HitShare" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-neutral-900">HitShare Admin</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-600">Control Center &amp; Management</span>
            <span className="text-neutral-300">•</span>
            <span>© {CURRENT_YEAR} HitShare Engine</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-neutral-400">Versi Dashboard:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F4F4EE] text-neutral-800 border border-[#E0E0D6]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              v2.0.0
            </span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODAL: Website Create / Edit                            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {websiteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-[#EAEAE3]">
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingWebsite ? 'Edit Website' : 'Tambah Website Baru'}
                </h3>
                <p className="text-sm text-neutral-500">
                  {editingWebsite ? `Update konfigurasi untuk ${editingWebsite.name}` : 'Daftarkan website baru untuk sharing cookie'}
                </p>
              </div>
              <button
                onClick={() => setWebsiteModalOpen(false)}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWebsite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Nama Layanan / Website <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Canva Pro, Netflix, ChatGPT Plus"
                  value={websiteForm.name}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  URL Website Target <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="Contoh: https://www.canva.com"
                  value={websiteForm.url}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, url: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Icon Website (Upload Foto / URL / Preset)
                </label>

                {/* Upload & Preview Box */}
                <div className="flex items-center gap-3 p-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl mb-2.5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#DDDDCF] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                    {isImageIcon(websiteForm.icon) ? (
                      <img
                        src={websiteForm.icon}
                        alt="Icon Preview"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-base font-bold text-neutral-800 font-mono">
                        {websiteForm.icon ? websiteForm.icon.charAt(0).toUpperCase() : '🌐'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        ref={websiteIconInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif,.svg,.ico,.webp"
                        disabled={uploadingWebsiteIcon}
                        onChange={handleUploadWebsiteIcon}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => websiteIconInputRef.current?.click()}
                        disabled={uploadingWebsiteIcon}
                        className="px-3.5 py-2 text-xs sm:text-sm font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingWebsiteIcon ? 'Mengunggah...' : 'Upload Foto / Icon'}
                      </button>
                      {websiteForm.icon && websiteForm.icon !== 'Globe' && (
                        <button
                          type="button"
                          onClick={() => setWebsiteForm({ ...websiteForm, icon: 'Globe' })}
                          className="px-2.5 py-2 text-xs font-semibold text-neutral-500 hover:text-rose-600 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1 truncate">
                      Format: PNG, JPG, SVG, ICO, WEBP (Maks. 2MB)
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Atau masukkan URL / nama icon (contoh: https://... atau Globe)"
                  value={websiteForm.icon}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, icon: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all font-mono text-xs"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs text-neutral-400 mr-1">Preset:</span>
                  {['Globe', 'Sparkles', 'Film', 'Music', 'BookOpen', 'Layers', 'Tv', 'Code'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWebsiteForm({ ...websiteForm, icon: preset })}
                      className={`px-2.5 py-1 text-xs rounded-xl border font-mono transition-colors cursor-pointer ${
                        websiteForm.icon === preset
                          ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                          : 'bg-[#FBFBF9] text-neutral-600 border-[#DDDDCF] hover:bg-neutral-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={websiteForm.category_id}
                  onChange={(val) => setWebsiteForm({ ...websiteForm, category_id: val })}
                  placeholder="Pilih Kategori"
                  options={[
                    { value: '', label: 'Pilih Kategori' },
                    ...categories.map((c) => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="website_active"
                  checked={websiteForm.is_active}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, is_active: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-[#DDDDCF] text-neutral-900 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="website_active" className="text-sm font-semibold text-neutral-700 cursor-pointer">
                  Website Aktif (Tampil di ekstensi dan dashboard pengguna)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0E8]">
                <button
                  type="button"
                  onClick={() => setWebsiteModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] shadow-sm transition-colors cursor-pointer"
                >
                  {editingWebsite ? 'Simpan Perubahan' : 'Tambah Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODAL: Category Create / Edit                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-[#EAEAE3]">
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
                <p className="text-sm text-neutral-500">
                  Kategori untuk mengelompokkan website di aplikasi
                </p>
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AI & Tools, Streaming, Desain"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Icon Kategori
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sparkles, Film, Music, Palette..."
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Urutan Tampil (Sort Order)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={categoryForm.sort_order}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0E8]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] shadow-sm transition-colors cursor-pointer"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODAL: Cookie Account Create / Edit                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {cookieModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full space-y-5 shadow-2xl border border-[#EAEAE3]">
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingCookie ? 'Edit Cookie Akun' : 'Tambah Cookie Akun Baru'}
                </h3>
                <p className="text-sm text-neutral-500">
                  Pilih website tujuan dan masukkan data cookies format JSON
                </p>
              </div>
              <button
                onClick={() => setCookieModalOpen(false)}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCookie} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Pilih Website <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={cookieForm.website_id}
                  disabled={Boolean(editingCookie)}
                  onChange={(val) => setCookieForm({ ...cookieForm, website_id: val })}
                  placeholder="Pilih Website"
                  options={[
                    { value: '', label: 'Pilih Website' },
                    ...websites.map((w) => ({ value: w.id, label: `${w.name} (${w.category_name || 'Tanpa Kategori'})` }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Label Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Akun 1, Akun Premium, Akun VIP"
                  value={cookieForm.label}
                  onChange={(e) => setCookieForm({ ...cookieForm, label: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cookie_active"
                  checked={cookieForm.is_active}
                  onChange={(e) => setCookieForm({ ...cookieForm, is_active: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-[#DDDDCF] text-neutral-900 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="cookie_active" className="text-sm font-semibold text-neutral-700 cursor-pointer">
                  Cookie Aktif (Dapat diakses oleh ekstensi)
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-neutral-700">
                    Data Cookie (JSON) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-mono text-neutral-400">
                    {(cookieForm.cookie_data?.length || 0).toLocaleString()} bytes
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder='Paste data cookie JSON (Array of {name, value, domain, path, ...})'
                  value={cookieForm.cookie_data}
                  onChange={(e) => setCookieForm({ ...cookieForm, cookie_data: e.target.value })}
                  className="w-full px-4 py-3 text-xs sm:text-sm font-mono bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0E8]">
                <button
                  type="button"
                  onClick={() => setCookieModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] shadow-sm transition-colors cursor-pointer"
                >
                  {editingCookie ? 'Simpan Perubahan' : 'Tambah Cookie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODAL: Edit User & Status                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {userModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-[#EAEAE3]">
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Edit Pengguna</h3>
                <p className="text-sm text-neutral-500">
                  Ubah status akun, masa aktif, dan data pengguna
                </p>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Nama Lengkap Pengguna
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={userForm.name || ''}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Email Pengguna
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-3 text-sm bg-neutral-100 border border-[#DDDDCF] rounded-2xl text-neutral-600 min-h-[46px] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 089530637007"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Status Akun <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={userForm.status}
                  onChange={(val) => {
                    let nextExpiry = userForm.expires_at;
                    if (val === 'active' && !nextExpiry) {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      nextExpiry = d.toISOString().split('T')[0];
                    }
                    setUserForm({ ...userForm, status: val, expires_at: nextExpiry });
                  }}
                  placeholder="Pilih Status"
                  options={[
                    { value: 'active', label: 'Aktif (Dapat Mengakses Layanan)' },
                    { value: 'pending', label: 'Pending (Belum Aktif / Menunggu Pembayaran)' },
                    { value: 'expired', label: 'Expired (Kadaluwarsa)' },
                    { value: 'inactive', label: 'Nonaktif (Ditangguhkan oleh Admin)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Masa Aktif Hingga (Expiry Date)
                </label>
                <input
                  type="date"
                  value={userForm.expires_at}
                  onChange={(e) => setUserForm({ ...userForm, expires_at: e.target.value })}
                  className="w-full px-4 py-3 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[46px] transition-all"
                />

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-neutral-400 font-semibold mr-1">Tambah Cepat:</span>
                  {[
                    { label: '+7 Hari', days: 7 },
                    { label: '+30 Hari', days: 30 },
                    { label: '+90 Hari', days: 90 },
                    { label: '+1 Tahun', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => addDaysToExpiry(preset.days)}
                      className="px-2.5 py-1 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {userForm.expires_at && (
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, expires_at: '' })}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0E8]">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl min-h-[44px] transition-all cursor-pointer shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODAL: Plan Create / Edit                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-[#EAEAE3] my-8">
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingPlan ? 'Edit Paket Langganan' : 'Tambah Paket Baru'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500">
                  {editingPlan
                    ? `Perbarui harga dan konfigurasi paket "${editingPlan.label}"`
                    : 'Konfigurasikan durasi, harga, dan promo paket baru'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 text-lg font-bold cursor-pointer transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Label Paket */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Nama / Label Paket <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 Bulan, 3 Bulan"
                    value={planForm.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      // Auto slug if creating and plan key was untouched
                      if (!editingPlan && (!planForm.plan || planForm.plan === planForm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))) {
                        const autoSlug = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setPlanForm({ ...planForm, label: newLabel, plan: autoSlug });
                      } else {
                        setPlanForm({ ...planForm, label: newLabel });
                      }
                    }}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>

                {/* Slug Identifier */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Kode / Slug Unik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 3months, monthly"
                    value={planForm.plan}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        plan: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                      })
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Harga Paket */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="25000"
                    value={planForm.amount}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, amount: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all font-semibold"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Rp {Number(planForm.amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Harga Coret */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Harga Asli / Coret (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="35000 (opsional)"
                    value={planForm.original_price || ''}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        original_price: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    {planForm.original_price > 0
                      ? `Coret: Rp ${Number(planForm.original_price).toLocaleString('id-ID')}`
                      : 'Kosongkan jika tanpa harga coret'}
                  </span>
                </div>
              </div>

              {/* Durasi Hari */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs sm:text-sm font-semibold text-neutral-700">
                    Durasi Masa Aktif (Hari) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                    {planForm.duration_days} Hari
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={planForm.duration_days}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, duration_days: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all font-semibold"
                />

                {/* Preset Durasi Hari */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-neutral-400 font-semibold mr-1">Preset:</span>
                  {[
                    { label: '7 Hari', days: 7 },
                    { label: '30 Hari (1 Bln)', days: 30 },
                    { label: '60 Hari (2 Bln)', days: 60 },
                    { label: '90 Hari (3 Bln)', days: 90 },
                    { label: '180 Hari (6 Bln)', days: 180 },
                    { label: '365 Hari (1 Thn)', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, duration_days: preset.days })}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        planForm.duration_days === preset.days
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Badge Promo */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Badge Promo (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hemat 20%, Terbaik"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>

                {/* Urutan Tampil */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Urutan Tampil (Sort)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.sort_order}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, sort_order: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                  Deskripsi / Subtitle (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ~Rp 20.000/bln atau Akses penuh 30 hari"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                />
              </div>

              {/* Status Aktif Switch */}
              <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAEAE0]">
                <input
                  id="plan-is-active"
                  type="checkbox"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 rounded accent-neutral-900 cursor-pointer"
                />
                <label htmlFor="plan-is-active" className="text-xs sm:text-sm font-semibold text-neutral-800 cursor-pointer select-none">
                  Aktifkan paket ini untuk publik (tampil di form daftar & dashboard)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#F0F0E8]">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-2xl min-h-[44px] transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {planSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingPlan ? 'Simpan Perubahan' : 'Buat Paket'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER MODAL */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-[#EAEAE3] my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0F0E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500">
                  {editingVoucher
                    ? `Perbarui kuota pemakaian dan pengaturan untuk "${editingVoucher.code}"`
                    : 'Atur kode kupon, diskon, dan batas kuota pemakaian'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 text-lg font-bold cursor-pointer transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveVoucher} className="space-y-4">
              {/* Kode Voucher */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                  Kode Voucher <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: HEMAT50, PROMO2026"
                    value={voucherForm.code}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all tracking-wider"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Tipe & Nilai Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Tipe Diskon <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={voucherForm.discount_type}
                    onChange={(val) => setVoucherForm({ ...voucherForm, discount_type: val })}
                    options={[
                      { value: 'percent', label: 'Persentase (%)' },
                      { value: 'fixed', label: 'Nominal Tetap (Rp)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    {voucherForm.discount_type === 'percent' ? 'Besar Diskon (%)' : 'Besar Diskon (Rp)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={voucherForm.discount_type === 'percent' ? '100' : undefined}
                    placeholder={voucherForm.discount_type === 'percent' ? '20' : '15000'}
                    value={voucherForm.discount_value}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, discount_value: parseInt(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
              </div>

              {/* BATAS PEMAKAIAN / KUOTA (CORE REQUEST) */}
              <div className="p-4 bg-[#FAF9F6] border border-[#E8E8DF] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-neutral-900">
                    Batas Pemakaian (Kuota Voucher)
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    voucherForm.max_uses > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {voucherForm.max_uses > 0 ? `Batas ${voucherForm.max_uses} Kali` : 'Tanpa Batas (Unlimited)'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Tanpa batas (Unlimited)"
                    value={voucherForm.max_uses}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, max_uses: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-[#DDDDCF] rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-900 min-h-[42px] transition-all"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Isi 0 untuk pemakaian tanpa batas (unlimited).
                </p>
                {editingVoucher && (
                  <div className="pt-2 border-t border-[#EDEDE6] text-[11px] text-neutral-600 flex items-center justify-between">
                    <span>Sudah pernah digunakan:</span>
                    <strong className="text-neutral-900">{editingVoucher.used_count || 0} kali</strong>
                  </div>
                )}
              </div>

              {/* Paket & Min Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Berlaku Untuk Paket
                  </label>
                  <CustomSelect
                    value={voucherForm.applies_to}
                    onChange={(val) => setVoucherForm({ ...voucherForm, applies_to: val })}
                    options={[
                      { value: 'all', label: 'Semua Paket' },
                      ...plansList.map((p) => ({
                        value: p.plan,
                        label: `Paket ${p.label}`,
                      })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                    Minimal Pembelian (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Tanpa minimal"
                    value={voucherForm.min_amount}
                    onChange={(e) =>
                      setVoucherForm({ ...voucherForm, min_amount: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi (Opsional) */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Promo Spesial / Kupon Event"
                  value={voucherForm.description || ''}
                  onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white min-h-[44px] transition-all"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="voucher_is_active"
                  checked={voucherForm.is_active}
                  onChange={(e) => setVoucherForm({ ...voucherForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
                <label htmlFor="voucher_is_active" className="text-xs sm:text-sm font-semibold text-neutral-800 cursor-pointer">
                  Voucher Aktif (Dapat langsung digunakan saat pembayaran)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0F0E8]">
                {editingVoucher ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setVoucherModalOpen(false);
                      await handleDeleteVoucher(editingVoucher);
                    }}
                    className="px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Voucher</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVoucherModalOpen(false)}
                    className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={voucherSubmitting}
                    className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-2xl min-h-[44px] transition-all cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    {voucherSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingVoucher ? 'Simpan Perubahan' : 'Buat Voucher'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {orderDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-6 shadow-2xl border border-[#EAEAE3] my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#F0F0E8] pb-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                  Detail Transaksi Pelanggan
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 flex-wrap pt-0.5">
                  <span className="text-neutral-400 font-medium">Order ID:</span>
                  <span className="font-mono font-bold text-neutral-900 select-all">
                    {selectedOrder.order_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.order_id);
                      toast.success('Order ID disalin ke clipboard');
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                    title="Salin Order ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-neutral-300">•</span>
                  <span className="text-neutral-400 font-medium">Status:</span>
                  <span
                    className={`font-bold ${
                      selectedOrder.status === 'paid'
                        ? 'text-emerald-700'
                        : selectedOrder.status === 'pending'
                        ? 'text-amber-700'
                        : selectedOrder.status === 'expired'
                        ? 'text-neutral-500'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedOrder.status === 'paid'
                      ? 'Lunas / Berhasil'
                      : selectedOrder.status === 'pending'
                      ? 'Menunggu Pembayaran'
                      : selectedOrder.status}
                  </span>
                  {orderDetailLoading && (
                    <>
                      <span className="text-neutral-300">•</span>
                      <span className="text-[11px] text-neutral-400 animate-pulse">Menyinkronkan detail...</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* Timeline Waktu Dipesan & Dibayar */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Waktu Transaksi & Pembayaran
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-white border border-[#EAEAE2] space-y-1">
                    <span className="text-xs text-neutral-400 font-medium block">Waktu Pemesanan</span>
                    <div className="font-bold text-neutral-900">
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      }) : '-'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#EAEAE2] space-y-1">
                    <span className="text-xs text-neutral-400 font-medium block">Waktu Pembayaran</span>
                    <div className={`font-bold ${selectedOrder.paid_at ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedOrder.paid_at ? new Date(selectedOrder.paid_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      }) : 'Menunggu Pembayaran'}
                    </div>
                    {selectedOrder.paid_at && selectedOrder.created_at && (
                      <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
                        {(() => {
                          const diffSec = Math.max(0, Math.round((new Date(selectedOrder.paid_at) - new Date(selectedOrder.created_at)) / 1000));
                          if (diffSec < 60) return `⚡ Terverifikasi dalam ${diffSec} detik`;
                          const diffMin = Math.floor(diffSec / 60);
                          const remSec = diffSec % 60;
                          return `⚡ Terverifikasi dalam ${diffMin} menit ${remSec > 0 ? `${remSec} dtk` : ''}`;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Pelanggan & Paket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data Pelanggan */}
                <div className="p-4 rounded-2xl bg-white border border-[#EAEAE2] space-y-2.5">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    Informasi Pelanggan
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <span className="text-xs text-neutral-400 block">Email Akun:</span>
                      <span className="font-bold text-neutral-900 select-all">{selectedOrder.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 block">Nama User:</span>
                      <span className="font-semibold text-neutral-800">{selectedOrder.user?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 block">WhatsApp:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800">{selectedOrder.user?.phone || '-'}</span>
                        {selectedOrder.user?.phone && (
                          <a
                            href={`https://wa.me/${selectedOrder.user.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-0.5"
                          >
                            Chat WA <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paket Langganan */}
                <div className="p-4 rounded-2xl bg-white border border-[#EAEAE2] space-y-2.5">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                    Paket Langganan
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <span className="text-xs text-neutral-400 block">Nama Paket:</span>
                      <span className="font-black text-neutral-900 uppercase text-base">{selectedOrder.plan}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 block">Durasi Langganan:</span>
                      <span className="font-semibold text-neutral-800">{selectedOrder.duration_days || 30} Hari</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 block">Masa Aktif Akun S/D:</span>
                      <span className="font-semibold text-neutral-800">
                        {selectedOrder.expires_at ? new Date(selectedOrder.expires_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Finansial & Diskon (Pake diskon ga?) */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAEAE2] space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  Rincian Pembayaran & Diskon
                </h4>

                <div className="divide-y divide-[#F4F4EE] text-sm">
                  {/* Harga Paket */}
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-neutral-500">Harga Asli Paket</span>
                    <span className="font-semibold text-neutral-900">
                      Rp {Number(selectedOrder.original_amount || selectedOrder.amount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Diskon / Voucher */}
                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">Diskon Voucher:</span>
                      {selectedOrder.voucher_code ? (
                        <span className="font-mono font-bold text-emerald-700">
                          {selectedOrder.voucher_code}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-medium">
                          Tanpa Voucher
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${Number(selectedOrder.discount_amount || 0) > 0 ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      {Number(selectedOrder.discount_amount || 0) > 0
                        ? `- Rp ${Number(selectedOrder.discount_amount).toLocaleString('id-ID')}`
                        : 'Rp 0'}
                    </span>
                  </div>

                  {/* Biaya Admin Gateway */}
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-neutral-500">Biaya Layanan / Admin Fee</span>
                    <span className="font-semibold text-neutral-700">
                      Rp {Number(selectedOrder.admin_fee || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Total Dibayar Customer */}
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-900 block">Total Dibayar Customer</span>
                      <span className="text-xs text-neutral-400">Nominal akhir transaksi</span>
                    </div>
                    <span className="text-xl font-black text-neutral-900">
                      Rp {Number(selectedOrder.amount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Net Revenue */}
                  <div className="py-2.5 flex items-center justify-between bg-emerald-50/50 -mx-4 px-4 rounded-b-xl">
                    <span className="text-xs font-bold text-emerald-900">Pendapatan Bersih (Net Revenue)</span>
                    <span className="font-black text-emerald-700">
                      Rp {(Number(selectedOrder.amount || 0) - Number(selectedOrder.admin_fee || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Referral / Afiliasi (Pake kode referal apa engga?) */}
              <div className="p-4 rounded-2xl bg-white border border-[#EAEAE2] space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-neutral-500" />
                  Informasi Kode Referral & Afiliasi
                </h4>

                {selectedOrder.affiliate_code || selectedOrder.referred_by || selectedOrder.referred_by_id ? (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs font-medium text-neutral-600">Status:</span>
                      <span className="text-xs font-bold text-purple-700">
                        Menggunakan Kode Referral
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs font-medium text-neutral-600">Kode Referral Terpasang:</span>
                      <span className="font-mono font-bold text-purple-900 text-sm">
                        {selectedOrder.affiliate_code || selectedOrder.referred_by?.affiliate_code || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-xs font-medium text-neutral-600">Upline / Pemilik Kode:</span>
                      <span className="font-semibold text-neutral-900">
                        {selectedOrder.referred_by?.name || selectedOrder.referred_by?.email || `User #${selectedOrder.referred_by_id}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-1 border-t border-purple-200/60">
                      <span className="text-xs font-medium text-neutral-600">Komisi Afiliasi:</span>
                      <span className="font-bold text-purple-700">
                        Rp {Number(selectedOrder.commission_amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFEFE8] flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-medium">Transaksi Organik (Tidak Menggunakan Kode Referral)</span>
                    <span className="text-neutral-600 font-semibold">Tanpa Referral</span>
                  </div>
                )}
              </div>

              {/* Detail Payment Gateway */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFEFE8] space-y-2 text-xs">
                <span className="font-bold text-neutral-500 uppercase tracking-wider block">ID Transaksi Gateway</span>
                <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-[#EAEAE2]">
                  <span className="font-mono text-neutral-800 break-all select-all">
                    {selectedOrder.payment_txn_id || '-'}
                  </span>
                  {selectedOrder.payment_txn_id && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.payment_txn_id);
                        toast.success('Txn ID disalin ke clipboard');
                      }}
                      className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                      title="Salin Txn ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#F0F0E8]">
              <button
                type="button"
                onClick={() => setOrderDetailModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedOrder.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => handleManualActivate(selectedOrder.id)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-2xl min-h-[44px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Aktivasi Manual Order</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const text = `Order ID: ${selectedOrder.order_id}\nEmail: ${selectedOrder.email}\nPaket: ${selectedOrder.plan}\nTotal: Rp ${Number(selectedOrder.amount || 0).toLocaleString('id-ID')}\nStatus: ${selectedOrder.status}\nVoucher: ${selectedOrder.voucher_code || 'Tanpa Voucher'}\nReferral: ${selectedOrder.affiliate_code || 'Tanpa Referral'}\nWaktu Pemesanan: ${selectedOrder.created_at || '-'}\nWaktu Pembayaran: ${selectedOrder.paid_at || 'Menunggu Pembayaran'}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Ringkasan order berhasil disalin!');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-800 bg-[#EFEFE8] hover:bg-[#E5E5DC] rounded-2xl min-h-[44px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Ringkasan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
