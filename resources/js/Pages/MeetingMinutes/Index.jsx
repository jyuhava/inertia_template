import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { useMemo, useState } from 'react';

function StatusBadge({ status }) {
    const map = {
        draft: 'bg-gray-100 text-gray-700 border-gray-200',
        published: 'bg-green-100 text-green-700 border-green-200',
        archived: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                map[status] || map.draft
            }`}
        >
            {labels[status] || status}
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

export default function Index({ meetings, employees, divisions, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [division, setDivision] = useState(filters.division || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const employeeMap = useMemo(() => {
        const map = {};
        (employees || []).forEach((emp) => {
            map[emp.id] = emp.name;
        });
        return map;
    }, [employees]);

    const meetingList = meetings?.data || [];

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(
            route('meeting-minutes.index'),
            { search, status, division, date_from: dateFrom, date_to: dateTo },
            { preserveState: true, preserveScroll: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');
        setDivision('');
        setDateFrom('');
        setDateTo('');
        router.get(route('meeting-minutes.index'), {}, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus notulen rapat ini?')) {
            router.delete(route('meeting-minutes.destroy', id));
        }
    };

    const inputClass =
        'w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

    return (
        <AdminLayout title="Notulen Rapat">
            <Head title="Notulen Rapat" />

                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Meeting Minutes</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Kelola notulen rapat, agenda, dan tindak lanjut.
                            </p>
                        </div>
                        <Link
                            href={route('meeting-minutes.create')}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            + Buat Notulen Baru
                        </Link>
                    </div>

                    {/* Filter bar */}
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Cari
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Judul / divisi / lokasi..."
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Divisi
                                </label>
                                <select
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Semua Divisi</option>
                                    {(divisions || []).map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Dari Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Sampai Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
                                <button
                                    type="submit"
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
                                >
                                    Terapkan Filter
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* List */}
                    {meetingList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                            <p className="text-sm text-gray-500">Belum ada notulen rapat.</p>
                            <p className="mt-1 text-sm text-gray-400">
                                Klik "Buat Notulen Baru" untuk memulai.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {meetingList.map((meeting) => {
                                const avgProgress = meeting.average_progress ?? 0;
                                return (
                                    <div
                                        key={meeting.id}
                                        className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <StatusBadge status={meeting.status} />
                                            {meeting.is_public && (
                                                <span className="inline-flex items-center rounded-full bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                                                    Publik
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900">
                                            <Link href={route('meeting-minutes.show', meeting.id)} className="hover:text-indigo-600">
                                                {meeting.title}
                                            </Link>
                                        </h3>

                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <p>
                                                <span className="font-medium text-gray-500">Divisi:</span>{' '}
                                                {meeting.division}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Lokasi:</span>{' '}
                                                {meeting.location}
                                            </p>
                                            <p>
                                                <span className="font-medium text-gray-500">Tanggal:</span>{' '}
                                                {formatDate(meeting.meeting_date)}
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className="mt-4">
                                            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                                <span>{meeting.agenda_items_count ?? 0} agenda</span>
                                                <span className="font-semibold text-gray-700">{avgProgress}%</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                                    style={{ width: `${Math.min(100, avgProgress)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                                            <Link
                                                href={route('meeting-minutes.show', meeting.id)}
                                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={route('meeting-minutes.edit', meeting.id)}
                                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(meeting.id)}
                                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        {meeting.creator && (
                                            <p className="mt-3 text-xs text-gray-400">
                                                Dibuat oleh {meeting.creator.name}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {meetings && (meetings.last_page > 1) && (
                        <div className="mt-6">
                            <Pagination links={meetings.links} />
                        </div>
                    )}
        </AdminLayout>
    );
}