import { Link } from '@inertiajs/react';
import { useState } from 'react';

export const PILLARS = [
    'Pendidikan & Pengajaran',
    'Penelitian',
    'Pengabdian Masyarakat',
    'Kelembagaan',
    'Kemahasiswaan',
    'SDM & Sarana Prasarana',
];

export const MONTHS = [
    { key: 'jan', label: 'Jan' },
    { key: 'feb', label: 'Feb' },
    { key: 'mar', label: 'Mar' },
    { key: 'apr', label: 'Apr' },
    { key: 'may', label: 'Mei' },
    { key: 'jun', label: 'Jun' },
    { key: 'jul', label: 'Jul' },
    { key: 'aug', label: 'Agu' },
    { key: 'sep', label: 'Sep' },
    { key: 'oct', label: 'Okt' },
    { key: 'nov', label: 'Nov' },
    { key: 'dec', label: 'Des' },
];

export function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export function Box({ children, className = '', padded = true, variant = 'white' }) {
    const variants = {
        white: 'bg-white border-[#e5e5e5]',
        black: 'bg-black border-black text-white',
        gray: 'bg-[#f5f5f5] border-[#e5e5e5]',
    };
    return (
        <div className={`border ${variants[variant]} ${padded ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function SectionTitle({ children, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-900">{children}</h2>
            {action && <div>{action}</div>}
        </div>
    );
}

export function ActionButton({ children, href, onClick, variant = 'primary', type = 'button', disabled = false }) {
    const map = {
        primary: 'bg-black text-white border-black hover:bg-neutral-800',
        secondary: 'bg-white text-black border-[#ccc] hover:bg-[#f5f5f5]',
        danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50',
        ghost: 'bg-transparent text-neutral-500 border-transparent hover:text-black',
    };
    const base = 'inline-flex items-center justify-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors duration-200 disabled:opacity-50';
    if (href) {
        return (
            <Link href={href} className={`${base} ${map[variant]}`}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]}`}>
            {children}
        </button>
    );
}

export function InputLabel({ children, htmlFor }) {
    return (
        <label htmlFor={htmlFor} className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
            {children}
        </label>
    );
}

export function TextInput({ id, type = 'text', value, onChange, error, disabled = false, ...props }) {
    return (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`block w-full border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-red-500' : ''}`}
            {...props}
        />
    );
}

export function SelectInput({ id, value, onChange, error, disabled = false, children, ...props }) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`block w-full border-neutral-300 text-sm text-neutral-900 focus:border-black focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-red-500' : ''}`}
            {...props}
        >
            {children}
        </select>
    );
}

export function TextArea({ id, value, onChange, error, disabled = false, ...props }) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`block w-full border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-red-500' : ''}`}
            {...props}
        />
    );
}

export function InputError({ message }) {
    if (!message) return null;
    return <p className="mt-2 text-xs text-red-600 font-medium">{message}</p>;
}

export function SessionStatusBadge({ status }) {
    const map = {
        Aktif: 'bg-green-600 text-white border-green-600',
        Selesai: 'bg-black text-white border-black',
        Draft: 'bg-white text-neutral-500 border-[#ddd]',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status] || map.Draft}`}>
            {status}
        </span>
    );
}

export function SubmissionStatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
            status === 'submitted'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-neutral-500 border-[#ddd]'
        }`}>
            {status === 'submitted' ? 'Disubmit' : 'Draft'}
        </span>
    );
}

export function ChipsInput({ value = [], onChange, placeholder = 'Tulis lalu tekan Enter', disabled = false }) {
    const [text, setText] = useState('');

    const add = () => {
        const v = text.trim();
        if (!v) return;
        if (!value.includes(v)) onChange([...value, v]);
        setText('');
    };

    const remove = (index) => onChange(value.filter((_, idx) => idx !== index));

    return (
        <div className="w-full border border-neutral-300 bg-white px-3 py-2 focus-within:border-black focus-within:ring-1 focus-within:ring-black disabled:opacity-50">
            <div className="flex flex-wrap gap-2">
                {(value || []).map((chip, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-[11px] font-semibold uppercase tracking-wider px-2 py-1">
                        {chip}
                        {!disabled && (
                            <button type="button" onClick={() => remove(i)} className="text-neutral-400 hover:text-white">×</button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        className="flex-1 min-w-28 bg-transparent outline-none text-sm text-neutral-900 placeholder-neutral-400"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); add(); }
                            else if (e.key === 'Backspace' && !text && (value || []).length) { remove(value.length - 1); }
                        }}
                        onBlur={add}
                        placeholder={placeholder}
                    />
                )}
            </div>
        </div>
    );
}

export function PillarCheckboxes({ value = [], onChange, disabled = false }) {
    const toggle = (pillar) => {
        if (disabled) return;
        if ((value || []).includes(pillar)) onChange(value.filter((p) => p !== pillar));
        else onChange([...(value || []), pillar]);
    };
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 border border-neutral-300 bg-white p-3 ${disabled ? 'bg-neutral-100' : ''}`}>
            {PILLARS.map((pillar) => (
                <label key={pillar} className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                        type="checkbox"
                        checked={(value || []).includes(pillar)}
                        onChange={() => toggle(pillar)}
                        disabled={disabled}
                        className="rounded border-neutral-300 text-black focus:ring-black"
                    />
                    {pillar}
                </label>
            ))}
        </div>
    );
}

export function ProgramSelect({ programs = [], value = {}, includeType = false, onChange, disabled = false, error }) {
    const current = (() => {
        if (!value.program_source_id) return '';
        const id = Number(value.program_source_id);
        if (includeType && value.program_source_type) {
            return `${value.program_source_type}:${id}`;
        }
        const prog = programs.find((p) => p.source_id === id);
        return prog ? `${prog.source_type}:${prog.source_id}` : '';
    })();

    const handleChange = (e) => {
        const raw = e.target.value;
        if (!raw) {
            onChange({ program_source_type: null, program_source_id: null, program_name: '' });
            return;
        }
        const [type, id] = raw.split(':');
        const prog = programs.find((p) => `${p.source_type}:${p.source_id}` === raw) ||
            programs.find((p) => `p:${p.source_id}` === raw);
        if (includeType) {
            onChange({
                program_source_type: type,
                program_source_id: Number(id),
                program_name: prog ? prog.name : '',
            });
        } else {
            onChange({
                program_source_id: Number(id),
                program_name: prog ? prog.name : '',
            });
        }
    };

    return (
        <div>
            <select
                value={current}
                onChange={handleChange}
                disabled={disabled}
                className={`block w-full border-neutral-300 text-sm text-neutral-900 focus:border-black focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 ${error ? 'border-red-500' : ''}`}
            >
                <option value="">— Pilih Program (dari Borang 1 / 2) —</option>
                {programs.map((p) => (
                    <option key={`${p.source_type}:${p.source_id}`} value={`${p.source_type}:${p.source_id}`}>
                        {p.source_type === 'existing' ? 'Lama' : 'Baru'} — {p.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function DragRow({ draggable, onDragStart, onDragOver, onDrop, isDragging, children }) {
    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`group flex items-start gap-3 border p-4 transition-colors ${
                isDragging ? 'border-black bg-neutral-50 opacity-60' : 'border-[#e5e5e5] bg-white hover:border-neutral-400'
            }`}
        >
            <div
                className={`mt-1 flex-shrink-0 text-neutral-400 ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                title={draggable ? 'Seret untuk mengurutkan' : ''}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zM8 14a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zM8 22a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}