import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/eventos' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/eventos',
    name: 'EventList',
    component: () => import('@/views/EventList.vue')
  },
  {
    path: '/eventos/:id',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    props: true
  },
  {
    path: '/eventos/:id/relatorios',
    name: 'Relatorios',
    component: () => import('@/views/Relatorios.vue'),
    props: true
  },
  {
    path: '/seed',
    name: 'Seed',
    component: () => import('@/views/SeedPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.session && !to.meta.public) {
    return '/login'
  }
  if (auth.session && to.name === 'Login') {
    return '/eventos'
  }
})

export default router
