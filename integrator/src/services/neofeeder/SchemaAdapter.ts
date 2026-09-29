import type { NeoFeederVersion, NeoFeederVersionAdapter } from '@/types/neofeeder';
import { appConfig } from '@/config/app.config';

/**
 * NeoFeederVersionAdapter
 * =======================
 * Struktur Web Service Neo Feeder dapat berubah antar versi. Agar perubahan
 * tersebut tidak menyebar ke seluruh komponen, seluruh penyesuaian dikumpulkan
 * di adapter ini:
 *
 *  - `minimumVersionByAct` : act yang baru tersedia sejak versi tertentu
 *  - `fieldOverrides`      : penyesuaian nama field per act
 *  - `requiredFields`      : field yang menjadi wajib pada versi tertentu
 *
 * Contoh nyata yang terdokumentasi: Neo Feeder 3.0 menjadikan nomor HP wajib
 * pada biodata mahasiswa dan menambahkan data NUPTK dosen; 3.1 menambahkan
 * kolom tanggal terbit ijazah pada data kelulusan.
 */

const adapters: Record<NeoFeederVersion, NeoFeederVersionAdapter> = {
    '2.0': {
        version: '2.0',
        label: 'Neo Feeder 2.0 (2022)',
        notes: 'Versi dasar dengan endpoint ws/live2.php. Belum ada kewajiban nomor HP pada biodata mahasiswa.',
        minimumVersionByAct: {},
        fieldOverrides: {},
        requiredFields: {},
    },
    '2.2': {
        version: '2.2',
        label: 'Neo Feeder 2.2',
        notes: 'Perbaikan WS UpdateNilaiPerkuliahanKelas (menghasilkan id_registrasi_mahasiswa dan id_kelas_kuliah).',
        minimumVersionByAct: {},
        fieldOverrides: {},
        requiredFields: {},
    },
    '3.0': {
        version: '3.0',
        label: 'Neo Feeder 3.0.x',
        notes: 'Nomor HP wajib pada biodata mahasiswa; penambahan referensi jenis pendaftaran & NUPTK dosen; ada alur baru mahasiswa masuk dan lulus/DO.',
        minimumVersionByAct: {
            GetJenisPendaftaran: '3.0',
            UpdateMahasiswaLulusDO: '3.0',
        },
        fieldOverrides: {},
        requiredFields: {
            InsertBiodataMahasiswa: ['nama_mahasiswa', 'jenis_kelamin', 'handphone'],
            UpdateBiodataMahasiswa: ['id_mahasiswa', 'nama_mahasiswa', 'jenis_kelamin', 'handphone'],
        },
    },
    '3.1': {
        version: '3.1',
        label: 'Neo Feeder 3.1',
        notes: 'Menambahkan kolom tanggal terbit ijazah pada data kelulusan serta aturan re-NIM/re-entry.',
        minimumVersionByAct: {
            GetJenisPendaftaran: '3.0',
            UpdateMahasiswaLulusDO: '3.0',
        },
        fieldOverrides: {
            InsertMahasiswaLulusDO: { nomor_ijazah: 'nomor_ijazah', tanggal_terbit_ijazah: 'tanggal_terbit_ijazah' },
        },
        requiredFields: {
            InsertBiodataMahasiswa: ['nama_mahasiswa', 'jenis_kelamin', 'handphone'],
            UpdateBiodataMahasiswa: ['id_mahasiswa', 'nama_mahasiswa', 'jenis_kelamin', 'handphone'],
        },
    },
};

export const neoFeederVersions = Object.values(adapters);

export const getVersionAdapter = (version?: string | null): NeoFeederVersionAdapter => {
    if (version && version in adapters) return adapters[version as NeoFeederVersion];
    return adapters[appConfig.defaultNeoFeederVersion as NeoFeederVersion];
};

const versionRank: Record<NeoFeederVersion, number> = { '2.0': 20, '2.2': 22, '3.0': 30, '3.1': 31 };

/** true bila act tersedia pada versi Neo Feeder terpasang. */
export const isActAvailable = (act: string, version?: string | null): boolean => {
    const adapter = getVersionAdapter(version);
    const minimum = adapter.minimumVersionByAct[act];
    if (!minimum) return true;
    return versionRank[adapter.version] >= versionRank[minimum];
};

/** Terapkan penyesuaian nama field versi tertentu pada record payload. */
export const applyFieldOverrides = (
    act: string,
    record: Record<string, unknown>,
    version?: string | null,
): { record: Record<string, unknown>; applied: { from: string; to: string }[] } => {
    const adapter = getVersionAdapter(version);
    const overrides = adapter.fieldOverrides[act];
    if (!overrides) return { record, applied: [] };

    const result: Record<string, unknown> = { ...record };
    const applied: { from: string; to: string }[] = [];

    Object.entries(overrides).forEach(([from, to]) => {
        if (from in result && from !== to) {
            result[to] = result[from];
            delete result[from];
            applied.push({ from, to });
        }
    });

    return { record: result, applied };
};

/** Field yang wajib pada versi versi terpasang (ditambahkan ke skema dasar). */
export const requiredFieldsFor = (act: string, version?: string | null): string[] => {
    const adapter = getVersionAdapter(version);
    return adapter.requiredFields[act] ?? [];
};

/** Field yang tidak dikenali versi terpasang (dipakai untuk peringatan di UI). */
export const filterFieldsForVersion = (
    act: string,
    fields: string[],
    dictionaryFields: string[] | null,
    version?: string | null,
): { accepted: string[]; rejected: string[] } => {
    if (!isActAvailable(act, version)) {
        return { accepted: [], rejected: fields };
    }
    if (!dictionaryFields || dictionaryFields.length === 0) {
        return { accepted: fields, rejected: [] };
    }
    const dictionary = new Set(dictionaryFields.map((field) => field.toLowerCase()));
    return {
        accepted: fields.filter((field) => dictionary.has(field.toLowerCase())),
        rejected: fields.filter((field) => !dictionary.has(field.toLowerCase())),
    };
};
