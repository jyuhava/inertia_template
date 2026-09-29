/** Util unduh file (CSV / JSON) dari sisi klien. */

const triggerDownload = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

export const downloadCsv = (content: string, filename: string): void => {
    triggerDownload(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' }), filename);
};

export const downloadJson = (payload: unknown, filename: string): void => {
    triggerDownload(new Blob([JSON.stringify(payload, null, 4)], { type: 'application/json' }), filename);
};

export const downloadText = (content: string, filename: string): void => {
    triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8;' }), filename);
};

export const timestampSuffix = (): string => {
    const now = new Date();
    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

export const buildFilename = (prefix: string, extension: string): string =>
    `integrator-${prefix}-${timestampSuffix()}.${extension}`;
