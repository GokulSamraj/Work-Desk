// Global auth middleware — runs before every page navigation
// Protects routes that require authentication and enforces role-based access
import { useAuthStore } from '~/stores/auth'
import { watch } from 'vue'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client-side (Firebase auth is client-side only)
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Wait for auth to finish loading before making decisions
  if (authStore.loading) {
    await new Promise((resolve) => {
      const stop = watch(
        () => authStore.loading,
        (loading) => {
          if (!loading) {
            stop()
            resolve(undefined)
          }
        }
      )
    })
  }

  const isAuth = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin
  const guestOnly = to.meta.guest

  // Redirect unauthenticated users trying to access protected pages
  if (requiresAuth && !isAuth) {
    return navigateTo('/login')
  }

  // Redirect non-admins trying to access admin pages
  if (requiresAdmin && !isAdmin) {
    return navigateTo('/dashboard')
  }

  // Redirect authenticated users away from login/guest pages
  if (guestOnly && isAuth) {
    if (isAdmin) return navigateTo('/admin/dashboard')
    return navigateTo('/dashboard')
  }
})
