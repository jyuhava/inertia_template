/** Util format tanggal, angka, dan teks — locale Indonesia. */

const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const timeFormatter = new Intl.DateTimeFormat('id-ID', { timeStyle: 'medium' });
const numberFormatter = new Intl.NumberFormat('id-ID');

export const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return dateFormatter.format(date);
};

export const formatDateTime = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return dateTimeFormatter.format(date);
};

export const formatTime = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return timeFormatter.format(date);
};

export const formatNumber = (value?: number | string | null): string => {
    if (value === null || value === undefined || value === '') return '—';
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) return String(value);
    return numberFormatter.format(numeric);
};

export const formatBytes = (value?: number | null): string => {
    if (!value) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const formatDuration = (ms?: number | null): string => {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.round((ms % 60_000) / 1000);
    return `${minutes}m ${seconds}s`;
};

export const relativeTime = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value).getTime();
    if (Number.isNaN(date)) return '—';
    const diff = Date.now() - date;
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'baru saja';
    if (diff < hour) return `${Math.floor(diff / minute)} menit lalu`;
    if (diff < day) return `${Math.floor(diff / hour)} jam lalu`;
    if (diff < 30 * day) return `${Math.floor(diff / day)} hari lalu`;
    return formatDate(value);
};

export const truncate = (value?: string | null, length = 48): string => {
    if (!value) return '—';
    return value.length > length ? `${value.slice(0, length - 1)}…` : value;
};

export const humanizeKey = (key: string): string =>
    key
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\w/, (char) => char.toUpperCase());

export const initials = (value?: string | null): string => {
    if (!value) return '—';
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
};

/** Format nilai apapun untuk ditampilkan pada tabel comparison. */
export const displayValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '(kosong)';
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    if (Array.isArray(value)) return value.length === 0 ? '(kosong)' : value.map((item) => displayValue(item)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

export const slugify = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
