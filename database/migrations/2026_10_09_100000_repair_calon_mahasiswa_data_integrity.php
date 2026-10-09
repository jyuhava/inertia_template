<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Repairs the integrity problems found in `calon_mahasiswas`:
 *
 *  1. Duplicate `no_pendaftaran`. Registration numbers were generated with
 *     `count() + 1`, which re-uses a number as soon as any row is deleted, so
 *     `PMB20260002` and `PMB20260016` were each issued twice. Because uploads
 *     are stored under `pmb/dokumen/{no_pendaftaran}/`, two applicants shared
 *     one document folder.
 *  2. Two applicant rows pointing at the same `users` row. The dashboard looks
 *     applicants up with `where('user_id', ...)->first()`, so one applicant
 *     was served another person's record.
 *  3. The `unique` indexes the original create-migration declares are missing
 *     in production, which is why the duplicates above were accepted silently.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->renumberDuplicateRegistrations();
        $this->detachSharedUserAccounts();
        $this->restoreUniqueIndexes();
    }

    public function down(): void
    {
        foreach (['no_pendaftaran', 'nik', 'email'] as $column) {
            if ($this->hasUniqueIndex('calon_mahasiswas', $column)) {
                Schema::table('calon_mahasiswas', function (Blueprint $table) use ($column) {
                    $table->dropUnique([$column]);
                });
            }
        }
    }

    /**
     * Give every duplicated registration number to a single applicant.
     *
     * The applicant that already has uploads keeps the number, so the document
     * folder referenced by `upload_dokumen_pmb.file_path` stays valid and no
     * file has to be moved on disk.
     */
    private function renumberDuplicateRegistrations(): void
    {
        $duplicates = DB::table('calon_mahasiswas')
            ->select('no_pendaftaran', DB::raw('COUNT(*) as total'))
            ->groupBy('no_pendaftaran')
            ->having('total', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            $rows = DB::table('calon_mahasiswas')
                ->where('no_pendaftaran', $duplicate->no_pendaftaran)
                ->orderBy('id')
                ->get();

            $pemilik = $this->pickNumberOwner($rows);

            foreach ($rows as $row) {
                if ($row->id === $pemilik->id) {
                    continue;
                }

                DB::table('calon_mahasiswas')
                    ->where('id', $row->id)
                    ->update(['no_pendaftaran' => $this->nextFreeNumber($this->prefixOf($duplicate->no_pendaftaran))]);
            }
        }
    }

    /**
     * Keep the number whose documents are already on disk; otherwise the
     * lowest id, so the result is deterministic.
     */
    private function pickNumberOwner($rows)
    {
        if (Schema::hasTable('upload_dokumen_pmb')) {
            foreach ($rows as $row) {
                $ada = DB::table('upload_dokumen_pmb')
                    ->where('calon_mahasiswa_id', $row->id)
                    ->exists();

                if ($ada) {
                    return $row;
                }
            }
        }

        return $rows->first();
    }

    /**
     * Release applicant rows that are not really owned by the shared account.
     *
     * `user_id` is nullable, so clearing it detaches the stray row without
     * losing its data or granting anyone access to another applicant's record.
     */
    private function detachSharedUserAccounts(): void
    {
        $sharedUsers = DB::table('calon_mahasiswas')
            ->whereNotNull('user_id')
            ->select('user_id', DB::raw('COUNT(*) as total'))
            ->groupBy('user_id')
            ->having('total', '>', 1)
            ->pluck('user_id');

        foreach ($sharedUsers as $userId) {
            $rows = DB::table('calon_mahasiswas')
                ->where('user_id', $userId)
                ->orderBy('id')
                ->get();

            // Prefer the row whose email matches the account: that is the
            // applicant the account was actually created for.
            $userEmail = DB::table('users')->where('id', $userId)->value('email');

            $pemilik = $userEmail !== null
                ? ($rows->firstWhere('email', $userEmail) ?? $rows->first())
                : $rows->first();

            foreach ($rows as $row) {
                if ($row->id !== $pemilik->id) {
                    DB::table('calon_mahasiswas')
                        ->where('id', $row->id)
                        ->update(['user_id' => null]);
                }
            }
        }
    }

    private function restoreUniqueIndexes(): void
    {
        foreach (['no_pendaftaran', 'nik', 'email'] as $column) {
            if ($this->hasUniqueIndex('calon_mahasiswas', $column)) {
                continue;
            }

            Schema::table('calon_mahasiswas', function (Blueprint $table) use ($column) {
                $table->unique($column);
            });
        }
    }

    private function hasUniqueIndex(string $table, string $column): bool
    {
        return Schema::hasIndex($table, $table . '_' . $column . '_unique')
            || Schema::hasIndex($table, $column);
    }

    /**
     * The year prefix of an existing number, e.g. "PMB2026".
     */
    private function prefixOf(string $noPendaftaran): string
    {
        if (preg_match('/^(PMB\d{4})/', $noPendaftaran, $m) === 1) {
            return $m[1];
        }

        return sprintf('PMB%d', now()->year);
    }

    private function nextFreeNumber(string $prefix): string
    {
        $terakhir = DB::table('calon_mahasiswas')
            ->where('no_pendaftaran', 'like', $prefix . '%')
            ->orderByDesc('no_pendaftaran')
            ->value('no_pendaftaran');

        $urutan = $terakhir !== null
            ? ((int) substr($terakhir, strlen($prefix))) + 1
            : 1;

        do {
            $kandidat = $prefix . str_pad($urutan, 4, '0', STR_PAD_LEFT);
            $urutan++;
        } while (DB::table('calon_mahasiswas')->where('no_pendaftaran', $kandidat)->exists());

        return $kandidat;
    }
};