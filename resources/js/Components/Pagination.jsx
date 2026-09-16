import { Link } from '@inertiajs/react';

/**
 * Pagination compact.
 * Di layar kecil hanya menampilkan halaman di sekitar halaman aktif (prev / next selalu tampil),
 * di layar besar seluruh nomor halaman ditampilkan seperti sebelumnya.
 */
export default function Pagination({ links }) {
    if (!links || links.length <= 1) return null;

    const labelOf = (link) => String(link.label || '').replace(/<[^>]*>/g, '').trim();

    const isNavLink = (link) => /previous|next|«|»/i.test(labelOf(link));
    const isEllipsis = (link) => /\.{3}|…/.test(labelOf(link));

    const activeIndex = links.findIndex((link) => link.active);
    const numericIndexes = links
        .map((link, index) => (Number.isNaN(Number(labelOf(link))) ? -1 : index))
        .filter((index) => index !== -1);

    const mobileVisible = new Set();

    if (activeIndex !== -1) {
        [activeIndex - 1, activeIndex, activeIndex + 1].forEach((index) => {
            if (index >= 0 && index < links.length) {
                mobileVisible.add(index);
            }
        });
    }

    if (numericIndexes.length > 0) {
        mobileVisible.add(numericIndexes[0]);
        mobileVisible.add(numericIndexes[numericIndexes.length - 1]);
    }

    const baseItem = 'mb-1 mr-1 inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center border px-2.5 text-xs leading-4 transition-colors sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5';

    return (
        <nav className="pagination-compact flex flex-wrap" aria-label="Navigasi halaman">
            {links.map((link, key) => {
                const hiddenOnMobile = !isNavLink(link) && !mobileVisible.has(key);
                const responsiveClass = hiddenOnMobile ? 'hidden sm:inline-flex' : 'inline-flex';

                if (link.url === null) {
                    return (
                        <span
                            key={key}
                            className={`${baseItem} ${responsiveClass} cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={key}
                        href={link.url}
                        className={`${baseItem} ${responsiveClass} ${
                            link.active
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900'
                        } ${isEllipsis(link) ? 'pointer-events-none' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}
