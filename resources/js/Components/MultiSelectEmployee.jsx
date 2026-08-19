import { useState, useRef, useEffect } from 'react';

/**
 * MultiSelectEmployee
 * Dropdown pencarian multi-pilih (dengan checkbox) untuk memilih beberapa employee/user.
 * Props:
 *  - employees: [{ id, name }]
 *  - value: array of id yang terpilih
 *  - onChange: (ids: number[]) => void
 *  - placeholder: string (opsional)
 *  - error: string (opsional), pesan error untuk ditampilkan di bawah
 */
export default function MultiSelectEmployee({
    employees = [],
    value = [],
    onChange,
    placeholder = 'Pilih pegawai...',
    error,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedEmployees = employees.filter((emp) => value.includes(emp.id));
    const filteredEmployees = employees.filter((emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase()),
    );

    const isUnique = (id) =>
        typeof id === 'number' || /^\d+$/.test(String(id));

    const toggle = (id) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const remove = (id) => {
        onChange(value.filter((v) => v !== id));
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Selected chips */}
            {selectedEmployees.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedEmployees.map((emp) => (
                        <span
                            key={emp.id}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                            {emp.name}
                            <button
                                type="button"
                                onClick={() => remove(emp.id)}
                                className="text-indigo-400 hover:text-indigo-700"
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
                {selectedEmployees.length === 0
                    ? placeholder
                    : `${selectedEmployees.length} dipilih`}
                <span className="float-right text-gray-400">{open ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-20 mt-1 w-full border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 p-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama pegawai..."
                            className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredEmployees.length === 0 && (
                            <p className="px-3 py-3 text-xs text-gray-400">Tidak ada pegawai.</p>
                        )}
                        {filteredEmployees.map((emp) => {
                            const checked = value.includes(emp.id);
                            return (
                                <label
                                    key={emp.id}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(emp.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="truncate">{emp.name}</span>
                                    {isUnique(emp.id) && (
                                        <span className="ml-auto text-[10px] text-gray-400">#{emp.id}</span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}