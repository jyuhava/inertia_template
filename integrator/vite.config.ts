import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Frontend standalone modul Integrator PDDikti / Neo Feeder.
 *
 * Modul ini SENGAJA terpisah dari build Vite utama SIAKAD:
 *  - tidak menyentuh resources/js, vite.config.js, atau package.json SIAKAD
 *  - dapat dijalankan/di-build sendiri dengan npm di dalam folder /integrator
 *  - di-deploy pada sub-path /integrator (base di bawah ini)
 */
export default defineConfig({
    base: '/integrator/',
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
});
