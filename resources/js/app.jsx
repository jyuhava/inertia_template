import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initInstallPrompt, registerServiceWorker } from './pwa';

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
        'admin.mahasiswa.reset-password': (id) => `/admin/mahasiswa/${typeof id === 'object' && id !== null ? (id.id || id.mahasiswa) : id}/reset-password`,
        'admin.dosen.reset-password': (id) => `/admin/dosen/${typeof id === 'object' && id !== null ? (id.id || id.dosen) : id}/reset-password`,

        // User Management routes
        'admin.user-management.index': '/admin/user-management',
        'admin.user-management.reset-password.form': (id) => `/admin/user-management/${typeof id === 'object' && id !== null ? (id.id || id.user) : id}/reset-password`,
        'admin.user-management.reset-password': (id) => `/admin/user-management/${typeof id === 'object' && id !== null ? (id.id || id.user) : id}/reset-password`,
        'admin.user-management.bulk-reset-password': '/admin/user-management/bulk-reset-password',
        'admin.user-management.generate-password': (id) => `/admin/user-management/${typeof id === 'object' && id !== null ? (id.id || id.user) : id}/generate-password`,
        'admin.user-management.toggle-status': (id) => `/admin/user-management/${typeof id === 'object' && id !== null ? (id.id || id.user) : id}/toggle-status`,
        'admin.user-management.export': '/admin/user-management/export',

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
        'dosen.penilaian.unfinalisasi': (id) => `/dosen/penilaian/${id}/unfinalisasi`,
        'dosen.absensi.index': (id) => `/dosen/absensi/${id}`,
        'dosen.absensi.pertemuan.create': (id) => `/dosen/absensi/${id}/pertemuan`,
        'dosen.absensi.update': (id) => `/dosen/absensi/${id}/update`,
        'dosen.absensi.pertemuan.delete': (id) => `/dosen/absensi/${id}/pertemuan`,
        'dosen.absensi.rekap': (id) => `/dosen/absensi/${id}/rekap`,
        // Outcome-Based Education routes
        'admin.obe.cpl.index': '/admin/obe/cpl',
        'admin.obe.cpl.create': '/admin/obe/cpl/create',
        'admin.obe.cpmk.index': '/admin/obe/cpmk',
        'admin.obe.mapping.index': '/admin/obe/mapping',
        'admin.obe.assessments.index': '/admin/obe/assessments',
        'admin.obe.report': '/admin/obe/report',
        'dosen.obe.index': '/dosen/obe',
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

        // Meeting Minutes (Notulen Rapat)
        'meeting-minutes.index': '/meeting-minutes',
        'meeting-minutes.create': '/meeting-minutes/create',
        'meeting-minutes.store': '/meeting-minutes',
        'meeting-minutes.show': (id) => `/meeting-minutes/${id}`,
        'meeting-minutes.edit': (id) => `/meeting-minutes/${id}/edit`,
        'meeting-minutes.update': (id) => `/meeting-minutes/${id}`,
        'meeting-minutes.destroy': (id) => `/meeting-minutes/${id}`,
        'meeting-minutes.status': (id) => `/meeting-minutes/${id}/status`,
        'meeting-minutes.toggle-public': (id) => `/meeting-minutes/${id}/toggle-public`,
        'meeting-agenda-items.progress': (id) => `/meeting-agenda-items/${id}/progress`,
        'meeting-minutes.attachments.upload': (id) => `/meeting-minutes/${id}/attachments`,
        'meeting-attachments.destroy': (id) => `/meeting-attachments/${id}`,
        'meeting-minutes.public': (token) => `/public/meeting/${token}`,

        // Raker (Rapat Kerja)
        'raker.index': '/raker',
        'raker.sessions.index': '/raker/sessions',
        'raker.sessions.create': '/raker/sessions/create',
        'raker.sessions.store': '/raker/sessions',
        'raker.sessions.show': (id) => `/raker/sessions/${id}`,
        'raker.sessions.edit': (id) => `/raker/sessions/${id}/edit`,
        'raker.sessions.update': (id) => `/raker/sessions/${id}`,
        'raker.sessions.destroy': (id) => `/raker/sessions/${id}`,
        'raker.submission.show': (id) => `/raker/sessions/${id}/my-submission`,
        'raker.submission.view': (id) => `/raker/submissions/${id}`,
        'raker.submission.update': (id) => `/raker/submissions/${id}`,
        'raker.submission.submit': (id) => `/raker/submissions/${id}/submit`,

        'raker.borang1.store': (id) => `/raker/submissions/${id}/borang1`,
        'raker.borang1.update': (id) => `/raker/borang1/${id}`,
        'raker.borang1.destroy': (id) => `/raker/borang1/${id}`,
        'raker.borang1.reorder': (id) => `/raker/submissions/${id}/borang1/reorder`,

        'raker.borang2.store': (id) => `/raker/submissions/${id}/borang2`,
        'raker.borang2.update': (id) => `/raker/borang2/${id}`,
        'raker.borang2.destroy': (id) => `/raker/borang2/${id}`,
        'raker.borang2.reorder': (id) => `/raker/submissions/${id}/borang2/reorder`,

        'raker.borang3.store': (id) => `/raker/submissions/${id}/borang3`,
        'raker.borang3.update': (id) => `/raker/borang3/${id}`,
        'raker.borang3.destroy': (id) => `/raker/borang3/${id}`,
        'raker.borang3.reorder': (id) => `/raker/submissions/${id}/borang3/reorder`,

        'raker.borang4.store': (id) => `/raker/submissions/${id}/borang4`,
        'raker.borang4.update': (id) => `/raker/borang4/${id}`,
        'raker.borang4.destroy': (id) => `/raker/borang4/${id}`,
        'raker.borang4.reorder': (id) => `/raker/submissions/${id}/borang4/reorder`,

        'raker.borang5.store': (id) => `/raker/submissions/${id}/borang5`,
        'raker.borang5.update': (id) => `/raker/borang5/${id}`,
        'raker.borang5.destroy': (id) => `/raker/borang5/${id}`,
        'raker.borang5.reorder': (id) => `/raker/submissions/${id}/borang5/reorder`,

        'raker.borang6.store': (id) => `/raker/submissions/${id}/borang6`,
        'raker.borang6.update': (id) => `/raker/borang6/${id}`,
        'raker.borang6.destroy': (id) => `/raker/borang6/${id}`,
        'raker.borang6.reorder': (id) => `/raker/submissions/${id}/borang6/reorder`,

        // LPM Admin
        'admin.lpm.dashboard': '/admin/lpm',
        'admin.lpm.overview': '/admin/lpm/dashboard',
        'admin.lpm.programs.index': '/admin/lpm/programs',
        'admin.lpm.programs.create': '/admin/lpm/programs/create',
        'admin.lpm.programs.store': '/admin/lpm/programs',
        'admin.lpm.programs.show': (id) => `/admin/lpm/programs/${id}`,
        'admin.lpm.programs.edit': (id) => `/admin/lpm/programs/${id}/edit`,
        'admin.lpm.programs.update': (id) => `/admin/lpm/programs/${id}`,
        'admin.lpm.programs.destroy': (id) => `/admin/lpm/programs/${id}`,
        'admin.lpm.programs.activate': (id) => `/admin/lpm/programs/${id}/activate`,
        'admin.lpm.programs.close': (id) => `/admin/lpm/programs/${id}/close`,
        'admin.lpm.programs.reopen': (id) => `/admin/lpm/programs/${id}/reopen`,
        'admin.lpm.programs.finalize': (id) => `/admin/lpm/programs/${id}/finalize`,
        'admin.lpm.programs.download-template': (id) => `/admin/lpm/programs/${id}/template`,
        'admin.lpm.proposals.index': '/admin/lpm/proposals',
        'admin.lpm.proposals.show': (id) => `/admin/lpm/proposals/${id}`,
        'admin.lpm.proposals.verify-approve': (id) => `/admin/lpm/proposals/${id}/verify-approve`,
        'admin.lpm.proposals.verify-return': (id) => `/admin/lpm/proposals/${id}/verify-return`,
        'admin.lpm.proposals.verify-admin-approve': (id) => `/admin/lpm/proposals/${id}/verify-admin-approve`,
        'admin.lpm.proposals.reject': (id) => `/admin/lpm/proposals/${id}/reject`,
        'admin.lpm.proposals.assign-reviewers': (id) => `/admin/lpm/proposals/${id}/assign-reviewers`,
        'admin.lpm.proposals.decide-review': (id) => `/admin/lpm/proposals/${id}/decide-review`,
        'admin.lpm.proposals.fund': (id) => `/admin/lpm/proposals/${id}/fund`,
        'admin.lpm.proposals.contract': (id) => `/admin/lpm/proposals/${id}/contract`,
        'admin.lpm.proposals.start': (id) => `/admin/lpm/proposals/${id}/start`,
        'admin.lpm.proposals.activities.store': (id) => `/admin/lpm/proposals/${id}/activities`,
        'admin.lpm.reports.validate': (id) => `/admin/lpm/reports/${id}/validate`,
        'admin.lpm.outputs.validate': (id) => `/admin/lpm/outputs/${id}/validate`,

        // LPM Dosen
        'dosen.lpm.proposals.index': '/dosen/lpm',
        'dosen.lpm.proposals.create': '/dosen/lpm/proposals/create',
        'dosen.lpm.proposals.store': '/dosen/lpm/proposals',
        'dosen.lpm.proposals.show': (id) => `/dosen/lpm/${id}`,
        'dosen.lpm.proposals.edit': (id) => `/dosen/lpm/${id}/edit`,
        'dosen.lpm.proposals.update': (id) => `/dosen/lpm/${id}`,
        'dosen.lpm.proposals.submit': (id) => `/dosen/lpm/${id}/submit`,
        'dosen.lpm.proposals.confirm-membership': (id) => `/dosen/lpm/${id}/confirm-membership`,
        'dosen.lpm.proposals.documents.upload': (id) => `/dosen/lpm/${id}/documents`,
        'dosen.lpm.proposals.documents.destroy': (id) => `/dosen/lpm/documents/${id}`,
        'dosen.lpm.proposals.reports.upload': (id) => `/dosen/lpm/${id}/reports`,
        'dosen.lpm.proposals.outputs.store': (id) => `/dosen/lpm/${id}/outputs`,
        'dosen.lpm.proposals.outputs.update': (id) => `/dosen/lpm/outputs/${id}`,
        'dosen.lpm.reviews.index': '/dosen/lpm/reviews',
        'dosen.lpm.reviews.edit': (id) => `/dosen/lpm/reviews/${id}`,
        'dosen.lpm.reviews.update': (id) => `/dosen/lpm/reviews/${id}`,
        'dosen.lpm.reviews.destroy': (id) => `/dosen/lpm/reviews/${id}`,
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
    if (typeof route === 'string') {
        if (params && typeof params === 'object' && !Array.isArray(params) && Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    queryParams.append(key, val);
                }
            });
            const qs = queryParams.toString();
            return qs ? `${route}?${qs}` : route;
        }
        return route;
    }
    if (name) {
        console.warn(`[Route Helper] Route "${name}" not found.`);
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

// PWA: service worker + dukungan "Pasang aplikasi".
registerServiceWorker();
initInstallPrompt();
