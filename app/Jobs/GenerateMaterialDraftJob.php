<?php

namespace App\Jobs;

use App\Models\AiJob;
use App\Models\LmsChapter;
use App\Services\Ai\ChatClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Menjalankan pembuatan draft materi AI di luar request HTTP.
 *
 * Dipakai karena panggilan LLM butuh 90-150 detik, sedangkan shared hosting
 * memutus request web di atas ~55 detik.
 */
class GenerateMaterialDraftJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /** Berapa kali percobaan sebelum menyerah. */
    public int $tries = 2;

    /** Job boleh berjalan jauh lebih lama karena tidak lagi di dalam request web. */
    public int $timeout = 600;

    public function __construct(public int $aiJobId) {}

    public function handle(ChatClient $ai): void
    {
        $aiJob = AiJob::find($this->aiJobId);

        if (! $aiJob || $aiJob->isFinished()) {
            return;
        }

        $aiJob->update(['status' => 'processing', 'started_at' => now(), 'error' => null]);

        try {
            $chapter = LmsChapter::with('course.jadwalKuliah.mataKuliah')->find($aiJob->input['chapter_id']);

            if (! $chapter) {
                throw new \RuntimeException('Bab tidak ditemukan, mungkin sudah dihapus.');
            }

            $courseName = $chapter->course?->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? 'Mata Kuliah';
            $prompt = (string) ($aiJob->input['prompt'] ?? '');

            $systemPrompt = "Kamu adalah asisten dosen untuk membuat materi kuliah berbahasa Indonesia. "
                ."Keluarkan konten dalam format HTML sederhana yang rapi (h2, h3, p, ul, ol, li, blockquote) "
                ."tanpa tag html/body/script. Fokus praktis, terstruktur, akademik, dan siap ditempel ke rich text editor.";

            $userPrompt = "Mata kuliah: {$courseName}\n"
                ."Bab: {$chapter->title}\n"
                ."Permintaan dosen: {$prompt}\n\n"
                ."Buat: judul materi singkat + isi materi lengkap.";

            $content = $ai->chat([
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ]);

            $aiJob->update([
                'status' => 'done',
                'result' => $content,
                'finished_at' => now(),
            ]);
        } catch (Throwable $e) {
            $aiJob->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ]);

            // Jangan lempar lagi: kegagalan AI adalah hasil yang valid untuk
            // pengguna, bukan error antrean. Tanpa ini job akan dicoba ulang
            // dan pengguna melihat "sedang diproses" tanpa henti.
            $this->fail($e);
        }
    }
}
