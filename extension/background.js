// ═══════════════════════════════════════════════════════════
//  HitShare Extension — background.js v2.0
//  Service Worker: Cookie injection handler
// ═══════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener(() => {
    console.log('[HitShare] Extension v2.0 installed.');
});

// ── Message Listener ──────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectCookies') {
        handleCookieInjection(message)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // keep message channel open for async response
    }
});

// ── Cookie Injection ──────────────────────────────────────
async function handleCookieInjection({ cookies, url, name }) {
    if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
        return { success: false, error: 'Tidak ada cookie untuk di-inject' };
    }
    if (!url) {
        return { success: false, error: 'URL website tidak tersedia' };
    }

    console.log(`[HitShare] Injecting ${cookies.length} cookies for ${name}...`);

    const now = Math.floor(Date.now() / 1000);
    const uniqueDomains = new Set();

    for (const cookie of cookies) {
        const domain = (cookie.domain || '').replace(/^\./, '');
        if (domain) uniqueDomains.add(domain);
    }

    // 1. Clear existing cookies for these domains
    for (const domain of uniqueDomains) {
        try {
            await clearAllCookiesForDomain(domain);
        } catch (e) {
            console.warn(`[HitShare] Could not clear cookies for ${domain}:`, e);
        }
    }

    // 2. Inject new cookies
    let successCount = 0;
    let errorCount   = 0;

    for (const cookie of cookies) {
        try {
            await setCookiePromise(cookie, now);
            successCount++;
        } catch (err) {
            errorCount++;
            console.warn(`[HitShare] Failed to set cookie "${cookie.name}":`, err);
        }
    }

    console.log(`[HitShare] Result: ${successCount} success, ${errorCount} failed`);

    if (successCount === 0) {
        return { success: false, error: `Gagal inject semua cookie (${errorCount} error)` };
    }

    // 3. Open tab with session protection against casual inspection (SEC-11)
    try {
        const tab = await chrome.tabs.create({ url, active: true });
        if (tab && tab.id && chrome.scripting) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: protectSession,
                    }).catch(() => {});
                }
            });
        }
    } catch (err) {
        console.warn('[HitShare] Failed to open tab:', err);
    }

    return { success: true, injected: successCount, failed: errorCount, total: cookies.length };
}

// ── Injected Security Helper (SEC-11) ─────────────────────
function protectSession() {
    try {
        // Disable context menu (inspect element)
        document.addEventListener('contextmenu', e => e.preventDefault(), true);

        // Block shortcut keys for DevTools and View Source
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 'I', 'J', 'C'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    } catch (e) {}
}

// ── Helpers ───────────────────────────────────────────────
function clearAllCookiesForDomain(domain) {
    return new Promise((resolve) => {
        chrome.cookies.getAll({ domain }, (cookies) => {
            if (!cookies || cookies.length === 0) { resolve(); return; }
            let removed = 0;
            cookies.forEach(c => {
                const cookieUrl = `http${c.secure ? 's' : ''}://${c.domain}${c.path}`;
                chrome.cookies.remove({ url: cookieUrl, name: c.name }, () => {
                    removed++;
                    if (removed === cookies.length) resolve();
                });
            });
        });
    });
}

function setCookiePromise(c, now) {
    return new Promise((resolve, reject) => {
        try {
            const rawDomain = (c.domain || '').replace(/^\./, '');
            const url = `https://${rawDomain}${c.path || '/'}`;

            const details = {
                url,
                name:           c.name,
                value:          c.value || '',
                path:           c.path || '/',
                secure:         !!c.secure,
                httpOnly:       !!c.httpOnly,
                sameSite:       normalizeSameSite(c.sameSite),
            };

            // Only pass domain if not hostOnly and domain exists (without leading dot!)
            if (!c.hostOnly && rawDomain) {
                details.domain = rawDomain;
            }

            // Expiration date: ensure it's in the future and not expired
            if (c.expirationDate && c.expirationDate > now) {
                details.expirationDate = c.expirationDate;
            } else if (!c.session) {
                details.expirationDate = now + (30 * 86400); // 30 days default
            }

            if (details.sameSite === 'no_restriction') {
                details.secure = true;
                details.url = details.url.replace('http://', 'https://');
            }

            chrome.cookies.set(details, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (result) {
                    resolve();
                } else {
                    reject(new Error('Cookie set returned null'));
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

function normalizeSameSite(sameSite) {
    if (!sameSite) return 'unspecified';
    const map = {
        no_restriction: 'no_restriction',
        none:           'no_restriction',
        lax:            'lax',
        strict:         'strict',
        unspecified:    'unspecified',
    };
    return map[sameSite.toLowerCase()] || 'unspecified';
}
