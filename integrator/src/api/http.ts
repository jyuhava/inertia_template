import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '@/config/app.config';
import { normalizeError, type NormalizedError } from '@/utils/errors';
import { handleMockRequest } from './mock/handlers';
import { persistMockState, restoreMockState } from './mock/state';

/**
 * HTTP layer integrator.
 *
 * Semua komponen memanggil service, service memanggil lapisan ini, dan lapisan
 * ini yang berbicara dengan backend SIAKAD (`/api/integrator/*`).
 *
 * Saat `VITE_MOCK_MODE=true`, adapter axios diganti mock adapter sehingga
 * endpoint yang sama dilayani di browser tanpa backend. Kode service tidak
 * berubah sama sekali antara mode mock dan mode nyata.
 */

export class ApiError extends Error {
    normalized: NormalizedError;

    constructor(normalized: NormalizedError) {
        super(normalized.message);
        this.name = 'ApiError';
        this.normalized = normalized;
    }
}

const isMock = (): boolean => appConfig.mockMode;

/**
 * Token CSRF untuk request yang mengubah data (POST/PUT/PATCH/DELETE).
 *
 * Frontend integrator dapat dilayani pada subdomain yang berbeda dari domain
 * SIAKAD (mis. feeder.alwafi.ac.id). Cookie XSRF-TOKEN hanya bisa dibaca
 * JavaScript pada origin yang mengaturnya, jadi dari subdomain lain token
 * tersebut tidak bisa diambil lewat document.cookie. Karena itu token diambil
 * dari endpoint /csrf dalam bentuk JSON dan dikirim sebagai header
 * X-CSRF-TOKEN, yang oleh Laravel dibandingkan langsung dengan token sesi.
 *
 * Pada mock mode tidak ada backend sama sekali, sehingga token tidak pernah
 * diambil dan tidak ada header yang ditambahkan.
 */
let csrfToken: string | null = null;

export const getCsrfToken = (): string | null => csrfToken;

/** Mengambil (bila perlu) token CSRF dari backend. Aman dipanggil berulang. */
export const ensureCsrfToken = async (): Promise<string | null> => {
    if (isMock()) return null;
    if (csrfToken) return csrfToken;

    const response = await axios.get<{ token: string }>(
        `${appConfig.siakadApiUrl}${appConfig.integratorApiPrefix}/csrf`,
        { withCredentials: true, timeout: appConfig.requestTimeoutMs },
    );

    csrfToken = typeof response.data?.token === 'string' ? response.data.token : null;
    return csrfToken;
};

export const clearCsrfToken = (): void => {
    csrfToken = null;
};

const stripPrefix = (url: string): string => {
    const prefix = appConfig.integratorApiPrefix.replace(/\/+$/, '');
    let path = url;
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length);
    return path.replace(/^\/+/, '').split('?')[0] ?? '';
};

const parseBody = (data: unknown): Record<string, unknown> => {
    if (!data) return {};
    if (typeof data === 'string') {
        try {
            return JSON.parse(data) as Record<string, unknown>;
        } catch {
            return {};
        }
    }
    if (typeof data === 'object') return data as Record<string, unknown>;
    return {};
};

const mockAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? 'get').toLowerCase();
    const path = stripPrefix(config.url ?? '');
    const query: Record<string, string> = {};

    Object.entries((config.params ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        query[key] = String(value);
    });

    // latensi ringan agar skeleton/loading state teruji
    await new Promise((resolve) => setTimeout(resolve, 40 + Math.floor(Math.random() * 90)));

    const result = await handleMockRequest({ method, path, query, body: parseBody(config.data) });

    if (result.status >= 400) {
        const error = new Error(`Mock request gagal: ${result.status}`) as Error & { isAxiosError?: boolean; response?: unknown; config?: unknown; code?: string };
        error.isAxiosError = true;
        error.config = config;
        error.response = {
            status: result.status,
            statusText: 'Mock Error',
            data: result.data,
            headers: {},
            config,
        };
        throw error;
    }

    return {
        data: result.data,
        status: result.status,
        statusText: 'OK',
        headers: {},
        config,
    };
};

const createInstance = (baseURL: string): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        timeout: appConfig.requestTimeoutMs,
        withCredentials: true,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Integrator-Client': 'siakad-integrator/0.1',
        },
    });

    if (isMock()) {
        restoreMockState();
        instance.defaults.adapter = mockAdapter;
    }

    instance.interceptors.request.use(async (config) => {
        // Endpoint /csrf sendiri tidak butuh token, dan nighttime check:
        // setiap request yang mengubah data harus membawa X-CSRF-TOKEN.
        // Endpoint /csrf sendiri tidak butuh token, jadi cukup untuk setiap
        // request yang mengubah data.
        if (!isMock() && (config.method ?? 'get').toLowerCase() !== 'get') {
            const token = await ensureCsrfToken();
            if (token) config.headers.set('X-CSRF-TOKEN', token);
        }
        return config;
    });

    instance.interceptors.response.use(
        (response) => response,
        (error: unknown) => {
            // Sesi berakhir di server (mis. cookie kedaluwarsa): token CSRF
            // juga sudah tidak berlaku, jadi dibuang agar diambil ulang saat
            // operator login kembali.
            const status = (error as { response?: { status?: number } } | null)?.response?.status;
            if (status === 419) clearCsrfToken();
            return Promise.reject(error instanceof ApiError ? error : new ApiError(normalizeError(error)));
        },
    );

    return instance;
};

/** Instance untuk endpoint integrator pada backend SIAKAD. */
export const integratorHttp = createInstance(`${appConfig.siakadApiUrl}${appConfig.integratorApiPrefix}`);

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
    try {
        const response = await integratorHttp.request<T>(config);
        return response.data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(normalizeError(error));
    }
};

export const get = <T>(url: string, params?: Record<string, unknown>): Promise<T> => request<T>({ method: 'get', url, params });

export const post = <T>(url: string, data?: unknown): Promise<T> => request<T>({ method: 'post', url, data });

export const put = <T>(url: string, data?: unknown): Promise<T> => request<T>({ method: 'put', url, data });

export const patch = <T>(url: string, data?: unknown): Promise<T> => request<T>({ method: 'patch', url, data });

export const del = <T>(url: string, data?: unknown): Promise<T> => request<T>({ method: 'delete', url, data });

export const isMockMode = isMock;
