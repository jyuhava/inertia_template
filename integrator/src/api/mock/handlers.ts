import type { JsonObject } from '@/types/common';
import type {
    AutoMapResult,
    MappingCandidate,
    MappingRecord,
    MappingStats,
} from '@/types/mapping';
import type {
    ComparisonRow,
    ConnectionProfile,
    DashboardSummary,
    EntityKey,
    MappingStatus,
    MonitoringSummary,
    PayloadPreviewItem,
    PayloadPreviewResponse,
    SyncJob,
    SyncLogEntry,
    ValidationIssue,
    ValidationSummary,
} from '@/types/integration';
import type { EntityDetail } from '@/types/siakad';
import type { ReferenceItem, ReferenceKey } from '@/types/reference';
import type { NeoFeederDictionaryResponse } from '@/types/neofeeder';
import type { ValidationContext } from '@/validators/common';
import type { RowMap } from '@/types/rows';
import { entityDefinitions, entityList } from '@/config/entities';
import { referenceDefinitions, referenceList } from '@/config/references';
import { getSyncStep, syncOrder } from '@/config/syncOrder';
import { validateRows, summarizeIssues, issueCountsByCode } from '@/validators';
import { issue as buildIssue } from '@/validators/common';
import type { DataStatus } from '@/types/integration';
import { compareEntity, determineDataStatus, emptyTally, tallyStatus, type StatusTally } from '@/services/StatusEngine';
import { checkDependencies } from '@/services/DependencyService';
import { buildPayload } from '@/services/neofeeder/TransformService';
import { getActDefinition, neoFeederActs } from '@/services/neofeeder/ActRegistry';
import { asString, stableHash } from '@/utils/json';
import { appConfig } from '@/config/app.config';
import { dataset, mockUuid, pddiktiMirror } from './sourceData';
import { entityMetaRow, isoNow, mockState } from './state';
import { callAct, connectionProbe, issueToken } from './neofeederSim';
import { cancelJob, createJob, retryFailedItems, startJobRunner } from './syncRunner';

/**
 * Mock backend integrator.
 *
 * Seluruh endpoint di sini adalah implementasi dari kontrak yang sama dengan
 * backend SIAKAD pada produksi (`/api/integrator/*`). Semua aturan status,
 * validasi, dependency, dan pembentukan payload memakai engine yang sama
 * dengan frontend sehingga hasil dry-run identik dengan hasil pengiriman.
 */

export interface MockRequest {
    method: string;
    path: string;
    query: Record<string, string>;
    body: Record<string, unknown>;
}

export interface MockResult {
    status: number;
    data: unknown;
}

// --------------------------------------------------------------------------
// Resolvers
// --------------------------------------------------------------------------

const blank = (value: unknown): boolean => value === null || value === undefined || String(value).trim() === '';

export const resolveExternalId = (entity: EntityKey, localId: string | number | null | undefined): string | null => {
    if (blank(localId)) return null;
    const key = String(localId);

    const direct = mockState.mappings[entity]?.[key];
    if (direct?.externalId) return direct.externalId;

    // Resolusi tambahan: nilai lokal dapat berupa kode/NIM/NIDN, bukan id baris.
    if (entity === 'semester') {
        const semester = dataset.semester.find((item) => item.kode === key);
        if (semester) return mockState.mappings.semester[String(semester.id)]?.externalId ?? null;
    }
    if (entity === 'prodi') {
        const prodi = dataset.prodi.find((item) => item.kodeProdi === key);
        if (prodi) return mockState.mappings.prodi[String(prodi.id)]?.externalId ?? null;
    }
    if (entity === 'mahasiswa') {
        const mahasiswa = dataset.mahasiswa.find((item) => item.nim === key);
        if (mahasiswa) return mockState.mappings.mahasiswa[String(mahasiswa.id)]?.externalId ?? null;
    }
    if (entity === 'dosen') {
        const dosen = dataset.dosen.find((item) => item.nidn === key || item.nip === key);
        if (dosen) return mockState.mappings.dosen[String(dosen.id)]?.externalId ?? null;
    }
    if (entity === 'krs') {
        const [mahasiswaId, kelasId] = key.split(':');
        const krs = dataset.krs.find((item) => String(item.mahasiswaId) === mahasiswaId && String(item.kelasId) === kelasId);
        if (krs) return mockState.mappings.krs[String(krs.id)]?.externalId ?? null;
    }

    return null;
};

const referenceItems = (key: ReferenceKey): ReferenceItem[] => mockState.references[key] ?? [];

export const resolveReference = (refKey: ReferenceKey, localValue: string | null): string | null => {
    if (blank(localValue)) return null;
    const found = referenceItems(refKey).find((item) => (item.localValue ?? item.name).toLowerCase() === String(localValue).toLowerCase());
    return found ? found.id : null;
};

export const hasReference = (refKey: ReferenceKey, localValue: string | null): boolean =>
    referenceItems(refKey).some((item) => (item.localValue ?? item.name).toLowerCase() === String(localValue ?? '').toLowerCase());

const validationContext = (entity: EntityKey): ValidationContext => ({
    entity,
    resolveExternalId,
    resolveReference,
    hasReference,
    semesterCodes: new Set(referenceItems('semester').map((item) => item.localValue ?? item.id)),
    prodiIds: new Set(dataset.prodi.map((item) => String(item.id))),
});

const compareOptions = { resolveExternalId, resolveReference };

// --------------------------------------------------------------------------
// Sumber baris
// --------------------------------------------------------------------------

const entityRows = (entity: EntityKey): Record<string, unknown>[] => {
    switch (entity) {
        case 'perguruan-tinggi':
            return [dataset.perguruanTinggi as unknown as Record<string, unknown>];
        case 'prodi':
            return dataset.prodi as unknown as Record<string, unknown>[];
        case 'semester':
            return dataset.semester as unknown as Record<string, unknown>[];
        case 'dosen':
            return dataset.dosen as unknown as Record<string, unknown>[];
        case 'mahasiswa':
            return dataset.mahasiswa as unknown as Record<string, unknown>[];
        case 'riwayat-pendidikan':
            return dataset.riwayat as unknown as Record<string, unknown>[];
        case 'kurikulum':
            return dataset.kurikulum as unknown as Record<string, unknown>[];
        case 'mata-kuliah':
            return dataset.mataKuliah as unknown as Record<string, unknown>[];
        case 'mata-kuliah-kurikulum':
            return dataset.kurikulumItems as unknown as Record<string, unknown>[];
        case 'kelas':
            return dataset.kelas as unknown as Record<string, unknown>[];
        case 'dosen-pengajar':
            return dataset.pengajar as unknown as Record<string, unknown>[];
        case 'krs':
            return dataset.krs as unknown as Record<string, unknown>[];
        case 'nilai':
            return dataset.nilai as unknown as Record<string, unknown>[];
        case 'aktivitas-mahasiswa':
            return dataset.aktivitas as unknown as Record<string, unknown>[];
        case 'kelulusan':
            return dataset.kelulusan as unknown as Record<string, unknown>[];
        default:
            return [];
    }
};

const localIdOf = (row: Record<string, unknown>): string => String(row.localId || row.id);

const remoteFor = (entity: EntityKey, localId: string): JsonObject | null => pddiktiMirror[entity]?.[localId] ?? null;

const issueMapFor = (entity: EntityKey, rows: Record<string, unknown>[]): Map<string, ValidationIssue[]> => {
    const issues = validateRows({ entity, rows, context: validationContext(entity) });
    const map = new Map<string, ValidationIssue[]>();
    issues.forEach((issue) => {
        const list = map.get(issue.localId) ?? [];
        list.push(issue);
        map.set(issue.localId, list);
    });
    return map;
};

interface DecoratedRow extends Record<string, unknown> {
    __comparison?: ComparisonRow[];
    __issues?: ValidationIssue[];
    __remote?: JsonObject | null;
}

const decorate = (entity: EntityKey, rows: Record<string, unknown>[], full = false): DecoratedRow[] => {
    const issueMap = issueMapFor(entity, rows);

    return rows.map((row) => {
        const localId = localIdOf(row);
        const remote = remoteFor(entity, localId);
        const meta = entityMetaRow(entity, localId, remote);
        const comparison = compareEntity(entity, row, remote, compareOptions);
        const rowIssues = issueMap.get(localId) ?? [];
        const lastLog = mockState.logs.find((log) => log.entity === entity && log.localId === localId);

        const dataStatus = determineDataStatus({
            entity,
            mappingStatus: meta.mappingStatus,
            hasRemote: Boolean(remote),
            comparison,
            issues: rowIssues,
            lastSyncStatus: lastLog ? (lastLog.status === 'success' ? 'SUCCESS' : 'FAILED') : null,
        });

        const decorated: DecoratedRow = {
            ...row,
            localId,
            mappingStatus: meta.mappingStatus,
            dataStatus,
            pddiktiId: meta.pddiktiId,
            pddiktiLabel: meta.mappingStatus === 'MAPPED' ? (mockState.mappings[entity]?.[localId]?.externalLabel ?? null) : null,
            lastSyncAt: meta.lastSyncAt,
            lastAction: meta.lastAction,
            lastSyncMessage: mockState.mappings[entity]?.[localId]?.lastMessage ?? null,
            issues: rowIssues.length,
            conflictFields: comparison.conflictFields,
        };

        if (full) {
            decorated.__comparison = comparison.rows;
            decorated.__issues = rowIssues;
            decorated.__remote = remote;
        }

        return decorated;
    });
};

// --------------------------------------------------------------------------
// Filter & pagination
// --------------------------------------------------------------------------

const SEMESTER_FIELD: Partial<Record<EntityKey, string>> = {
    kelas: 'semesterId',
    'dosen-pengajar': 'semesterId',
    'riwayat-pendidikan': 'semesterId',
    mahasiswa: 'semesterMasuk',
    'aktivitas-mahasiswa': 'semesterNama',
    kelulusan: 'periodeKeluar',
};

const PRODI_FIELD: Partial<Record<EntityKey, string>> = {
    prodi: 'id',
    mahasiswa: 'prodiId',
    dosen: 'prodiId',
    kelas: 'prodiId',
    'dosen-pengajar': 'prodiId',
    kurikulum: 'prodiId',
    'mata-kuliah': 'prodiId',
    'mata-kuliah-kurikulum': 'prodiId',
    'riwayat-pendidikan': 'prodiId',
};

const matchesFilters = (entity: EntityKey, row: DecoratedRow, query: Record<string, string>): boolean => {
    const search = (query.search ?? '').trim().toLowerCase();
    if (search) {
        const haystack = entityDefinitions[entity].columns
            .map((column) => asString(row[column.key]))
            .join(' ')
            .toLowerCase();
        if (!haystack.includes(search)) return false;
    }

    const prodiField = PRODI_FIELD[entity];
    if (query.prodiId && prodiField) {
        const raw = row[prodiField];
        const target = query.prodiId;
        const prodi = dataset.prodi.find((item) => String(item.id) === target);
        if (String(raw) !== target && !(prodi && asString(row.prodiNama) === prodi.namaProdi)) return false;
    }

    const semesterField = SEMESTER_FIELD[entity];
    if (query.periodId && semesterField) {
        const target = query.periodId;
        const semester = dataset.semester.find((item) => String(item.id) === target);
        const raw = asString(row[semesterField]);
        const matchById = raw === target;
        const matchByCode = semester ? raw === semester.kode || raw === semester.namaSemester : false;
        if (!matchById && !matchByCode) return false;
    }

    if (query.dataStatus && String(row.dataStatus) !== query.dataStatus) return false;
    if (query.mappingStatus && String(row.mappingStatus) !== query.mappingStatus) return false;
    if (query.angkatan && asString(row.angkatan) !== query.angkatan) return false;
    if (query.statusMahasiswa && asString(row.status) !== query.statusMahasiswa) return false;
    if (query.statusKepegawaian && asString(row.statusKepegawaian) !== query.statusKepegawaian) return false;
    if (query.jenjang && asString(row.jenjang) !== query.jenjang) return false;
    if (query.jenis && asString(row.jenis) !== query.jenis) return false;
    if (query.kurikulumId && String(row.kurikulumId ?? '') !== query.kurikulumId) return false;
    if (query.statusKelas && asString(row.status) !== query.statusKelas) return false;
    if (query.statusKrs && asString(row.statusKrs) !== query.statusKrs) return false;
    if (query.statusNilai && asString(row.statusNilai) !== query.statusNilai) return false;
    if (query.kategori && asString(row.kategori) !== query.kategori) return false;
    if (query.jenisKeluar && asString(row.jenisKeluar) !== query.jenisKeluar) return false;
    if (query.jenisMataKuliah) {
        const kodeMk = asString(entity === 'kelas' ? row.kodeMk : row.kode);
        const mk = dataset.mataKuliah.find((item) => item.kode === kodeMk);
        if (!mk || mk.jenis !== query.jenisMataKuliah) return false;
    }

    return true;
};

const paginate = <T>(rows: T[], query: Record<string, string>): { data: T[]; meta: { page: number; perPage: number; total: number; lastPage: number } } => {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const perPage = Math.max(1, Number.parseInt(query.perPage ?? String(appConfig.defaultPageSize), 10) || appConfig.defaultPageSize);
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, lastPage);
    return {
        data: rows.slice((safePage - 1) * perPage, safePage * perPage),
        meta: { page: safePage, perPage, total, lastPage },
    };
};

const appliedStatusFilters = (query: Record<string, string>): boolean => Boolean(query.dataStatus || query.mappingStatus);

const tallyFor = (rows: DecoratedRow[]): StatusTally => {
    let tally = emptyTally();
    rows.forEach((row) => {
        tally = tallyStatus(tally, row.dataStatus as never, row.mappingStatus as MappingStatus, Boolean(row.pddiktiId));
    });
    return tally;
};

// --------------------------------------------------------------------------
// Mapping helpers
// --------------------------------------------------------------------------

const mappingRecord = (entity: EntityKey, localId: string): MappingRecord | null => mockState.mappings[entity]?.[localId] ?? null;

const candidatesFor = (entity: EntityKey, localId: string): MappingCandidate[] => {
    const record = mappingRecord(entity, localId);
    if (!record) return [];
    const rows = Object.entries(pddiktiMirror[entity] ?? {});

    return rows
        .map(([remoteKey, remote]) => {
            const remoteCode = asString(
                remote.kode_program_studi ?? remote.kode_mata_kuliah ?? remote.kode_kurikulum ?? remote.nidn ?? remote.nim ?? remote.id_semester ?? remote.id,
            );
            const remoteLabel = asString(
                remote.nama_program_studi ?? remote.nama_mata_kuliah ?? remote.nama_kurikulum ?? remote.nama_dosen ?? remote.nama_mahasiswa ?? remote.nama_semester ?? remoteKey,
            );
            let score = 0;
            const reasons: string[] = [];

            if (remoteCode && remoteCode.toLowerCase() === record.localCode.toLowerCase()) {
                score += 0.6;
                reasons.push('kode identik');
            }
            if (remoteLabel && remoteLabel.toLowerCase() === record.localLabel.toLowerCase()) {
                score += 0.3;
                reasons.push('nama identik');
            } else if (remoteLabel && record.localLabel && (remoteLabel.toLowerCase().includes(record.localLabel.toLowerCase().slice(0, 8)) || record.localLabel.toLowerCase().includes(remoteLabel.toLowerCase().slice(0, 8)))) {
                score += 0.15;
                reasons.push('nama mirip');
            }

            return {
                externalId: asString(remote[Object.keys(remote).find((key) => key.startsWith('id_')) ?? 'id']),
                externalCode: remoteCode || null,
                label: remoteLabel || '(tanpa nama)',
                score: Math.min(0.99, score + (stableHash(`${entity}-${localId}-${remoteKey}`) % 12) / 100),
                reason: reasons.length > 0 ? reasons.join(', ') : 'kemiripan rendah',
            };
        })
        .filter((candidate) => candidate.externalId !== '')
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
};

const mappingStats = (entity: EntityKey): MappingStats => {
    const records = Object.values(mockState.mappings[entity] ?? {});
    const mapped = records.filter((record) => record.status === 'MAPPED').length;
    const total = records.length;
    return {
        entity,
        label: entityDefinitions[entity].label,
        total,
        mapped,
        unmapped: records.filter((record) => record.status === 'UNMAPPED').length,
        conflict: records.filter((record) => record.status === 'CONFLICT').length,
        invalid: records.filter((record) => record.status === 'INVALID').length,
        progress: total === 0 ? 0 : Math.round((mapped / total) * 100),
        required: getSyncStep(entity)?.mandatory ?? false,
    };
};

// --------------------------------------------------------------------------
// Handler
// --------------------------------------------------------------------------

export const handleMockRequest = async (request: MockRequest): Promise<MockResult> => {
    const segments = request.path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const [head, second, third] = segments;
    const query = request.query;
    const body = request.body ?? {};

    // ------------------------------------------------------------- session
    if (head === 'session') {
        return {
            status: 200,
            data: {
                id: 2,
                name: 'Admin Akademik',
                email: 'akademik@alwafi.ac.id',
                role: 'admin',
                permissions: ['integrator.view', 'integrator.sync', 'integrator.mapping', 'integrator.connection'],
                institution: dataset.perguruanTinggi.namaPt,
                mockMode: appConfig.mockMode,
            },
        };
    }

    // ----------------------------------------------------------- periods
    if (head === 'periods') {
        return {
            status: 200,
            data: {
                active: dataset.semester.find((item) => item.status === 'aktif')?.id ?? null,
                data: dataset.semester.map((semester) => ({
                    ...semester,
                    mappingStatus: mockState.mappings.semester[String(semester.id)]?.status ?? 'UNMAPPED',
                    pddiktiId: mockState.mappings.semester[String(semester.id)]?.externalId ?? null,
                })),
            },
        };
    }

    if (head === 'prodi-options') {
        return {
            status: 200,
            data: dataset.prodi.map((prodi) => ({
                value: String(prodi.id),
                label: `${prodi.namaProdi} (${prodi.jenjang})`,
                kode: prodi.kodeProdi,
                mapped: Boolean(mockState.mappings.prodi[String(prodi.id)]?.externalId),
            })),
        };
    }

    // --------------------------------------------------------- connection
    if (head === 'connection') {
        if (!second) {
            if (request.method === 'put') {
                const profile = body.profile as Partial<ConnectionProfile> | undefined;
                if (profile) {
                    mockState.connection = {
                        ...mockState.connection,
                        baseUrl: asString(profile.baseUrl) || mockState.connection.baseUrl,
                        webServiceUrl: asString(profile.webServiceUrl) || mockState.connection.webServiceUrl,
                        username: asString(profile.username) || mockState.connection.username,
                        timeoutSeconds: Number(profile.timeoutSeconds ?? mockState.connection.timeoutSeconds),
                        retryCount: Number(profile.retryCount ?? mockState.connection.retryCount),
                        active: profile.active ?? mockState.connection.active,
                        useProxy: profile.useProxy ?? mockState.connection.useProxy,
                        passwordConfigured: asString(body.password).length > 0 || mockState.connection.passwordConfigured,
                    };
                    mockState.connectionEvents.unshift({ at: isoNow(), action: 'Simpan konfigurasi', status: mockState.status.status, message: 'Profil koneksi diperbarui (kredensial disimpan di backend).' });
                }
                return { status: 200, data: { profile: mockState.connection, status: mockState.status } };
            }

            return {
                status: 200,
                data: {
                    profile: mockState.connection,
                    status: mockState.status,
                    token: { expiresAt: mockState.token.expiresAt, issuedAt: mockState.token.issuedAt, refreshesLast24h: mockState.token.refreshes.length },
                    dictionary: mockState.dictionary
                        ? { synced: true, version: mockState.dictionary.version, fetchedAt: mockState.dictionary.fetchedAt, actCount: mockState.dictionary.acts.length }
                        : { synced: false, version: mockState.status.serverVersion, fetchedAt: null, actCount: neoFeederActs ? Object.keys(neoFeederActs).length : 0 },
                    events: mockState.connectionEvents.slice(0, 12),
                    retryPolicy: { maxAttempts: mockState.connection.retryCount + 1, baseDelayMs: 800 },
                },
            };
        }

        if (second === 'test') {
            const probe = await connectionProbe();
            const ok = Number(probe.raw.error_code) === 0;
            const serverRow = Array.isArray(probe.raw.data) && probe.raw.data[0] ? (probe.raw.data[0] as JsonObject) : null;

            mockState.status = {
                ...mockState.status,
                status: ok ? 'CONNECTED' : 'TIMEOUT',
                serverVersion: serverRow ? asString(serverRow.server_version, mockState.status.serverVersion ?? '') : mockState.status.serverVersion,
                apiStatus: serverRow ? asString(serverRow.api_status, 'aktif') : mockState.status.apiStatus,
                lastConnectedAt: ok ? isoNow() : mockState.status.lastConnectedAt,
                message: ok ? null : asString(probe.raw.error_desc),
            };
            mockState.connectionEvents.unshift({
                at: isoNow(),
                action: 'Uji koneksi',
                status: mockState.status.status,
                message: ok ? `Web service merespons dalam ${probe.latencyMs} ms.` : asString(probe.raw.error_desc, 'Tidak ada respons.'),
            });

            return {
                status: 200,
                data: {
                    status: mockState.status.status,
                    message: ok ? 'Web Service Neo Feeder merespons dengan baik.' : asString(probe.raw.error_desc, 'Web Service tidak merespons.'),
                    latencyMs: probe.latencyMs,
                    serverVersion: mockState.status.serverVersion,
                    apiStatus: mockState.status.apiStatus,
                    checkedAt: isoNow(),
                    steps: [
                        { label: 'DNS / host dapat dijangkau', ok, detail: mockState.connection.webServiceUrl },
                        { label: 'Endpoint ws/live2.php merespons', ok, detail: `HTTP 200 dalam ${probe.latencyMs} ms` },
                        { label: 'Token akses tersedia', ok: Boolean(mockState.token.expiresAt), detail: mockState.token.expiresAt ?? 'belum ada token' },
                    ],
                },
            };
        }

        if (second === 'authenticate' || (second === 'token' && third === 'refresh')) {
            const result = await issueToken(mockState.connection.username, 'tersimpan-di-backend');
            const ok = Number(result.error_code) === 0;
            mockState.connectionEvents.unshift({
                at: isoNow(),
                action: second === 'authenticate' ? 'Autentikasi' : 'Refresh token',
                status: ok ? 'CONNECTED' : 'AUTHENTICATION_FAILED',
                message: ok ? 'Token berhasil diperbarui.' : asString(result.error_desc),
            });
            return {
                status: 200,
                data: {
                    status: mockState.status.status,
                    message: ok ? 'Token berhasil diperbarui dan berlaku 60 menit.' : asString(result.error_desc),
                    tokenExpiresAt: mockState.token.expiresAt,
                    serverVersion: mockState.status.serverVersion,
                },
            };
        }

        if (second === 'dictionary' && third === 'sync') {
            const dictionary: NeoFeederDictionaryResponse = {
                version: mockState.status.serverVersion ?? '3.1',
                fetchedAt: isoNow(),
                source: 'ws-dictionary',
                acts: Object.values(neoFeederActs),
            };
            mockState.dictionary = dictionary;
            return {
                status: 200,
                data: {
                    synced: true,
                    version: dictionary.version,
                    actCount: dictionary.acts.length,
                    fetchedAt: dictionary.fetchedAt,
                    message: `Dictionary versi ${dictionary.version} berhasil diambil (${dictionary.acts.length} act).`,
                },
            };
        }
    }

    if (head === 'neofeeder') {
        if (second === 'token') {
            const result = await issueToken(mockState.connection.username, 'tersimpan-di-backend');
            return { status: 200, data: { success: Number(result.error_code) === 0, message: asString(result.error_desc, 'Token diperbarui.'), expiresAt: mockState.token.expiresAt, serverVersion: mockState.status.serverVersion } };
        }
        if (second === 'test') {
            const probe = await connectionProbe();
            return { status: 200, data: { ok: Number(probe.raw.error_code) === 0, message: asString(probe.raw.error_desc, 'OK'), latencyMs: probe.latencyMs, serverVersion: mockState.status.serverVersion, apiStatus: mockState.status.apiStatus } };
        }
        if (second === 'call') {
            const envelope = {
                act: asString(body.act),
                record: (body.record as JsonObject) ?? undefined,
                filter: asString(body.filter) || undefined,
                limit: body.limit === undefined ? undefined : Number(body.limit),
                offset: body.offset === undefined ? undefined : Number(body.offset),
            };
            const { raw, latencyMs, httpStatus } = await callAct(envelope);
            const code = Number(raw.error_code ?? -1);
            return {
                status: 200,
                data: {
                    success: code === 0,
                    code,
                    message: asString(raw.error_desc) || (code === 0 ? 'Sukses' : 'Tidak ada keterangan'),
                    data: raw.data ?? [],
                    raw,
                    act: envelope.act,
                    requestId: `req-${mockUuid(`${envelope.act}-${Date.now()}`).slice(0, 12)}`,
                    durationMs: Math.round(latencyMs),
                    attempts: 1,
                    httpStatus,
                    mocked: true,
                },
            };
        }
        if (second === 'dictionary' && !third) {
            return {
                status: 200,
                data: mockState.dictionary ?? { version: mockState.status.serverVersion, fetchedAt: null, source: 'assumed', acts: Object.values(neoFeederActs) },
            };
        }
    }

    // ------------------------------------------------------------ dashboard
    if (head === 'dashboard' && second === 'summary') {
        const perEntity = entityList.map((definition) => {
            const rows = decorate(definition.key, entityRows(definition.key));
            const tally = tallyFor(rows);
            const stats = mappingStats(definition.key);
            return {
                entity: definition.key,
                label: definition.label,
                siakad: tally.total,
                pddikti: tally.pddikti,
                synced: tally.synced,
                willSend: tally.willSend,
                invalid: tally.invalid,
                mapped: stats.mapped,
                unmapped: stats.unmapped,
                progress: stats.progress,
                _tally: tally,
            };
        });

        const totals = perEntity.reduce(
            (accumulator, item) => ({
                siakad: accumulator.siakad + item._tally.total,
                pddikti: accumulator.pddikti + item._tally.pddikti,
                synced: accumulator.synced + item._tally.synced,
                willSend: accumulator.willSend + item._tally.willSend,
                willUpdate: accumulator.willUpdate + item._tally.willUpdate,
                invalid: accumulator.invalid + item._tally.invalid,
                failed: accumulator.failed + item._tally.failed,
                unmapped: accumulator.unmapped + item._tally.unmapped,
                conflict: accumulator.conflict + item._tally.conflict,
                inProgress: accumulator.inProgress + item._tally.inProgress,
            }),
            { siakad: 0, pddikti: 0, synced: 0, willSend: 0, willUpdate: 0, invalid: 0, failed: 0, unmapped: 0, conflict: 0, inProgress: 0 },
        );

        const lastJob = mockState.jobs[0] ?? null;
        const summary: DashboardSummary = {
            connection: mockState.status,
            lastSync: lastJob
                ? {
                      jobId: lastJob.id,
                      entity: lastJob.entity,
                      finishedAt: lastJob.finishedAt ?? lastJob.createdAt,
                      success: lastJob.success,
                      failed: lastJob.failed,
                      total: lastJob.total,
                      user: lastJob.createdBy,
                  }
                : null,
            totals,
            perEntity: perEntity.map(({ _tally, ...item }) => item),
            recentJobs: mockState.jobs.slice(0, 6).map((job) => ({
                id: job.id,
                entity: job.entity,
                status: job.status,
                total: job.total,
                success: job.success,
                failed: job.failed,
                createdAt: job.createdAt,
                createdBy: job.createdBy,
                dryRun: job.dryRun,
            })),
            failedItems: mockState.logs
                .filter((log) => log.status === 'failed')
                .slice(0, 8)
                .map((log) => ({
                    entity: log.entity,
                    localId: log.localId,
                    localLabel: log.localLabel,
                    message: log.neoFeederMessage ?? 'Gagal tanpa keterangan',
                    errorCategory: log.errorCategory ?? 'UNKNOWN_ERROR',
                    createdAt: log.createdAt,
                    jobId: log.jobId ?? '—',
                })),
            validationWarnings: issueCountsByCode(
                entityList.flatMap((definition) => validateRows({ entity: definition.key, rows: entityRows(definition.key), context: validationContext(definition.key) })),
            )
                .slice(0, 8)
                .map((item) => ({ code: item.code, message: item.message, entity: item.entity, severity: item.severity, count: item.count })),
            mappingWarnings: entityList
                .filter((definition) => getSyncStep(definition.key)?.mandatory)
                .map((definition) => {
                    const stats = mappingStats(definition.key);
                    return { entity: definition.key, label: definition.label, unmapped: stats.unmapped, conflict: stats.conflict, total: stats.total };
                }),
        };

        return { status: 200, data: summary };
    }

    // ----------------------------------------------------------- references
    if (head === 'references') {
        if (!second || second === 'summary') {
            return {
                status: 200,
                data: referenceList.map((definition) => {
                    const items = referenceItems(definition.key);
                    return {
                        key: definition.key,
                        label: definition.label,
                        total: items.length,
                        usedBySiakad: items.reduce((total, item) => total + (item.usedBySiakad ?? 0), 0),
                        unmappedLocalValues: items.filter((item) => item.usedBySiakad && !item.localValue).length,
                        lastFetchedAt: mockState.status.lastSuccessfulRequestAt,
                        act: definition.act,
                    };
                }),
            };
        }

        const definition = referenceDefinitions[second as ReferenceKey];
        if (!definition) return { status: 404, data: { message: `Referensi "${second}" tidak dikenal.` } };

        const search = (query.search ?? '').toLowerCase();
        const items = referenceItems(definition.key).filter(
            (item) => !search || item.name.toLowerCase().includes(search) || (item.code ?? '').toLowerCase().includes(search),
        );

        return {
            status: 200,
            data: {
                definition,
                ...paginate(items, query),
                dictionaryVerified: Boolean(mockState.dictionary),
                requiresProdi: definition.requiresProdi ?? false,
            },
        };
    }

    // ------------------------------------------------------------ mapping
    if (head === 'mapping') {
        if (!second || second === 'summary') {
            return { status: 200, data: entityList.map((definition) => mappingStats(definition.key)) };
        }

        const entity = second as EntityKey;
        if (!entityDefinitions[entity]) return { status: 404, data: { message: `Entitas "${second}" tidak dikenal.` } };

        if (third === 'auto') {
            const mode = asString(body.mode, 'code') as 'code' | 'name' | 'identity';
            const records = Object.values(mockState.mappings[entity] ?? {}).filter((record) => record.status !== 'MAPPED');
            const result: AutoMapResult = { entity, matched: 0, skipped: 0, conflicts: 0, details: [] };

            records.forEach((record) => {
                const candidates = candidatesFor(entity, record.localId);
                const best = candidates[0];
                const threshold = mode === 'name' ? 0.3 : 0.58;

                if (!best || best.score < threshold) {
                    result.skipped += 1;
                    result.details.push({ localId: record.localId, localLabel: record.localLabel, externalId: null, externalLabel: null, status: 'UNMAPPED', reason: 'Tidak ada kandidat yang melewati ambang kecocokan.' });
                    return;
                }

                const runnerUp = candidates[1];
                if (runnerUp && runnerUp.score > threshold && Math.abs(runnerUp.score - best.score) < 0.05) {
                    record.status = 'CONFLICT';
                    record.lastMessage = 'Lebih dari satu kandidat dengan skor mirip — perlu keputusan operator.';
                    result.conflicts += 1;
                    result.details.push({ localId: record.localId, localLabel: record.localLabel, externalId: best.externalId, externalLabel: best.label, status: 'CONFLICT', reason: 'Dua kandidat berskor hampir sama.' });
                    return;
                }

                record.externalId = best.externalId;
                record.externalCode = best.externalCode;
                record.externalLabel = best.label;
                record.status = 'MAPPED';
                record.mappingType = mode === 'code' ? 'by-code' : mode === 'name' ? 'by-name' : 'by-identity';
                record.confidence = best.score;
                record.lastMessage = `Dipetakan otomatis (${best.reason}).`;
                result.matched += 1;
                result.details.push({ localId: record.localId, localLabel: record.localLabel, externalId: best.externalId, externalLabel: best.label, status: 'MAPPED', reason: best.reason });
            });

            mockState.autoMapRuns.unshift({ at: isoNow(), entity, matched: result.matched, skipped: result.skipped, conflicts: result.conflicts });
            return { status: 200, data: result };
        }

        if (third === 'bulk') {
            const items = (body.items as { localId: string; externalId: string; mappingType?: string }[]) ?? [];
            let updated = 0;
            items.forEach((item) => {
                const record = mockState.mappings[entity]?.[String(item.localId)];
                if (!record) return;
                record.externalId = item.externalId;
                record.externalLabel = record.externalLabel ?? record.localLabel;
                record.status = 'MAPPED';
                record.mappingType = (item.mappingType as MappingRecord['mappingType']) ?? 'manual';
                record.confidence = 1;
                record.lastMessage = 'Dipetakan manual oleh operator.';
                updated += 1;
            });
            return { status: 200, data: { updated, requested: items.length } };
        }

        if (third === 'unmap') {
            const localIds = (body.localIds as string[]) ?? [];
            let updated = 0;
            localIds.forEach((localId) => {
                const record = mockState.mappings[entity]?.[String(localId)];
                if (!record) return;
                record.externalId = null;
                record.externalCode = null;
                record.externalLabel = null;
                record.status = 'UNMAPPED';
                record.mappingType = null;
                record.confidence = null;
                record.lastMessage = 'Pemetaan dilepas oleh operator.';
                updated += 1;
            });
            return { status: 200, data: { updated } };
        }

        if (third === 'candidates') {
            return { status: 200, data: { candidates: candidatesFor(entity, asString(query.localId)) } };
        }

        if (!third && request.method === 'post') {
            const localId = String(body.localId ?? '');
            const record = mockState.mappings[entity]?.[localId];
            if (!record) return { status: 404, data: { message: 'Baris SIAKAD tidak ditemukan pada entitas ini.' } };
            record.externalId = asString(body.externalId);
            record.externalLabel = asString(body.externalLabel) || record.localLabel;
            record.externalCode = asString(body.externalCode) || null;
            record.status = 'MAPPED';
            record.mappingType = (body.mappingType as MappingRecord['mappingType']) ?? 'manual';
            record.confidence = 1;
            record.lastMessage = 'Dipetakan manual oleh operator.';
            return { status: 200, data: { record } };
        }

        const rows = decorate(entity, entityRows(entity));
        const filtered = rows.filter((row) => {
            if (query.mappingStatus && String(row.mappingStatus) !== query.mappingStatus) return false;
            if (query.search) {
                const haystack = `${asString(row.nim)} ${asString(row.nama)} ${asString(row.kode)} ${asString(row.kodeProdi)} ${asString(row.namaProdi)} ${asString(row.kodeKelas)}`.toLowerCase();
                if (!haystack.includes(String(query.search).toLowerCase())) return false;
            }
            if (query.prodiId && String(row.prodiId ?? '') !== String(query.prodiId)) return false;
            return true;
        });

        const records = filtered
            .map((row) => mappingRecord(entity, localIdOf(row)))
            .filter((record): record is MappingRecord => record !== null);

        return { status: 200, data: { ...paginate(records, query), stats: mappingStats(entity) } };
    }

    // ---------------------------------------------------------- validation
    if (head === 'validation') {
        if (second === 'summary' || !second) {
            const summaries: ValidationSummary[] = entityList.map((definition) => {
                const rows = entityRows(definition.key);
                const issues = validateRows({ entity: definition.key, rows, context: validationContext(definition.key) });
                return summarizeIssues(definition.key, issues, rows.length);
            });

            return {
                status: 200,
                data: {
                    summaries,
                    totals: summaries.reduce(
                        (accumulator, item) => ({
                            total: accumulator.total + item.total,
                            valid: accumulator.valid + item.valid,
                            critical: accumulator.critical + item.critical,
                            error: accumulator.error + item.error,
                            warning: accumulator.warning + item.warning,
                            info: accumulator.info + item.info,
                            conflict: accumulator.conflict + item.conflict,
                        }),
                        { total: 0, valid: 0, critical: 0, error: 0, warning: 0, info: 0, conflict: 0 },
                    ),
                },
            };
        }

        if (second === 'issues') {
            const target = (query.entity as EntityKey) || null;
            const entities = target ? [target] : entityList.map((definition) => definition.key);
            let issues: ValidationIssue[] = entities.flatMap((entity) =>
                validateRows({ entity, rows: entityRows(entity), context: validationContext(entity) }),
            );

            if (query.severity) issues = issues.filter((issue) => issue.severity === query.severity);
            if (query.search) {
                const search = query.search.toLowerCase();
                issues = issues.filter((issue) => `${issue.localLabel} ${issue.message} ${issue.code}`.toLowerCase().includes(search));
            }
            if (query.prodiId) {
                const prodi = dataset.prodi.find((item) => String(item.id) === query.prodiId);
                if (prodi) {
                    issues = issues.filter((issue) => issue.localLabel.includes(prodi.namaProdi) || issue.entity === 'prodi');
                }
            }

            const order = { critical: 0, error: 1, warning: 2, info: 3 } as const;
            issues = issues.sort((a, b) => order[a.severity] - order[b.severity]);

            return { status: 200, data: { ...paginate(issues, query), grouped: issueCountsByCode(issues).slice(0, 12) } };
        }
    }

    // ---------------------------------------------------------------- sync
    if (head === 'sync') {
        if (second === 'order') {
            return {
                status: 200,
                data: syncOrder.map((step) => {
                    const stats = mappingStats(step.entity);
                    return {
                        ...step,
                        mapped: stats.mapped,
                        unmapped: stats.unmapped,
                        total: stats.total,
                        ready: stats.unmapped === 0 || !step.mandatory,
                        capability: entityDefinitions[step.entity].acts.syncCapability,
                        capabilityNote: entityDefinitions[step.entity].acts.capabilityNote,
                    };
                }),
            };
        }

        if (second === 'jobs') {
            if (!third) {
                if (request.method === 'post') {
                    const entity = asString(body.entity) as EntityKey;
                    if (!entityDefinitions[entity]) return { status: 422, data: { message: 'Entitas tidak valid.' } };

                    const ids = (body.ids as string[]) ?? [];
                    if (ids.length === 0) return { status: 422, data: { message: 'Tidak ada data yang dipilih untuk disinkronkan.' } };
                    if (ids.length > appConfig.maxBulkItemsPerJob) {
                        return { status: 422, data: { message: `Jumlah data melebihi batas ${appConfig.maxBulkItemsPerJob} item per job.` } };
                    }

                    const job = createJob({
                        entity,
                        ids: ids.map(String),
                        dryRun: Boolean(body.dryRun),
                        user: 'Admin Akademik',
                        periodId: body.periodId ? String(body.periodId) : null,
                        periodLabel: body.periodLabel ? String(body.periodLabel) : null,
                        prodiId: body.prodiId ? String(body.prodiId) : null,
                        prodiLabel: body.prodiLabel ? String(body.prodiLabel) : null,
                    });

                    return { status: 201, data: job };
                }

                let jobs = mockState.jobs;
                if (query.entity) jobs = jobs.filter((job) => job.entity === query.entity);
                if (query.status) jobs = jobs.filter((job) => job.status === query.status);
                if (query.search) {
                    const search = String(query.search).toLowerCase();
                    jobs = jobs.filter((job) => job.id.toLowerCase().includes(search) || job.createdBy.toLowerCase().includes(search));
                }

                const paged = paginate(jobs, query);
                return {
                    status: 200,
                    data: {
                        ...paged,
                        data: paged.data.map((job) => ({ ...job, items: [] as never[] })),
                        stats: {
                            queued: mockState.jobs.filter((job) => job.status === 'QUEUED').length,
                            running: mockState.jobs.filter((job) => job.status === 'RUNNING').length,
                            completed: mockState.jobs.filter((job) => job.status === 'COMPLETED').length,
                            partial: mockState.jobs.filter((job) => job.status === 'PARTIAL').length,
                            failed: mockState.jobs.filter((job) => job.status === 'FAILED').length,
                            totalItems: mockState.jobs.reduce((total, job) => total + job.total, 0),
                            successItems: mockState.jobs.reduce((total, job) => total + job.success, 0),
                            failedItems: mockState.jobs.reduce((total, job) => total + job.failed, 0),
                        },
                    },
                };
            }

            const job = mockState.jobs.find((item) => item.id === third);
            if (!job) return { status: 404, data: { message: 'Job sinkronisasi tidak ditemukan.' } };

            const action = segments[3];
            if (action === 'run') {
                startJobRunner(job.id, resolveExternalId);
                return { status: 200, data: job };
            }
            if (action === 'retry-failed') {
                retryFailedItems(job.id, resolveExternalId);
                return { status: 200, data: job };
            }
            if (action === 'cancel') {
                cancelJob(job.id);
                return { status: 200, data: job };
            }

            return { status: 200, data: job };
        }
    }

    // ---------------------------------------------------------------- logs
    if (head === 'logs') {
        if (second) {
            const log = mockState.logs.find((item) => item.id === second);
            if (!log) return { status: 404, data: { message: 'Log tidak ditemukan.' } };
            return { status: 200, data: log };
        }

        let logs = mockState.logs;
        if (query.entity) logs = logs.filter((log) => log.entity === query.entity);
        if (query.status) logs = logs.filter((log) => log.status === query.status);
        if (query.errorCategory) logs = logs.filter((log) => log.errorCategory === query.errorCategory);
        if (query.search) {
            const search = String(query.search).toLowerCase();
            logs = logs.filter((log) => `${log.localLabel} ${log.act} ${log.neoFeederMessage ?? ''} ${log.user}`.toLowerCase().includes(search));
        }
        if (query.dateFrom) logs = logs.filter((log) => log.createdAt >= String(query.dateFrom));
        if (query.dateTo) logs = logs.filter((log) => log.createdAt <= String(query.dateTo));

        return {
            status: 200,
            data: {
                ...paginate(logs, query),
                stats: {
                    total: mockState.logs.length,
                    success: mockState.logs.filter((log) => log.status === 'success').length,
                    failed: mockState.logs.filter((log) => log.status === 'failed').length,
                    avgDurationMs: Math.round(mockState.logs.reduce((total, log) => total + log.durationMs, 0) / Math.max(1, mockState.logs.length)),
                },
            },
        };
    }

    // ---------------------------------------------------------- monitoring
    if (head === 'monitoring') {
        const byAct = new Map<string, { total: number; count: number; max: number }>();
        mockState.logs.forEach((log) => {
            const entry = byAct.get(log.act) ?? { total: 0, count: 0, max: 0 };
            entry.total += log.durationMs;
            entry.count += 1;
            entry.max = Math.max(entry.max, log.durationMs);
            byAct.set(log.act, entry);
        });

        const errors = new Map<string, number>();
        mockState.logs.filter((log) => log.errorCategory).forEach((log) => {
            errors.set(log.errorCategory as string, (errors.get(log.errorCategory as string) ?? 0) + 1);
        });

        const throughput = Array.from({ length: 7 }).map((_, index) => {
            const day = new Date();
            day.setDate(day.getDate() - (6 - index));
            const label = day.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            const dayLogs = mockState.logs.filter((log) => new Date(log.createdAt).toDateString() === day.toDateString());
            return {
                label,
                success: dayLogs.filter((log) => log.status === 'success').length,
                failed: dayLogs.filter((log) => log.status === 'failed').length,
            };
        });

        const summary: MonitoringSummary = {
            queue: {
                queued: mockState.jobs.filter((job) => job.status === 'QUEUED').length,
                running: mockState.jobs.filter((job) => job.status === 'RUNNING').length,
                completed: mockState.jobs.filter((job) => job.status === 'COMPLETED' || job.status === 'PARTIAL').length,
                failed: mockState.jobs.filter((job) => job.status === 'FAILED').length,
            },
            throughput,
            latency: Array.from(byAct.entries())
                .map(([act, entry]) => ({ act, avgMs: Math.round(entry.total / entry.count), maxMs: entry.max, calls: entry.count }))
                .sort((a, b) => b.avgMs - a.avgMs)
                .slice(0, 8),
            errorBreakdown: Array.from(errors.entries()).map(([category, count]) => ({ category, count })),
            recentFailures: mockState.logs.filter((log) => log.status === 'failed').slice(0, 10),
            tokenHealth: {
                status: mockState.status.status,
                tokenExpiresAt: mockState.token.expiresAt,
                refreshesLast24h: mockState.token.refreshes.filter((at) => Date.now() - new Date(at).getTime() < 86_400_000).length,
            },
        };

        return { status: 200, data: summary };
    }

    // -------------------------------------------------------------- import
    if (head === 'import' && second === 'preview') {
        const format = asString(body.format, 'json');
        const content = asString(body.content);
        const entity = asString(body.entity, 'mahasiswa') as EntityKey;

        let rows: Record<string, unknown>[] = [];
        if (format === 'json') {
            try {
                const parsed = JSON.parse(content);
                rows = Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
            } catch {
                return { status: 422, data: { message: 'Isi JSON tidak valid.' } };
            }
        } else {
            const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
            const header = (lines.shift() ?? '').split(',').map((cell) => cell.trim());
            rows = lines.map((line) => {
                const cells = line.split(',');
                const row: Record<string, unknown> = {};
                header.forEach((key, index) => {
                    row[key] = (cells[index] ?? '').trim();
                });
                return row;
            });
        }

        const preview = rows.slice(0, 50).map((row, index) => {
            const issues = validateRows({ entity, rows: [row], context: validationContext(entity) });
            return {
                index: index + 1,
                row,
                issues,
                blocking: issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error').length,
            };
        });

        return {
            status: 200,
            data: {
                entity,
                format,
                total: rows.length,
                preview,
                summary: {
                    valid: preview.filter((item) => item.blocking === 0).length,
                    invalid: preview.filter((item) => item.blocking > 0).length,
                },
                note: 'Import tidak langsung melakukan sinkronisasi. Lanjutkan dengan validation → mapping → approval.',
            },
        };
    }

    // ----------------------------------------------------- entity generik
    const entity = head as EntityKey;
    if (entityDefinitions[entity]) {
        const definition = entityDefinitions[entity];

        if (!second) {
            const baseRows = decorate(entity, entityRows(entity)).filter((row) => matchesFilters(entity, row, query));
            const statusFiltered = appliedStatusFilters(query) ? baseRows.filter((row) => matchesFilters(entity, row, query)) : baseRows;
            const paged = paginate(statusFiltered, query);

            return {
                status: 200,
                data: {
                    ...paged,
                    stats: tallyFor(baseRows),
                    entity,
                    capability: definition.acts.syncCapability,
                    capabilityNote: definition.acts.capabilityNote,
                    acts: definition.acts,
                },
            };
        }

        if (second === 'preview') {
            const ids = (body.ids as string[]) ?? [];
            const dryRun = Boolean(body.dryRun);
            const full = decorate(entity, entityRows(entity), true);
            const selected = full.filter((row) => ids.includes(localIdOf(row)));
            const referenceKeyResolver: typeof resolveReference = (refKey, value) => resolveReference(refKey, value);

            const items: PayloadPreviewItem[] = selected.map((row) => {
                const localId = localIdOf(row);
                const mapping = mappingRecord(entity, localId);
                const status = row.dataStatus as DataStatus;
                const alreadySynced = status === 'SYNCED' || status === 'SUCCESS';

                const action: 'INSERT' | 'UPDATE' | 'SKIP' =
                    definition.acts.syncCapability === 'read-only'
                        ? 'SKIP'
                        : alreadySynced
                          ? 'SKIP'
                          : mapping?.externalId
                            ? 'UPDATE'
                            : definition.acts.syncCapability === 'update-only'
                              ? 'SKIP'
                              : 'INSERT';
                const act = action === 'UPDATE' ? (definition.acts.update ?? definition.acts.insert ?? definition.acts.list) : (definition.acts.insert ?? definition.acts.list);

                const dependencies = checkDependencies(entity, row, { resolveExternalId });
                const rowIssues = (row.__issues as ValidationIssue[]) ?? [];
                const issues: ValidationIssue[] = [...rowIssues];

                if (action === 'SKIP' && alreadySynced) {
                    issues.push(
                        buildIssue(
                            entity,
                            localId,
                            mapping?.localLabel ?? localId,
                            'info',
                            'SKIP_ALREADY_SYNCED',
                            'Data sudah identik dengan PDDikti sehingga tidak dikirim ulang (idempotent).',
                        ),
                    );
                }

                const built = buildPayload(act, {
                    entity,
                    localId,
                    action,
                    values: row,
                    existing: mapping?.externalId ? ({ id: mapping.externalId } as JsonObject) : null,
                    issues,
                    resolve: resolveExternalId,
                    resolveReference: referenceKeyResolver,
                    version: mockState.status.serverVersion,
                    dictionaryFields: mockState.dictionary ? (getActDefinition(act)?.recordFields ?? []).map((field) => field.key) : null,
                });

                return {
                    localId,
                    localLabel: mapping?.localLabel ?? localId,
                    act,
                    entity,
                    action,
                    status,
                    record: action === 'SKIP' ? {} : built.record,
                    skippedFields: built.skippedFields,
                    issues,
                    dependencies,
                };
            });

            const response: PayloadPreviewResponse = {
                entity,
                act: definition.acts.insert ?? definition.acts.list,
                dryRun,
                generatedAt: isoNow(),
                items,
                summary: {
                    total: items.length,
                    ready: items.filter((item) => item.action !== 'SKIP' && item.dependencies.ok && !item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')).length,
                    invalid: items.filter((item) => item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')).length,
                    warning: items.filter((item) => item.issues.some((issue) => issue.severity === 'warning')).length,
                    conflict: items.filter((item) => item.status === 'CONFLICT').length,
                    skipped: items.filter((item) => item.action === 'SKIP').length,
                },
            };

            return { status: 200, data: response };
        }

        if (second === 'validate') {
            const ids = (body.ids as string[]) ?? [];
            const full = decorate(entity, entityRows(entity), true);
            const selected = full.filter((row) => ids.length === 0 || ids.includes(localIdOf(row)));
            return {
                status: 200,
                data: {
                    entity,
                    issues: selected.flatMap((row) => (row.__issues as ValidationIssue[]) ?? []),
                    checkedAt: isoNow(),
                },
            };
        }

        if (second === 'compare') {
            const ids = (body.ids as string[]) ?? [];
            const full = decorate(entity, entityRows(entity), true);
            const selected = full.filter((row) => ids.includes(localIdOf(row)));
            return {
                status: 200,
                data: {
                    entity,
                    items: selected.map((row) => ({
                        localId: localIdOf(row),
                        localLabel: mappingRecord(entity, localIdOf(row))?.localLabel ?? localIdOf(row),
                        status: row.dataStatus,
                        comparison: row.__comparison as ComparisonRow[],
                        remote: row.__remote ?? null,
                    })),
                    generatedAt: isoNow(),
                },
            };
        }

        // detail
        const row = decorate(entity, entityRows(entity), true).find((item) => localIdOf(item) === second);
        if (!row) return { status: 404, data: { message: `Data ${definition.singular} tidak ditemukan.` } };

        const localId = localIdOf(row);
        const mapping = mappingRecord(entity, localId);
        const remote = (row.__remote as JsonObject | null) ?? null;
        const issues = (row.__issues as ValidationIssue[]) ?? [];
        const detailStatus = row.dataStatus as DataStatus;
        const detailSynced = detailStatus === 'SYNCED' || detailStatus === 'SUCCESS';
        const detailAction: 'INSERT' | 'UPDATE' | 'SKIP' =
            definition.acts.syncCapability === 'read-only'
                ? 'SKIP'
                : detailSynced
                  ? 'SKIP'
                  : mapping?.externalId
                    ? 'UPDATE'
                    : definition.acts.syncCapability === 'update-only'
                      ? 'SKIP'
                      : 'INSERT';
        const act = detailAction === 'UPDATE' ? (definition.acts.update ?? definition.acts.insert ?? definition.acts.list) : (definition.acts.insert ?? definition.acts.list);

        const detailBuilt = buildPayload(act, {
            entity,
            localId,
            action: detailAction,
            values: row,
            existing: mapping?.externalId ? ({ id: mapping.externalId } as JsonObject) : null,
            issues,
            resolve: resolveExternalId,
            resolveReference,
            version: mockState.status.serverVersion,
            dictionaryFields: mockState.dictionary ? (getActDefinition(act)?.recordFields ?? []).map((field) => field.key) : null,
        });

        const payloadItem: PayloadPreviewItem = {
            localId,
            localLabel: mapping?.localLabel ?? localId,
            act,
            entity,
            action: detailAction,
            status: detailStatus,
            record: detailAction === 'SKIP' ? {} : detailBuilt.record,
            skippedFields: detailBuilt.skippedFields,
            issues,
            dependencies: checkDependencies(entity, row, { resolveExternalId }),
        };

        const history = mockState.logs.filter((log) => log.entity === entity && log.localId === localId).slice(0, 25);
        const lastLog = history[0] ?? null;

        const detail: EntityDetail = {
            entity,
            local: row as unknown as JsonObject,
            remote,
            comparison: (row.__comparison as ComparisonRow[]) ?? [],
            mappingStatus: (row.mappingStatus as MappingStatus) ?? 'UNMAPPED',
            dataStatus: row.dataStatus as never,
            pddiktiId: (row.pddiktiId as string | null) ?? null,
            issues,
            dependencies: checkDependencies(entity, row, { resolveExternalId }),
            payload: payloadItem,
            history,
            rawLast: {
                request: (lastLog?.payload as never) ?? null,
                response: (lastLog?.response as never) ?? null,
            },
            fields: Object.keys(row)
                .filter((key) => !key.startsWith('__'))
                .map((key) => ({ key, label: key, pddiktiField: null, value: (row[key] ?? null) as never })),
        };

        return { status: 200, data: detail };
    }

    return { status: 404, data: { message: `Endpoint mock "${request.path}" tidak dikenali.` } };
};

/** Dipakai modul lain untuk tipe baris generik. */
export type MockRowMap = RowMap;

export { mappingStats };
export const referenceSummaryList = (): ReferenceItem[] => referenceList.flatMap((definition) => referenceItems(definition.key));
