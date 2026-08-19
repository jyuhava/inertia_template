import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Simple route helper to avoid Ziggy issues
window.route = (name, params = {}) => {
    const routes = {
        'dashboard': '/dashboard',
        'admin.dashboard': '/admin/dashboard',
        'mahasiswa.dashboard': '/mahasiswa/dashboard',
        'dosen.dashboard': '/dosen/dashboard',
        'admin.mahasiswa.index': '/admin/mahasiswa',
        'admin.mahasiswa.create': '/admin/mahasiswa/create',
        'admin.mahasiswa.store': '/admin/mahasiswa',
        'admin.mahasiswa.show': (id) => `/admin/mahasiswa/${id}`,
        'admin.mahasiswa.edit': (id) => `/admin/mahasiswa/${id}/edit`,
        'admin.mahasiswa.update': (id) => `/admin/mahasiswa/${id}`,
        'admin.mahasiswa.destroy': (id) => `/admin/mahasiswa/${id}`,
        'admin.user-management.reset-password.form': (id) => `/admin/user-management/${id}/reset-password`,

        // KHS routes
        'admin.mahasiswa.khs.index': (id) => `/admin/mahasiswa/${id}/khs`,
        'admin.mahasiswa.khs.show': (params) => {
            const [mahasiswaId, periodeKrsId] = Array.isArray(params) ? params : [params];
            return `/admin/mahasiswa/${mahasiswaId}/khs/${periodeKrsId}`;
        },
        'admin.mahasiswa.khs.print': (params) => {
            const [mahasiswaId, periodeKrsId] = Array.isArray(params) ? params : [params];
            return `/admin/mahasiswa/${mahasiswaId}/khs/${periodeKrsId}/print`;
        },

        // Prodi routes
        'admin.prodi.index': '/admin/prodi',
        'admin.prodi.create': '/admin/prodi/create',
        'admin.prodi.store': '/admin/prodi',
        'admin.prodi.show': (id) => `/admin/prodi/${id}`,
        'admin.prodi.edit': (id) => `/admin/prodi/${id}/edit`,
        'admin.prodi.update': (id) => `/admin/prodi/${id}`,
        'admin.prodi.destroy': (id) => `/admin/prodi/${id}`,
        // Dosen routes
        'admin.dosen.index': '/admin/dosen',
        'admin.dosen.create': '/admin/dosen/create',
        'admin.dosen.store': '/admin/dosen',
        'admin.dosen.show': (id) => `/admin/dosen/${id}`,
        'admin.dosen.edit': (id) => `/admin/dosen/${id}/edit`,
        'admin.dosen.update': (id) => `/admin/dosen/${id}`,
        'admin.dosen.destroy': (id) => `/admin/dosen/${id}`,
        // Tahun Ajaran routes
        'admin.tahun-ajaran.index': '/admin/tahun-ajaran',
        'admin.tahun-ajaran.create': '/admin/tahun-ajaran/create',
        'admin.tahun-ajaran.store': '/admin/tahun-ajaran',
        'admin.tahun-ajaran.show': (id) => `/admin/tahun-ajaran/${id}`,
        'admin.tahun-ajaran.edit': (id) => `/admin/tahun-ajaran/${id}/edit`,
        'admin.tahun-ajaran.update': (id) => `/admin/tahun-ajaran/${id}`,
        'admin.tahun-ajaran.destroy': (id) => `/admin/tahun-ajaran/${id}`,
        // Semester routes
        'admin.semester.index': '/admin/semester',
        'admin.semester.create': '/admin/semester/create',
        'admin.semester.store': '/admin/semester',
        'admin.semester.show': (id) => `/admin/semester/${id}`,
        'admin.semester.edit': (id) => `/admin/semester/${id}/edit`,
        'admin.semester.update': (id) => `/admin/semester/${id}`,
        'admin.semester.destroy': (id) => `/admin/semester/${id}`,
        // Mata Kuliah routes
        'admin.mata-kuliah.index': '/admin/mata-kuliah',
        'admin.mata-kuliah.create': '/admin/mata-kuliah/create',
        'admin.mata-kuliah.store': '/admin/mata-kuliah',
        'admin.mata-kuliah.show': (id) => `/admin/mata-kuliah/${id}`,
        'admin.mata-kuliah.edit': (id) => `/admin/mata-kuliah/${id}/edit`,
        'admin.mata-kuliah.update': (id) => `/admin/mata-kuliah/${id}`,
        'admin.mata-kuliah.destroy': (id) => `/admin/mata-kuliah/${id}`,
        // Jadwal Kuliah routes
        'admin.jadwal-kuliah.index': '/admin/jadwal-kuliah',
        'admin.jadwal-kuliah.create': '/admin/jadwal-kuliah/create',
        'admin.jadwal-kuliah.store': '/admin/jadwal-kuliah',
        'admin.jadwal-kuliah.show': (id) => `/admin/jadwal-kuliah/${id}`,
        'admin.jadwal-kuliah.edit': (id) => `/admin/jadwal-kuliah/${id}/edit`,
        'admin.jadwal-kuliah.update': (id) => `/admin/jadwal-kuliah/${id}`,
        'admin.jadwal-kuliah.destroy': (id) => `/admin/jadwal-kuliah/${id}`,
        // Periode KRS routes
        'admin.periode-krs.index': '/admin/periode-krs',
        'admin.periode-krs.create': '/admin/periode-krs/create',
        'admin.periode-krs.store': '/admin/periode-krs',
        'admin.periode-krs.show': (id) => `/admin/periode-krs/${id}`,
        'admin.periode-krs.edit': (id) => `/admin/periode-krs/${id}/edit`,
        'admin.periode-krs.update': (id) => `/admin/periode-krs/${id}`,
        'admin.periode-krs.destroy': (id) => `/admin/periode-krs/${id}`,
        'admin.periode-krs.activate': (id) => `/admin/periode-krs/${id}/activate`,
        'admin.periode-krs.deactivate': (id) => `/admin/periode-krs/${id}/deactivate`,
        // Mahasiswa KRS routes
        'mahasiswa.krs.index': '/mahasiswa/krs',
        'mahasiswa.krs.store': '/mahasiswa/krs',
        'mahasiswa.krs.destroy': (id) => `/mahasiswa/krs/${id}`,
        'mahasiswa.krs.print': '/mahasiswa/krs/print',
        // Dosen routes
        'dosen.jadwal': '/dosen/jadwal',
        'dosen.mahasiswa': (id) => `/dosen/mahasiswa/${id}`,
        'dosen.penilaian': (id) => `/dosen/penilaian/${id}`,
        'dosen.penilaian.update': (id) => `/dosen/penilaian/${id}`,
        'dosen.penilaian.finalisasi': (id) => `/dosen/penilaian/${id}/finalisasi`,
        'dosen.absensi.index': (id) => `/dosen/absensi/${id}`,
        'dosen.absensi.pertemuan.create': (id) => `/dosen/absensi/${id}/pertemuan`,
        'dosen.absensi.update': (id) => `/dosen/absensi/${id}/update`,
        'dosen.absensi.pertemuan.delete': (id) => `/dosen/absensi/${id}/pertemuan`,
        'dosen.absensi.rekap': (id) => `/dosen/absensi/${id}/rekap`,
        // Profile routes
        'profile.edit': '/profile',
        'logout': '/logout',
        'login': '/login',
        'register': '/register',

        // PMB Public routes
        'pmb.index': '/pmb',
        'pmb.create': '/pmb/daftar',
        'pmb.store': '/pmb/daftar',
        'pmb.status.form': '/pmb/cek-status',
        'pmb.status.check': '/pmb/cek-status',

        // PMB Admin routes
        'admin.periode-pmb.index': '/admin/periode-pmb',
        'admin.periode-pmb.create': '/admin/periode-pmb/create',
        'admin.periode-pmb.store': '/admin/periode-pmb',
        'admin.periode-pmb.show': (id) => `/admin/periode-pmb/${id}`,
        'admin.periode-pmb.edit': (id) => `/admin/periode-pmb/${id}/edit`,
        'admin.periode-pmb.update': (id) => `/admin/periode-pmb/${id}`,
        'admin.periode-pmb.destroy': (id) => `/admin/periode-pmb/${id}`,
        'admin.periode-pmb.activate': (id) => `/admin/periode-pmb/${id}/activate`,
        'admin.periode-pmb.deactivate': (id) => `/admin/periode-pmb/${id}/deactivate`,

        'admin.dokumen-pmb.index': '/admin/dokumen-pmb',
        'admin.dokumen-pmb.create': '/admin/dokumen-pmb/create',
        'admin.dokumen-pmb.store': '/admin/dokumen-pmb',
        'admin.dokumen-pmb.show': (id) => `/admin/dokumen-pmb/${id}`,
        'admin.dokumen-pmb.edit': (id) => `/admin/dokumen-pmb/${id}/edit`,
        'admin.dokumen-pmb.update': (id) => `/admin/dokumen-pmb/${id}`,
        'admin.dokumen-pmb.destroy': (id) => `/admin/dokumen-pmb/${id}`,
        'admin.dokumen-pmb.toggle-status': (id) => `/admin/dokumen-pmb/${id}/toggle-status`,

        'admin.calon-mahasiswa.index': '/admin/calon-mahasiswa',
        'admin.calon-mahasiswa.show': (id) => `/admin/calon-mahasiswa/${id}`,
        'admin.calon-mahasiswa.update-status': (id) => `/admin/calon-mahasiswa/${id}/status`,
        'admin.calon-mahasiswa.bulk-update-status': '/admin/calon-mahasiswa/bulk-update-status',
        'admin.calon-mahasiswa.convert': (id) => `/admin/calon-mahasiswa/${id}/convert`,
        'admin.calon-mahasiswa.export': '/admin/calon-mahasiswa/export/csv',
        'admin.calon-mahasiswa.download-dokumen': (id) => `/admin/calon-mahasiswa/download-dokumen/${id}`,
        'admin.upload-dokumen.download': (id) => `/admin/upload-dokumen/${id}/download`,

        // Calon Mahasiswa routes
        'calon-mahasiswa.dashboard': '/calon-mahasiswa/dashboard',
        'calon-mahasiswa.profile.update': '/calon-mahasiswa/profile',
        'calon-mahasiswa.dokumen.upload': '/calon-mahasiswa/dokumen/upload',
        'calon-mahasiswa.dokumen.download': (id) => `/calon-mahasiswa/dokumen/${id}/download`,
        'calon-mahasiswa.submit': '/calon-mahasiswa/submit',

        // LMS Admin
        'admin.lms-courses.index': '/admin/lms-courses',
        'admin.lms-courses.show': (id) => `/admin/lms-courses/${id}`,

        // LMS Dosen
        'dosen.lms.index': '/dosen/lms',
        'dosen.lms.store': '/dosen/lms',
        'dosen.lms.show': (id) => `/dosen/lms/${id}`,

        'dosen.lms.chapters.store': (id) => `/dosen/lms/${id}/chapters`,
        'dosen.lms.chapters.update': (id) => `/dosen/lms/chapters/${id}`,
        'dosen.lms.chapters.delete': (id) => `/dosen/lms/chapters/${id}`,
        'dosen.lms.forums.store': (id) => `/dosen/lms/chapters/${id}/forums`,
        'dosen.lms.forums.update': (id) => `/dosen/lms/forums/${id}`,
        'dosen.lms.forums.delete': (id) => `/dosen/lms/forums/${id}`,
        'dosen.lms.forums.show': (id) => `/dosen/lms/forums/${id}`,
        'dosen.lms.forums.threads.store': (id) => `/dosen/lms/forums/${id}/threads`,
        'dosen.lms.forums.threads.show': (id) => `/dosen/lms/forum-threads/${id}`,
        'dosen.lms.forums.threads.update': (id) => `/dosen/lms/forum-threads/${id}`,
        'dosen.lms.forums.threads.delete': (id) => `/dosen/lms/forum-threads/${id}`,
        'dosen.lms.forums.replies.store': (id) => `/dosen/lms/forum-threads/${id}/replies`,
        'dosen.lms.forums.replies.update': (id) => `/dosen/lms/forum-replies/${id}`,
        'dosen.lms.forums.replies.delete': (id) => `/dosen/lms/forum-replies/${id}`,

        'dosen.lms.materials.create': (id) => `/dosen/lms/chapters/${id}/materials/create`,
        'dosen.lms.materials.store': (id) => `/dosen/lms/chapters/${id}/materials`,
        'dosen.lms.materials.generate': (id) => `/dosen/lms/chapters/${id}/materials/generate`,
        'dosen.lms.materials.show': (id) => `/dosen/lms/materials/${id}/view`,
        'dosen.lms.materials.edit': (id) => `/dosen/lms/materials/${id}/edit`,
        'dosen.lms.materials.update': (id) => `/dosen/lms/materials/${id}`,
        'dosen.lms.materials.assistant': (id) => `/dosen/lms/materials/${id}/assistant`,
        'dosen.lms.materials.delete': (id) => `/dosen/lms/materials/${id}`,

        'dosen.lms.assignments.create': (id) => `/dosen/lms/chapters/${id}/assignments/create`,
        'dosen.lms.assignments.store': (id) => `/dosen/lms/chapters/${id}/assignments`,
        'dosen.lms.assignments.edit': (id) => `/dosen/lms/assignments/${id}/edit`,
        'dosen.lms.assignments.grading': (id) => `/dosen/lms/assignments/${id}/grading`,
        'dosen.lms.assignments.update': (id) => `/dosen/lms/assignments/${id}`,
        'dosen.lms.submissions.grade': (id) => `/dosen/lms/submissions/${id}/grading`,
        'dosen.lms.assignments.delete': (id) => `/dosen/lms/assignments/${id}`,

        // LMS Mahasiswa
        'mahasiswa.lms.index': '/mahasiswa/lms',
        'mahasiswa.lms.show': (id) => `/mahasiswa/lms/${id}`,
        'mahasiswa.lms.materials.show': (id) => `/mahasiswa/lms/materials/${id}`,
        'mahasiswa.lms.materials.toggle': (id) => `/mahasiswa/lms/materials/${id}/toggle`,
        'mahasiswa.lms.materials.assistant': (id) => `/mahasiswa/lms/materials/${id}/assistant`,
        'mahasiswa.lms.assignments.submit': (id) => `/mahasiswa/lms/assignments/${id}/submit`,
        'mahasiswa.lms.forums.show': (id) => `/mahasiswa/lms/forums/${id}`,
        'mahasiswa.lms.forums.threads.show': (id) => `/mahasiswa/lms/forum-threads/${id}`,
        'mahasiswa.lms.forums.replies.store': (id) => `/mahasiswa/lms/forum-threads/${id}/replies`,
    };

    if (name === undefined) {
        // Return route helper with current method
        return {
            current: (routeName) => {
                const currentPath = window.location.pathname;
                const routePath = routes[routeName];
                if (typeof routePath === 'function') {
                    // For dynamic routes, just check if current path starts with base path
                    const basePath = routePath.toString().match(/\/[^\/]+/)?.[0] || '';
                    return currentPath.startsWith(basePath);
                }
                return currentPath === routePath;
            }
        };
    }

    const route = routes[name];
    if (typeof route === 'function') {
        return route(params);
    }
    return route || '/';
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
