import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/admin',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: { guest: true, adminLogin: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: () => import('@/views/TaskDetailView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // While auth is still loading, allow navigation to proceed for now
  // The App.vue will handle loading state
  if (authStore.loading) {
    return next()
  }

  const isAuth = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login')
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return next('/dashboard')
  }

  if (to.meta.guest && isAuth) {
    // Redirect authenticated users away from login pages
    if (isAdmin) return next('/admin/dashboard')
    return next('/dashboard')
  }

  next()
})

export default router
