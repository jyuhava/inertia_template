/**
 * Membaca body response secara aman.
 *
 * Endpoint AI bisa membalas HTML (halaman error / timeout / halaman login)
 * alih-alih JSON. Calling response.json() langsung pada body HTML akan
 * melempar "Unexpected token '<'", sehingga pesan aslinya hilang. Fungsi ini
 * selalu mengembalikan objek: payload JSON bila ada, atau objek berisi
 * pesan error yang bisa dibaca manusia.
 */
export async function readJsonResponse(response) {
    let raw = '';
    try {
        raw = await response.text();
    } catch {
        return { ok: false, payload: { message: 'Gagal membaca respons dari server.' } };
    }

    if (!raw.trim()) {
        if (response.status === 419) {
            return {
                ok: false,
                payload: { message: 'Sesi Anda habis. Muat ulang halaman lalu coba lagi.' },
            };
        }

        return {
            ok: false,
            payload: {
                message: `Server tidak mengirim data (HTTP ${response.status}). Proses mungkin terlalu lama, silakan coba lagi.`,
            },
        };
    }

    try {
        return { ok: response.ok, payload: JSON.parse(raw) };
    } catch {
        // Body HTML: kemungkinan halaman error, timeout, atau 502 dari proxy.
        const isHtml = /^\s*<(!doctype|html)/i.test(raw);
        const status = response.status;

        let message = `Permintaan gagal (HTTP ${status}).`;
        if (isHtml && (status === 419 || status === 401)) {
            message = 'Sesi Anda habis. Muat ulang halaman lalu coba lagi.';
        } else if (isHtml) {
            message =
                'Layanan AI membutuhkan waktu lama dan koneksi terputus. '
                + 'Silakan coba lagi, atau persingkat permintaan Anda.';
        }

        return { ok: false, payload: { message } };
    }
}

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Menunggu hasil pekerjaan AI yang dijalankan di antrean server.
 *
 * Generate materi butuh 1-2 menit, jadi request awal hanya mengantre
 * pekerjaan. Fungsi ini melakukan polling status berkala, memperbarui
 * teks status lewat onTick, lalu mengembalikan konten hasil.
 */
export async function pollAiJob(jobId, onTick) {
    if (!jobId) {
        throw new Error('ID pekerjaan AI tidak diterima dari server.');
    }

    const startedAt = Date.now();
    const elapsedLabel = () => Math.round((Date.now() - startedAt) / 1000);

    // Tunggu antrean mulai tergarbeit sedikit, lalu poll berkala.
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        const response = await fetch(route('dosen.lms.ai.jobs.status', jobId), {
            headers: { Accept: 'application/json' },
        });

        const { ok, payload } = await readJsonResponse(response);
        if (!ok) {
            throw new Error(payload?.message || 'Gagal memeriksa status pekerjaan AI.');
        }

        if (payload.status === 'done') {
            if (!payload.content) {
                throw new Error('AI selesai tetapi materinya kosong. Silakan coba lagi.');
            }
            return payload.content;
        }

        if (payload.status === 'failed') {
            throw new Error(payload.message || 'AI gagal membuat materi.');
        }

        onTick?.(
            payload.status === 'processing'
                ? `AI sedang menulis materi... (${elapsedLabel()} dtk)`
                : `Menunggu antrean AI... (${elapsedLabel()} dtk)`,
        );
    }

    throw new Error('Waktu tunggu habis. Materi mungkin sudah selesai — silakan muat ulang halaman.');
}
