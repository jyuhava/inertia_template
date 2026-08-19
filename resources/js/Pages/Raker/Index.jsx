import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Box, ActionButton, SessionStatusBadge, SubmissionStatusBadge } from './Components/RakerUi';

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Index({ sessions, isAdmin }) {
    return (
        <AdminLayout>
            <Head title="Raker" />

            <div className="space-y-6">
                    <Box variant="black" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">Rapat Kerja</p>
                            <h1 className="text-xl font-bold uppercase tracking-tight text-white">Raker</h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Pilih sesi Raker untuk mengisi borang program kerja.
                            </p>
                        </div>
                        {isAdmin && (
                            <ActionButton href="/raker/sessions" variant="secondary">Kelola Sesi</ActionButton>
                        )}
                    </Box>

                    {sessions.length === 0 ? (
                        <Box>
                            <p className="text-sm text-neutral-500 text-center py-8 uppercase tracking-widest">
                                Belum ada sesi Raker yang aktif atau selesai.
                            </p>
                        </Box>
                    ) : (
                        sessions.map((session) => (
                            <Box key={session.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h2 className="text-base font-bold uppercase tracking-tight text-neutral-900">
                                            {session.name}
                                        </h2>
                                        <SessionStatusBadge status={session.status} />
                                        {session.own_submission && (
                                            <SubmissionStatusBadge status={session.own_submission.status} />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-600">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(session.start_date)} — {formatDate(session.end_date)}
                                        </span>
                                        {session.location && (
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {session.location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {session.submissions_count} pengisi
                                        </span>
                                    </div>
                                    {session.description && (
                                        <p className="mt-2 text-xs text-neutral-500">{session.description}</p>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <ActionButton
                                        href={`/raker/sessions/${session.id}/my-submission`}
                                        variant={session.own_submission?.status === 'submitted' ? 'secondary' : 'primary'}
                                    >
                                        {session.own_submission?.status === 'submitted'
                                            ? 'Lihat Isian'
                                            : session.own_submission?.status === 'draft'
                                            ? 'Lanjutkan Isi'
                                            : 'Buka & Isi Borang'}
                                    </ActionButton>
                                </div>
                            </Box>
                        ))
                    )}
                </div>
        </AdminLayout>
    );
}