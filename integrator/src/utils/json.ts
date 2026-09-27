import type { JsonObject, JsonValue } from '@/types/common';

const SENSITIVE_KEYS = ['token', 'password', 'passwd', 'secret', 'authorization', 'api_key', 'apikey', 'credential'];

export const TOKEN_PLACEHOLDER = '[HIDDEN]';

export const isSensitiveKey = (key: string): boolean =>
    SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive));

/** Sensor nilai sensitif (token/password) secara rekursif sebelum ditampilkan/di-export. */
export const maskSensitive = (value: JsonValue | undefined | null): JsonValue | null => {
    if (value === null || value === undefined) return null;

    if (Array.isArray(value)) {
        return value.map((item) => maskSensitive(item) ?? null);
    }

    if (typeof value === 'object') {
        const result: JsonObject = {};
        Object.entries(value as JsonObject).forEach(([key, item]) => {
            result[key] = isSensitiveKey(key) ? TOKEN_PLACEHOLDER : (maskSensitive(item) ?? null);
        });
        return result;
    }

    return value;
};

export const safeStringify = (value: unknown, space = 4): string => {
    try {
        return JSON.stringify(maskSensitive(value as JsonValue) ?? null, null, space);
    } catch {
        return String(value);
    }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
};

/** Ambil nilai string dari JSON mentah dengan aman. */
export const asString = (value: unknown, fallback = ''): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
};

export const asNumber = (value: unknown, fallback: number | null = null): number | null => {
    if (value === null || value === undefined || value === '') return fallback;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

export const asRecord = (value: unknown): JsonObject =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {};

export const stableHash = (input: string): number => {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};
