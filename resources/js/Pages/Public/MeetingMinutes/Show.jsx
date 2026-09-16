import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d);
}

function StatusBadge({ status }) {
    const map = {
        pending: 'bg-gray-100 text-gray-600',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
    };
    const labels = {
        pending: 'Menunggu',
        in_progress: 'Dalam Progress',
        completed: 'Selesai',
        overdue: 'Terlambat',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
            {labels[status] || status}
        </span>
    );
}

/**
 * Halaman publik notulen rapat (tanpa login).
 * Akses dibatasi hanya notulen yang is_public = true dengan token valid.
 */
export default function PublicMeetingMinuteShow({ meeting }) {
    const employeeMap = useMemo(() => {
        const map = {};
        // PIC names dan creator sudah diresolusi server-side? tidak; fallback ditangani di bawah.
        return map;
    }, []);

    const attendeesNames = useMemo(() => {
        // attendees berupa array id — nama tidak disertakan di halaman publik
        // (privacy: hanya tampilkan jumlah & inisial dari id jika perlu). Untuk
        // konsistensi, tampilkan "Peserta (N)" saja.
        return (meeting.attendees || []).length;
    }, [meeting.attendees]);

    const progressItems = (meeting.agenda_items || []).map((item) => ({
        ...item,
        effectiveStatus:
            item.is_overdue && item.status !== 'completed' ? 'overdue' : item.status,
    }));

    const averageProgress = useMemo(() => {
        const items = meeting.agenda_items || [];
        if (items.length === 0) return 0;
        const total = items.reduce((sum, item) => sum + (item.progress_percentage || 0), 0);
        return Math.round(total / items.length);
    }, [meeting.agenda_items]);

    return (
        <div className="min-h-dvh bg-gray-50">
            <Head title={meeting.title} />

            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                            Notulen Rapat Publik
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Published
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{meeting.title}</h1>

                    <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                        <p><span className="font-medium text-gray-500">Divisi:</span> {meeting.division}</p>
                        <p><span className="font-medium text-gray-500">Tanggal:</span> {formatDate(meeting.meeting_date)}</p>
                        <p><span className="font-medium text-gray-500">Lokasi:</span> {meeting.location}</p>
                        <p>
                            <span className="font-medium text-gray-500">Dibuat oleh:</span>{' '}
                            {meeting.creator?.name || '-'}
                        </p>
                    </div>

                    {meeting.description && (
                        <p className="mt-4 text-sm text-gray-600">{meeting.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-3 py-1">Peserta: {attendeesNames}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">Agenda: {meeting.agenda_items?.length || 0}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">Rata-rata Progress: {averageProgress}%</span>
                    </div>
                </div>

                {/* Agenda */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Agenda Rapat</h2>

                    {progressItems.length === 0 ? (
                        <p className="text-sm text-gray-400">Belum ada agenda item.</p>
                    ) : (
                        <div className="space-y-4">
                            {progressItems.map((item) => (
                                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                                {item.item_number}
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Pembahasan</h3>
                                                <p className="text-sm text-gray-700">{item.discussion}</p>
                                                <h3 className="mt-3 font-semibold text-gray-900">Keputusan</h3>
                                                <p className="text-sm text-gray-700">{item.decision}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={item.effectiveStatus} />
                                    </div>

                                    {item.deadline && (
                                        <p className="mt-3 text-sm text-gray-600">
                                            <span className="font-medium text-gray-500">Deadline:</span>{' '}
                                            {formatDate(item.deadline)}
                                        </p>
                                    )}

                                    <div className="mt-4">
                                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                            <span>Progress</span>
                                            <span className="font-semibold text-gray-700">
                                                {item.progress_percentage ?? 0}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className={`h-full rounded-full transition-all ${item.progress_color || 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(100, item.progress_percentage ?? 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attachments */}
                {(meeting.attachments || []).length > 0 && (
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Lampiran</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(meeting.attachments || []).map((att) => (
                                <a
                                    key={att.id}
                                    href={`/storage/${att.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-indigo-50 text-lg">
                                        {att.file_type === 'image' ? '🖼' : att.file_type === 'pdf' ? '📄' : '📎'}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-indigo-600">
                                            {att.original_name}
                                        </span>
                                        {att.description && (
                                            <span className="block truncate text-xs text-gray-500">
                                                {att.description}
                                            </span>
                                        )}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <p className="mt-8 text-center text-xs text-gray-400">
                    Dokumen ini dibagikan secara publik melalui tautan rahasia. Jangan sebarkan tanpa izin.
                </p>

                <div className="text-center">
                    <a href="/" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        ← Kembali ke Beranda
                    </a>
                </div>
            </div>
        </div>
    );
}