// ═══════════════════════════════════════════════════════════
//  HitShare Extension — popup.js v2.0.5
//  Dark & Neon Emerald Layout: 6-Column App Grid, Category Carousel
//  Embedded Inline SVGs (No External CDN Script Blocking)
// ═══════════════════════════════════════════════════════════

// ── Config (Development) ──────────────────────────────────
const API_BASE = 'http://localhost:8000/api';
const WEB_BASE = 'http://localhost:5173';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;   // 5 menit
const SYNC_STALE_MS    = 10 * 60 * 1000;  // 10 menit

// ── State ────────────────────────────────────────────────
let currentUser    = null;
let websiteItems   = [];
let publicSettings = {};
let syncTimer      = null;
let pinnedWebsites = [];
let isLocked       = false;
let isUpdateRequired = false;
let activeCategory = 'all';

// ── SVG Icons Dictionary (Local, No Remote Dependency) ───
const SVG_ICONS = {
    'zap': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    'refresh-cw': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>',
    'user-round': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>',
    'log-out': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    'search': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    'globe': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    'key': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>',
    'eye': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    'eye-off': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>',
    'chevron-right': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
};

function getIconSvg(name) {
    return SVG_ICONS[name] || '';
}

function resolveIconUrl(icon) {
    if (!icon) return '';
    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
        return icon;
    }
    if (icon.startsWith('/')) {
        const origin = API_BASE.replace(/\/api\/?$/, '');
        return `${origin}${icon}`;
    }
    return icon;
}

function isImageIcon(icon) {
    if (!icon) return false;
    return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('data:image/');
}

const CATEGORY_SVGS = {
    'grid': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>',
    'palette': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"></path></svg>',
    'sparkles': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>',
    'bot': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>',
    'graduation-cap': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
    'tv': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
    'film': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>',
    'headphones': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path></svg>',
    'briefcase': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    'layers': '<svg class="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
};

function getCategoryIcon(catName, rawIcon) {
    const raw = (rawIcon || '').toLowerCase();
    if (raw === 'palette') return CATEGORY_SVGS['palette'];
    if (raw === 'sparkles') return CATEGORY_SVGS['sparkles'];
    if (raw === 'graduationcap' || raw === 'graduation-cap' || raw === 'bookopen') return CATEGORY_SVGS['graduation-cap'];
    if (raw === 'tv') return CATEGORY_SVGS['tv'];
    if (raw === 'film') return CATEGORY_SVGS['film'];
    if (raw === 'headphones' || raw === 'music') return CATEGORY_SVGS['headphones'];
    if (raw === 'briefcase') return CATEGORY_SVGS['briefcase'];
    if (raw === 'layers' || raw === 'globe') return CATEGORY_SVGS['layers'];

    const lower = (catName || '').toLowerCase();
    if (lower === 'all' || lower === 'semua') return CATEGORY_SVGS['grid'];
    if (lower.includes('desain') || lower.includes('design') || lower.includes('kreatif') || lower.includes('art')) return CATEGORY_SVGS['palette'];
    if (lower.includes('musik') || lower.includes('suara') || lower.includes('audio') || lower.includes('lagu') || lower.includes('podcast')) return CATEGORY_SVGS['headphones'];
    if (lower.includes('pendidikan') || lower.includes('edukasi') || lower.includes('belajar') || lower.includes('course')) return CATEGORY_SVGS['graduation-cap'];
    if (lower.includes('streaming') || lower.includes('layanan') || lower.includes('film') || lower.includes('video') || lower.includes('nonton') || lower.includes('tv')) return CATEGORY_SVGS['tv'];
    if (lower.includes('ai') || lower.includes('tool') || lower.includes('bot') || lower.includes('gpt')) return CATEGORY_SVGS['sparkles'];
    if (lower.includes('produktivitas') || lower.includes('kerja') || lower.includes('office') || lower.includes('doc')) return CATEGORY_SVGS['briefcase'];
    return CATEGORY_SVGS['layers'];
}

// ── DOM Helpers ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const show = (el) => { if (typeof el === 'string') el = $(el); if (el) el.style.display = ''; };
const hide = (el) => { if (typeof el === 'string') el = $(el); if (el) el.style.display = 'none'; };

function reinitIcons() {
    document.querySelectorAll('i[data-lucide]').forEach(el => {
        const iconName = el.getAttribute('data-lucide');
        if (SVG_ICONS[iconName]) {
            el.outerHTML = SVG_ICONS[iconName];
        }
    });
}

function switchScreen(id) {
    if (isUpdateRequired && id !== 'updateScreen') {
        return; // Lock on update screen
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const t = $(id);
    if (t) {
        t.classList.add('active');
        reinitIcons();
    }
}

// ── Version Helpers ──────────────────────────────────────
function getExtensionVersion() {
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
            const manifest = chrome.runtime.getManifest();
            return manifest.version || '2.0.5';
        }
    } catch (e) {}
    return '2.0.5';
}

function compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const p1 = v1.toString().replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = v2.toString().replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(p1.length, p2.length);
    for (let i = 0; i < len; i++) {
        const a = p1[i] || 0;
        const b = p2[i] || 0;
        if (a < b) return -1;
        if (a > b) return 1;
    }
    return 0;
}

function isVersionOutdated(currentVer, latestVer) {
    if (!latestVer) return false;
    return compareVersions(currentVer, latestVer) < 0;
}

function showUpdateScreen(currentVer, latestVer, downloadUrl) {
    isUpdateRequired = true;
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
    }

    const curVer = currentVer || getExtensionVersion();
    const latVer = latestVer || '2.0.0';

    const curVerEl = $('updateCurrentVer');
    const latVerEl = $('updateLatestVer');
    const descEl   = $('updateScreenDesc');
    const btnText  = $('updateDownloadBtnText');

    if (curVerEl) curVerEl.textContent = `v${curVer}`;
    if (latVerEl) latVerEl.textContent = `v${latVer}`;
    if (descEl) {
        descEl.innerHTML = `Versi ekstensi yang Anda gunakan (<strong>v${curVer}</strong>) sudah kadaluarsa. Harap unduh dan pasang versi terbaru (<strong>v${latVer}</strong>) untuk dapat melanjutkan akses akun &amp; layanan.`;
    }
    if (btnText) {
        btnText.textContent = `Download Ekstensi Terbaru (v${latVer})`;
    }

    switchScreen('updateScreen');
}

function showToast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const spin = btn.querySelector('.btn-spin');
    if (!text) return;
    if (loading) {
        text.style.display = 'none';
        if (spin) spin.style.display = '';
        btn.disabled = true;
    } else {
        text.style.display = '';
        if (spin) spin.style.display = 'none';
        btn.disabled = false;
    }
}

function showError(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = '';
}

function hideError(id) {
    const el = $(id);
    if (el) el.style.display = 'none';
}

// ── Device ID ────────────────────────────────────────────
async function getDeviceId() {
    const stored = await chrome.storage.local.get('device_id');
    if (stored.device_id) return stored.device_id;
    const id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    await chrome.storage.local.set({ device_id: id });
    return id;
}

// ── Sanitization Helper (Anti-XSS) ──────────────────────
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── API ──────────────────────────────────────────────────
async function apiCall(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
    const stored = await chrome.storage.local.get(['auth_token']);
    if (stored.auth_token) {
        opts.headers['Authorization'] = `Bearer ${stored.auth_token}`;
    }
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (res.status === 401 && path !== '/login') {
        await chrome.storage.local.remove(['auth_token', 'user_email', 'user_items', 'user_expires_at', 'user_days_left', 'user_locked']);
        currentUser = null;
        websiteItems = [];
        switchScreen('loginScreen');
        showError('loginError', 'Sesi telah berakhir atau tidak valid. Silakan login kembali.');
        return { status: false, error_code: 'SESSION_INVALID' };
    }
    return await res.json();
}

// ── Public Settings / Brand ──────────────────────────────
async function loadPublicSettings() {
    try {
        publicSettings = await apiCall('GET', '/settings/public');
        applyBrand();

        if (publicSettings.whatsapp_number) {
            const waNum = publicSettings.whatsapp_number.replace(/\D/g, '');
            const waLink = `https://wa.me/${waNum}`;
            const contactSection = $('contactSection');
            const contactLink    = $('contactLink');
            const contactText    = $('contactText');
            if (contactSection) show(contactSection);
            if (contactLink) contactLink.href = waLink;
            if (contactText && publicSettings.contact_message) contactText.textContent = publicSettings.contact_message;

            const footerWa = $('footerWaBtn');
            if (footerWa) {
                footerWa.href = waLink;
                footerWa.style.display = 'inline-flex';
            }
        }

        const dashboardUrl = `${WEB_BASE}/akun`;
        const dashLoginBtn = $('openDashboardLogin');
        if (dashLoginBtn) dashLoginBtn.href = dashboardUrl;
    } catch (e) {
        console.log('[HitShare] Could not load public settings:', e);
    }
}

function applyBrand() {
    if (publicSettings.logo_url) {
        const logoUrl = publicSettings.logo_url.startsWith('http')
            ? publicSettings.logo_url
            : API_BASE.replace('/api', '') + publicSettings.logo_url;

        ['loginLogo', 'mainLogo'].forEach(id => {
            const el = $(id);
            if (!el || el.querySelector('img')) return;
            el.innerHTML = '';
            const img = document.createElement('img');
            img.src = logoUrl;
            img.alt = 'Logo';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
            el.appendChild(img);
        });
    }

    if (publicSettings.site_name) {
        [$('loginBrandName'), $('mainBrandName')].forEach(el => {
            if (el) el.textContent = publicSettings.site_name;
        });
        document.title = publicSettings.site_name;

        const pendDesc = document.querySelector('#pendingScreen .state-desc');
        if (pendDesc) pendDesc.textContent = `Akun Anda sedang menunggu aktivasi. Lakukan pembayaran untuk mulai menggunakan ${publicSettings.site_name}.`;
    }
}

// ── Init ─────────────────────────────────────────────────
async function init() {
    await loadPublicSettings();

    const curVer = getExtensionVersion();
    const reqVer = publicSettings.extension_version;

    if (reqVer && isVersionOutdated(curVer, reqVer)) {
        showUpdateScreen(curVer, reqVer, publicSettings.extension_download_url);
        return;
    }

    const stored = await chrome.storage.local.get(['user_email', 'user_items', 'user_expires_at', 'user_days_left', 'user_locked', 'synced_at']);

    if (stored.user_email && (stored.user_items || stored.user_locked)) {
        currentUser  = stored.user_email;
        isLocked     = stored.user_locked === true;
        websiteItems = isLocked ? [] : (stored.user_items || []);
        await loadPublicSettings();
        showMainScreen();

        const lastSync = stored.synced_at ? new Date(stored.synced_at) : null;
        const isStale  = !lastSync || (Date.now() - lastSync.getTime() > SYNC_STALE_MS);
        if (isStale) syncData(true);

        syncTimer = setInterval(() => syncData(true), SYNC_INTERVAL_MS);
    } else {
        await loadPublicSettings();
        switchScreen('loginScreen');
    }
}

// ── Sync ─────────────────────────────────────────────────
async function syncData(silent = false) {
    try {
        const stored = await chrome.storage.local.get(['user_email', 'device_id']);
        if (!stored.user_email) return;

        const deviceId = await getDeviceId();
        const curVer = getExtensionVersion();
        const data = await apiCall('POST', '/sync', { email: stored.user_email, deviceId, version: curVer });

        if (data.error_code === 'UPDATE_REQUIRED') {
            showUpdateScreen(data.current_version || curVer, data.latest_version, data.download_url);
            return;
        }

        if (data.extension_version && isVersionOutdated(curVer, data.extension_version)) {
            showUpdateScreen(curVer, data.extension_version, data.download_url);
            return;
        }

        if (data.status) {
            isLocked = data.locked === true;
            await chrome.storage.local.set({
                user_items: data.items || [],
                user_expires_at: data.expires_at || null,
                user_days_left: data.days_left,
                user_locked: isLocked,
                synced_at: data.synced_at
            });

            if (isLocked) {
                websiteItems = [];
                if ($('mainScreen')?.classList.contains('active')) {
                    applyFilters();
                    updateExpiryBadge(data.days_left, data.expires_at);
                    showLockOverlay(data.expires_at);
                } else {
                    showMainScreen();
                }
            } else {
                websiteItems = data.items || [];
                hideLockOverlay();
                if ($('mainScreen')?.classList.contains('active')) {
                    renderCategoryTabs();
                    applyFilters();
                    updateExpiryBadge(data.days_left, data.expires_at);
                }
                if (!silent) showToast('Data berhasil diperbarui');
            }
        } else {
            if (!silent) showToast(data.html || 'Sesi berakhir, silakan login ulang', 'error');
            if (data.error_code === 'DEVICE_MISMATCH' || data.error_code === 'SESSION_INVALID') {
                await handleLogout();
            }
        }
    } catch (e) {
        if (!silent) showToast('Gagal sync data', 'error');
    }
}

// ── Expiry Badge / Pill ───────────────────────────────────
function updateExpiryBadge(daysLeft, expiresAt) {
    const badge = $('expiryBadge');
    if (!badge) return;

    if (daysLeft === null || daysLeft === undefined) {
        badge.style.display = 'none';
        return;
    }

    const wrap = badge.parentElement;

    if (daysLeft <= 0) {
        if (wrap && wrap.classList.contains('expiry-wrap')) wrap.style.display = 'block';
        badge.style.display = 'block';
        badge.innerHTML = `
            <div class="expiry-pill ep-danger">
                <div class="ep-left">
                    <span class="ep-dot"></span>
                    <span class="ep-status">EXPIRED</span>
                </div>
                <div class="ep-right">
                    <span>Perpanjang Sekarang →</span>
                </div>
            </div>`;
        badge.onclick = () => chrome.tabs.create({ url: `${WEB_BASE}/akun` });
    } else if (daysLeft <= 3) {
        if (wrap && wrap.classList.contains('expiry-wrap')) wrap.style.display = 'block';
        badge.style.display = 'block';
        badge.innerHTML = `
            <div class="expiry-pill ep-warn">
                <div class="ep-left">
                    <span class="ep-dot"></span>
                    <span class="ep-status">SEGERA HABIS</span>
                </div>
                <div class="ep-right">
                    <span>${daysLeft} hari lagi • Perpanjang →</span>
                </div>
            </div>`;
        badge.onclick = () => chrome.tabs.create({ url: `${WEB_BASE}/akun` });
    } else {
        badge.style.display = 'none';
        badge.innerHTML = '';
        const wrap = badge.parentElement;
        if (wrap && wrap.classList.contains('expiry-wrap')) wrap.style.display = 'none';
    }
}

// ── Login ─────────────────────────────────────────────────
async function handleLogin() {
    const email    = $('loginEmail').value.trim();
    const password = $('loginPassword').value;

    if (!email || !password) {
        showError('loginError', 'Masukkan email dan password');
        return;
    }

    const btn = $('loginBtn');
    setLoading(btn, true);
    hideError('loginError');

    try {
        const deviceId = await getDeviceId();
        const curVer = getExtensionVersion();
        const data = await apiCall('POST', '/login', { email, password, deviceId, version: curVer });

        if (data.error_code === 'UPDATE_REQUIRED') {
            showUpdateScreen(data.current_version || curVer, data.latest_version, data.download_url);
            return;
        }

        if (data.status) {
            if (data.extension_version && isVersionOutdated(curVer, data.extension_version)) {
                showUpdateScreen(curVer, data.extension_version, data.download_url);
                return;
            }

            currentUser  = email;
            isLocked     = data.locked === true;
            websiteItems = data.locked ? [] : (data.items || []);

            await chrome.storage.local.set({
                auth_token:      data.token || null,
                user_email:      email,
                user_items:      websiteItems,
                user_expires_at: data.expires_at || null,
                user_days_left:  data.days_left,
                user_locked:     isLocked,
                synced_at:       data.synced_at
            });

            showMainScreen();
        } else {
            if (data.error_code === 'ACCOUNT_EXPIRED') {
                await chrome.storage.local.set({
                    auth_token: data.token || null,
                    user_email: email
                });
                showExpiredScreen(data.expires_at || null);
            } else if (data.error_code === 'ACCOUNT_INACTIVE') {
                showError('loginError', 'Akun Anda dinonaktifkan oleh admin.');
            } else if (data.error_code === 'ACCOUNT_PENDING') {
                await chrome.storage.local.set({ user_email: email });
                switchScreen('pendingScreen');
            } else if (data.error_code === 'DEVICE_MISMATCH') {
                showError('loginError', data.html || 'Akun sedang terkunci di perangkat lain. Silakan buka Dashboard Web di bawah untuk reset perangkat.');
            } else {
                showError('loginError', data.html || data.error || data.message || 'Login gagal');
            }
        }
    } catch (e) {
        showError('loginError', 'Tidak dapat terhubung ke server');
    } finally {
        setLoading(btn, false);
    }
}

// ── Logout ────────────────────────────────────────────────
async function handleLogout() {
    if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
    await chrome.storage.local.remove(['auth_token', 'user_email', 'user_items', 'user_expires_at', 'user_days_left', 'user_locked', 'synced_at']);
    currentUser  = null;
    websiteItems = [];
    isLocked     = false;
    isUpdateRequired = false;
    const emailEl = $('loginEmail');
    const passEl  = $('loginPassword');
    if (emailEl) emailEl.value = '';
    if (passEl)  passEl.value  = '';
    await loadPublicSettings();
    switchScreen('loginScreen');
}

// ── Show Main Screen ──────────────────────────────────────
async function showMainScreen() {
    switchScreen('mainScreen');
    const emailEl = $('userEmail');
    if (emailEl) emailEl.textContent = currentUser || '';
    const statusEl = $('statusText');
    if (statusEl) { statusEl.textContent = 'Siap digunakan'; statusEl.className = 'status-txt'; }

    const stored = await chrome.storage.local.get(['user_days_left', 'user_expires_at', 'user_locked', 'pinned_websites']);
    updateExpiryBadge(stored.user_days_left, stored.user_expires_at);
    pinnedWebsites = stored.pinned_websites || [];

    if (stored.user_locked || isLocked) {
        isLocked = true;
        renderWebsiteList([]);
        showLockOverlay(stored.user_expires_at);
    } else {
        hideLockOverlay();
        renderCategoryTabs();
        applyFilters();
    }
}

// ── Lock Overlay ──────────────────────────────────────────
function showLockOverlay(expiresAt) {
    const overlay = $('lockOverlay');
    if (!overlay) return;

    const descEl = $('lockDesc');
    if (descEl && expiresAt) {
        const expDate = new Date(expiresAt);
        const daysAgo = Math.floor((Date.now() - expDate.getTime()) / 86400000);
        const dateStr = expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        descEl.textContent = daysAgo <= 0
            ? `Masa aktif akun Anda berakhir pada ${dateStr}.`
            : `Masa aktif akun Anda berakhir sejak ${dateStr} (${daysAgo} hari lalu).`;
    }

    if (publicSettings.whatsapp_number) {
        const waNum = publicSettings.whatsapp_number.replace(/\D/g, '');
        const waBtn = $('lockWaBtn');
        if (waBtn) {
            chrome.storage.local.get('user_email').then(stored => {
                const msg = encodeURIComponent(`Halo, saya ingin memperpanjang akun HitShare saya (${stored.user_email || ''})`);
                waBtn.href = `https://wa.me/${waNum}?text=${msg}`;
                waBtn.style.display = '';
            });
        }
    }

    overlay.style.display = 'flex';
}

function hideLockOverlay() {
    const overlay = $('lockOverlay');
    if (overlay) overlay.style.display = 'none';
    isLocked = false;
}

// ── Category Tabs (Carousel) ──────────────────────────────
function renderCategoryTabs() {
    const tabsContainer = $('categoryTabs');
    if (!tabsContainer) return;

    if (!websiteItems || websiteItems.length === 0) {
        tabsContainer.innerHTML = '';
        return;
    }

    // Extract unique categories and their icons
    const catMap = {};
    websiteItems.forEach(item => {
        const cat = item.category || 'Lainnya';
        if (!catMap[cat]) {
            catMap[cat] = {
                name: cat,
                icon: item.categoryIcon || ''
            };
        }
    });

    const categoryNames = Object.keys(catMap);

    let html = `
        <button class="cat-chip ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
            <span class="cat-chip-icon">${getCategoryIcon('all')}</span>
            <span>Semua</span>
        </button>
    `;

    categoryNames.forEach(cat => {
        const safeCat = escapeHtml(cat);
        const iconSvg = getCategoryIcon(cat, catMap[cat].icon);
        html += `
            <button class="cat-chip ${activeCategory === cat ? 'active' : ''}" data-cat="${safeCat}">
                <span class="cat-chip-icon">${iconSvg}</span>
                <span>${safeCat}</span>
            </button>
        `;
    });

    tabsContainer.innerHTML = html;

    // Attach click events
    tabsContainer.querySelectorAll('.cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            applyFilters();
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });
}

// ── Render Skeleton List (6-col Grid) ─────────────────────
function renderSkeletonList() {
    const container = $('websiteList');
    if (!container) return;
    let skeletonItems = '';
    for (let i = 0; i < 18; i++) {
        skeletonItems += `
            <div class="skeleton-app-item">
                <div class="skeleton skeleton-app-icon"></div>
                <div class="skeleton skeleton-text" style="width:48px; height:9px; margin:0 auto"></div>
            </div>
        `;
    }
    container.innerHTML = `<div class="app-grid">${skeletonItems}</div>`;
}

// ── Filter and Search Controller ──────────────────────────
function applyFilters() {
    const query = $('searchInput') ? $('searchInput').value.toLowerCase().trim() : '';
    const clearBtn = $('searchClearBtn');
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    let filtered = [...websiteItems];

    // Filter by category
    if (activeCategory !== 'all') {
        filtered = filtered.filter(item => (item.category || 'Lainnya') === activeCategory);
    }

    // Filter by search query
    if (query) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.url && item.url.toLowerCase().includes(query))
        );
    }

    renderWebsiteList(filtered);
}

// ── Render Website List (6-Column App Grid) ───────────────
function renderWebsiteList(items) {
    const container = $('websiteList');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="list-empty">
                <div class="list-empty-icon">
                    ${getIconSvg('globe')}
                </div>
                <p>Tidak ada website yang ditemukan</p>
            </div>`;
        const webCountEl = $('websiteCount');
        if (webCountEl) webCountEl.textContent = '0 website';
        return;
    }

    // Sort: pinned items first
    const sorted = [...items].sort((a, b) => {
        const aPinned = pinnedWebsites.includes(a.name) ? 1 : 0;
        const bPinned = pinnedWebsites.includes(b.name) ? 1 : 0;
        return bPinned - aPinned;
    });

    const itemsHtml = sorted.map(item => {
        const hasAccounts = item.accounts && item.accounts.length > 0;
        const count = hasAccounts ? item.accounts.length : 0;
        const isPinned = pinnedWebsites.includes(item.name);
        const safeName = escapeHtml(item.name);
        const safeInitial = escapeHtml(item.name ? item.name.charAt(0) : '?');

        const iconSrc = resolveIconUrl(item.icon);
        const logoHtml = isImageIcon(item.icon)
            ? `<img src="${iconSrc}" class="app-icon-img" alt="">`
            : `<span class="app-icon-fb">${item.icon && item.icon.length <= 4 ? escapeHtml(item.icon) : safeInitial}</span>`;

        return `
        <div class="app-item ${!hasAccounts ? 'app-item--empty' : ''}" data-name="${safeName}">
            <div class="app-icon-wrap">
                ${logoHtml}
                ${count > 1 ? `<span class="app-badge-count">${count}</span>` : ''}
                ${count === 0 ? `<span class="app-badge-empty" title="Belum ada akun">!</span>` : ''}
                <button class="app-pin-btn ${isPinned ? 'pinned' : ''}" data-name="${safeName}" title="${isPinned ? 'Hapus Favorit' : 'Jadikan Favorit'}">★</button>
            </div>
            <span class="app-name" title="${safeName}">${safeName}</span>
        </div>`;
    }).join('');

    container.innerHTML = `<div class="app-grid">${itemsHtml}</div>`;
    const webCountEl = $('websiteCount');
    if (webCountEl) webCountEl.textContent = `${items.length} website`;

    // Click handler for apps
    container.querySelectorAll('.app-item').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.app-pin-btn')) return;
            const name = card.dataset.name;
            const item = items.find(i => i.name === name);
            if (!item) return;

            if (!item.accounts || item.accounts.length === 0) {
                showToast('Belum ada akun untuk website ini', 'error');
                return;
            }

            if (item.accounts.length === 1) {
                handleAccountClick(item, item.accounts[0], card);
            } else {
                showAccountScreen(item);
            }
        });
    });

    // Pin handlers
    container.querySelectorAll('.app-pin-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const name = btn.dataset.name;
            if (pinnedWebsites.includes(name)) {
                pinnedWebsites = pinnedWebsites.filter(n => n !== name);
            } else {
                pinnedWebsites = [name, ...pinnedWebsites];
            }
            await chrome.storage.local.set({ pinned_websites: pinnedWebsites });
            applyFilters();
        });
    });
}

// ── Account Screen (Multi-akun) ───────────────────────────
function showAccountScreen(item) {
    const icoEl  = $('acctScreenIco');
    const nameEl = $('acctScreenName');
    const subEl  = $('acctScreenSub');
    const list   = $('acctScreenGrid');

    if (icoEl) {
        const iconSrc = resolveIconUrl(item.icon);
        icoEl.innerHTML = isImageIcon(item.icon)
            ? `<img src="${iconSrc}" onerror="this.parentElement.innerHTML='<span>${item.name.charAt(0)}</span>'" alt="">`
            : `<span>${item.icon && item.icon.length <= 4 ? item.icon : item.name.charAt(0)}</span>`;
    }
    if (nameEl) nameEl.textContent = item.name;
    if (subEl)  subEl.textContent  = `${item.accounts.length} akun siap digunakan`;

    if (list) {
        const iconSrc = resolveIconUrl(item.icon);
        const safeInitial = escapeHtml(item.name ? item.name.charAt(0).toUpperCase() : '?');
        const logoHtml = isImageIcon(item.icon)
            ? `<img src="${iconSrc}" class="app-icon-img" alt="">`
            : (item.icon && item.icon.length <= 4
                ? `<span class="app-icon-fb">${escapeHtml(item.icon)}</span>`
                : `<div class="acct-key-fb">${getIconSvg('key')}</div>`);

        list.innerHTML = item.accounts.map((acc, i) => {
            const hasCookie = acc.value && acc.value !== '[]';
            const safeLabel = escapeHtml(acc.label || 'Akun ' + (i + 1));
            return `
            <div class="acct-item ${!hasCookie ? 'empty' : ''}" data-idx="${i}" title="${safeLabel}">
                <div class="app-icon-wrap">
                    ${logoHtml}
                </div>
                <span class="acct-item-name">${safeLabel}</span>
            </div>`;
        }).join('');

        list.querySelectorAll('.acct-item').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.idx);
                const acc = item.accounts[idx];
                if (!acc) return;
                handleAccountClick(item, acc, card);
            });
        });
    }

    switchScreen('accountScreen');
}

// ── Cookie Injection ──────────────────────────────────────
async function handleAccountClick(item, account, el) {
    if (!account.value || account.value === '[]') {
        showToast('Cookie belum tersedia untuk akun ini', 'error');
        return;
    }

    let cookies;
    try { cookies = typeof account.value === 'string' ? JSON.parse(account.value) : account.value; }
    catch (e) { showToast('Format cookie tidak valid', 'error'); return; }

    if (!Array.isArray(cookies) || cookies.length === 0) {
        showToast('Tidak ada cookie untuk di-inject', 'error');
        return;
    }

    if (el) el.classList.add('injecting');
    const statusEl = $('statusText');
    if (statusEl) { statusEl.textContent = `Mengakses ${item.name}...`; statusEl.className = 'status-txt active'; }

    try {
        const result = await chrome.runtime.sendMessage({ action: 'injectCookies', cookies, url: item.url, name: item.name });
        if (result && result.success) {
            if (el) { el.classList.remove('injecting'); el.classList.add('success'); }
            showToast(`${item.name} — ${account.label || 'Akun'} berhasil dibuka!`);

            const stored = await chrome.storage.local.get('user_email');
            apiCall('POST', '/track-click', { email: stored.user_email || '', websiteName: item.name, websiteUrl: item.url }).catch(() => {});

            setTimeout(() => {
                if (el) { el.classList.remove('success'); el.classList.remove('injecting'); }
                if (statusEl) { statusEl.textContent = 'Siap digunakan'; statusEl.className = 'status-txt'; }
                showMainScreen();
            }, 1400);
        } else {
            throw new Error(result?.error || 'Gagal inject cookie');
        }
    } catch (e) {
        if (el) { el.classList.remove('injecting'); el.classList.add('error'); }
        if (statusEl) statusEl.textContent = `Gagal: ${e.message}`;
        showToast(e.message || 'Gagal mengakses website', 'error');
        setTimeout(() => {
            if (el) el.classList.remove('error');
            if (statusEl) { statusEl.textContent = 'Siap digunakan'; statusEl.className = 'status-txt'; }
        }, 3000);
    }
}

// ── Search Handling ───────────────────────────────────────
function handleSearch() {
    applyFilters();
}

// ── Expired Screen ────────────────────────────────────────
async function showExpiredScreen(expiresAt) {
    switchScreen('expiredScreen');

    const infoEl = $('expInfo');
    if (infoEl && expiresAt) {
        const expDate = new Date(expiresAt);
        const daysAgo = Math.floor((Date.now() - expDate.getTime()) / 86400000);
        infoEl.textContent = `Kadaluwarsa sejak ${expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysAgo} hari lalu)`;
        infoEl.style.display = '';
    } else if (infoEl) {
        infoEl.style.display = 'none';
    }

    const dashUrl = `${WEB_BASE}/akun`;
    const dashBtn = $('expDashboardBtn');
    if (dashBtn) {
        dashBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: dashUrl });
        });
    }

    try {
        const settings = await apiCall('GET', '/settings/public');
        if (settings.whatsapp_number) {
            const stored = await chrome.storage.local.get('user_email');
            const waNum = settings.whatsapp_number.replace(/\D/g, '');
            const msg = encodeURIComponent(`Halo, saya ingin memperpanjang akun HitShare saya (${stored.user_email || ''})`);
            const waBtn = $('expWaBtn');
            if (waBtn) { waBtn.href = `https://wa.me/${waNum}?text=${msg}`; waBtn.style.display = ''; }
        }
    } catch (e) { /* abaikan */ }
}

// ── Profile Screen ────────────────────────────────────────
async function showProfileScreen() {
    switchScreen('profileScreen');

    const stored = await chrome.storage.local.get(['user_email', 'user_expires_at', 'user_days_left', 'user_items', 'synced_at']);
    const days = stored.user_days_left;

    $('profileEmail').textContent = stored.user_email || '-';

    // Status badge
    const badge = $('profileStatusBadge');
    if (days === null || days === undefined) {
        badge.textContent = 'Tidak Terbatas';
        badge.className = 'status-badge sb-ok';
    } else if (days <= 0) {
        badge.textContent = 'Expired';
        badge.className = 'status-badge sb-danger';
    } else if (days <= 3) {
        badge.textContent = 'Segera Expired';
        badge.className = 'status-badge sb-warn';
    } else {
        badge.textContent = 'Aktif';
        badge.className = 'status-badge sb-ok';
    }

    // Expiry date
    if (stored.user_expires_at) {
        const expDate = new Date(stored.user_expires_at);
        $('profileExpiry').textContent = expDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
        $('profileExpiry').textContent = 'Tidak Terbatas';
    }

    // Days left
    if (days !== null && days !== undefined) {
        $('profileDaysLeft').textContent = days <= 0 ? 'Sudah expired' : `${days} hari`;
    } else {
        $('profileDaysLeft').textContent = '∞';
    }

    // Website count
    const webCount = stored.user_items ? stored.user_items.length : 0;
    $('profileWebCount').textContent = `${webCount} website`;

    // Last sync
    if (stored.synced_at) {
        const syncDate = new Date(stored.synced_at);
        const diffMin = Math.floor((Date.now() - syncDate.getTime()) / 60000);
        if (diffMin < 1) $('profileLastSync').textContent = 'Baru saja';
        else if (diffMin < 60) $('profileLastSync').textContent = `${diffMin} mnt lalu`;
        else $('profileLastSync').textContent = syncDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else {
        $('profileLastSync').textContent = '-';
    }

    // Progress bar
    if (stored.user_expires_at && days !== null) {
        show($('profileProgressSection'));
        const totalDays = Math.max(days, 30);
        const pct = Math.max(0, Math.min(100, (days / totalDays) * 100));
        const fill = $('profileProgressFill');
        fill.style.width = `${pct}%`;
        fill.style.background = days <= 3 ? 'var(--danger)' : days <= 7 ? 'var(--warn)' : 'var(--accent)';
        $('profileProgressText').textContent = `${days} hari tersisa`;
    } else {
        hide($('profileProgressSection'));
    }

    // Contact WA
    if (publicSettings.whatsapp_number) {
        const waNum = publicSettings.whatsapp_number.replace(/\D/g, '');
        show($('profileContactSection'));
        $('profileContactLink').href = `https://wa.me/${waNum}`;
        if (publicSettings.contact_message) {
            $('profileContactText').textContent = publicSettings.contact_message;
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // ── LOGIN ────────────────────────────────────────────
    const loginBtn  = $('loginBtn');
    const loginPass = $('loginPassword');
    const loginEmail= $('loginEmail');
    const toggleBtn = $('togglePass');
    const eyeIcon   = $('eyeIcon');

    if (loginBtn)   loginBtn.addEventListener('click', handleLogin);
    if (loginPass)  loginPass.addEventListener('keydown', e => e.key === 'Enter' && handleLogin());
    if (loginEmail) loginEmail.addEventListener('keydown', e => e.key === 'Enter' && loginPass?.focus());

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (!loginPass) return;
            const isHidden = loginPass.type === 'password';
            loginPass.type = isHidden ? 'text' : 'password';
            if (eyeIcon) {
                eyeIcon.innerHTML = isHidden ? getIconSvg('eye-off') : getIconSvg('eye');
            }
        });
    }

    // ── REGISTER (open landing) ──────────────────────────
    const showRegisterBtn = $('showRegister');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${WEB_BASE}/daftar` });
        });
    }

    // ── DASHBOARD BUTTON ─────────────────────────────────
    const dashLoginBtn = $('openDashboardLogin');
    if (dashLoginBtn) {
        dashLoginBtn.addEventListener('click', e => {
            e.preventDefault();
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }

    // ── MAIN SCREEN ──────────────────────────────────────
    const logoutBtn  = $('logoutBtn');
    const profileBtn = $('profileBtn');
    const refreshBtn = $('refreshBtn');
    const searchInp  = $('searchInput');
    const searchClr  = $('searchClearBtn');

    if (logoutBtn)  logoutBtn.addEventListener('click', handleLogout);
    if (profileBtn) profileBtn.addEventListener('click', showProfileScreen);
    if (searchInp)  searchInp.addEventListener('input', handleSearch);

    if (searchClr) {
        searchClr.addEventListener('click', () => {
            if (searchInp) searchInp.value = '';
            handleSearch();
            searchInp?.focus();
        });
    }

    // Carousel navigation
    const catPrev = $('catPrevBtn');
    const catNext = $('catNextBtn');
    const tabsContainer = $('categoryTabs');

    if (catPrev && tabsContainer) {
        catPrev.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: -120, behavior: 'smooth' });
        });
    }
    if (catNext && tabsContainer) {
        catNext.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: 120, behavior: 'smooth' });
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.5';
            renderSkeletonList();
            await syncData(false);
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '';
        });
    }

    // ── ACCOUNT SCREEN ───────────────────────────────────
    const backToServices = $('backToServices');
    if (backToServices) backToServices.addEventListener('click', showMainScreen);

    // ── PROFILE ──────────────────────────────────────────
    const backFromProfile  = $('backFromProfile');
    const profileLogoutBtn = $('profileLogoutBtn');
    const dashProfileBtn   = $('openDashboardProfile');

    if (backFromProfile)  backFromProfile.addEventListener('click', showMainScreen);
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', handleLogout);
    if (dashProfileBtn) {
        dashProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }

    // ── EXPIRED SCREEN ───────────────────────────────────
    const expLogoutBtn = $('expLogoutBtn');
    if (expLogoutBtn) expLogoutBtn.addEventListener('click', handleLogout);

    // ── LOCK OVERLAY ─────────────────────────────────────
    const lockRenewBtn = $('lockRenewBtn');
    if (lockRenewBtn) {
        lockRenewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }

    const lockLogoutBtn = $('lockLogoutBtn');
    if (lockLogoutBtn) lockLogoutBtn.addEventListener('click', handleLogout);

    // ── PENDING SCREEN ───────────────────────────────────
    const pendActivateBtn = $('pendActivateBtn');
    const pendLogoutBtn   = $('pendLogoutBtn');

    if (pendActivateBtn) {
        pendActivateBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }
    if (pendLogoutBtn) pendLogoutBtn.addEventListener('click', handleLogout);
 
    // ── FOOTER / STATUSBAR ───────────────────────────────
    const footerDashBtn = $('footerDashBtn');
    if (footerDashBtn) {
        footerDashBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }

    const footerWaBtn = $('footerWaBtn');
    if (footerWaBtn) {
        footerWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (footerWaBtn.href && !footerWaBtn.href.endsWith('#')) {
                chrome.tabs.create({ url: footerWaBtn.href });
            }
        });
    }

    // ── UPDATE SCREEN ────────────────────────────────────
    const updateDownloadBtn = $('updateDownloadBtn');
    const updateGuideBtn    = $('updateGuideBtn');
    const updateLogoutBtn   = $('updateLogoutBtn');

    if (updateDownloadBtn) {
        updateDownloadBtn.addEventListener('click', () => {
            const downloadUrl = publicSettings.extension_download_url || '/downloads/extension.zip';
            const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${WEB_BASE}${downloadUrl}`;
            chrome.tabs.create({ url: fullUrl });
        });
    }

    if (updateGuideBtn) {
        updateGuideBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${WEB_BASE}/akun` });
        });
    }

    if (updateLogoutBtn) {
        updateLogoutBtn.addEventListener('click', handleLogout);
    }

    // ── START ────────────────────────────────────────────
    init();
});
