<script setup lang="ts">
/**
 * AppIcon — ikon SVG inline (tanpa dependensi eksternal).
 * Nama ikon dipakai pada config entitas & navigasi sehingga tidak ada import
 * ikon yang tersebar di komponen.
 */
const props = withDefaults(defineProps<{ name: string; size?: number; class?: string }>(), { size: 16, class: '' });

const paths: Record<string, string> = {
    dashboard: 'M3 3h7v7H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 14h7v7H3z',
    plug: 'M9 3v6M15 3v6M6 9h12v3a6 6 0 01-6 6 6 6 0 01-6-6zM12 18v3',
    book: 'M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2zM8 7h8M8 11h6',
    map: 'M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z',
    users: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M12 7a3 3 0 11-6 0 3 3 0 016 0zM22 19v-1a4 4 0 00-3-3.87',
    'user-tie': 'M12 12a4 4 0 100-8 4 4 0 000 8zM6 21v-2l6-3 6 3v2',
    'academic-cap': 'M12 4L2 9l10 5 10-5zM6 12v5c0 1 3 2 6 2s6-1 6-2v-5',
    calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14v15H5zM8 12h3M8 16h6',
    'rectangle-stack': 'M4 7h16v12H4zM7 4h10',
    'chart-bar': 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    sparkles: 'M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 15l1 2.4 2.4 1-2.4 1L18 22l-1-2.6-2.4-1 2.4-1z',
    clipboard: 'M9 4h6v3H9zM6 5h3v2h6V5h3v16H6z',
    list: 'M4 6h16M4 12h16M4 18h16',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    activity: 'M3 12h4l2-6 3 12 2-6h5',
    file: 'M7 3h7l5 5v13H7zM14 3v5h5',
    chevron: 'M9 6l6 6-6 6',
    'chevron-down': 'M6 9l6 6 6-6',
    plus: 'M12 5v14M5 12h14',
    refresh: 'M4 12a8 8 0 0113.7-5.7L20 8M20 12a8 8 0 01-13.7 5.7L4 16M20 4v4h-4M4 20v-4h4',
    download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
    upload: 'M12 20V8M7 13l5-5 5 5M5 4h14',
    check: 'M5 13l4 4L19 7',
    x: 'M6 6l12 12M18 6L6 18',
    alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
    info: 'M12 8h.01M11 12h1v5h1',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
    filter: 'M4 5h16l-6 7v6l-4-2v-4z',
    copy: 'M9 9h11v11H9zM5 15V4h11',
    eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6zM12 12a3 3 0 100-.01',
    play: 'M7 5l12 7-12 7z',
    retry: 'M4 12a8 8 0 1014-5.3M4 5v5h5',
    cancel: 'M6 6l12 12M18 6L6 18',
    external: 'M14 4h6v6M20 4l-9 9M9 5H5v14h14v-4',
    settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM4 12l-1.5-2 2-3.5H9l1.5-2h3L15 6.5h4.5l2 3.5L20 12l1.5 2-2 3.5H15L13.5 20h-3L9 17.5H4.5l-2-3.5z',
    arrow_left: 'M19 12H5M11 18l-6-6 6-6',
    arrow_right: 'M5 12h14M13 6l6 6-6 6',
    dots: 'M12 6h.01M12 12h.01M12 18h.01',
    clock: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2',
    sync: 'M4 7h13l-3-3M20 17H7l3 3M4 7v4M20 17v-4',
    logout: 'M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 8l-4 4 4 4M6 12h11',
};
</script>

<template>
    <svg
        :width="props.size"
        :height="props.size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="props.class"
        aria-hidden="true"
    >
        <path :d="paths[props.name] ?? paths.info" />
    </svg>
</template>
