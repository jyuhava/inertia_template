import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import {
    Box,
    ActionButton,
    InputLabel,
    TextInput,
    InputError,
    SessionStatusBadge,
    SubmissionStatusBadge,
} from '../Components/RakerUi';
import Borang1Tab from './Tabs/Borang1Tab';
import Borang2Tab from './Tabs/Borang2Tab';
import Borang3Tab from './Tabs/Borang3Tab';
import Borang4Tab from './Tabs/Borang4Tab';
import Borang5Tab from './Tabs/Borang5Tab';
import Borang6Tab from './Tabs/Borang6Tab';

export default function Show({ session, submission, isOwner, isAdmin, canEdit, borangs, completion_stats }) {
    const [activeTab, setActiveTab] = useState('borang1');
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    const profile = useForm({
        unit: submission.unit || '',
        jabatan: submission.jabatan || '',
    });

    const tabs = [
        { key: 'borang1', label: 'Borang 1 · Program Kerja Lama', count: completion_stats.borang_1 },
        { key: 'borang2', label: 'Borang 2 · Program Kerja Baru', count: completion_stats.borang_2 },
        { key: 'borang3', label: 'Borang 3 · Analisis Risiko', count: completion_stats.borang_3 },
        { key: 'borang4', label: 'Borang 4 · Timeline', count: completion_stats.borang_4 },
        { key: 'borang5', label: 'Borang 5 · Kebutuhan', count: completion_stats.borang_5 },
        { key: 'borang6', label: 'Borang 6 · Anggaran', count: completion_stats.borang_6 },
    ];

    const programs = [
        ...(borangs.borang1 || []).map((p) => ({ source_type: 'existing', source_id: p.id, name: p.program_name })),
        ...(borangs.borang2 || []).map((p) => ({ source_type: 'new', source_id: p.id, name: p.program_name })),
    ];

    const submitProfile = (e) => {
        e.preventDefault();
        profile.put(route('raker.submission.update', submission.id), {
            preserveScroll: true,
            onSuccess: () => setShowProfileEdit(false),
        });
    };

    const handleSubmit = () => {
        if (confirm('Yakin ingin mengunci dan submit isian Raker? Isian tidak dapat diubah lagi setelah disubmit.')) {
            router.post(route('raker.submission.submit', submission.id));
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <AdminLayout>
            <Head title={`Raker — ${session.name}`} />

            <div className="space-y-6">
                <Box variant="black">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-xl font-bold uppercase tracking-tight text-white">{session.name}</h1>
                                <SessionStatusBadge status={session.status} />
                                <SubmissionStatusBadge status={submission.status} />
                            </div>
                            <p className="text-sm text-neutral-400">
                                {formatDate(session.start_date)} — {formatDate(session.end_date)}
                                {session.location ? ` • ${session.location}` : ''}
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-11 w-11 border border-[#333] bg-neutral-900 flex items-center justify-center">
                                    <span className="text-sm font-bold tracking-widest text-white">
                                        {(submission.user?.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{submission.user?.name}</p>
                                    <p className="text-[11px] text-neutral-400">
                                        {submission.unit || 'Unit belum diisi'} {submission.jabatan ? ` · ${submission.jabatan}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
                            {!isOwner && isAdmin && (
                                <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 border border-yellow-400 px-3 py-1">
                                    Mode Admin — melihat isian user lain (read-only)
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <ActionButton href="/raker" variant="secondary">← Kembali</ActionButton>
                                {canEdit && submission.status === 'draft' && (
                                    <ActionButton onClick={handleSubmit} variant="primary">
                                        Submit & Kunci Isian
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                    </div>
                </Box>

                {/* Profil pengisi: unit & jabatan */}
                <Box>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">Profil Pengisi</h2>
                            <p className="text-sm text-neutral-600 mt-1">
                                {showProfileEdit
                                    ? 'Perbarui unit dan jabatan Anda'
                                    : `${submission.unit || 'Unit belum diisi'} / ${submission.jabatan || 'Jabatan belum diisi'}`}
                            </p>
                        </div>
                        {!showProfileEdit && canEdit && (
                            <ActionButton onClick={() => setShowProfileEdit(true)} variant="secondary">Edit Profil</ActionButton>
                        )}
                    </div>

                    {showProfileEdit && (
                        <form onSubmit={submitProfile} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-neutral-200 pt-6">
                            <div>
                                <InputLabel htmlFor="unit">Unit / Bidang</InputLabel>
                                <TextInput id="unit" value={profile.data.unit} onChange={(e) => profile.setData('unit', e.target.value)} error={profile.errors.unit} placeholder="Contoh: Bidang Akademik" />
                                <InputError message={profile.errors.unit} />
                            </div>
                            <div>
                                <InputLabel htmlFor="jabatan">Jabatan</InputLabel>
                                <TextInput id="jabatan" value={profile.data.jabatan} onChange={(e) => profile.setData('jabatan', e.target.value)} error={profile.errors.jabatan} placeholder="Contoh: Kepala Bidang" />
                                <InputError message={profile.errors.jabatan} />
                            </div>
                            <div className="flex items-center gap-3 md:col-span-2">
                                <ActionButton onClick={() => setShowProfileEdit(false)} variant="secondary">Batal</ActionButton>
                                <ActionButton type="submit" variant="primary" disabled={profile.processing}>
                                    {profile.processing ? 'Menyimpan...' : 'Simpan Profil'}
                                </ActionButton>
                            </div>
                        </form>
                    )}
                </Box>

                {/* Tabs */}
                <Box padded={false}>
                    <div className="border-b border-[#e5e5e5] px-4 overflow-x-auto">
                        <div className="flex whitespace-nowrap">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-black text-black'
                                            : 'border-transparent text-neutral-500 hover:text-black'
                                    }`}
                                >
                                    {tab.label}
                                    <span className="ml-1.5 inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 text-[9px] bg-neutral-200 text-neutral-700">
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className={activeTab === 'borang1' ? '' : 'hidden'}>
                            <Borang1Tab items={borangs.borang1} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                        <div className={activeTab === 'borang2' ? '' : 'hidden'}>
                            <Borang2Tab items={borangs.borang2} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                        <div className={activeTab === 'borang3' ? '' : 'hidden'}>
                            <Borang3Tab items={borangs.borang3} programs={programs} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                        <div className={activeTab === 'borang4' ? '' : 'hidden'}>
                            <Borang4Tab items={borangs.borang4} programs={programs} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                        <div className={activeTab === 'borang5' ? '' : 'hidden'}>
                            <Borang5Tab items={borangs.borang5} programs={programs} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                        <div className={activeTab === 'borang6' ? '' : 'hidden'}>
                            <Borang6Tab items={borangs.borang6} programs={programs} submissionId={submission.id} canEdit={canEdit} />
                        </div>
                    </div>
                </Box>

                {!canEdit && submission.status === 'submitted' && (
                    <div className="bg-green-50 border border-green-300 text-green-800 text-xs font-bold uppercase tracking-widest px-4 py-3">
                        Isian ini sudah disubmit dan terkunci. Tidak dapat diubah lagi.
                    </div>
                )}
                {!canEdit && !isOwner && isAdmin && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-bold uppercase tracking-widest px-4 py-3">
                        Anda sedang melihat isian user lain dalam mode read-only.
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}