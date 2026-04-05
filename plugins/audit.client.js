import { useAuthStore } from '~/stores/auth'
import { logAction } from '~/firebase/firestore'

export default defineNuxtPlugin(nuxtApp => {
  if (import.meta.server) return

  const router = useRouter()

  router.afterEach((to, from) => {
    // We use a timeout to ensure auth store has hydrated on initial boot
    setTimeout(() => {
      const authStore = useAuthStore()
      if (authStore.user && to.path !== from.path) {
        let details = `Navigated to ${to.path}`
        if (from.path !== '/') {
          details = `Navigated from ${from.path} to ${to.path}`
        }
        logAction(authStore.user.uid, authStore.user.name, 'page_navigated', details).catch(() => {})
      }
    }, 500)
  })
})
