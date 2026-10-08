import type { JsonValue } from '@/types/common';

/** Util CSV sederhana (tanpa dependensi eksternal). */

export const toCsv = (headers: string[], rows: (string | number | null | undefined)[][]): string => {
    const escape = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const text = String(value);
        if (/[",\n;]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    };

    const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];
    return lines.join('\n');
};

/** Parser CSV minimal yang mendukung tanda kutip ganda. */
export const parseCsv = (input: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    const pushField = (): void => {
        row.push(field);
        field = '';
    };

    const pushRow = (): void => {
        pushField();
        rows.push(row);
        row = [];
    };

    for (let index = 0; index < input.length; index += 1) {
        const char = input[index];

        if (inQuotes) {
            if (char === '"') {
                if (input[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            continue;
        }

        if (char === ',') {
            pushField();
            continue;
        }

        if (char === '\n') {
            pushRow();
            continue;
        }

        if (char === '\r') continue;

        field += char;
    }

    if (field.length > 0 || row.length > 0) {
        pushRow();
    }

    return rows.filter((item) => item.some((cell) => cell.trim() !== ''));
};

export const csvToObjects = (input: string): Record<string, string>[] => {
    const rows = parseCsv(input);
    if (rows.length === 0) return [];
    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map((header) => header.trim());

    return dataRows.map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = (row[index] ?? '').trim();
        });
        return record;
    });
};

export const jsonToCsv = (data: Record<string, JsonValue>[]): string => {
    if (data.length === 0) return '';
    const headers = Array.from(new Set(data.flatMap((item) => Object.keys(item))));
    const rows = data.map((item) =>
        headers.map((header) => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return value as string | number;
        }),
    );
    return toCsv(headers, rows);
};
