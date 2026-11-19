<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan field dokumen notulensi resmi (final) ke tabel meeting_minutes.
     * Berbeda dengan lampiran: satu dokumen resmi per notulen yang bisa diunduh
     * oleh semua user yang melihat notulen, termasuk via tautan publik.
     */
    public function up(): void
    {
        Schema::table('meeting_minutes', function (Blueprint $table) {
            $table->string('official_document_path')->nullable()->after('description');
            $table->string('official_document_name')->nullable()->after('official_document_path');
            $table->string('official_document_mime')->nullable()->after('official_document_name');
            $table->bigInteger('official_document_size')->nullable()->after('official_document_mime');
            $table->unsignedBigInteger('official_document_uploaded_by')->nullable()->after('official_document_size');
            $table->timestamp('official_document_uploaded_at')->nullable()->after('official_document_uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meeting_minutes', function (Blueprint $table) {
            $table->dropColumn([
                'official_document_path',
                'official_document_name',
                'official_document_mime',
                'official_document_size',
                'official_document_uploaded_by',
                'official_document_uploaded_at',
            ]);
        });
    }
};
