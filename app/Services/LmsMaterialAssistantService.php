<?php

namespace App\Services;

use App\Models\LmsMaterial;
use Illuminate\Support\Facades\Http;

class LmsMaterialAssistantService
{
    public function answer(LmsMaterial $material, string $question, array $history = []): string
    {
        $apiKey = config('services.openrouter.api_key');
        if (! $apiKey) {
            throw new \RuntimeException('OPENROUTER_API_KEY belum diatur.');
        }

        $context = $this->buildMaterialContext($material);

        $messages = [
            [
                'role' => 'system',
                'content' => "Kamu adalah asisten pembelajaran untuk satu materi kuliah tertentu. "
                    ."Jawab hanya berdasarkan konteks materi yang diberikan. "
                    ."Jika pertanyaan di luar materi, tolak dengan sopan dan arahkan ke topik materi ini saja. "
                    ."Gunakan Bahasa Indonesia yang ringkas, jelas, dan akademik.",
            ],
            [
                'role' => 'system',
                'content' => "KONTEKS MATERI:\n{$context}",
            ],
        ];

        foreach (array_slice($history, -8) as $item) {
            $role = $item['role'] ?? null;
            $content = trim((string) ($item['content'] ?? ''));

            if (! in_array($role, ['user', 'assistant'], true) || $content === '') {
                continue;
            }

            $messages[] = [
                'role' => $role,
                'content' => $content,
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => trim($question),
        ];

        $response = Http::timeout(120)
            ->withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name'),
            ])
            ->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'openai/gpt-oss-120b:free',
                'messages' => $messages,
                'reasoning' => [
                    'enabled' => true,
                ],
            ]);

        if (! $response->successful()) {
            $error = data_get($response->json(), 'error.message') ?: 'Gagal memproses chat AI.';
            throw new \RuntimeException($error);
        }

        $content = data_get($response->json(), 'choices.0.message.content', '');

        if (is_array($content)) {
            $content = collect($content)->pluck('text')->filter()->implode("\n");
        }

        $content = trim((string) $content);

        if ($content === '') {
            throw new \RuntimeException('Model tidak mengembalikan jawaban.');
        }

        return $content;
    }

    private function buildMaterialContext(LmsMaterial $material): string
    {
        $title = $material->title ?? '-';
        $type = $material->type ?? '-';
        $chapterTitle = $material->chapter?->title ?? '-';
        $courseName = $material->chapter?->course?->jadwalKuliah?->mataKuliah?->nama_mata_kuliah ?? '-';

        $rawText = trim(strip_tags((string) ($material->content ?? '')));
        $normalized = preg_replace('/\s+/', ' ', $rawText) ?? '';
        $contentSnippet = mb_substr($normalized, 0, 12000);

        return "Judul: {$title}\n"
            ."Tipe: {$type}\n"
            ."Bab: {$chapterTitle}\n"
            ."Mata Kuliah: {$courseName}\n"
            ."Isi Materi (teks):\n{$contentSnippet}";
    }
}
