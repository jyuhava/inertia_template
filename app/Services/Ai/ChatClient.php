<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Klien AI terpusat untuk seluruh fitur berbasis LLM di aplikasi ini.
 *
 * Semua fitur AI (tanya materi, generate draft materi) memakai kelas ini,
 * sehingga mengganti provider cukup lewat config + .env tanpa menyentuh
 * controller atau service lain.
 *
 * Format request/response mengikuti standar OpenAI (chat/completions).
 */
class ChatClient
{
    /**
     * @throws RuntimeException
     */
    public function chat(array $messages): string
    {
        $apiKey = config('services.atria.api_key');

        if (! $apiKey) {
            throw new RuntimeException('ATRIA_API_KEY belum diatur di environment.');
        }

        $response = Http::timeout((int) config('services.atria.timeout', 120))
            ->withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])
            ->post(config('services.atria.base_url').'/chat/completions', [
                'model' => config('services.atria.model'),
                'messages' => $messages,
            ]);

        if (! $response->successful()) {
            $error = data_get($response->json(), 'error.message')
                ?: data_get($response->json(), 'message')
                ?: 'Gagal memproses permintaan AI.';

            throw new RuntimeException($error, $response->status());
        }

        $content = data_get($response->json(), 'choices.0.message.content', '');

        // Beberapa gateway mengirim konten sebagai array of part.
        if (is_array($content)) {
            $content = collect($content)->pluck('text')->filter()->implode("\n");
        }

        $content = trim((string) $content);

        if ($content === '') {
            throw new RuntimeException('Model tidak mengembalikan jawaban.');
        }

        return $content;
    }
}
