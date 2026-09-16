import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '7xl': 'sm:max-w-7xl',
    }[maxWidth] ?? 'sm:max-w-2xl';

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-end justify-center overflow-y-auto transition-all sm:items-center sm:px-4 sm:py-6"
                onClose={close}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-500/75" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel
                        className={`safe-bottom relative flex max-h-[92dvh] w-full transform flex-col overflow-y-auto rounded-t-xl bg-white shadow-xl transition-all sm:mx-auto sm:max-h-[88dvh] sm:w-full sm:rounded-lg ${maxWidthClass}`}
                    >
                        {/* Gagang tarik — hanya tampil di mobile sebagai penanda bottom sheet */}
                        <div className="flex justify-center pt-2 sm:hidden">
                            <span className="h-1 w-10 rounded-full bg-neutral-300" />
                        </div>

                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
