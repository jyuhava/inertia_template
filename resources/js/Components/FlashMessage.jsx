import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (flash.message || flash.error || flash.success) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000); // Auto hide after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible || (!flash.message && !flash.error && !flash.success)) {
        return null;
    }

    const getMessageType = () => {
        if (flash.error) return 'error';
        if (flash.success) return 'success';
        return 'info';
    };

    const getMessage = () => {
        return flash.error || flash.success || flash.message;
    };

    const getStyles = () => {
        const type = getMessageType();
        // Mobile: menempel di atas layar (aman dari notch). Desktop: toast kanan atas.
        const baseStyles = 'safe-top fixed inset-x-0 top-0 z-[60] px-3 pt-3 sm:inset-x-auto sm:right-3 sm:max-w-sm sm:pt-0 transition-all duration-300 transform';

        switch (type) {
            case 'error':
                return `${baseStyles} text-red-700`;
            case 'success':
                return `${baseStyles} text-green-700`;
            default:
                return `${baseStyles} text-blue-700`;
        }
    };

    const getPanelStyles = () => {
        switch (getMessageType()) {
            case 'error':
                return 'border-red-400 bg-red-100';
            case 'success':
                return 'border-green-400 bg-green-100';
            default:
                return 'border-blue-400 bg-blue-100';
        }
    };

    const getIcon = () => {
        const type = getMessageType();

        switch (type) {
            case 'error':
                return (
                    <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className={getStyles()} role="status" aria-live="polite">
            <div className={`flex items-start border px-3.5 py-2.5 shadow-md ${getPanelStyles()}`}>
                {getIcon()}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-relaxed sm:text-sm">{getMessage()}</p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="ml-3 -mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center text-gray-500 transition-colors duration-200 hover:text-gray-700"
                    aria-label="Tutup notifikasi"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
