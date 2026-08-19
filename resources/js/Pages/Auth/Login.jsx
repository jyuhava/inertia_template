import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

const facts = [
    'SIAKAD terintegrasi untuk Admin, Dosen, dan Mahasiswa.',
    'Mendukung KRS, KHS, LMS, absensi, dan penilaian dalam satu platform.',
    'Dikembangkan untuk layanan akademik STIT Al Wafi Bogor yang lebih tertib dan efisien.',
];

const stats = [
    { label: 'Platform', value: 'Terpadu' },
    { label: 'Akses', value: '24/7' },
    { label: 'Layanan', value: 'Akademik' },
];

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-[#e8e8e8]">
            <Head title="Masuk - SIAKAD STIT Al Wafi" />

            {/* Geometric pattern overlay */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.035]"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, #fff 1px, transparent 1px),
                        linear-gradient(180deg, #fff 1px, transparent 1px)
                    `,
                    backgroundSize: '64px 64px',
                }}
            />

            {/* Decorative boxes */}
            <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 border border-[#222]" />
            <div className="pointer-events-none absolute -right-12 bottom-12 h-48 w-48 border border-[#222]" />

            <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-12 lg:gap-0">
                    {/* Left panel */}
                    <section className="order-2 border border-[#222] bg-[#111] p-6 lg:order-1 lg:col-span-5 lg:p-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center border border-[#333] bg-white p-1">
                                <img
                                    src="https://alwafi.ac.id/assets/img/stit.png"
                                    alt="Logo STIT Al Wafi"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#888]">SIAKAD</p>
                                <p className="text-sm font-bold uppercase tracking-wide text-white">STIT Al Wafi Bogor</p>
                            </div>
                        </Link>

                        <h1 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                            Panel Akademik
                            <span className="block text-[#888]">Modern & Terpusat</span>
                        </h1>

                        <p className="mt-4 text-sm leading-7 text-[#999]">
                            Akses akun Anda untuk mengelola aktivitas akademik di lingkungan STIT Al Wafi.
                        </p>

                        <div className="mt-6 grid grid-cols-3 gap-px bg-[#222]">
                            {stats.map((item) => (
                                <div key={item.label} className="bg-[#0a0a0a] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#666]">{item.label}</p>
                                    <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <ul className="mt-6 space-y-3">
                            {facts.map((fact) => (
                                <li key={fact} className="flex items-start gap-3 text-sm text-[#bbb]">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-white" />
                                    <span className="leading-6">{fact}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Right panel */}
                    <section className="order-1 border border-[#222] bg-white p-6 text-[#0a0a0a] lg:order-2 lg:col-span-7 lg:p-10">
                        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888]">Login Portal</p>
                                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0a0a0a] sm:text-3xl">Selamat datang kembali</h2>
                                <p className="mt-1 text-sm text-[#666]">Masuk menggunakan akun terdaftar.</p>
                            </div>
                            <Link
                                href="/"
                                className="border border-[#ccc] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#555] transition hover:border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
                            >
                                Beranda
                            </Link>
                        </div>

                        {status && (
                            <div className="mb-4 border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="email" value="Email" className="text-xs font-bold uppercase tracking-wider text-[#555]" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-2 block w-full rounded-none border-[#ccc] text-sm focus:border-[#0a0a0a] focus:ring-[#0a0a0a]"
                                    placeholder="nama@email.com"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-xs font-bold uppercase tracking-wider text-[#555]" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-2 block w-full rounded-none border-[#ccc] text-sm focus:border-[#0a0a0a] focus:ring-[#0a0a0a]"
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <label htmlFor="remember" className="inline-flex items-center gap-2 text-sm text-[#555]">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span>Ingat saya</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-semibold text-[#0a0a0a] underline decoration-[#ccc] underline-offset-4 transition hover:decoration-[#0a0a0a]"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>

                            <PrimaryButton
                                className="w-full justify-center rounded-none border border-[#0a0a0a] bg-[#0a0a0a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#333]"
                                disabled={processing}
                            >
                                {processing ? 'Sedang masuk...' : 'Masuk ke SIAKAD'}
                            </PrimaryButton>
                        </form>

                        <div className="mt-6 border-t border-[#ddd] pt-4 text-center text-xs leading-5 text-[#888]">
                            Dengan masuk, Anda menyetujui kebijakan penggunaan sistem akademik STIT Al Wafi.
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
