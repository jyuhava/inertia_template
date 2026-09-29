import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ConnectionProfile, ConnectionTestResult, NeoFeederConnectionStatus } from '@/types/integration';
import { siakadApi, type ConnectionResponse } from '@/api/siakad';
import { ApiError } from '@/api/http';

/**
 * connection store
 * ----------------
 * Status koneksi Neo Feeder + konfigurasi (tanpa kredensial).
 * Frontend hanya menerima STATUS dan metadata; password/token tetap di backend.
 */
export const useConnectionStore = defineStore('integrator/connection', () => {
    const profile = ref<ConnectionProfile | null>(null);
    const status = ref<NeoFeederConnectionStatus | null>(null);
    const token = ref<ConnectionResponse['token']>({ expiresAt: null, issuedAt: null, refreshesLast24h: 0 });
    const dictionary = ref<ConnectionResponse['dictionary']>({ synced: false, version: null, fetchedAt: null, actCount: 0 });
    const events = ref<ConnectionResponse['events']>([]);
    const retryPolicy = ref<ConnectionResponse['retryPolicy']>({ maxAttempts: 3, baseDelayMs: 800 });
    const lastTest = ref<ConnectionTestResult | null>(null);

    const loading = ref(false);
    const testing = ref(false);
    const authenticating = ref(false);
    const saving = ref(false);
    const syncingDictionary = ref(false);
    const error = ref<string | null>(null);

    const isConnected = computed(() => status.value?.status === 'CONNECTED');
    const statusLabel = computed(() => status.value?.status ?? 'DISCONNECTED');
    const serverVersion = computed(() => status.value?.serverVersion ?? '—');
    const tokenExpiry = computed(() => token.value.expiresAt);
    const dictionaryVerified = computed(() => dictionary.value.synced);

    const applyResponse = (response: ConnectionResponse): void => {
        profile.value = response.profile;
        status.value = response.status;
        token.value = response.token;
        dictionary.value = response.dictionary;
        events.value = response.events;
        retryPolicy.value = response.retryPolicy;
    };

    const fetch = async (): Promise<void> => {
        loading.value = true;
        error.value = null;
        try {
            applyResponse(await siakadApi.connection.get());
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memuat konfigurasi koneksi.';
        } finally {
            loading.value = false;
        }
    };

    const save = async (payload: { profile: Partial<ConnectionProfile>; password?: string }): Promise<boolean> => {
        saving.value = true;
        error.value = null;
        try {
            const response = await siakadApi.connection.save(payload);
            profile.value = response.profile;
            status.value = response.status;
            return true;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal menyimpan konfigurasi.';
            return false;
        } finally {
            saving.value = false;
        }
    };

    const test = async (): Promise<ConnectionTestResult | null> => {
        testing.value = true;
        error.value = null;
        try {
            lastTest.value = await siakadApi.connection.test();
            status.value = { ...(status.value ?? { lastConnectedAt: null, lastSuccessfulRequestAt: null, tokenExpiresAt: null, message: null, apiStatus: null, serverVersion: null, status: 'DISCONNECTED' }), status: lastTest.value.status };
            return lastTest.value;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Uji koneksi gagal.';
            return null;
        } finally {
            testing.value = false;
        }
    };

    const authenticate = async (): Promise<boolean> => {
        authenticating.value = true;
        error.value = null;
        try {
            const response = await siakadApi.connection.authenticate();
            await fetch();
            if (response.status !== 'CONNECTED') {
                error.value = response.message || 'Autentikasi Neo Feeder gagal.';
                return false;
            }
            return true;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Autentikasi gagal.';
            return false;
        } finally {
            authenticating.value = false;
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        authenticating.value = true;
        error.value = null;
        try {
            const response = await siakadApi.connection.refreshToken();
            if (response.status !== 'CONNECTED') {
                error.value = response.message || 'Refresh token Neo Feeder gagal.';
                return false;
            }
            token.value = { ...token.value, expiresAt: response.tokenExpiresAt };
            await fetch();
            return true;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal memperbarui token.';
            return false;
        } finally {
            authenticating.value = false;
        }
    };

    const syncDictionary = async (): Promise<boolean> => {
        syncingDictionary.value = true;
        error.value = null;
        try {
            const response = await siakadApi.connection.syncDictionary();
            dictionary.value = { synced: response.synced, version: response.version, fetchedAt: response.fetchedAt, actCount: response.actCount };
            if (!response.synced) {
                error.value = response.message || 'Dictionary Neo Feeder belum berhasil disinkronkan.';
                return false;
            }
            await fetch();
            return true;
        } catch (caught) {
            error.value = caught instanceof ApiError ? caught.normalized.message : 'Gagal mengambil dictionary Neo Feeder.';
            return false;
        } finally {
            syncingDictionary.value = false;
        }
    };

    return {
        profile,
        status,
        token,
        dictionary,
        events,
        retryPolicy,
        lastTest,
        loading,
        testing,
        authenticating,
        saving,
        syncingDictionary,
        error,
        isConnected,
        statusLabel,
        serverVersion,
        tokenExpiry,
        dictionaryVerified,
        fetch,
        save,
        test,
        authenticate,
        refreshToken,
        syncDictionary,
    };
});
