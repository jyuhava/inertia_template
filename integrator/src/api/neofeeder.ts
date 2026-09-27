import type { JsonObject } from '@/types/common';
import type { NeoFeederDictionaryResponse, NeoFeederEnvelope, NeoFeederResult } from '@/types/neofeeder';
import type { NeoFeederTransport } from '@/services/neofeeder/NeoFeederClient';
import { get, post } from './http';

/**
 * Endpoint Neo Feeder pada backend integrator.
 *
 * PENTING: frontend tidak pernah mengirim username/password/token.
 * Endpoint `/neofeeder/*` hanya menerima `act` + parameter, dan backend yang
 * menambahkan token ke envelope sebelum memanggil `ws/live2.php`.
 */
export const neofeederApi = {
    token: () => post<{ success: boolean; message: string; expiresAt: string | null; serverVersion: string | null }>('/neofeeder/token'),
    test: () => post<{ ok: boolean; message: string; latencyMs: number | null; serverVersion: string | null; apiStatus: string | null }>('/neofeeder/test'),
    call: (envelope: NeoFeederEnvelope) => post<NeoFeederResult<JsonObject[]>>('/neofeeder/call', envelope),
    dictionary: () => get<NeoFeederDictionaryResponse>('/neofeeder/dictionary'),
};

/** Transport yang dipakai NeoFeederClient (satu-satunya jalur ke Web Service). */
export const neoFeederTransport: NeoFeederTransport = {
    call: async (envelope) => neofeederApi.call(envelope),
    token: async () => {
        const response = await neofeederApi.token();
        return { status: response.success ? 'CONNECTED' : 'AUTHENTICATION_FAILED', expiresAt: response.expiresAt, serverVersion: response.serverVersion };
    },
    test: async () => neofeederApi.test(),
};
