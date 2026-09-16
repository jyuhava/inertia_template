/**
 * Utilitas PWA: pendaftaran service worker + pengelolaan prompt "Pasang aplikasi".
 * Dipakai oleh app.jsx dan komponen PwaInstallPrompt.
 */

export const INSTALL_PROMPT_EVENT = 'siakad:install-available';
export const INSTALL_DISMISSED_KEY = 'siakad.pwa.install.dismissed';

let deferredPrompt = null;

export function isStandalone() {
    if (typeof window === 'undefined') return false;

    return (
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.matchMedia?.('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true
    );
}

export function isIos() {
    if (typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent || '';
    const iOSDevice = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);

    return iOSDevice && !window.MSStream;
}

export function wasInstallDismissed() {
    try {
        return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

export function dismissInstall() {
    try {
        window.localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    } catch {
        /* localStorage tidak tersedia — abaikan */
    }
}

export function getDeferredPrompt() {
    return deferredPrompt;
}

export async function promptInstall() {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;

    return choice?.outcome === 'accepted';
}

export function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            /* pendaftaran gagal (mis. mode privat) — aplikasi tetap berjalan normal */
        });
    });
}

export function initInstallPrompt() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_EVENT));
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        dismissInstall();
    });
}
