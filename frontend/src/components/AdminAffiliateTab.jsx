import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client';
import {
  Gift,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Clock,
  ExternalLink,
  Users,
  DollarSign,
  Settings,
} from 'lucide-react';

function resolveProofImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/payout_proofs/')) {
    return url.replace('/storage/payout_proofs/', '/uploads/payout_proofs/');
  }
  return url;
}

export default function AdminAffiliateTab({ toast, showConfirm }) {
  const [subtab, setSubtab] = useState('affiliates'); // 'affiliates' | 'payouts' | 'earnings' | 'settings'

  // Affiliates List state
  const [affiliates, setAffiliates] = useState([]);
  const [affiliatesPagination, setAffiliatesPagination] = useState(null);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [affiliateSearch, setAffiliateSearch] = useState('');
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState('all');

  // Payouts state
  const [payouts, setPayouts] = useState([]);
  const [, setPayoutsPagination] = useState(null);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('pending');
  const [payoutSearch, setPayoutSearch] = useState('');

  // Earnings state
  const [earnings, setEarnings] = useState([]);
  const [, setEarningsPagination] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningSearch, setEarningSearch] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    affiliate_enabled: true,
    affiliate_commission_default: 20000,
    affiliate_min_payout: 50000,
  });
  const [, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newAffiliateCode, setNewAffiliateCode] = useState('');
  const [newCommission, setNewCommission] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [editForm, setEditForm] = useState({
    affiliate_code: '',
    affiliate_commission: '',
    affiliate_balance: 0,
    is_affiliate: true,
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Approve / Reject Payout modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [activePayout, setActivePayout] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Pending count badge
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);

  // Fetch Affiliates
  const fetchAffiliates = useCallback(async (page = 1) => {
    setAffiliatesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (affiliateSearch.trim()) params.append('search', affiliateSearch.trim());
      if (affiliateStatusFilter !== 'all') params.append('status', affiliateStatusFilter);

      const res = await api.get(`/admin/affiliates?${params.toString()}`);
      setAffiliates(res.data.data || []);
      setAffiliatesPagination(res.data);
    } catch (err) {
      console.error('Failed to load affiliates:', err);
      toast.error('Gagal memuat daftar afiliator');
    } finally {
      setAffiliatesLoading(false);
    }
  }, [affiliateSearch, affiliateStatusFilter, toast]);

  // Fetch Payouts
  const fetchPayouts = useCallback(async (page = 1) => {
    setPayoutsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (payoutStatusFilter !== 'all') params.append('status', payoutStatusFilter);
      if (payoutSearch.trim()) params.append('search', payoutSearch.trim());

      const res = await api.get(`/admin/affiliate/payouts?${params.toString()}`);
      setPayouts(res.data.data || []);
      setPayoutsPagination(res.data);

      // Check pending count
      if (payoutStatusFilter === 'pending') {
        setPendingPayoutCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setPayoutsLoading(false);
    }
  }, [payoutStatusFilter, payoutSearch]);

  // Fetch Earnings
  const fetchEarnings = useCallback(async (page = 1) => {
    setEarningsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (earningSearch.trim()) params.append('search', earningSearch.trim());

      const res = await api.get(`/admin/affiliate/earnings?${params.toString()}`);
      setEarnings(res.data.data || []);
      setEarningsPagination(res.data);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setEarningsLoading(false);
    }
  }, [earningSearch]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get('/admin/affiliate/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load affiliate settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      fetchAffiliates();
      fetchSettings();
      api.get('/admin/affiliate/payouts?status=pending')
        .then((res) => { if (active) setPendingPayoutCount(res.data?.total || 0); })
        .catch(() => {});
    });
    return () => { active = false; };
  }, [fetchAffiliates, fetchSettings]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (subtab === 'affiliates') fetchAffiliates();
      else if (subtab === 'payouts') fetchPayouts();
      else if (subtab === 'earnings') fetchEarnings();
      else if (subtab === 'settings') fetchSettings();
    });
    return () => { active = false; };
  }, [subtab, fetchAffiliates, fetchPayouts, fetchEarnings, fetchSettings]);

  // Debounced user search in Create Modal
  const searchTimeoutRef = useRef(null);
  const handleUserSearchInput = (val) => {
    setUserQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setUserSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.get(`/admin/affiliate/search-users?q=${encodeURIComponent(val.trim())}`);
        setUserSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  };

  // Submit Appoint Affiliate
  const handleCreateAffiliate = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Pilih pengguna yang akan dijadikan afiliator.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await api.post('/admin/affiliates', {
        user_id: selectedUser.id,
        affiliate_code: newAffiliateCode.trim() || null,
        affiliate_commission: newCommission ? parseInt(newCommission, 10) : null,
      });

      toast.success(res.data.message || 'Afiliator baru berhasil ditambahkan!');
      setCreateModalOpen(false);
      setSelectedUser(null);
      setUserQuery('');
      setNewAffiliateCode('');
      setNewCommission('');
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Gagal menambahkan afiliator.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Affiliate
  const handleOpenEdit = (aff) => {
    setEditingAffiliate(aff);
    setEditForm({
      affiliate_code: aff.affiliate_code || '',
      affiliate_commission: aff.custom_commission != null ? String(aff.custom_commission) : '',
      affiliate_balance: aff.affiliate_balance || 0,
      is_affiliate: aff.is_affiliate,
      bank_name: aff.bank_name || '',
      bank_account_number: aff.bank_account_number || '',
      bank_account_holder: aff.bank_account_holder || '',
    });
    setEditModalOpen(true);
  };

  // Submit Edit Affiliate
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAffiliate) return;

    setEditSubmitting(true);
    try {
      const res = await api.put(`/admin/affiliates/${editingAffiliate.id}`, {
        affiliate_code: editForm.affiliate_code.trim(),
        affiliate_commission: editForm.affiliate_commission !== '' ? parseInt(editForm.affiliate_commission, 10) : null,
        affiliate_balance: parseInt(editForm.affiliate_balance, 10) || 0,
        is_affiliate: editForm.is_affiliate,
        bank_name: editForm.bank_name.trim(),
        bank_account_number: editForm.bank_account_number.trim(),
        bank_account_holder: editForm.bank_account_holder.trim(),
      });

      toast.success(res.data.message || 'Data afiliator berhasil diperbarui.');
      setEditModalOpen(false);
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Gagal memperbarui afiliator.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Revoke Affiliate
  const handleRevoke = async (aff) => {
    const ok = await showConfirm({
      title: 'Nonaktifkan Status Afiliator',
      message: `Nonaktifkan status afiliator untuk "${aff.name}"? Kode referral tidak akan dapat digunakan oleh member baru lagi.`,
      confirmText: 'Nonaktifkan',
      isDanger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/admin/affiliates/${aff.id}`);
      toast.success(`Afiliator ${aff.name} berhasil dinonaktifkan.`);
      fetchAffiliates();
    } catch {
      toast.error('Gagal menonaktifkan afiliator.');
    }
  };

  // Submit Approve Payout
  const handleApprovePayout = async (e) => {
    e.preventDefault();
    if (!activePayout) return;

    setApproveSubmitting(true);
    try {
      const formData = new FormData();
      if (proofFile) formData.append('proof_image', proofFile);
      if (approveNotes.trim()) formData.append('admin_notes', approveNotes.trim());

      const res = await api.post(`/admin/affiliate/payouts/${activePayout.id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message || 'Penarikan berhasil disetujui.');
      setApproveModalOpen(false);
      setActivePayout(null);
      setProofFile(null);
      setProofPreview(null);
      setApproveNotes('');
      fetchPayouts();
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyetujui penarikan.');
    } finally {
      setApproveSubmitting(false);
    }
  };

  // Submit Reject Payout
  const handleRejectPayout = async (e) => {
    e.preventDefault();
    if (!activePayout) return;
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi.');
      return;
    }

    setRejectSubmitting(true);
    try {
      const res = await api.post(`/admin/affiliate/payouts/${activePayout.id}/reject`, {
        reason: rejectReason.trim(),
      });

      toast.success(res.data.message || 'Penarikan berhasil ditolak dan saldo dikembalikan.');
      setRejectModalOpen(false);
      setActivePayout(null);
      setRejectReason('');
      fetchPayouts();
      fetchAffiliates();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menolak penarikan.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await api.put('/admin/affiliate/settings', settings);
      toast.success(res.data.message || 'Pengaturan berhasil disimpan.');
      setSettings(res.data.settings);
    } catch {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900">Manajemen Afiliasi & Referral</h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Kelola afiliator, komisi referral, dan persetujuan pencairan dana penarikan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setUserQuery('');
              setUserSearchResults([]);
              setNewAffiliateCode('');
              setNewCommission('');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Afiliator</span>
          </button>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#EAEAE3] pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSubtab('affiliates')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subtab === 'affiliates'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-[#F5F5EE] border border-[#E8E8DF]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Daftar Afiliator ({affiliatesPagination?.total || 0})</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSubtab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subtab === 'payouts'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-[#F5F5EE] border border-[#E8E8DF]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Permintaan Penarikan</span>
            {pendingPayoutCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingPayoutCount}
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSubtab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subtab === 'earnings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-[#F5F5EE] border border-[#E8E8DF]'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Riwayat Komisi Transaksi</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSubtab('settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subtab === 'settings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 hover:bg-[#F5F5EE] border border-[#E8E8DF]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Pengaturan Global</span>
          </div>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SUBTAB 1: DAFTAR AFILIATOR
         ══════════════════════════════════════════════════════════ */}
      {subtab === 'affiliates' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={affiliateSearch}
                onChange={(e) => setAffiliateSearch(e.target.value)}
                placeholder="Cari nama, email, atau kode referral..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={affiliateStatusFilter}
                onChange={(e) => setAffiliateStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif Saja</option>
                <option value="inactive">Nonaktif Saja</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-[#E8E8DF] shadow-bone overflow-hidden">
            {affiliatesLoading ? (
              <div className="py-16 text-center text-xs text-neutral-400">Memuat daftar afiliator...</div>
            ) : affiliates.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">Belum ada afiliator terdaftar.</p>
                <p className="text-xs text-neutral-400">Klik tombol "+ Tambah Afiliator" di atas untuk mendaftarkan member.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFBF9] border-b border-[#ECECE5] text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Afiliator</th>
                      <th className="py-3 px-4">Kode Referral</th>
                      <th className="py-3 px-4">Rate Komisi</th>
                      <th className="py-3 px-4">Saldo Komisi</th>
                      <th className="py-3 px-4">Total Dicairkan</th>
                      <th className="py-3 px-4">Referral / Sales</th>
                      <th className="py-3 px-4">Rekening Tujuan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EB]">
                    {affiliates.map((aff) => (
                      <tr key={aff.id} className="hover:bg-[#FDFDFB] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-900">{aff.name}</div>
                          <div className="text-[11px] text-neutral-500">{aff.email}</div>
                          {aff.phone && <div className="text-[10px] text-neutral-400">{aff.phone}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs bg-neutral-100 text-neutral-900 px-2 py-1 rounded-lg border border-neutral-200">
                            {aff.affiliate_code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-900">
                            Rp {aff.commission_rate?.toLocaleString('id-ID')}
                          </div>
                          {aff.custom_commission != null && (
                            <span className="text-[10px] text-amber-600 font-semibold">Custom</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-emerald-700 text-xs">
                            Rp {aff.affiliate_balance?.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-600">
                          Rp {aff.total_payout?.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{aff.referrals_count} Member</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{aff.paid_orders_count} Pembelian</div>
                        </td>
                        <td className="py-3 px-4">
                          {aff.bank_name ? (
                            <div>
                              <div className="font-semibold text-neutral-800">{aff.bank_name}</div>
                              <div className="font-mono text-[10px] text-neutral-500">{aff.bank_account_number}</div>
                              <div className="text-[10px] text-neutral-400">({aff.bank_account_holder})</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Belum diisi</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {aff.is_affiliate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(aff)}
                              className="p-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-[#F2F2EC] transition-colors cursor-pointer"
                              title="Edit Afiliator"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {aff.is_affiliate && (
                              <button
                                type="button"
                                onClick={() => handleRevoke(aff)}
                                className="p-1.5 rounded-xl text-rose-600 hover:text-rose-900 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Nonaktifkan Status"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* ══════════════════════════════════════════════════════════
          SUBTAB 2: PERMINTAAN PENARIKAN (PAYOUTS)
         ══════════════════════════════════════════════════════════ */}
      {subtab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                placeholder="Cari ID payout, nama, atau rekening..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none"
              >
                <option value="pending">Menunggu Konfirmasi (Pending)</option>
                <option value="approved">Sudah Ditransfer (Disetujui)</option>
                <option value="rejected">Ditolak</option>
                <option value="all">Semua Status</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E8DF] shadow-bone overflow-hidden">
            {payoutsLoading ? (
              <div className="py-16 text-center text-xs text-neutral-400">Memuat permintaan penarikan...</div>
            ) : payouts.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <CreditCard className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">Tidak ada permohonan penarikan dana.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFBF9] border-b border-[#ECECE5] text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">ID Permohonan</th>
                      <th className="py-3 px-4">Afiliator</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Rekening Tujuan Transfer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Bukti / Catatan</th>
                      <th className="py-3 px-4">Tanggal Pengajuan</th>
                      <th className="py-3 px-4 text-right">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EB]">
                    {payouts.map((p) => {
                      const isPending = p.status === 'pending';
                      const isApproved = p.status === 'approved';
                      const isRejected = p.status === 'rejected';

                      return (
                        <tr key={p.id} className="hover:bg-[#FDFDFB] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-neutral-900">
                            {p.payout_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900">{p.affiliate?.name || 'Member'}</div>
                            <div className="text-[11px] text-neutral-500">{p.affiliate?.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-sm text-neutral-900">
                              Rp {p.amount?.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900">{p.bank_name}</div>
                            <div className="font-mono text-[11px] text-neutral-700 font-bold">{p.bank_account_number}</div>
                            <div className="text-[10px] text-neutral-500">a.n. {p.bank_account_holder}</div>
                          </td>
                          <td className="py-3 px-4">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> Pending Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" /> Berhasil Ditransfer
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <X className="w-3 h-3" /> Ditolak
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {p.proof_image ? (
                              <a
                                href={resolveProofImageUrl(p.proof_image)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                              >
                                <span>Lihat Bukti Transfer</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-neutral-400">{p.admin_notes || '-'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-neutral-400">
                            {new Date(p.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayout(p);
                                    setProofFile(null);
                                    setProofPreview(null);
                                    setApproveNotes('');
                                    setApproveModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                                >
                                  Setujui & Transfer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayout(p);
                                    setRejectReason('');
                                    setRejectModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-neutral-400 text-[11px]">Selesai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SUBTAB 3: RIWAYAT KOMISI TRANSAKSI
         ══════════════════════════════════════════════════════════ */}
      {subtab === 'earnings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={earningSearch}
                onChange={(e) => setEarningSearch(e.target.value)}
                placeholder="Cari order ID, nama afiliator, atau pembeli..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E8DF] shadow-bone overflow-hidden">
            {earningsLoading ? (
              <div className="py-16 text-center text-xs text-neutral-400">Memuat log komisi...</div>
            ) : earnings.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <DollarSign className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">Belum ada riwayat komisi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFBF9] border-b border-[#ECECE5] text-neutral-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Afiliator Penerima</th>
                      <th className="py-3 px-4">Pembeli (User Baru)</th>
                      <th className="py-3 px-4">Total Nilai Order</th>
                      <th className="py-3 px-4">Komisi Diterima</th>
                      <th className="py-3 px-4">Status Komisi</th>
                      <th className="py-3 px-4">Waktu Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EB]">
                    {earnings.map((e) => (
                      <tr key={e.id} className="hover:bg-[#FDFDFB] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-neutral-900">
                          {e.order_id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-900">{e.affiliate?.name}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            [{e.affiliate?.affiliate_code}] {e.affiliate?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{e.referred_user?.name || 'Member'}</div>
                          <div className="text-[11px] text-neutral-500">{e.referred_user?.email}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-700">
                          Rp {e.order_amount?.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-600 text-sm">
                          Rp {e.commission_amount?.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Tersedia
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(e.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

      {/* ══════════════════════════════════════════════════════════
          SUBTAB 4: PENGATURAN GLOBAL
         ══════════════════════════════════════════════════════════ */}
      {subtab === 'settings' && (
        <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">Pengaturan Sistem Afiliasi</h3>
            <p className="text-xs text-neutral-500">
              Konfigurasi parameter default untuk semua afiliator di Hitshare.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-4 bg-[#FBFBF9] rounded-2xl border border-[#EAEAE3]">
              <div>
                <div className="font-bold text-sm text-neutral-900">Aktifkan Program Afiliasi</div>
                <div className="text-xs text-neutral-500">
                  Jika dinonaktifkan, kode referral baru tidak akan dapat digunakan saat checkout pendaftaran.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.affiliate_enabled}
                  onChange={(e) => setSettings({ ...settings, affiliate_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
              </label>
            </div>

            {/* Default Commission */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Default Komisi per Pembelian Pertama (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={settings.affiliate_commission_default}
                onChange={(e) => setSettings({ ...settings, affiliate_commission_default: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
              <p className="text-[11px] text-neutral-400">
                Nilai komisi ini berlaku jika afiliator tidak memiliki pengaturan komisi khusus.
              </p>
            </div>

            {/* Min Payout */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Minimal Penarikan Saldo (Rp)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={settings.affiliate_min_payout}
                onChange={(e) => setSettings({ ...settings, affiliate_min_payout: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
              <p className="text-[11px] text-neutral-400">
                Batas minimum saldo yang harus dimiliki afiliator sebelum dapat mengajukan penarikan.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full py-3.5 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                {settingsSaving ? 'Menyimpan...' : 'Simpan Pengaturan Afiliasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: TAMBAH AFILIATOR BARU
         ══════════════════════════════════════════════════════════ */}
      {createModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Gift className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Tambah / Angkat Afiliator</h3>
                  <p className="text-xs text-neutral-500">Pilih user dan tentukan kode referral resminya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAffiliate} className="space-y-4">
              {/* User Search & Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Cari Pengguna Terdaftar
                </label>
                {!selectedUser ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => handleUserSearchInput(e.target.value)}
                        placeholder="Ketik nama, email, atau no HP user..."
                        className="w-full pl-10 pr-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    {searchingUsers && (
                      <p className="text-xs text-neutral-400 italic">Mencari pengguna...</p>
                    )}

                    {userSearchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto bg-white border border-[#DDDDCF] rounded-2xl divide-y divide-[#F0F0EB] shadow-xs">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearchResults([]);
                              if (u.name) {
                                // Suggest code based on first name
                                const firstName = u.name.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                if (firstName.length >= 3) {
                                  setNewAffiliateCode(`${firstName}${Math.floor(10 + Math.random() * 89)}`);
                                }
                              }
                            }}
                            className="w-full p-3 text-left hover:bg-[#FBFBF9] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-xs text-neutral-900">{u.name}</div>
                              <div className="text-[11px] text-neutral-500">{u.email}</div>
                            </div>
                            {u.is_affiliate ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Sudah Afiliator ({u.affiliate_code})
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-neutral-900 underline">Pilih</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-neutral-900">{selectedUser.name}</div>
                      <div className="text-xs text-neutral-500">{selectedUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Ganti User
                    </button>
                  </div>
                )}
              </div>

              {/* Referral Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Kode Referral (Custom atau Auto-Generate)
                </label>
                <input
                  type="text"
                  value={newAffiliateCode}
                  onChange={(e) => setNewAffiliateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="Contoh: ANDI20 (Kosongkan untuk otomatis)"
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <p className="text-[11px] text-neutral-400">
                  Hanya huruf, angka, dash (-), dan underscore (_). Jika dikosongkan akan di-generate otomatis.
                </p>
              </div>

              {/* Custom Commission */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Nominal Komisi per Penjualan (Opsional)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  placeholder={`Default: Rp ${settings.affiliate_commission_default?.toLocaleString('id-ID')}`}
                  className="w-full px-4 py-3 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
                <p className="text-[11px] text-neutral-400">
                  Kosongkan jika ingin menggunakan rate komisi default sistem.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || !selectedUser}
                  className="w-1/2 py-3 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {createSubmitting ? 'Menyimpan...' : 'Aktifkan Afiliator'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: EDIT AFILIATOR
         ══════════════════════════════════════════════════════════ */}
      {editModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Edit Data Afiliator</h3>
                  <p className="text-xs text-neutral-500">{editingAffiliate?.name} ({editingAffiliate?.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Kode Referral
                </label>
                <input
                  type="text"
                  required
                  value={editForm.affiliate_code}
                  onChange={(e) => setEditForm({ ...editForm, affiliate_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  className="w-full px-4 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Rate Komisi (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editForm.affiliate_commission}
                    onChange={(e) => setEditForm({ ...editForm, affiliate_commission: e.target.value })}
                    placeholder="Default"
                    className="w-full px-4 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <p className="text-[10px] text-neutral-400">Kosong = default rate</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Saldo Komisi (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.affiliate_balance}
                    onChange={(e) => setEditForm({ ...editForm, affiliate_balance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs sm:text-sm font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-[#F0F0EB]">
                <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Rekening Bank / E-Wallet Afiliator
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editForm.bank_name}
                    onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                    placeholder="Nama Bank / E-Wallet"
                    className="w-full px-3 py-2 bg-[#FBFBF9] border border-[#DDDDCF] rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="text"
                    value={editForm.bank_account_number}
                    onChange={(e) => setEditForm({ ...editForm, bank_account_number: e.target.value })}
                    placeholder="Nomor Rekening"
                    className="w-full px-3 py-2 bg-[#FBFBF9] border border-[#DDDDCF] rounded-xl text-xs font-mono focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <input
                  type="text"
                  value={editForm.bank_account_holder}
                  onChange={(e) => setEditForm({ ...editForm, bank_account_holder: e.target.value })}
                  placeholder="Nama Pemilik Rekening"
                  className="w-full px-3 py-2 bg-[#FBFBF9] border border-[#DDDDCF] rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FBFBF9] rounded-2xl border border-[#EAEAE3]">
                <span className="text-xs font-bold text-neutral-800">Status Afiliator Aktif</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_affiliate}
                    onChange={(e) => setEditForm({ ...editForm, is_affiliate: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="w-1/2 py-3 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: SETUJUI & UPLOAD BUKTI TRANSFER PAYOUT
         ══════════════════════════════════════════════════════════ */}
      {approveModalOpen && activePayout && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setApproveModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Konfirmasi Transfer Komisi</h3>
                  <p className="text-xs text-neutral-500 font-mono">{activePayout.payout_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target info */}
            <div className="p-4 bg-[#FBFBF9] rounded-2xl border border-[#EAEAE3] space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500">Nominal Transfer:</span>
                <span className="text-base font-black text-neutral-900">
                  Rp {activePayout.amount?.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="pt-2 border-t border-[#ECECE5] space-y-1">
                <div className="font-bold text-neutral-900 text-sm">
                  {activePayout.bank_name} - {activePayout.bank_account_number}
                </div>
                <div className="text-neutral-600">
                  a.n. <strong>{activePayout.bank_account_holder}</strong>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Afiliator: {activePayout.affiliate?.name} ({activePayout.affiliate?.email})
                </div>
              </div>
            </div>

            <form onSubmit={handleApprovePayout} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Upload Bukti Transfer (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProofFile(file);
                      setProofPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
                />
                {proofPreview && (
                  <div className="mt-2 w-full h-32 rounded-xl border border-neutral-200 overflow-hidden">
                    <img src={proofPreview} alt="Preview Bukti" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Catatan untuk Afiliator (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Contoh: Transfer via BCA Mobile ref #1234..."
                  className="w-full px-3.5 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approveSubmitting}
                  className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {approveSubmitting ? 'Memproses...' : 'Konfirmasi Transfer Berhasil'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: TOLAK PAYOUT (REFUND SALDO)
         ══════════════════════════════════════════════════════════ */}
      {rejectModalOpen && activePayout && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setRejectModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E8E8DF] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <X className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Tolak Permohonan Penarikan</h3>
                  <p className="text-xs text-neutral-500 font-mono">{activePayout.payout_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pengembalian Saldo Otomatis</span>
              </div>
              <p className="text-neutral-600">
                Saldo sebesar <strong>Rp {activePayout.amount?.toLocaleString('id-ID')}</strong> akan otomatis dikembalikan ke saldo komisi akun afiliator ({activePayout.affiliate?.name}).
              </p>
            </div>

            <form onSubmit={handleRejectPayout} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Alasan Penolakan (Wajib Diisi)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Nomor rekening tidak valid / nama tidak sesuai bank..."
                  className="w-full px-3.5 py-2.5 bg-[#FBFBF9] border border-[#DDDDCF] rounded-2xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectSubmitting || !rejectReason.trim()}
                  className="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {rejectSubmitting ? 'Memproses...' : 'Tolak & Kembalikan Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
