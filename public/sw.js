/* eslint-env serviceworker */
/**
 * Service Worker SIAKAD STIT Al Wafi
 * Strategi:
 *  - Navigasi (HTML): network-first → cache → halaman offline
 *  - Aset statis (build, ikon, gambar, font): stale-while-revalidate
 *  - Sisanya: langsung ke jaringan (data akademik selalu segar)
 */

const VERSION = 'v1';
const SHELL_CACHE = `siakad-shell-${VERSION}`;
const ASSET_CACHE = `siakad-asset-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith('siakad-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

const STATIC_DESTINATIONS = ['style', 'script', 'font', 'image'];

function isStaticAsset(url, request) {
    if (STATIC_DESTINATIONS.includes(request.destination)) {
        return true;
    }

    return /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot)$/i.test(url.pathname);
}

function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

async function networkFirstNavigation(request) {
    const cache = await caches.open(SHELL_CACHE);

    try {
        const response = await fetch(request);
        if (response && response.ok && request.method === 'GET') {
            cache.put(request, response.clone()).catch(() => undefined);
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) {
            return cached;
        }

        const offline = await cache.match(OFFLINE_URL);
        if (offline) {
            return offline;
        }

        return new Response('Anda sedang offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);

    const network = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
        })
        .catch(() => cached);

    return cached || network;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // Permintaan lintas-origin (mis. font/logo eksternal) dibiarkan ke jaringan.
    if (!isSameOrigin(url)) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    if (isStaticAsset(url, request)) {
        event.respondWith(staleWhileRevalidate(request));
    }
});
