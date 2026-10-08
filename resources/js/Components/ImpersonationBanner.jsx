import { router, usePage } from '@inertiajs/react';

/**
 * Banner yang tampil saat admin sedang impersonasi akun mahasiswa/dosen.
 * Wajib selalu terlihat supaya admin tidak salah mengira sedang login
 * sebagai akun_TARGET.
 */
export default function ImpersonationBanner() {
    const impersonating = usePage().props.auth?.impersonating;

    if (!impersonating) return null;

    return (
        <div className="sticky top-0 z-[60] w-full bg-amber-400 text-amber-950 shadow-lg">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
                <div className="text-xs font-bold uppercase tracking-wide">
                    Mode login-as &mdash; Anda melihat sistem sebagai{' '}
                    <span className="underline">{impersonating.as_name}</span>{' '}
                    ({impersonating.as_role}) &middot; akun admin: {impersonating.admin_name}
                </div>
                <button
                    type="button"
                    onClick={() => router.post(route('admin.impersonate.stop'))}
                    className="shrink-0 self-start rounded bg-amber-950 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-50 hover:bg-black sm:self-auto"
                >
                    Kembali ke akun admin
                </button>
            </div>
        </div>
    );
}
