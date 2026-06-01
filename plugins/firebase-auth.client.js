import { useAuthStore } from '~/stores/auth'
import { useTasksStore } from '~/stores/tasks'
import { useNotificationsStore } from '~/stores/notifications'
import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  const tasksStore = useTasksStore()
  const notificationsStore = useNotificationsStore()

  authStore.initAuth()

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
