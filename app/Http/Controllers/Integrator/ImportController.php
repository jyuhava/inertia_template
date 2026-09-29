<?php

namespace App\Http\Controllers\Integrator;

use App\Http\Controllers\Controller;
use App\Services\Integrator\IntegratorAuditService;
use App\Services\Integrator\IntegratorEntityRegistry;
use App\Services\Integrator\IntegratorValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ImportController extends Controller
{
    public function __construct(
        private readonly IntegratorValidationService $validator,
        private readonly IntegratorAuditService $audit,
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity' => ['required', 'string', 'max:40'],
            'format' => ['required', 'in:csv,json'],
            'content' => ['required', 'string', 'max:2097152'],
        ]);
        $entity = $validated['entity'];
        abort_unless(IntegratorEntityRegistry::exists($entity), 422, 'Entitas import tidak dikenal.');

        $rows = $this->parse($validated['format'], $validated['content']);
        if (count($rows) > 500) {
            throw ValidationException::withMessages(['content' => 'Preview impor dibatasi maksimal 500 baris.']);
        }

        $preview = [];
        $valid = 0;
        $invalid = 0;
        foreach ($rows as $index => $row) {
            $row['localId'] = 'import-'.($index + 1);
            $row['localLabel'] = (string) ($row['nama'] ?? $row['namaMahasiswa'] ?? $row['nim'] ?? $row['kode'] ?? 'Baris '.($index + 1));
            $issues = $this->validator->validateRow($entity, $row);
            $blocking = count(array_filter($issues, static fn (array $issue): bool => in_array($issue['severity'], ['critical', 'error'], true)));
            $blocking > 0 ? $invalid++ : $valid++;
            if ($index < 50) {
                unset($row['localId'], $row['localLabel']);
                $preview[] = ['index' => $index + 1, 'row' => $row, 'issues' => $issues, 'blocking' => $blocking];
            }
        }

        $this->audit->record($request, 'IMPORT_PREVIEW', $entity, null, count($rows), $valid, $invalid, ['format' => $validated['format']]);

        return response()->json([
            'entity' => $entity,
            'format' => $validated['format'],
            'total' => count($rows),
            'preview' => $preview,
            'summary' => ['valid' => $valid, 'invalid' => $invalid],
            'note' => 'Preview dan validasi saja: data belum disimpan atau dikirim ke PDDikti. Koreksi dan konfirmasi wajib dilakukan di SIAKAD sebagai sumber data utama.',
        ]);
    }

    /** @return list<array<string,mixed>> */
    private function parse(string $format, string $content): array
    {
        if ($format === 'json') {
            try {
                $decoded = json_decode($content, true, 64, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                throw ValidationException::withMessages(['content' => 'Isi JSON tidak valid.']);
            }
            if (isset($decoded['data']) && is_array($decoded['data'])) {
                $decoded = $decoded['data'];
            }
            if (! is_array($decoded) || ! array_is_list($decoded)) {
                throw ValidationException::withMessages(['content' => 'JSON harus berupa array objek, atau object dengan properti data berupa array.']);
            }
            foreach ($decoded as $index => $row) {
                if (! is_array($row)) {
                    throw ValidationException::withMessages(['content' => 'Baris JSON ke-'.($index + 1).' harus berupa object.']);
                }
            }

            return array_values($decoded);
        }

        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw ValidationException::withMessages(['content' => 'File CSV tidak dapat dibaca.']);
        }
        fwrite($stream, $content);
        rewind($stream);
        $headers = fgetcsv($stream, null, ',', '"', '\\');
        if (! is_array($headers) || $headers === []) {
            fclose($stream);
            throw ValidationException::withMessages(['content' => 'CSV harus memiliki header kolom.']);
        }
        $headers = array_map(static fn ($header): string => trim((string) $header), $headers);
        $rows = [];
        while (($values = fgetcsv($stream, null, ',', '"', '\\')) !== false) {
            if ($values === [null] || $values === []) {
                continue;
            }
            $row = [];
            foreach ($headers as $index => $header) {
                if ($header === '') {
                    continue;
                }
                $row[$header] = $values[$index] ?? null;
            }
            $rows[] = $row;
            if (count($rows) > 500) {
                break;
            }
        }
        fclose($stream);

        return $rows;
    }
}
