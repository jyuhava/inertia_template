<?php

namespace App\Services\Integrator;

use App\Models\IntegratorSetting;
use App\Models\IntegratorSyncJobItem;
use App\Models\Semester;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Read-only adapter from existing SIAKAD Eloquent models to Integrator DTOs. */
class IntegratorEntityService
{
    public function __construct(
        private readonly IntegratorMappingService $mappings,
        private readonly IntegratorValidationService $validator,
        private readonly IntegratorDependencyService $dependencies,
        private readonly IntegratorPayloadService $payloads,
        private readonly IntegratorConnectionService $connection,
    ) {}

    /** @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    public function list(string $entity, array $params = []): array
    {
        $definition = IntegratorEntityRegistry::def($entity);
        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = max(1, min(250, (int) ($params['perPage'] ?? 25)));
        $dataStatusFilter = strtoupper((string) ($params['dataStatus'] ?? ''));
        $mappingStatusFilter = strtoupper((string) ($params['mappingStatus'] ?? ''));
        $computedInvalidFilter = $dataStatusFilter === 'INVALID' || $mappingStatusFilter === 'INVALID';

        if ($definition['source'] === 'config') {
            $all = [$this->institutionRow()];
            $search = mb_strtolower(trim((string) ($params['search'] ?? '')));
            if ($search !== '') {
                $all = array_values(array_filter($all, static fn (array $row): bool => str_contains(mb_strtolower(json_encode($row) ?: ''), $search)));
            }
            if ($computedInvalidFilter) {
                $all = array_values(array_filter($all, static fn (array $row): bool => $row['dataStatus'] === 'INVALID'));
            }
            $total = count($all);
            $stats = $this->statsForRows($entity, $all);
            $rows = array_slice($all, ($page - 1) * $perPage, $perPage);
        } else {
            $query = $this->queryFor($entity, $params);
            if ($query === null) {
                $rows = [];
                $total = 0;
                $stats = $this->zeroStats();
            } else {
                $this->applySearch($query, $entity, (string) ($params['search'] ?? ''));
                $this->applySimpleFilters($query, $entity, $params);
                $this->applyMappingStatusFilter($query, $entity, $params);
                $this->applyDataStatusFilter($query, $entity, $params);
                $this->applySort($query, $entity, (string) ($params['sort'] ?? ''), (string) ($params['direction'] ?? 'asc'));

                if ($computedInvalidFilter) {
                    $allRows = $this->formatModels($entity, $query->get());
                    $allRows = array_values(array_filter($allRows, static fn (array $row): bool => $row['dataStatus'] === 'INVALID'));
                    $total = count($allRows);
                    $stats = $this->statsForRows($entity, $allRows);
                    $rows = array_slice($allRows, ($page - 1) * $perPage, $perPage);
                } else {
                    $total = (clone $query)->count();
                    $models = $query->forPage($page, $perPage)->get();
                    $rows = $this->formatModels($entity, $models);
                    $stats = $this->statsForQuery($entity, $query, $total);
                }
            }
        }

        return [
            'data' => $rows,
            'meta' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'lastPage' => max(1, (int) ceil($total / $perPage)),
            ],
            'stats' => $stats,
            'entity' => $entity,
            'capability' => $definition['syncCapability'],
            'capabilityNote' => $definition['capabilityNote'],
            'acts' => $definition['acts'],
        ];
    }

    /** @param array<string, mixed> $params
     * @return list<array<string,mixed>>
     */
    public function allRows(string $entity, array $params = [], ?array $ids = null): array
    {
        $definition = IntegratorEntityRegistry::def($entity);
        if ($definition['source'] === 'config') {
            $row = $this->institutionRow();

            return $ids === null || in_array((string) $row['localId'], array_map('strval', $ids), true) ? [$row] : [];
        }

        $query = $this->queryFor($entity, $params);
        if ($query === null) {
            return [];
        }

        $this->applySearch($query, $entity, (string) ($params['search'] ?? ''));
        $this->applySimpleFilters($query, $entity, $params);
        if ($ids !== null) {
            if ($ids === []) {
                return [];
            }
            $query->whereIn($query->getModel()->getQualifiedKeyName(), $ids);
        }

        $models = $query->orderBy($query->getModel()->getQualifiedKeyName())->get();

        return $this->formatModels($entity, $models);
    }

    /** Visit normalized rows in bounded chunks, avoiding a full-table model load. */
    public function scanRows(string $entity, callable $callback, array $params = []): void
    {
        $definition = IntegratorEntityRegistry::def($entity);
        if ($definition['source'] === 'config') {
            $callback($this->institutionRow());

            return;
        }
        $query = $this->queryFor($entity, $params);
        if ($query === null) {
            return;
        }
        $this->applySearch($query, $entity, (string) ($params['search'] ?? ''));
        $this->applySimpleFilters($query, $entity, $params);
        $query->chunkById(250, function (Collection $models) use ($entity, $callback): void {
            foreach ($this->formatModels($entity, $models, false) as $row) {
                $callback($row);
            }
        });
    }

    /** @return array<string,mixed> */
    public function find(string $entity, int|string $id): array
    {
        $definition = IntegratorEntityRegistry::def($entity);
        if ($definition['source'] === 'config') {
            if ((string) $id !== '1') {
                abort(404, 'Data tidak ditemukan.');
            }

            return $this->institutionRow();
        }

        $query = $this->queryFor($entity, []);
        if ($query === null) {
            abort(404, 'Sumber data entitas ini belum tersedia di SIAKAD.');
        }

        $model = $query->find($id);
        if (! $model instanceof Model) {
            abort(404, 'Data tidak ditemukan.');
        }

        return $this->formatModels($entity, collect([$model]))[0];
    }

    /** @return array<string,mixed> */
    public function detail(string $entity, int|string $id): array
    {
        $row = $this->find($entity, $id);
        $meta = $this->mappingMeta($entity, (string) $row['localId']);
        $issues = $this->validator->validateRow($entity, $row);
        $comparison = $this->compareRows($entity, [$row])[0]['comparison'];
        $payload = $this->previewItems($entity, [$row], true)[0] ?? null;
        $last = IntegratorSyncJobItem::query()
            ->where('entity', $entity)
            ->where('local_id', (string) $row['localId'])
            ->latest('created_at')
            ->first();

        $remote = $this->remoteFromLog($last?->response);
        $fields = [];
        foreach (IntegratorFieldMap::forEntity($entity) as $field) {
            $fields[] = [
                'key' => $field['local'],
                'label' => $field['label'],
                'pddiktiField' => $field['remote'],
                'value' => $row[$field['local']] ?? null,
            ];
        }

        return [
            'entity' => $entity,
            'local' => $row,
            'remote' => $remote,
            'comparison' => $comparison,
            'mappingStatus' => $row['mappingStatus'],
            'dataStatus' => $row['dataStatus'],
            'pddiktiId' => $row['pddiktiId'],
            'issues' => $issues,
            'dependencies' => $this->dependencies->check($entity, $row),
            'payload' => $payload,
            'history' => $this->historyFor($entity, (string) $row['localId']),
            'rawLast' => [
                'request' => $last?->payload,
                'response' => $last?->response,
            ],
            'fields' => $fields,
        ];
    }

    /** @param list<string> $ids
     * @return array<string,mixed>
     */
    public function preview(string $entity, array $ids, bool $dryRun = true): array
    {
        $rows = $this->allRows($entity, [], $ids);
        $items = $this->previewItems($entity, $rows, $dryRun);
        $summary = ['total' => count($items), 'ready' => 0, 'invalid' => 0, 'warning' => 0, 'conflict' => 0, 'skipped' => 0];

        foreach ($items as $item) {
            $blocking = collect($item['issues'])->contains(fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true));
            if ($item['action'] === 'SKIP' || ! $item['dependencies']['ok']) {
                $summary['skipped']++;
            } elseif ($blocking) {
                $summary['invalid']++;
            } else {
                $summary['ready']++;
            }
            if (collect($item['issues'])->contains(fn (array $issue): bool => $issue['severity'] === 'warning')) {
                $summary['warning']++;
            }
            if ($item['status'] === 'CONFLICT') {
                $summary['conflict']++;
            }
        }

        return [
            'entity' => $entity,
            'act' => IntegratorEntityRegistry::act($entity, 'insert') ?? IntegratorEntityRegistry::act($entity, 'update') ?? '',
            'dryRun' => $dryRun,
            'generatedAt' => now()->toISOString(),
            'items' => $items,
            'summary' => $summary,
        ];
    }

    /** @param list<string> $ids
     * @return array<string,mixed>
     */
    public function validate(string $entity, array $ids = []): array
    {
        $rows = $this->allRows($entity, [], $ids === [] ? null : $ids);

        return [
            'entity' => $entity,
            'issues' => $this->validator->validateRows($entity, $rows),
            'checkedAt' => now()->toISOString(),
        ];
    }

    /** @param list<string> $ids
     * @return array<string,mixed>
     */
    public function compare(string $entity, array $ids): array
    {
        $rows = $this->allRows($entity, [], $ids);

        return [
            'entity' => $entity,
            'items' => $this->compareRows($entity, $rows),
            'generatedAt' => now()->toISOString(),
        ];
    }

    /** @param list<array<string,mixed>> $rows
     * @return list<array<string,mixed>>
     */
    public function compareRows(string $entity, array $rows): array
    {
        $result = [];
        foreach ($rows as $row) {
            $last = IntegratorSyncJobItem::query()
                ->where('entity', $entity)
                ->where('local_id', (string) $row['localId'])
                ->whereNotNull('response')
                ->latest('created_at')
                ->first();
            $remote = $this->remoteFromLog($last?->response);
            $comparisons = [];
            $identityConflict = false;

            foreach (IntegratorFieldMap::forEntity($entity) as $field) {
                if ($field['remote'] === null || ($field['noCompare'] ?? false)) {
                    continue;
                }
                $localValue = $row[$field['local']] ?? null;
                $remoteValue = $remote[$field['remote']] ?? null;
                if ($remote === null) {
                    $status = $row['pddiktiId'] === null ? 'MISSING_PDDIKTI' : 'UNVERIFIED';
                } elseif ($this->valuesEqual($localValue, $remoteValue)) {
                    $status = 'MATCH';
                } elseif ($localValue === null || $localValue === '') {
                    $status = 'MISSING_LOCAL';
                } elseif ($remoteValue === null || $remoteValue === '') {
                    $status = 'MISSING_PDDIKTI';
                } else {
                    $status = 'DIFFERENT';
                }
                if ($status === 'DIFFERENT' && ($field['identity'] ?? false)) {
                    $identityConflict = true;
                }
                $comparisons[] = [
                    'field' => $field['remote'],
                    'label' => $field['label'],
                    'local' => is_scalar($localValue) || $localValue === null ? $localValue : json_encode($localValue),
                    'remote' => is_scalar($remoteValue) || $remoteValue === null ? $remoteValue : json_encode($remoteValue),
                    'status' => $status,
                    'identity' => (bool) ($field['identity'] ?? false),
                ];
            }

            $result[] = [
                'localId' => (string) $row['localId'],
                'localLabel' => (string) ($row['localLabel'] ?? $row['nama'] ?? $row['nim'] ?? $row['kode'] ?? $row['localId']),
                'status' => $identityConflict ? 'CONFLICT' : ($remote === null ? 'UNVERIFIED' : 'DIFFERENT'),
                'comparison' => $comparisons,
                'remote' => $remote,
            ];
        }

        return $result;
    }

    /** @return array<string,mixed> */
    public function mappingMeta(string $entity, string $localId): array
    {
        return $this->mappings->metaFor($entity, [$localId])[$localId] ?? [];
    }

    /** @param list<Model> $models
     * @return list<array<string,mixed>>
     */
    private function formatModels(string $entity, Collection $models, bool $includeValidation = true): array
    {
        $ids = $models->map(static fn (Model $model): string => (string) $model->getKey())->all();
        $allMeta = $this->mappings->metaFor($entity, $ids);
        $result = [];

        foreach ($models as $model) {
            $id = (string) $model->getKey();
            $row = $this->serializeModel($entity, $model);
            $meta = $allMeta[$id] ?? $this->emptyMeta();
            $issues = $includeValidation ? $this->validator->validateRow($entity, array_merge($row, ['localId' => $id])) : [];
            $hasBlockingIssue = $includeValidation && collect($issues)->contains(fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true));
            $mappingStatus = $meta['externalId'] ? 'MAPPED' : 'UNMAPPED';
            $dataStatus = $this->dataStatus($entity, $meta, $hasBlockingIssue);

            $result[] = array_merge($row, [
                'localId' => $id,
                'localLabel' => $this->labelFrom($entity, $row),
                'mappingStatus' => $mappingStatus,
                'dataStatus' => $dataStatus,
                'pddiktiId' => $meta['externalId'] ?? null,
                'pddiktiLabel' => $meta['externalLabel'] ?? null,
                'lastSyncAt' => $meta['lastSyncedAt'] ?? null,
                'lastAction' => $this->normalizeLastAction($meta['lastAction'] ?? null),
                'lastSyncMessage' => $meta['lastMessage'] ?? null,
                'issues' => count($issues),
                'conflictFields' => [],
            ]);
        }

        return $result;
    }

    /** @return array<string,mixed> */
    private function serializeModel(string $entity, Model $model): array
    {
        return match ($entity) {
            'prodi' => [
                'id' => (int) $model->id,
                'kodeProdi' => (string) $model->kode_prodi,
                'namaProdi' => (string) $model->nama_prodi,
                'jenjang' => (string) $model->jenjang,
                'status' => (string) $model->status,
                'fakultas' => null,
                'totalMataKuliah' => (int) ($model->mata_kuliahs_count ?? 0),
                'totalMahasiswa' => (int) ($model->mahasiswas_count ?? 0),
            ],
            'semester' => $this->semesterRow($model),
            'dosen' => $this->lecturerRow($model),
            'mahasiswa' => $this->studentRow($model),
            'riwayat-pendidikan' => $this->educationHistoryRow($model),
            'kurikulum' => $this->curriculumRow($model),
            'mata-kuliah' => $this->courseRow($model),
            'mata-kuliah-kurikulum' => $this->curriculumCourseRow($model),
            'kelas' => $this->classRow($model),
            'dosen-pengajar' => $this->lecturerAssignmentRow($model),
            'krs' => $this->registrationItemRow($model),
            'nilai' => $this->gradeRow($model),
            default => ['id' => (int) $model->getKey()],
        };
    }

    /** @return array<string,mixed> */
    private function institutionRow(): array
    {
        $profile = config('integrator.institusi', []);
        $row = [
            'id' => 1,
            'kodePt' => (string) ($profile['kode_pt'] ?? ''),
            'namaPt' => (string) ($profile['nama_pt'] ?? config('app.name', '')),
            'singkatan' => (string) ($profile['singkatan'] ?? ''),
            'alamat' => (string) ($profile['alamat'] ?? ''),
            'telepon' => (string) ($profile['telepon'] ?? ''),
            'email' => (string) ($profile['email'] ?? ''),
            'website' => (string) ($profile['website'] ?? ''),
            'npwp' => (string) ($profile['npwp'] ?? ''),
            'akreditasi' => (string) ($profile['akreditasi'] ?? ''),
            'kota' => (string) ($profile['kota'] ?? ''),
        ];
        $meta = $this->mappings->metaFor('perguruan-tinggi', ['1'])['1'] ?? $this->emptyMeta();
        $issues = $this->validator->validateRow('perguruan-tinggi', $row);

        return array_merge($row, [
            'localId' => '1',
            'localLabel' => $row['namaPt'],
            'mappingStatus' => $meta['externalId'] ? 'MAPPED' : 'UNMAPPED',
            'dataStatus' => $meta['externalId'] ? 'MAPPED' : 'UNMAPPED',
            'pddiktiId' => $meta['externalId'],
            'pddiktiLabel' => $meta['externalLabel'],
            'lastSyncAt' => $meta['lastSyncedAt'],
            'lastAction' => $this->normalizeLastAction($meta['lastAction']),
            'issues' => count($issues),
            'conflictFields' => [],
        ]);
    }

    /** @return array<string,mixed> */
    private function semesterRow(Model $model): array
    {
        $academicYear = $model->tahunAjaran;
        $code = $this->mappings->pddiktiSemesterCode($model);
        $localCode = $academicYear?->nama_tahun_ajaran
            ? $academicYear->nama_tahun_ajaran.'-'.($model->nama_semester === 'Ganjil' ? 'G' : 'E')
            : (string) $model->id;

        return [
            'id' => (int) $model->id,
            'kode' => $localCode,
            'namaSemester' => (string) $model->nama_semester,
            'tahunAjaran' => (string) ($academicYear?->nama_tahun_ajaran ?? ''),
            'tanggalMulai' => $this->dateValue($model->tanggal_mulai),
            'tanggalSelesai' => $this->dateValue($model->tanggal_selesai),
            'status' => (string) $model->status,
            'pddiktiKode' => $this->mappings->externalIdFor('semester', $model->id) ?? $code,
            'periodeId' => null,
            'periodeNama' => null,
        ];
    }

    /** @return array<string,mixed> */
    private function lecturerRow(Model $model): array
    {
        $homebase = $model->homebaseAktif;
        $prodi = $homebase?->prodi;

        return [
            'id' => (int) $model->id,
            'nip' => $model->nip,
            'nidn' => $model->nidn,
            'nidk' => $model->nidk,
            'nuptk' => $model->nuptk,
            'nama' => (string) $model->nama_lengkap,
            'prodiId' => $prodi?->id,
            'prodiNama' => $prodi?->nama_prodi,
            'jenisKelamin' => (string) $model->jenis_kelamin,
            'status' => (string) $model->status,
            'statusKepegawaian' => $model->status_kepegawaian,
            'jabatanAkademik' => $model->jabatan_akademik,
            'bidangKeahlian' => $model->bidang_keahlian,
            'email' => $model->email,
            'noHp' => $model->no_hp,
            'agama' => $model->agama,
            'tempatLahir' => $model->tempat_lahir,
            'tanggalLahir' => $this->dateValue($model->tanggal_lahir),
        ];
    }

    /** @return array<string,mixed> */
    private function studentRow(Model $model): array
    {
        $prodi = $model->prodi;
        $registration = $model->registrasiTerbaru;
        $semesterCode = null;
        if ($registration?->periode_masuk) {
            $semesterCode = $this->semesterCodeFromRegistration((string) $registration->periode_masuk, (string) ($registration->tanggal_masuk?->format('n') ?? ''));
        }

        return [
            'id' => (int) $model->id,
            'nim' => (string) $model->nim,
            'nama' => (string) $model->nama_lengkap,
            'prodiId' => $model->prodi_id ? (int) $model->prodi_id : null,
            'prodiNama' => (string) ($prodi?->nama_prodi ?? ''),
            'angkatan' => (string) $model->angkatan,
            'jenisKelamin' => (string) $model->jenis_kelamin,
            'tempatLahir' => (string) $model->tempat_lahir,
            'tanggalLahir' => $this->dateValue($model->tanggal_lahir),
            'agama' => (string) $model->agama,
            'kewarganegaraan' => (string) ($model->kewarganegaraan ?? 'Indonesia'),
            'alamat' => (string) $model->alamat,
            'noHp' => (string) $model->no_hp,
            'email' => (string) $model->email,
            'nik' => $model->no_ktp,
            'nisn' => $model->nisn,
            'status' => (string) $model->status,
            'semesterMasuk' => $semesterCode,
            'jalurMasuk' => $registration?->jalur_masuk,
            'jenisPendaftaran' => $registration?->jenis_pendaftaran,
            'pembiayaan' => null,
            'tanggalMasuk' => $this->dateValue($registration?->tanggal_masuk),
        ];
    }

    /** @return array<string,mixed> */
    private function educationHistoryRow(Model $model): array
    {
        $student = $model->mahasiswa;
        $prodi = $model->prodi;

        return [
            'id' => (int) $model->id,
            'mahasiswaId' => (int) $model->mahasiswa_id,
            'nim' => (string) ($student?->nim ?? ''),
            'nama' => (string) ($student?->nama_lengkap ?? ''),
            'prodiId' => (int) $model->prodi_id,
            'prodiNama' => (string) ($prodi?->nama_prodi ?? ''),
            'semesterId' => null,
            'jenisPendaftaran' => $model->jenis_pendaftaran,
            'jalurMasuk' => $model->jalur_masuk,
            'semesterMasuk' => $this->semesterCodeFromRegistration((string) $model->periode_masuk, (string) ($model->tanggal_masuk?->format('n') ?? '')),
            'pembiayaan' => null,
            'biayaMasuk' => null,
            'tanggalMasuk' => $this->dateValue($model->tanggal_masuk),
        ];
    }

    /** @return array<string,mixed> */
    private function curriculumRow(Model $model): array
    {
        return [
            'id' => (int) $model->id,
            'kode' => (string) $model->kode,
            'nama' => (string) $model->nama,
            'prodiId' => (int) $model->prodi_id,
            'prodiNama' => (string) ($model->prodi?->nama_prodi ?? ''),
            'tahunMulai' => (string) ($model->semesterMulai?->tahunAjaran?->nama_tahun_ajaran ?? ''),
            'tahunSelesai' => $model->semesterSelesai?->tahunAjaran?->nama_tahun_ajaran,
            'totalSks' => (float) $model->total_sks_wajib,
            'jumlahMataKuliah' => (int) ($model->kurikulum_mata_kuliahs_count ?? $model->kurikulumMataKuliahs()->count()),
            'status' => (string) $model->status,
            'semesterMulai' => $model->semesterMulai?->nama_semester,
        ];
    }

    /** @return array<string,mixed> */
    private function courseRow(Model $model): array
    {
        return [
            'id' => (int) $model->id,
            'kode' => (string) $model->kode_mata_kuliah,
            'nama' => (string) $model->nama_mata_kuliah,
            'sks' => (float) $model->sks,
            'sksTeori' => (float) ($model->theory_credits ?? $model->sks),
            'sksPraktik' => (float) ($model->practical_credits ?? 0),
            'jenis' => (string) $model->jenis,
            'semester' => (int) $model->semester,
            'prodiId' => (int) $model->prodi_id,
            'prodiNama' => (string) ($model->prodi?->nama_prodi ?? ''),
            'status' => (string) $model->status,
            'kelompok' => $model->kategori?->nama,
        ];
    }

    /** @return array<string,mixed> */
    private function curriculumCourseRow(Model $model): array
    {
        $course = $model->mataKuliah;
        $curriculum = $model->kurikulum;
        $credits = $model->sks_override ?? $course?->sks ?? 0;

        return [
            'id' => (int) $model->id,
            'kurikulumId' => (int) $model->kurikulum_id,
            'kodeKurikulum' => (string) ($curriculum?->kode ?? ''),
            'prodiId' => (int) ($curriculum?->prodi_id ?? 0),
            'prodiNama' => (string) ($curriculum?->prodi?->nama_prodi ?? ''),
            'mataKuliahId' => (int) $model->mata_kuliah_id,
            'kodeMk' => (string) ($course?->kode_mata_kuliah ?? ''),
            'namaMk' => (string) ($course?->nama_mata_kuliah ?? ''),
            'sks' => (float) $credits,
            'semester' => (int) $model->semester,
            'wajib' => (bool) $model->is_wajib,
            'pddiktiId' => $this->mappings->externalIdFor('mata-kuliah-kurikulum', $model->id),
        ];
    }

    /** @return array<string,mixed> */
    private function classRow(Model $model): array
    {
        $course = $model->mataKuliah;
        $semester = $model->semester;
        $instructors = $model->pengajars->map(static fn ($assignment): ?string => $assignment->dosen?->nama_lengkap)
            ->filter()->values()->all();

        return [
            'id' => (int) $model->id,
            'kodeKelas' => (string) $model->kode_kelas,
            'namaKelas' => (string) ($model->nama_kelas ?: $model->nama_lengkap),
            'mataKuliahId' => (int) $model->mata_kuliah_id,
            'kodeMk' => (string) ($course?->kode_mata_kuliah ?? ''),
            'namaMk' => (string) ($course?->nama_mata_kuliah ?? ''),
            'sks' => (float) ($course?->sks ?? 0),
            'prodiId' => $course?->prodi_id ? (int) $course->prodi_id : null,
            'prodiNama' => (string) ($course?->prodi?->nama_prodi ?? ''),
            'semesterId' => (int) $model->semester_id,
            'semesterNama' => (string) ($semester?->nama_semester ?? ''),
            'periodeNama' => trim(($semester?->tahunAjaran?->nama_tahun_ajaran ?? '').' '.($semester?->nama_semester ?? '')),
            'kurikulumId' => $model->kurikulum_id ? (int) $model->kurikulum_id : null,
            'kapasitas' => (int) $model->kapasitas,
            'terisi' => (int) ($model->terisi_count ?? $model->jumlah_terdaftar),
            'tipeKelas' => (string) $model->tipe_kelas,
            'status' => (string) $model->status,
            'dosenPengajar' => $instructors,
            'jumlahDosen' => count($instructors),
        ];
    }

    /** @return array<string,mixed> */
    private function lecturerAssignmentRow(Model $model): array
    {
        $class = $model->kelasKuliah;
        $course = $class?->mataKuliah;
        $semester = $class?->semester;
        $lecturer = $model->dosen;

        return [
            'id' => (int) $model->id,
            'kelasId' => (int) $model->kelas_kuliah_id,
            'kodeKelas' => (string) ($class?->kode_kelas ?? ''),
            'namaKelas' => (string) ($class?->nama_kelas ?: $class?->nama_lengkap ?? ''),
            'dosenId' => (int) $model->dosen_id,
            'nim' => (string) ($lecturer?->nidn ?? $lecturer?->nidk ?? ''),
            'nama' => (string) ($lecturer?->nama_lengkap ?? ''),
            'prodiId' => $course?->prodi_id ? (int) $course->prodi_id : null,
            'prodiNama' => (string) ($course?->prodi?->nama_prodi ?? ''),
            'semesterId' => (int) ($class?->semester_id ?? 0),
            'periodeNama' => trim(($semester?->tahunAjaran?->nama_tahun_ajaran ?? '').' '.($semester?->nama_semester ?? '')),
            'peran' => (string) $model->peran,
        ];
    }

    /** @return array<string,mixed> */
    private function registrationItemRow(Model $model): array
    {
        $registration = $model->registration;
        $student = $registration?->mahasiswa;
        $class = $model->kelasKuliah;
        $course = $class?->mataKuliah;
        $semester = $class?->semester;

        return [
            'id' => (int) $model->id,
            'mahasiswaId' => (int) ($registration?->mahasiswa_id ?? 0),
            'nim' => (string) ($student?->nim ?? ''),
            'namaMahasiswa' => (string) ($student?->nama_lengkap ?? ''),
            'kelasId' => $class?->id ? (int) $class->id : null,
            'kodeKelas' => $class?->kode_kelas,
            'kodeMk' => $course?->kode_mata_kuliah,
            'namaMk' => $course?->nama_mata_kuliah,
            'sks' => (float) $model->sks_snapshot,
            'prodiId' => $student?->prodi_id ? (int) $student->prodi_id : null,
            'prodiNama' => (string) ($student?->prodi?->nama_prodi ?? ''),
            'semesterId' => $class?->semester_id ? (int) $class->semester_id : null,
            'periodeNama' => (string) ($registration?->periodeKrs?->nama_periode ?? trim(($semester?->tahunAjaran?->nama_tahun_ajaran ?? '').' '.($semester?->nama_semester ?? ''))),
            'statusKrs' => (string) ($registration?->status ?? ''),
            'pddiktiPesertaId' => $this->mappings->externalIdFor('krs', $model->id),
        ];
    }

    /** @return array<string,mixed> */
    private function gradeRow(Model $model): array
    {
        $student = $model->mahasiswa;
        $schedule = $model->jadwalKuliah;
        $course = $schedule?->mataKuliah;
        $semester = $schedule?->semester;
        $classId = $this->resolveClassId($schedule?->mata_kuliah_id, $schedule?->semester_id, $model->mahasiswa_id);

        return [
            'id' => (int) $model->id,
            'mahasiswaId' => (int) $model->mahasiswa_id,
            'nim' => (string) ($student?->nim ?? ''),
            'namaMahasiswa' => (string) ($student?->nama_lengkap ?? ''),
            'kelasId' => $classId,
            'kodeKelas' => $classId ? (string) (DB::table('kelas_kuliahs')->where('id', $classId)->value('kode_kelas') ?? '') : null,
            'kodeMk' => $course?->kode_mata_kuliah,
            'namaMk' => $course?->nama_mata_kuliah,
            'sks' => (float) ($course?->sks ?? 0),
            'nilaiAngka' => $model->nilai_akhir === null ? null : (float) $model->nilai_akhir,
            'nilaiHuruf' => $model->nilai_huruf,
            'bobot' => $model->nilai_angka === null ? null : (float) $model->nilai_angka,
            'prodiId' => $student?->prodi_id ? (int) $student->prodi_id : null,
            'prodiNama' => (string) ($student?->prodi?->nama_prodi ?? ''),
            'semesterId' => $schedule?->semester_id ? (int) $schedule->semester_id : null,
            'pddiktiPesertaId' => $classId ? $this->mappings->externalIdFor('krs', $model->mahasiswa_id.':'.$classId) : null,
            'periodeNama' => (string) ($model->periodeKrs?->nama_periode ?? trim(($semester?->tahunAjaran?->nama_tahun_ajaran ?? '').' '.($semester?->nama_semester ?? ''))),
            'statusNilai' => (string) $model->status,
        ];
    }

    private function resolveClassId(mixed $courseId, mixed $semesterId, mixed $studentId): ?int
    {
        if (! is_numeric($courseId) || ! is_numeric($semesterId)) {
            return null;
        }

        if (is_numeric($studentId)) {
            $enrolled = DB::table('student_course_registration_items as item')
                ->join('student_course_registrations as registration', 'registration.id', '=', 'item.registration_id')
                ->join('kelas_kuliahs as kelas', 'kelas.id', '=', 'item.kelas_kuliah_id')
                ->where('registration.mahasiswa_id', (int) $studentId)
                ->where('item.mata_kuliah_id', (int) $courseId)
                ->where('kelas.semester_id', (int) $semesterId)
                ->where('item.status', 'active')
                ->whereNull('kelas.deleted_at')
                ->distinct()->limit(2)->pluck('kelas.id');
            if ($enrolled->count() === 1) {
                return (int) $enrolled->first();
            }
            if ($enrolled->count() > 1) {
                return null;
            }
        }

        $matches = DB::table('kelas_kuliahs')
            ->where('mata_kuliah_id', (int) $courseId)
            ->where('semester_id', (int) $semesterId)
            ->whereNull('deleted_at')
            ->limit(2)
            ->pluck('id');

        return $matches->count() === 1 ? (int) $matches->first() : null;
    }

    private function semesterCodeFromRegistration(string $period, string $month): ?string
    {
        if (! preg_match('/^(\d{4})\s*\/\s*\d{4}$/', trim($period), $matches)) {
            return null;
        }
        if ($month === '') {
            return null;
        }

        // Prefer matching an actual SIAKAD semester by its academic year and
        // half-year. If no mapping exists, do not synthesize an external ID.
        $name = (int) $month <= 1 || (int) $month >= 7 ? 'Ganjil' : 'Genap';
        $semester = Semester::query()->whereHas('tahunAjaran', fn ($q) => $q->where('nama_tahun_ajaran', $period))
            ->where('nama_semester', $name)->first();

        return $semester ? $this->mappings->externalIdFor('semester', $semester->id) : null;
    }

    /** @param array<string,mixed> $meta */
    private function dataStatus(string $entity, array $meta, bool $hasBlockingIssue): string
    {
        if ($hasBlockingIssue) {
            return 'INVALID';
        }
        if (in_array($meta['syncStatus'] ?? null, ['error', 'failed'], true)) {
            return 'FAILED';
        }
        if (($meta['externalId'] ?? null) === null) {
            return in_array(IntegratorEntityRegistry::def($entity)['syncCapability'], ['full', 'update-only', 'assignment-only'], true)
                ? 'NEW'
                : 'UNMAPPED';
        }
        if (in_array($meta['syncStatus'] ?? null, ['synced', 'mapped'], true) && ($meta['lastSyncedAt'] ?? null) !== null) {
            return 'SYNCED';
        }

        return 'MAPPED';
    }

    private function normalizeLastAction(?string $action): ?string
    {
        return match (strtoupper((string) $action)) {
            'INSERT', 'INSERT_BIODATA', 'INSERT_RECORD' => 'INSERT',
            'UPDATE', 'UPDATE_BIODATA', 'UPDATE_RECORD' => 'UPDATE',
            'SKIP' => 'SKIP',
            default => null,
        };
    }

    /** @param array<string,mixed> $row */
    private function labelFrom(string $entity, array $row): string
    {
        foreach (['nama', 'namaPt', 'namaProdi', 'namaSemester', 'namaMk', 'namaKelas', 'namaMahasiswa', 'judul', 'nim', 'kode', 'kodeProdi', 'kodeKelas'] as $key) {
            if (isset($row[$key]) && (string) $row[$key] !== '') {
                if (in_array($entity, ['mahasiswa', 'nilai', 'krs'], true) && isset($row['nim'])) {
                    return trim((string) $row['nim'].' — '.(string) ($row['nama'] ?? $row['namaMahasiswa'] ?? ''));
                }
                if ($entity === 'kelas' && isset($row['kodeMk'])) {
                    return trim((string) $row['kodeMk'].' — '.(string) $row['namaKelas']);
                }

                return (string) $row[$key];
            }
        }

        return (string) ($row['localId'] ?? '');
    }

    /** @return array<string,mixed> */
    private function emptyMeta(): array
    {
        return ['externalId' => null, 'externalCode' => null, 'externalLabel' => null, 'mappingType' => null, 'confidence' => null, 'lastSyncedAt' => null, 'lastMessage' => null, 'lastAction' => null, 'syncStatus' => null];
    }

    private function dateValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value instanceof \DateTimeInterface ? $value->format('Y-m-d') : substr((string) $value, 0, 10);
    }

    /** @param array<string,mixed> $params */
    private function queryFor(string $entity, array $params): ?Builder
    {
        $definition = IntegratorEntityRegistry::def($entity);
        if ($definition['source'] !== 'model') {
            return null;
        }
        $model = IntegratorEntityRegistry::modelClass($entity);
        if ($model === null) {
            return null;
        }

        /** @var Builder $query */
        $query = $model::query();
        switch ($entity) {
            case 'prodi':
                $query->withCount(['mataKuliahs', 'mahasiswas']);
                break;
            case 'semester':
                $query->with('tahunAjaran');
                break;
            case 'dosen':
                $query->with('homebaseAktif.prodi');
                break;
            case 'mahasiswa':
                $query->with(['prodi', 'registrasiTerbaru']);
                break;
            case 'riwayat-pendidikan':
                $query->with(['mahasiswa', 'prodi']);
                break;
            case 'kurikulum':
                $query->withCount('kurikulumMataKuliahs')->with(['prodi', 'semesterMulai.tahunAjaran', 'semesterSelesai.tahunAjaran']);
                break;
            case 'mata-kuliah':
                $query->with(['prodi', 'kategori']);
                break;
            case 'mata-kuliah-kurikulum':
                $query->with(['kurikulum.prodi', 'mataKuliah']);
                break;
            case 'kelas':
                $query->with(['mataKuliah.prodi', 'semester.tahunAjaran', 'pengajars.dosen'])
                    ->withCount(['registrationItems as terisi_count' => fn ($q) => $q->where('status', 'active')
                        ->whereHas('registration', fn ($registration) => $registration->whereIn('status', ['draft', 'submitted', 'revision', 'approved', 'locked']))]);
                break;
            case 'dosen-pengajar':
                $query->with(['kelasKuliah.mataKuliah.prodi', 'kelasKuliah.semester.tahunAjaran', 'dosen']);
                break;
            case 'krs':
                $query->with(['registration.mahasiswa.prodi', 'registration.periodeKrs.semester.tahunAjaran', 'kelasKuliah.mataKuliah.prodi', 'kelasKuliah.semester.tahunAjaran']);
                break;
            case 'nilai':
                $query->with(['mahasiswa.prodi', 'jadwalKuliah.mataKuliah.prodi', 'jadwalKuliah.semester.tahunAjaran', 'periodeKrs.semester.tahunAjaran']);
                break;
        }

        return $query;
    }

    private function applySearch(Builder $query, string $entity, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }
        $columns = IntegratorEntityRegistry::def($entity)['searchColumns'] ?? [];
        if ($columns === []) {
            return;
        }

        $query->where(function (Builder $where) use ($columns, $search): void {
            foreach ($columns as $column) {
                if (str_contains($column, '.')) {
                    [$relation, $field] = explode('.', $column, 2);
                    $where->orWhereHas($relation, fn (Builder $related) => $related->where($field, 'like', '%'.$search.'%'));
                } else {
                    $where->orWhere($column, 'like', '%'.$search.'%');
                }
            }
        });
    }

    /** @param array<string,mixed> $params */
    private function applySimpleFilters(Builder $query, string $entity, array $params): void
    {
        $prodiId = $params['prodiId'] ?? null;
        if ($prodiId !== null && $prodiId !== '' && $prodiId !== 'all') {
            match ($entity) {
                'prodi' => $query->whereKey($prodiId),
                'dosen' => $query->whereHas('homebaseAktif', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                'mahasiswa', 'mata-kuliah' => $query->where('prodi_id', $prodiId),
                'riwayat-pendidikan', 'kurikulum' => $query->where('prodi_id', $prodiId),
                'mata-kuliah-kurikulum' => $query->whereHas('kurikulum', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                'kelas' => $query->whereHas('mataKuliah', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                'dosen-pengajar' => $query->whereHas('kelasKuliah.mataKuliah', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                'krs' => $query->whereHas('kelasKuliah.mataKuliah', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                'nilai' => $query->whereHas('jadwalKuliah.mataKuliah', fn (Builder $q) => $q->where('prodi_id', $prodiId)),
                default => null,
            };
        }

        $periodId = $params['periodId'] ?? null;
        if ($periodId !== null && $periodId !== '' && $periodId !== 'all') {
            match ($entity) {
                'semester' => $query->whereKey($periodId),
                'kelas' => $query->where('semester_id', $periodId),
                'dosen-pengajar' => $query->whereHas('kelasKuliah', fn (Builder $q) => $q->where('semester_id', $periodId)),
                'krs' => $query->whereHas('kelasKuliah', fn (Builder $q) => $q->where('semester_id', $periodId)),
                'nilai' => $query->whereHas('jadwalKuliah', fn (Builder $q) => $q->where('semester_id', $periodId)),
                default => null,
            };
        }

        foreach (['status', 'angkatan', 'jenis', 'statusKepegawaian', 'statusKrs', 'statusNilai'] as $filter) {
            $value = $params[$filter] ?? null;
            if ($value === null || $value === '' || $value === 'all') {
                continue;
            }
            $column = match ($filter) {
                'angkatan' => 'angkatan',
                'jenis' => 'jenis',
                'statusKepegawaian' => 'status_kepegawaian',
                'statusKrs' => 'status',
                'statusNilai' => 'status',
                default => 'status',
            };
            if ($filter === 'statusKrs' && $entity === 'krs') {
                $databaseStatus = match ($value) {
                    'disetujui' => 'approved',
                    'terkunci' => 'locked',
                    'ditolak' => 'rejected',
                    default => $value,
                };
                $query->whereHas('registration', fn (Builder $registration) => $registration->where('status', $databaseStatus));
            } elseif ($filter === 'statusNilai' && $entity === 'nilai') {
                $databaseStatus = $value === 'belum_final' ? 'draft' : $value;
                $query->where('status', $databaseStatus);
            } elseif (in_array($filter, ['status', 'angkatan', 'jenis', 'statusKepegawaian'], true)) {
                $query->where($column, $value);
            }
        }
    }

    /** @param array<string,mixed> $params */
    private function applyMappingStatusFilter(Builder $query, string $entity, array $params): void
    {
        $status = strtoupper((string) ($params['mappingStatus'] ?? ''));
        if ($status === '' || $status === 'ALL') {
            return;
        }
        if ($status === 'INVALID') {
            return;
        }
        if ($status === 'CONFLICT') {
            $query->whereRaw('1 = 0');

            return;
        }

        $mapped = $status === 'MAPPED';
        $this->whereMappingExists($query, $entity, $mapped);
    }

    /** @param array<string,mixed> $params */
    private function applyDataStatusFilter(Builder $query, string $entity, array $params): void
    {
        $status = strtoupper((string) ($params['dataStatus'] ?? ''));
        if ($status === '' || in_array($status, ['ALL', 'INVALID'], true)) {
            return;
        }
        if ($status === 'CONFLICT') {
            $query->whereRaw('1 = 0');

            return;
        }
        if (in_array($status, ['NEW', 'UNMAPPED'], true)) {
            $this->whereMappingExists($query, $entity, false);

            return;
        }
        if (in_array($status, ['SYNCED', 'MAPPED', 'CHANGED'], true)) {
            $this->whereMappingExists($query, $entity, true);
            if ($status === 'SYNCED') {
                $this->whereSyncStatus($query, $entity, ['synced', 'mapped']);
            } elseif ($status === 'CHANGED') {
                $this->whereSyncStatus($query, $entity, ['not_synced', 'pending']);
            }

            return;
        }
        if ($status === 'FAILED') {
            $this->whereSyncStatus($query, $entity, ['failed', 'error']);
        }
    }

    private function whereMappingExists(Builder $query, string $entity, bool $mapped): void
    {
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            $hasId = is_string(IntegratorSetting::get('connection.pddikti_pt_id'));
            if ($mapped !== $hasId) {
                $query->whereRaw('1 = 0');
            }

            return;
        }

        [$table, $foreign, $external, $condition] = $this->mappingColumns($entity);
        if ($table === null) {
            $query->whereRaw('1 = 0');

            return;
        }
        $modelKey = $query->getModel()->getQualifiedKeyName();
        $mappingConstraint = function ($subquery) use ($table, $foreign, $external, $condition, $mapped, $modelKey): void {
            $subquery->selectRaw('1')->from($table);
            if ($condition !== null) {
                $subquery->where($condition[0], $condition[1]);
            }
            $subquery->whereColumn($table.'.'.$foreign, $modelKey);
            if ($mapped) {
                $subquery->whereNotNull($table.'.'.$external);
            } else {
                $subquery->whereNull($table.'.'.$external);
            }
        };

        if ($mapped) {
            $query->whereExists($mappingConstraint);
        } else {
            $query->whereNotExists(function ($subquery) use ($table, $foreign, $external, $condition, $modelKey): void {
                $subquery->selectRaw('1')->from($table);
                if ($condition !== null) {
                    $subquery->where($condition[0], $condition[1]);
                }
                $subquery->whereColumn($table.'.'.$foreign, $modelKey)
                    ->whereNotNull($table.'.'.$external);
            });
        }
    }

    /** @return array{0:?string,1:string,2:string,3:?array{0:string,1:mixed}} */
    private function mappingColumns(string $entity): array
    {
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_MAHASISWA) {
            return ['pddikti_mahasiswa_mappings', 'mahasiswa_id', 'pddikti_id', null];
        }
        if ($kind === IntegratorEntityRegistry::STORAGE_DOSEN) {
            return ['pddikti_dosen_mappings', 'dosen_id', 'pddikti_id', null];
        }
        $model = IntegratorEntityRegistry::modelClass($entity);

        return $model === null ? [null, 'id', 'external_id', null] : ['pddikti_akademik_mappings', 'entity_id', 'external_id', ['entity_type', $model]];
    }

    private function whereSyncStatus(Builder $query, string $entity, array $statuses): void
    {
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            return;
        }
        [$table, $foreign, $external, $condition] = $this->mappingColumns($entity);
        if ($table === null) {
            return;
        }
        $modelKey = $query->getModel()->getQualifiedKeyName();
        $statusColumn = $kind === IntegratorEntityRegistry::STORAGE_AKADEMIK ? 'sync_status' : 'status_mapping';
        $requireLastSync = in_array('synced', $statuses, true);
        $query->whereExists(function ($subquery) use ($table, $foreign, $condition, $statuses, $modelKey, $statusColumn, $requireLastSync): void {
            $subquery->selectRaw('1')->from($table);
            if ($condition !== null) {
                $subquery->where($condition[0], $condition[1]);
            }
            $subquery->whereColumn($table.'.'.$foreign, $modelKey)->whereIn($table.'.'.$statusColumn, $statuses);
            if ($requireLastSync) {
                $subquery->whereNotNull($table.'.last_synced_at');
            }
        });
    }

    private function applySort(Builder $query, string $entity, string $sort, string $direction): void
    {
        $columns = match ($entity) {
            'prodi' => ['kodeProdi' => 'kode_prodi', 'namaProdi' => 'nama_prodi', 'status' => 'status'],
            'semester' => ['namaSemester' => 'nama_semester', 'status' => 'status'],
            'dosen' => ['nama' => 'nama_lengkap', 'nidn' => 'nidn', 'nip' => 'nip', 'status' => 'status'],
            'mahasiswa' => ['nim' => 'nim', 'nama' => 'nama_lengkap', 'angkatan' => 'angkatan', 'status' => 'status'],
            'riwayat-pendidikan' => ['tanggalMasuk' => 'tanggal_masuk', 'noPendaftaran' => 'no_pendaftaran'],
            'kurikulum' => ['kode' => 'kode', 'nama' => 'nama', 'status' => 'status'],
            'mata-kuliah' => ['kode' => 'kode_mata_kuliah', 'nama' => 'nama_mata_kuliah', 'semester' => 'semester', 'status' => 'status'],
            'mata-kuliah-kurikulum' => ['semester' => 'semester', 'isWajib' => 'is_wajib'],
            'kelas' => ['kodeKelas' => 'kode_kelas', 'namaKelas' => 'nama_kelas', 'status' => 'status'],
            default => [],
        };
        $column = $columns[$sort] ?? 'id';
        $query->orderBy($column, strtolower($direction) === 'desc' ? 'desc' : 'asc');
    }

    /** @return array<string,int> */
    private function statsForQuery(string $entity, Builder $query, int $total): array
    {
        $mappedQuery = clone $query;
        $this->whereMappingExists($mappedQuery, $entity, true);
        $mapped = min((int) $mappedQuery->count(), $total);
        $unmapped = max(0, $total - $mapped);
        $syncedQuery = clone $query;
        $this->whereSyncStatus($syncedQuery, $entity, ['synced', 'mapped']);
        $synced = min((int) $syncedQuery->count(), $total);
        $invalid = $this->countInvalidRows($entity, $query);
        $failed = $this->failedCountForQuery($entity, $query);
        $capability = IntegratorEntityRegistry::def($entity)['syncCapability'];
        $canInsert = in_array($capability, ['full', 'assignment-only'], true);

        return [
            'total' => $total,
            'mapped' => $mapped,
            'unmapped' => $unmapped,
            'pddikti' => $mapped,
            'synced' => $synced,
            'willSend' => $canInsert ? max(0, $unmapped - $invalid) : 0,
            'willUpdate' => 0,
            'invalid' => $invalid,
            'failed' => $failed,
            'conflict' => 0,
            'new' => $unmapped,
            'changed' => 0,
            'valid' => max(0, $total - $invalid),
        ];
    }

    private function countInvalidRows(string $entity, Builder $query): int
    {
        $cacheKey = 'integrator.entity.invalid.'.sha1($entity.'|'.$query->toSql().'|'.serialize($query->getBindings()));

        return Cache::remember($cacheKey, now()->addSeconds(20), function () use ($entity, $query): int {
            $invalid = 0;
            $scan = clone $query;
            $scan->reorder()->chunkById(250, function (Collection $models) use ($entity, &$invalid): void {
                foreach ($this->formatModels($entity, $models) as $row) {
                    if ($row['dataStatus'] === 'INVALID') {
                        $invalid++;
                    }
                }
            });

            return $invalid;
        });
    }

    /** @param list<array<string,mixed>> $rows
     * @return array<string,int>
     */
    private function statsForRows(string $entity, array $rows): array
    {
        $total = count($rows);
        $mapped = count(array_filter($rows, static fn (array $row): bool => $row['pddiktiId'] !== null));
        $invalid = count(array_filter($rows, static fn (array $row): bool => $row['dataStatus'] === 'INVALID'));

        return [
            'total' => $total,
            'mapped' => $mapped,
            'unmapped' => max(0, $total - $mapped),
            'pddikti' => $mapped,
            'synced' => count(array_filter($rows, static fn (array $row): bool => $row['dataStatus'] === 'SYNCED')),
            'willSend' => 0,
            'willUpdate' => 0,
            'invalid' => $invalid,
            'failed' => 0,
            'conflict' => 0,
            'new' => 0,
            'changed' => 0,
            'valid' => max(0, $total - $invalid),
        ];
    }

    private function failedCountForQuery(string $entity, Builder $query): int
    {
        $failed = clone $query;
        $kind = IntegratorEntityRegistry::storageKind($entity);
        if ($kind === IntegratorEntityRegistry::STORAGE_NONE) {
            return 0;
        }
        $statusColumn = $kind === IntegratorEntityRegistry::STORAGE_AKADEMIK ? 'sync_status' : 'status_mapping';
        [$table, $foreign, , $condition] = $this->mappingColumns($entity);
        $key = $failed->getModel()->getQualifiedKeyName();
        $failed->whereExists(function ($subquery) use ($table, $foreign, $statusColumn, $condition, $key): void {
            $subquery->selectRaw('1')->from($table);
            if ($condition !== null) {
                $subquery->where($condition[0], $condition[1]);
            }
            $subquery->whereColumn($table.'.'.$foreign, $key)->whereIn($table.'.'.$statusColumn, ['failed', 'error']);
        });

        return (int) $failed->count();
    }

    /** @return array<string,mixed> */
    private function previewItem(string $entity, array $row, bool $dryRun): array
    {
        $issues = $this->validator->validateRow($entity, $row);
        $dependencies = $this->dependencies->check($entity, $row);
        $definition = IntegratorEntityRegistry::def($entity);
        $capability = $definition['syncCapability'];
        $mapped = ! empty($row['pddiktiId']);
        $action = 'SKIP';
        $act = '';

        if ($capability === 'full' || $capability === 'assignment-only') {
            if ($mapped && isset($definition['acts']['update'])) {
                $action = 'UPDATE';
                $act = $definition['acts']['update'];
            } elseif (! $mapped && isset($definition['acts']['insert'])) {
                $action = 'INSERT';
                $act = $definition['acts']['insert'];
            }
        } elseif ($capability === 'update-only' && $mapped && isset($definition['acts']['update'])) {
            $action = 'UPDATE';
            $act = $definition['acts']['update'];
        }

        if ($action === 'SKIP') {
            $updateOnlyWithoutMapping = $capability === 'update-only' && ! $mapped;
            $issues[] = [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'entity' => $entity,
                'localId' => (string) $row['localId'],
                'localLabel' => (string) ($row['localLabel'] ?? $row['localId']),
                'severity' => $updateOnlyWithoutMapping ? 'error' : 'info',
                'code' => $updateOnlyWithoutMapping ? 'UPDATE_TARGET_MISSING' : 'ENTITY_NOT_SENDABLE',
                'field' => null,
                'message' => $updateOnlyWithoutMapping ? 'Entitas update-only belum memiliki ID PDDikti; operasi insert tidak tersedia.' : $definition['capabilityNote'],
                'remediation' => $updateOnlyWithoutMapping ? 'Pastikan mahasiswa sudah terdaftar sebagai peserta kelas di PDDikti sebelum mengirim nilai.' : 'Kelola mapping atau gunakan act PDDikti yang memang tersedia; integrator tidak menjalankan operasi hapus.',
                'createdAt' => now()->toISOString(),
            ];
        }

        $transformed = $this->payloads->build($entity, $row, $action);
        $record = $transformed['record'];
        $skippedFields = $transformed['skippedFields'];
        array_push($issues, ...$transformed['issues']);

        if ($action !== 'SKIP' && ! $dryRun) {
            $verifiedActs = config('integrator.neofeeder.verified_write_acts', []);
            $writeAllowed = (bool) config('integrator.neofeeder.allow_write', false)
                && is_array($verifiedActs)
                && in_array($act, $verifiedActs, true)
                && $this->connection->isActVerified($act)
                && $this->connection->arePayloadFieldsVerified($act, array_keys($record));
            if (! $writeAllowed) {
                $issues[] = [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'entity' => $entity,
                    'localId' => (string) $row['localId'],
                    'localLabel' => (string) ($row['localLabel'] ?? $row['localId']),
                    'severity' => 'error',
                    'code' => 'LIVE_WRITE_NOT_ENABLED',
                    'field' => 'act',
                    'message' => 'Live write belum diaktifkan untuk act/field ini; request tidak akan dikirim.',
                    'remediation' => 'Uji pada sandbox, verifikasi dictionary dan payload, lalu konfigurasi INTEGRATOR_ALLOW_WRITE serta INTEGRATOR_VERIFIED_WRITE_ACTS di backend.',
                    'createdAt' => now()->toISOString(),
                ];
            }
        }

        $blocking = collect($issues)->contains(fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true));
        $status = $blocking ? 'INVALID' : ($action === 'SKIP' ? (string) ($row['dataStatus'] ?? 'UNMAPPED') : ($mapped ? 'CHANGED' : 'NEW'));
        if ($row['dataStatus'] === 'CONFLICT') {
            $status = 'CONFLICT';
            $action = 'SKIP';
            $record = [];
        }

        return [
            'localId' => (string) $row['localId'],
            'localLabel' => (string) ($row['localLabel'] ?? $row['nama'] ?? $row['nim'] ?? $row['localId']),
            'act' => $act,
            'entity' => $entity,
            'action' => $action,
            'status' => $status,
            'record' => $record,
            'skippedFields' => $skippedFields,
            'issues' => $issues,
            'dependencies' => $dependencies,
        ];
    }

    /** @param list<array<string,mixed>> $rows
     * @return list<array<string,mixed>>
     */
    private function previewItems(string $entity, array $rows, bool $dryRun): array
    {
        return array_map(fn (array $row): array => $this->previewItem($entity, $row, $dryRun), $rows);
    }

    /** @return list<array<string,mixed>> */
    private function historyFor(string $entity, string $localId): array
    {
        return IntegratorSyncJobItem::query()
            ->with('job.user')
            ->where('entity', $entity)
            ->where('local_id', $localId)
            ->latest('created_at')
            ->limit(25)
            ->get()
            ->map(fn (IntegratorSyncJobItem $item): array => $this->logDto($item))
            ->all();
    }

    /** @return array<string,mixed> */
    private function logDto(IntegratorSyncJobItem $item): array
    {
        $response = SensitiveDataSanitizer::sanitize($item->response);
        $responseArray = is_array($response) ? $response : [];
        $neoCode = data_get($responseArray, 'error_code');
        $neoMessage = data_get($responseArray, 'error_desc') ?? $item->message;

        return [
            'id' => (string) $item->id,
            'requestId' => (string) ($item->request_id ?? $item->id),
            'entity' => $item->entity,
            'localId' => (string) $item->local_id,
            'localLabel' => (string) ($item->local_label ?? ''),
            'pddiktiId' => $item->pddikti_id,
            'act' => $item->act,
            'action' => $item->action,
            'payload' => SensitiveDataSanitizer::sanitize($item->payload),
            'response' => $response,
            'httpStatus' => $item->response_code,
            'neoFeederCode' => is_numeric($neoCode) ? (int) $neoCode : null,
            'neoFeederMessage' => is_string($neoMessage) ? $neoMessage : null,
            'status' => $item->status === 'SUCCESS' ? 'success' : 'failed',
            'errorCategory' => $item->error_category,
            'durationMs' => (int) ($item->duration_ms ?? 0),
            'attempt' => (int) $item->attempts,
            'user' => (string) ($item->job?->created_by_name ?? '—'),
            'jobId' => $item->job_id,
            'createdAt' => $item->created_at?->toISOString(),
        ];
    }

    private function remoteFromLog(mixed $response): ?array
    {
        $response = SensitiveDataSanitizer::sanitize($response);
        if (! is_array($response)) {
            return null;
        }
        $data = $response['data'] ?? null;
        if (is_array($data) && array_is_list($data)) {
            $data = $data[0] ?? null;
        }

        return is_array($data) ? $data : null;
    }

    private function valuesEqual(mixed $left, mixed $right): bool
    {
        if ($left === null && $right === null) {
            return true;
        }
        if (is_numeric($left) && is_numeric($right)) {
            return (float) $left === (float) $right;
        }

        return mb_strtolower(trim((string) $left)) === mb_strtolower(trim((string) $right));
    }

    /** @return array<string,int> */
    private function zeroStats(): array
    {
        return ['total' => 0, 'mapped' => 0, 'unmapped' => 0, 'pddikti' => 0, 'synced' => 0, 'willSend' => 0, 'willUpdate' => 0, 'invalid' => 0, 'failed' => 0, 'conflict' => 0, 'new' => 0, 'changed' => 0, 'valid' => 0];
    }
}
