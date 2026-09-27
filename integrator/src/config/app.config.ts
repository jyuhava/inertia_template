/**
 * Konfigurasi aplikasi Integrator.
 *
 * Semua nilai yang berhubungan dengan kredensial berada DI BACKEND.
 * Frontend hanya mengetahui: base URL SIAKAD, prefix endpoint integrator,
 * mode mock, dan preferensi tampilan.
 */

const env = import.meta.env;

const bool = (value: string | undefined, fallback: boolean): boolean => {
    if (value === undefined || value === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const int = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const appConfig = {
    appName: env.VITE_APP_NAME || 'Integrator PDDikti',

    /** Base URL SIAKAD (backend penyedia API integrator). */
    siakadApiUrl: env.VITE_SIAKAD_API_URL || '',

    /** Prefix endpoint integrator pada backend SIAKAD. */
    integratorApiPrefix: env.VITE_INTEGRATOR_API_PREFIX || '/api/integrator',

    /** Mock mode: seluruh request dilayani mock adapter di browser. */
    mockMode: bool(env.VITE_MOCK_MODE, true),

    /** Simulasi latensi backend pada mock mode (ms). */
    mockLatencyMs: int(env.VITE_MOCK_LATENCY_MS, 320),

    /** Versi Neo Feeder default yang dipakai SchemaAdapter bila backend belum melaporkan versi. */
    defaultNeoFeederVersion: '3.0' as const,

    /** Jumlah baris per halaman default pada seluruh DataTable. */
    defaultPageSize: 25,

    /** Pilihan page size pada DataTable. */
    pageSizeOptions: [10, 25, 50, 100, 250],

    /** Interval polling job sinkronisasi (ms). */
    syncPollIntervalMs: 900,

    /** Batas jumlah item yang boleh dikirim dalam satu job sinkronisasi. */
    maxBulkItemsPerJob: 500,

    /** Timeout request HTTP ke backend SIAKAD (ms). */
    requestTimeoutMs: 120_000,

    /** Kunci localStorage yang diizinkan (tidak pernah berisi kredensial/token). */
    storageKeys: {
        uiPreferences: 'integrator.ui',
        filters: 'integrator.filters',
        recentPeriod: 'integrator.recent-period',
        docs: 'integrator.docs-expanded',
    },

    /**
     * Informasi untuk operator (bukan dipakai frontend):
     * Web Service Neo Feeder standar berjalan pada host:port yang sama dengan
     * aplikasi Neo Feeder, endpoint `ws/live2.php` atau `ws/live.php`.
     * Kredensial & token hanya boleh dikelola backend.
     */
    neoFeederReference: {
        defaultWebServicePath: 'ws/live2.php',
        defaultPort: 8082,
        docs: '/integrator/panduan',
    },
} as const;

export type AppConfig = typeof appConfig;
