// Initializes Firebase auth listener on app startup
// and wires up tasks/notifications on login state changes
import { useAuthStore } from '~/stores/auth'
import { useTasksStore } from '~/stores/tasks'
import { useNotificationsStore } from '~/stores/notifications'
import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return

  const authStore = useAuthStore()
  const tasksStore = useTasksStore()
  const notificationsStore = useNotificationsStore()

  // Wait for the auth to initialize
  authStore.initAuth()

  // Wire up dependent stores when auth state changes
  watch(() => authStore.user, (user) => {
    if (user) {
      tasksStore.init()
      notificationsStore.init(user.uid)
    } else {
      tasksStore.cleanup()
      notificationsStore.cleanup()
    }
  }, { immediate: true })
})
