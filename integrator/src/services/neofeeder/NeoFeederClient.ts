import type { JsonObject } from '@/types/common';
import type { NeoFeederEnvelope, NeoFeederResult } from '@/types/neofeeder';
import { getActDefinition } from './ActRegistry';
import { isActAvailable } from './SchemaAdapter';

/**
 * NeoFeederClient
 * ===============
 * Klien tipis di atas endpoint backend (`/api/integrator/neofeeder/*`).
 *
 * Frontend TIDAK PERNAH memegang token/kredensial: seluruh request yang
 * membutuhkan secret dikirim melalui backend, dan backend menyisipkan token
 * ke envelope `{ act, token, record | filter | order | limit | offset }`.
 *
 * Raw response selalu disimpan agar operator dapat memeriksa apa yang benar
 * benar dikirim/diterima Neo Feeder (dengan token disensor).
 */

export interface NeoFeederTransport {
    call: (envelope: NeoFeederEnvelope, options?: { timeoutMs?: number }) => Promise<NeoFeederResult<JsonObject[]>>;
    token: () => Promise<{ status: string; expiresAt: string | null; serverVersion: string | null }>;
    test: () => Promise<{ ok: boolean; message: string; latencyMs: number | null; serverVersion: string | null; apiStatus: string | null }>;
}

export class NeoFeederClient {
    constructor(private readonly transport: NeoFeederTransport) {}

    async getToken(): Promise<{ status: string; expiresAt: string | null; serverVersion: string | null }> {
        return this.transport.token();
    }

    async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number | null; serverVersion: string | null; apiStatus: string | null }> {
        return this.transport.test();
    }

    /** Pemanggilan act generik — satu-satunya pintu ke Web Service. */
    async call(envelope: NeoFeederEnvelope): Promise<NeoFeederResult<JsonObject[]>> {
        const definition = getActDefinition(envelope.act);
        if (!definition) {
            return {
                success: false,
                code: -2,
                message: `Act "${envelope.act}" tidak terdaftar pada ActRegistry. Tambahkan definisinya terlebih dahulu.`,
                data: [],
                raw: {},
                act: envelope.act,
                requestId: 'local-registry',
                durationMs: 0,
                attempts: 0,
                httpStatus: null,
                mocked: false,
            };
        }

        if (!isActAvailable(envelope.act)) {
            return {
                success: false,
                code: -3,
                message: `Act "${envelope.act}" belum tersedia pada versi Neo Feeder yang terpasang.`,
                data: [],
                raw: {},
                act: envelope.act,
                requestId: 'local-version-guard',
                durationMs: 0,
                attempts: 0,
                httpStatus: null,
                mocked: false,
            };
        }

        return this.transport.call(envelope);
    }

    async getList(
        act: string,
        options: { filter?: string; order?: string; limit?: number; offset?: number } = {},
    ): Promise<NeoFeederResult<JsonObject[]>> {
        return this.call({ act, filter: options.filter ?? '', order: options.order ?? '', limit: options.limit, offset: options.offset });
    }

    async getDetail(act: string, keyField: string, keyValue: string): Promise<NeoFeederResult<JsonObject[]>> {
        return this.call({ act, filter: `${keyField} = '${keyValue}'`, limit: 1, offset: 0 });
    }

    async insert(act: string, record: JsonObject): Promise<NeoFeederResult<JsonObject[]>> {
        return this.call({ act, record });
    }

    async update(act: string, record: JsonObject): Promise<NeoFeederResult<JsonObject[]>> {
        return this.call({ act, record });
    }

    /** Mengirim banyak record secara berurutan (satu act per record). */
    async sync(act: string, records: JsonObject[], onProgress?: (index: number, total: number) => void): Promise<NeoFeederResult<JsonObject[]>[]> {
        const results: NeoFeederResult<JsonObject[]>[] = [];
        for (let index = 0; index < records.length; index += 1) {
            results.push(await this.insert(act, records[index]));
            onProgress?.(index + 1, records.length);
        }
        return results;
    }
}

/**
 * CATATAN: act delete tersedia pada Web Service (mis. DeleteKelasKuliah), tetapi
 * sesuai kebijakan modul ini operasi hapus TIDAK diekspos ke UI operator.
 * Fungsi delete sengaja tidak disediakan agar tidak ada data yang terhapus
 * dari PDDikti melalui integrator.
 */
export const FORBIDDEN_ACTS = ['DeleteBiodataMahasiswa', 'DeleteKelasKuliah', 'DeleteKurikulum', 'DeleteMataKuliah', 'DeletePesertaKelasKuliah'] as const;
