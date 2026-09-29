import { fileURLToPath, URL } from 'node:url';
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
        plugins: [vue()],
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
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['vue', 'vue-router', 'pinia', 'axios'],
                    },
                },
            },
        },
    };
});
