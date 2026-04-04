<template>
  <div id="app">
    <div v-if="authStore.loading" class="fixed inset-0 bg-surface-50 dark:bg-surface-950 flex items-center justify-center z-50 transition-colors duration-300">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6h16M3 11h10M3 16h7" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="flex gap-1.5">
          <div class="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style="animation-delay: 300ms"></div>
        </div>
      </div>
    </div>
    <RouterView v-else />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useNotificationsStore } from '@/stores/notifications'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const notificationsStore = useNotificationsStore()

onMounted(() => {
  authStore.initAuth()
})

// When user logs in, init tasks and notifications
watch(() => authStore.user, (user) => {
  if (user) {
    tasksStore.init()
    notificationsStore.init(user.uid)
  } else {
    tasksStore.cleanup()
    notificationsStore.cleanup()
  }
}, { immediate: true })

onUnmounted(() => {
  authStore.cleanup()
  tasksStore.cleanup()
  notificationsStore.cleanup()
})
</script>
