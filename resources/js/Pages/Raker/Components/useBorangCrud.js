import { router } from '@inertiajs/react';

export function useBorangCrud({ destroyRoute, reorderRoute, label }) {
    const destroy = (id) => {
        if (confirm(`Yakin ingin menghapus ${label} ini?`)) {
            router.delete(destroyRoute(id), { preserveScroll: true });
        }
    };

    const reorderOnDrop = (items, draggedId, overId) => {
        if (draggedId === null || draggedId === overId) return;

        const arr = [...items];
        const from = arr.findIndex((i) => i.id === draggedId);
        const to = arr.findIndex((i) => i.id === overId);
        if (from < 0 || to < 0) return;

        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);

        const payload = arr.map((item, idx) => ({ id: item.id, order_index: idx }));
        router.post(reorderRoute, { items: payload }, { preserveScroll: true });
    };

    return { destroy, reorderOnDrop };
}