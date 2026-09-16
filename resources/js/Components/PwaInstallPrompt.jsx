import { useEffect, useState } from 'react';
import {
    INSTALL_PROMPT_EVENT,
    dismissInstall,
    getDeferredPrompt,
    isIos,
    isStandalone,
    promptInstall,
    wasInstallDismissed,
} from '@/pwa';

export default function PwaInstallPrompt() {
    const [visible, setVisible] = useState(false);
    const [iosHint, setIosHint] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isStandalone() || wasInstallDismissed()) {
            return;
        }

        const show = () => setVisible(true);
        window.addEventListener(INSTALL_PROMPT_EVENT, show);

        // iOS tidak punya beforeinstallprompt — tampilkan petunjuk manual.
        let timer;
        if (isIos()) {
            timer = setTimeout(() => {
                setIosHint(true);
                setVisible(true);
            }, 4000);
        }

        if (getDeferredPrompt()) {
            setVisible(true);
        }

        return () => {
            window.removeEventListener(INSTALL_PROMPT_EVENT, show);
            if (timer) clearTimeout(timer);
        };
    }, []);

    if (!visible) return null;

    const handleInstall = async () => {
        setBusy(true);
        const accepted = await promptInstall();
        setBusy(false);

        if (!accepted) {
            dismissInstall();
            setVisible(false);
        }
    };

    const handleDismiss = () => {
        dismissInstall();
        setVisible(false);
    };

    return (
        <div className="pb-mobile-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:pb-0 lg:pr-4 lg:pt-4">
            <div className="pointer-events-auto ml-auto flex w-full max-w-md items-start gap-3 border border-[#e4e4e7] bg-white p-3 shadow-lg lg:mb-4">
                <img
                    src="/icons/icon-192.png"
                    alt="SIAKAD"
                    className="h-10 w-10 flex-shrink-0 border border-[#e4e4e7] object-contain"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900">
                        Pasang SIAKAD
                    </p>

                    {iosHint ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                            Ketuk <strong>Bagikan</strong> lalu pilih <strong>Tambahkan ke Layar Utama</strong> agar
                            SIAKAD terbuka seperti aplikasi.
                        </p>
                    ) : (
                        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                            Akses lebih cepat langsung dari layar utama tanpa membuka browser.
                        </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                        {!iosHint && (
                            <button
                                type="button"
                                onClick={handleInstall}
                                disabled={busy}
                                className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {busy ? 'Memproses…' : 'Pasang'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="border border-[#e4e4e7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                        >
                            Nanti saja
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Tutup"
                    className="-mr-1 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center text-neutral-400 transition hover:text-neutral-900"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
