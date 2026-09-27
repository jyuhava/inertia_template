import { ref } from 'vue';
import { useUiStore } from '@/stores/ui';
import { copyToClipboard } from '@/utils/json';
import type { NormalizedError } from '@/utils/errors';
import { ApiError } from '@/api/http';

/**
 * useToast — pembungkus store UI untuk notifikasi standar.
 * Pesan error selalu manusiawi; detail teknis disimpan di `detail`
 * dan hanya tampil pada bagian yang dapat dibuka (expandable).
 */
export const useToast = () => {
    const ui = useUiStore();

    const success = (title: string, message?: string): string => ui.pushToast({ tone: 'success', title, message });

    const info = (title: string, message?: string): string => ui.pushToast({ tone: 'info', title, message });

    const warning = (title: string, message?: string): string => ui.pushToast({ tone: 'warning', title, message });

    const error = (title: string, normalized?: NormalizedError | Error | null): string => {
        if (normalized instanceof ApiError) {
            return ui.pushToast({
                tone: 'error',
                title,
                message: normalized.normalized.message,
                detail: normalized.normalized.detail,
                timeout: 9000,
            });
        }
        return ui.pushToast({
            tone: 'error',
            title,
            message: normalized instanceof Error ? normalized.message : 'Terjadi kesalahan yang tidak diketahui.',
            timeout: 9000,
        });
    };

    const plainError = (title: string, message: string, detail?: string | null): string =>
        ui.pushToast({ tone: 'error', title, message, detail: detail ?? null, timeout: 9000 });

    return { success, info, warning, error, plainError, dismiss: ui.removeToast, clear: ui.clearToasts };
};

/** useClipboard — salin ID/JSON ke papan klip dengan notifikasi. */
export const useClipboard = () => {
    const toast = useToast();
    const copied = ref<string | null>(null);

    const copy = async (value: string, label = 'Nilai'): Promise<void> => {
        const ok = await copyToClipboard(value);
        if (ok) {
            copied.value = value;
            toast.success(`${label} disalin`, value.length > 60 ? `${value.slice(0, 57)}…` : value);
            window.setTimeout(() => {
                copied.value = null;
            }, 1600);
            return;
        }
        toast.warning('Tidak dapat menyalin', 'Peramban menolak akses papan klip.');
    };

    return { copy, copied };
};

/** useDebounce — menunda eksekusi pencarian. */
export const useDebounce = (delayMs = 350) => {
    let timer: number | null = null;
    const run = (callback: () => void): void => {
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            callback();
            timer = null;
        }, delayMs);
    };
    const cancel = (): void => {
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
    };
    return { run, cancel };
};

/** useAsyncAction — mengelola status loading/error untuk satu aksi UI. */
export const useAsyncAction = () => {
    const loading = ref(false);
    const toast = useToast();

    const run = async <T>(action: () => Promise<T>, options: { errorTitle?: string; onSuccess?: (result: T) => void; onError?: (error: unknown) => void } = {}): Promise<T | null> => {
        loading.value = true;
        try {
            const result = await action();
            options.onSuccess?.(result);
            return result;
        } catch (caught) {
            toast.error(options.errorTitle ?? 'Aksi gagal', caught instanceof Error ? caught : null);
            options.onError?.(caught);
            return null;
        } finally {
            loading.value = false;
        }
    };

    return { loading, run };
};
