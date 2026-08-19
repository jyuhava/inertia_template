import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useMemo, useState } from 'react';

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-gray-100 text-gray-700 border-gray-200',
        published: 'bg-green-100 text-green-700 border-green-200',
        archived: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = { draft: 'Draft', published: 'Published', archived: 'Archived' };
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.draft}`}>
            {labels[status] || status}
        </span>
    );
}

function AgendaStatusBadge({ status, isOverdue }) {
    const effectiveStatus = isOverdue && status !== 'completed' ? 'overdue' : status;
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
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[effectiveStatus] || map.pending}`}>
            {labels[effectiveStatus] || effectiveStatus}
        </span>
    );
}

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

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

function ProgressModal({ item, employees, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        progress_percentage: item.progress_percentage ?? 0,
        status: item.status ?? 'pending',
        progress_notes: item.progress_notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('meeting-agenda-items.progress', item.id));
    };

    const inputClass =
        'mt-1 block w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Update Progress</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        &times;
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Persentase
                        </label>
                        <div className="mt-1 flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={data.progress_percentage}
                                onChange={(e) => setData('progress_percentage', Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <span className="w-12 text-right text-sm font-bold text-gray-900">
                                {data.progress_percentage}%
                            </span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={data.progress_percentage}
                            onChange={(e) => setData('progress_percentage', Number(e.target.value))}
                            className="mt-1 block w-24 border border-gray-300 px-2 py-1 text-sm"
                        />
                        {errors.progress_percentage && (
                            <p className="mt-1 text-xs text-red-600">{errors.progress_percentage}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                        </label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className={inputClass}
                        >
                            <option value="pending">Menunggu</option>
                            <option value="in_progress">Dalam Progress</option>
                            <option value="completed">Selesai</option>
                            <option value="overdue">Terlambat</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Catatan Progress
                        </label>
                        <textarea
                            value={data.progress_notes}
                            onChange={(e) => setData('progress_notes', e.target.value)}
                            rows="3"
                            className={inputClass}
                            placeholder="Catatan perkembangan (opsional)"
                        />
                        {errors.progress_notes && (
                            <p className="mt-1 text-xs text-red-600">{errors.progress_notes}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 ${
                                processing ? 'opacity-50' : ''
                            }`}
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Progress'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Show({ meeting, employees, canEdit }) {
    const [progressItem, setProgressItem] = useState(null);
    const [attachBusy, setAttachBusy] = useState(false);
    const [attachError, setAttachError] = useState('');
    const [copied, setCopied] = useState(false);

    const employeeMap = useMemo(() => {
        const map = {};
        (employees || []).forEach((emp) => {
            map[emp.id] = emp.name;
        });
        return map;
    }, [employees]);

    const attendees = (meeting.attendees || []).map((id) => ({
        id,
        name: employeeMap[id] || `User #${id}`,
    }));

    const handleStatusChange = (status) => {
        if (confirm(`Ubah status notulen menjadi ${status}?`)) {
            router.post(route('meeting-minutes.status', meeting.id), { status });
        }
    };

    const handleTogglePublic = () => {
        router.post(
            route('meeting-minutes.toggle-public', meeting.id),
            {},
            {
                onSuccess: () => window.location.reload(),
            },
        );
    };

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus notulen rapat ini?')) {
            router.delete(route('meeting-minutes.destroy', meeting.id));
        }
    };

    const handleUploadAttachment = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAttachBusy(true);
        setAttachError('');

        try {
            await router.post(
                route('meeting-minutes.attachments.upload', meeting.id),
                { file },
                {
                    forceFormData: true,
                    onSuccess: () => {
                        window.location.reload();
                    },
                },
            );
        } catch {
            setAttachError('Gagal mengupload file.');
        } finally {
            setAttachBusy(false);
            e.target.value = '';
        }
    };

    const handleDeleteAttachment = (attachmentId) => {
        if (confirm('Hapus lampiran ini?')) {
            router.delete(route('meeting-attachments.destroy', attachmentId));
        }
    };

    const handleCopyPublicUrl = () => {
        if (!meeting.public_url) return;
        navigator.clipboard
            ?.writeText(meeting.public_url)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {});
    };

    return (
        <AdminLayout title="Detail Notulen Rapat">
            <Head title={meeting.title} />

                    {/* Header */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <StatusBadge status={meeting.status} />
                                    {meeting.is_public && (
                                        <span className="inline-flex items-center rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                                            Publik
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
                                <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                                    <p><span className="font-medium text-gray-500">Divisi:</span> {meeting.division}</p>
                                    <p><span className="font-medium text-gray-500">Tanggal:</span> {formatDate(meeting.meeting_date)}</p>
                                    <p><span className="font-medium text-gray-500">Lokasi:</span> {meeting.location}</p>
                                    <p>
                                        <span className="font-medium text-gray-500">Dibuat oleh:</span>{' '}
                                        {meeting.creator?.name || '-'}
                                    </p>
                                </div>
                                {meeting.description && (
                                    <p className="mt-3 text-sm text-gray-600">{meeting.description}</p>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                                {canEdit && (
                                    <>
                                        <Link
                                            href={route('meeting-minutes.edit', meeting.id)}
                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusChange(meeting.status === 'published' ? 'draft' : 'published')}
                                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                        >
                                            {meeting.status === 'published' ? 'Tarik dari Published' : 'Publish'}
                                        </button>
                                        {meeting.status !== 'archived' ? (
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange('archived')}
                                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                                            >
                                                Arsipkan
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange('draft')}
                                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                                            >
                                                Buka Arsip
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleTogglePublic}
                                            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                                        >
                                            {meeting.is_public ? 'Tutup Publik' : 'Publikasikan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                                <Link
                                    href={route('meeting-minutes.index')}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Kembali
                                </Link>
                            </div>
                        </div>

                        {meeting.is_public && meeting.public_url && (
                            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                                        Link Publik (tanpa login)
                                    </p>
                                    <a
                                        href={meeting.public_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-sm font-medium text-sky-700 hover:underline"
                                    >
                                        {meeting.public_url}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyPublicUrl}
                                    className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                                >
                                    {copied ? 'Tersalin!' : 'Salin Link'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Attendees */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold text-gray-900">
                            Peserta ({attendees.length})
                        </h2>
                        {attendees.length === 0 ? (
                            <p className="text-sm text-gray-400">Belum ada peserta.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {attendees.map((person) => (
                                    <span
                                        key={person.id}
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                                    >
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                            {person.name.charAt(0).toUpperCase()}
                                        </span>
                                        {person.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Agenda Items */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Agenda Rapat ({meeting.agenda_items?.length || 0})
                        </h2>

                        {(!meeting.agenda_items || meeting.agenda_items.length === 0) && (
                            <p className="text-sm text-gray-400">Belum ada agenda item.</p>
                        )}

                        <div className="space-y-4">
                            {(meeting.agenda_items || []).map((item) => {
                                const picNames = (item.pic || []).map(
                                    (id) => employeeMap[id] || `User #${id}`,
                                );
                                return (
                                    <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
                                            <div className="shrink-0">
                                                <AgendaStatusBadge
                                                    status={item.status}
                                                    isOverdue={item.is_overdue}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                                            <p>
                                                <span className="font-medium text-gray-500">Deadline:</span>{' '}
                                                {formatDate(item.deadline)}
                                            </p>
                                            <div className="flex items-start gap-1">
                                                <span className="font-medium text-gray-500">PIC:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {picNames.length === 0 && <span className="text-gray-400">Belum ada PIC</span>}
                                                    {picNames.map((name, i) => (
                                                        <span
                                                            key={i}
                                                            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                                                        >
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress */}
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
                                            {item.progress_notes && (
                                                <p className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600">
                                                    {item.progress_notes}
                                                </p>
                                            )}
                                        </div>

                                        {canEdit && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setProgressItem(item)}
                                                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                >
                                                    Update Progress
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Lampiran</h2>
                            {canEdit && (
                                <label className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700">
                                    {attachBusy ? 'Mengupload...' : '+ Upload Lampiran'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleUploadAttachment}
                                        disabled={attachBusy}
                                    />
                                </label>
                            )}
                        </div>

                        {attachError && (
                            <p className="mb-3 rounded bg-red-50 p-2 text-xs text-red-600">{attachError}</p>
                        )}

                        {(meeting.attachments || []).length === 0 ? (
                            <p className="text-sm text-gray-400">Belum ada lampiran.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {(meeting.attachments || []).map((att) => (
                                    <div key={att.id} className="flex flex-col rounded-lg border border-gray-200 p-3">
                                        <div className="flex items-start gap-2">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-indigo-50 text-lg">
                                                {att.file_type === 'image' ? '🖼' : att.file_type === 'pdf' ? '📄' : '📎'}
                                            </span>
                                            <div className="min-w-0">
                                                <a
                                                    href={`/storage/${att.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block truncate text-sm font-medium text-indigo-600 hover:underline"
                                                >
                                                    {att.original_name}
                                                </a>
                                                <p className="text-xs text-gray-400">
                                                    {formatFileSize(att.file_size)}
                                                </p>
                                            </div>
                                        </div>
                                        {att.description && (
                                            <p className="mt-2 text-xs text-gray-500">{att.description}</p>
                                        )}
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAttachment(att.id)}
                                                className="mt-2 self-start rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Shares */}
                    {(meeting.shares || []).length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-3 text-lg font-semibold text-gray-900">Dibagikan ke</h2>
                            <div className="flex flex-wrap gap-2">
                                {(meeting.shares || []).map((share) => (
                                    <span
                                        key={share.id}
                                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                                    >
                                        {share.shared_to?.name || 'User'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

            {/* Modal Update Progress */}
            {progressItem && (
                <ProgressModal
                    item={progressItem}
                    employees={employees || []}
                    onClose={() => setProgressItem(null)}
                />
            )}
        </AdminLayout>
    );
}