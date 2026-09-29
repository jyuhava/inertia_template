<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Models\Prodi;
use App\Models\Semester;
use App\Services\Integrator\IntegratorMappingService;
use Illuminate\Http\JsonResponse;

class PeriodController extends Controller
{
    public function __construct(private readonly IntegratorMappingService $mappings) {}

    public function periods(): JsonResponse
    {
        $semesters = Semester::query()->with('tahunAjaran')
            ->orderByDesc('tahun_ajaran_id')->orderBy('nama_semester')->get();
        $ids = $semesters->map(static fn (Semester $semester): string => (string) $semester->id)->all();
        $meta = $this->mappings->metaFor('semester', $ids);
        $data = $semesters->map(function (Semester $semester) use ($meta): array {
            $id = (string) $semester->id;
            $mapping = $meta[$id] ?? [];
            $year = (string) ($semester->tahunAjaran?->nama_tahun_ajaran ?? '');

            return [
                'id' => (int) $semester->id,
                'kode' => $year.'-'.($semester->nama_semester === 'Ganjil' ? 'G' : 'E'),
                'namaSemester' => (string) $semester->nama_semester,
                'tahunAjaran' => $year,
                'tanggalMulai' => $semester->tanggal_mulai?->toDateString(),
                'tanggalSelesai' => $semester->tanggal_selesai?->toDateString(),
                'status' => (string) $semester->status,
                'pddiktiKode' => $mapping['externalId'] ?? null,
                'periodeId' => null,
                'periodeNama' => null,
                'mappingStatus' => ! empty($mapping['externalId']) ? 'MAPPED' : 'UNMAPPED',
                'pddiktiId' => $mapping['externalId'] ?? null,
            ];
        })->values();
        $active = $semesters->first(fn (Semester $semester): bool => $semester->status === 'aktif');

        return response()->json(['active' => $active?->id ? (int) $active->id : null, 'data' => $data]);
    }

    public function prodiOptions(): JsonResponse
    {
        $prodi = Prodi::query()->orderBy('nama_prodi')->get();
        $meta = $this->mappings->metaFor('prodi', $prodi->map(static fn (Prodi $row): string => (string) $row->id)->all());

        return response()->json($prodi->map(function (Prodi $row) use ($meta): array {
            $mapped = ! empty($meta[(string) $row->id]['externalId']);

            return [
                'value' => (string) $row->id,
                'label' => (string) $row->nama_prodi,
                'kode' => (string) $row->kode_prodi,
                'mapped' => $mapped,
            ];
        })->values());
    }
}
