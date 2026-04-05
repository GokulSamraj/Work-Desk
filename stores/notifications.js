import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '~/firebase/firestore'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  let unsubscribe = null

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  function init(userId) {
    if (unsubscribe) unsubscribe()
    unsubscribe = subscribeToNotifications(userId, (data) => {
      notifications.value = data
    })
  }

  async function markRead(notifId) {
    await markNotificationRead(notifId)
  }

  async function markAllRead(userId) {
    await markAllNotificationsRead(userId)
  }

  function cleanup() {
    if (unsubscribe) unsubscribe()
    notifications.value = []
  }

  return { notifications, unreadCount, init, markRead, markAllRead, cleanup }
})
