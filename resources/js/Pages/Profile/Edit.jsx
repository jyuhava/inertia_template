import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout title="Pengaturan Profil">
            <Head title="Profil" />

            <div className="space-y-6">
                <section className="relative overflow-hidden border border-neutral-900 bg-neutral-900 p-7 text-white shadow-sm">
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Pengaturan Akun</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Profil Pengguna</h1>
                        <p className="mt-2 text-sm text-neutral-300">Kelola informasi profil, kata sandi, dan preferensi akun Anda.</p>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <div className="border border-neutral-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Menu Pengaturan</h2>
                            <p className="mt-1 text-sm text-neutral-500">Pilih bagian yang ingin diubah.</p>
                            <div className="mt-4 space-y-2">
                                <a href="#informasi-profil" className="block border border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                                    Informasi Profil
                                </a>
                                <a href="#kata-sandi" className="block border border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                                    Kata Sandi
                                </a>
                                <a href="#hapus-akun" className="block border border-neutral-900 bg-neutral-900 p-3 text-sm font-semibold text-white hover:bg-neutral-800">
                                    Hapus Akun
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-8">
                        <div id="informasi-profil" className="border border-neutral-200 bg-white p-5 shadow-sm">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        <div id="kata-sandi" className="border border-neutral-200 bg-white p-5 shadow-sm">
                            <UpdatePasswordForm />
                        </div>

                        <div id="hapus-akun" className="border border-neutral-200 bg-white p-5 shadow-sm">
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
