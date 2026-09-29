import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { appConfig } from './config/app.config';
import { mockState } from './api/mock/state';
import './assets/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.config.errorHandler = (error, _instance, info) => {
    // Detail teknis tetap di console untuk penelusuran; UI menampilkan pesan manusiawi.
    console.error('[integrator] unhandled error', info, error);
};

/**
 * Debug hook (HANYA pada mock mode): memudahkan operator teknis memeriksa
 * state store dari console browser. Tidak pernah aktif pada mode nyata dan
 * tidak memuat kredensial apa pun.
 */
if (appConfig.mockMode) {
    (window as unknown as Record<string, unknown>).__integrator = {
        pinia,
        state: () => pinia.state.value,
        mock: mockState,
        version: '0.1',
    };
}

app.mount('#integrator-app');
