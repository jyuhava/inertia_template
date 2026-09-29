import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { entityDefinitions, entityGroupLabels } from '@/config/entities';

/**
 * Routing integrator (dilayani pada sub-path /integrator).
 *
 * Contoh URL: /integrator/dashboard, /integrator/mapping/mahasiswa,
 * /integrator/kelas/12, /integrator/logs.
 */
const entityRoutes: RouteRecordRaw[] = Object.values(entityDefinitions).flatMap((definition) => [
    {
        path: `/${definition.route}`,
        name: `entity.${definition.key}`,
        component: () => import('@/views/entities/EntityList.vue'),
        meta: { title: definition.label, group: entityGroupLabels[definition.group], entity: definition.key },
    },
    {
        path: `/${definition.route}/:id`,
        name: `entity.${definition.key}.detail`,
        component: () => import('@/views/entities/EntityDetail.vue'),
        meta: { title: `Detail ${definition.singular}`, group: entityGroupLabels[definition.group], entity: definition.key },
    },
]);

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: '/dashboard' },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: 'Dashboard', group: 'Ringkasan' },
    },
    {
        path: '/connection',
        name: 'connection',
        component: () => import('@/views/ConnectionView.vue'),
        meta: { title: 'Koneksi Neo Feeder', group: 'Konfigurasi' },
    },
    {
        path: '/references',
        name: 'references',
        component: () => import('@/views/references/ReferenceList.vue'),
        meta: { title: 'Referensi PDDikti', group: 'Referensi' },
    },
    {
        path: '/references/:key',
        name: 'references.detail',
        component: () => import('@/views/references/ReferenceView.vue'),
        meta: { title: 'Detail Referensi', group: 'Referensi' },
    },
    {
        path: '/mapping',
        name: 'mapping',
        component: () => import('@/views/mapping/MappingCenter.vue'),
        meta: { title: 'Mapping Center', group: 'Pemetaan' },
    },
    {
        path: '/mapping/:entity',
        name: 'mapping.entity',
        component: () => import('@/views/mapping/MappingEntity.vue'),
        meta: { title: 'Pemetaan Data', group: 'Pemetaan' },
    },
    {
        path: '/validation',
        name: 'validation',
        component: () => import('@/views/validation/ValidationCenter.vue'),
        meta: { title: 'Validation Center', group: 'Validasi' },
    },
    {
        path: '/synchronization',
        name: 'synchronization',
        component: () => import('@/views/sync/Synchronization.vue'),
        meta: { title: 'Sinkronisasi', group: 'Sinkronisasi' },
    },
    {
        path: '/synchronization/wizard',
        name: 'synchronization.wizard',
        component: () => import('@/views/sync/SyncWizard.vue'),
        meta: { title: 'Sync Wizard', group: 'Sinkronisasi' },
    },
    {
        path: '/synchronization/jobs/:id',
        name: 'synchronization.job',
        component: () => import('@/views/sync/SyncJobDetail.vue'),
        meta: { title: 'Detail Job Sinkronisasi', group: 'Sinkronisasi' },
    },
    {
        path: '/monitoring',
        name: 'monitoring',
        component: () => import('@/views/sync/Monitoring.vue'),
        meta: { title: 'Monitoring', group: 'Sinkronisasi' },
    },
    {
        path: '/logs',
        name: 'logs',
        component: () => import('@/views/logs/LogsView.vue'),
        meta: { title: 'Log & Audit Trail', group: 'Sinkronisasi' },
    },
    {
        path: '/panduan',
        name: 'panduan',
        component: () => import('@/views/docs/Panduan.vue'),
        meta: { title: 'Panduan Integrator', group: 'Bantuan' },
    },
    ...entityRoutes,
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: 'Halaman tidak ditemukan', group: 'Bantuan' },
    },
];

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
    const title = (to.meta.title as string | undefined) ?? 'Integrator PDDikti';
    document.title = `${title} · Integrator PDDikti`;
});

export default router;
