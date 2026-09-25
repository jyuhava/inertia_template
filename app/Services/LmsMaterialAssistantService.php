<?php

namespace App\Services;

use App\Models\LmsMaterial;
use App\Services\Ai\ChatClient;

class LmsMaterialAssistantService
{
    public function __construct(private readonly ChatClient $ai) {}

    public function answer(LmsMaterial $material, string $question, array $history = []): string
    {
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

        return $this->ai->chat($messages);
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
