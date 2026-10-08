import { fileURLToPath, URL } from 'node:url';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Frontend standalone modul Integrator PDDikti / Neo Feeder.
 *
 * Modul ini SENGAJA terpisah dari build Vite utama SIAKAD:
 *  - tidak menyentuh resources/js, vite.config.js, atau package.json SIAKAD
 *  - dapat dijalankan/di-build sendiri dengan npm di dalam folder /integrator
 *  - di-deploy pada subdomain sendiri (mis. feeder.alwafi.ac.id)
 *
 * Base path diambil dari VITE_BASE_PATH di .env.local, sehingga build untuk
 * root subdomain ("/") maupun sub-path ("/feeder/") sama-sama bisa tanpa
 * mengubah kode.
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: env.VITE_BASE_PATH || '/integrator/',
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            port: 5174,
            host: true,
        },
        preview: {
            port: 4174,
            host: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            chunkSizeWarningLimit: 900,
            // Modul ini memakai Vue Router history mode, jadi server web
            // perlu aturan rewrite ke index.html agar F5 pada /dashboard,
            // /mapping/mahasiswa, dan sejenisnya tidak berakhir 404.
            // .htaccess tidak otomatis ikut ke dist/, jadi disalin manual.
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['vue', 'vue-router', 'pinia', 'axios'],
                    },
                },
            },
        },
        plugins: [
            vue(),
            {
                // Vite memproses <head> index.html sendiri, sehingga .htaccess
                // tidak ikut tercopy. Plugin kecil ini menutup celah itu supaya
                // hasil build selalu menyertakan berkas .htaccess.
                name: 'copy-htaccess',
                closeBundle() {
                    const outDir = resolvePath(__dirname, 'dist');
                    mkdirSync(outDir, { recursive: true });
                    copyFileSync(resolvePath(__dirname, 'public/.htaccess'), resolvePath(outDir, '.htaccess'));
                },
            },
        ],
    };
});
