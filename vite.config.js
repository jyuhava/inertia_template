import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        dedupe: ['ckeditor5', '@ckeditor/ckeditor5-react'],
    },
    optimizeDeps: {
        include: ['ckeditor5'],
    },
    build: {
        commonjsOptions: {
            // Keep CKEditor support, but do not block other CJS packages
            // like react / qs that Inertia depends on during production build.
            include: [/node_modules/, /ckeditor5/],
        },
    },
});
