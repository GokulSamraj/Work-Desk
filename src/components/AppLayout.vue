<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-950 flex transition-colors duration-300">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col fixed left-0 top-0 h-full z-30 transition-colors duration-300">
      <!-- Logo -->
      <div class="h-16 flex items-center px-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 5h14M2 9h9M2 13h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="font-bold text-surface-900 dark:text-surface-50 text-lg tracking-tight">TaskFlow</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <p class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest px-3 pt-2 pb-1">Main</p>

        <RouterLink to="/dashboard" custom v-slot="{ isActive, navigate }">
          <button @click="navigate" :class="['nav-link w-full', isActive ? 'active' : '']">
            <LayoutDashboard :size="17" />
            Dashboard
          </button>
        </RouterLink>

        <div v-if="authStore.isAdmin" class="pt-3">
          <p class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-widest px-3 pb-1">Admin</p>
          <RouterLink to="/admin/dashboard" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" :class="['nav-link w-full', isActive ? 'active' : '']">
              <ShieldCheck :size="17" />
              User Management
            </button>
          </RouterLink>
        </div>
      </nav>

      <!-- User Footer -->
      <div class="p-3 border-t border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3 px-2 py-2">
          <!-- Avatar: photo or initials -->
          <div v-if="authStore.user?.photoURL" class="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <img :src="authStore.user.photoURL" :alt="authStore.user?.name" class="w-full h-full object-cover" />
          </div>
          <div v-else :class="['w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(authStore.user?.name)]">
            {{ initials(authStore.user?.name) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-surface-400 dark:text-surface-500 truncate capitalize">{{ authStore.user?.role }}</p>
          </div>
          <button @click="handleLogout" class="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors p-1 rounded" title="Sign out">
            <LogOut :size="15" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 ml-60 flex flex-col min-h-screen">
      <!-- Top navbar -->
      <header class="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-300">
        <div>
          <slot name="header-title">
            <h1 class="text-lg font-bold text-surface-900 dark:text-surface-50">{{ title }}</h1>
          </slot>
        </div>

        <div class="flex items-center gap-2">
          <!-- Dark Mode Toggle -->
          <button
            @click="themeStore.toggleTheme()"
            class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
            :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            id="theme-toggle-btn"
          >
            <Sun v-if="themeStore.isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>

          <!-- Notifications Bell -->
          <div class="relative" ref="notifRef">
            <button
              @click="notifOpen = !notifOpen"
              class="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
              id="notifications-btn"
            >
              <Bell :size="18" />
              <span
                v-if="notifStore.unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
              >
                {{ notifStore.unreadCount > 99 ? '99+' : notifStore.unreadCount }}
              </span>
            </button>

            <!-- Notification Dropdown -->
            <Transition name="dropdown">
              <div v-if="notifOpen" class="absolute right-0 top-12 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-dropdown border border-surface-200 dark:border-surface-700 z-50 animate-fade-in overflow-hidden">
                <div class="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <h3 class="font-semibold text-sm text-surface-900 dark:text-surface-100">Notifications</h3>
                  <button
                    v-if="notifStore.unreadCount > 0"
                    @click="markAllRead"
                    class="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <div class="max-h-72 overflow-y-auto">
                  <div v-if="notifStore.notifications.length === 0" class="px-4 py-8 text-center">
                    <Bell :size="24" class="mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                    <p class="text-sm text-surface-400 dark:text-surface-500">No notifications yet</p>
                  </div>

                  <button
                    v-for="notif in notifStore.notifications.slice(0, 20)"
                    :key="notif.id"
                    @click="handleNotifClick(notif)"
                    class="w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors border-b border-surface-50 dark:border-surface-700 last:border-0"
                    :class="{ 'bg-brand-50/50 dark:bg-brand-900/20': !notif.read }"
                  >
                    <div class="flex items-start gap-3">
                      <div :class="['w-2 h-2 rounded-full mt-1.5 shrink-0', notif.read ? 'bg-transparent' : 'bg-brand-500']"></div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-surface-900 dark:text-surface-100 line-clamp-1">{{ notif.taskTitle }}</p>
                        <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                        <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">{{ timeAgo(notif.createdAt) }}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- User Avatar -->
          <div v-if="authStore.user?.photoURL" class="w-8 h-8 rounded-full overflow-hidden cursor-default ring-2 ring-surface-200 dark:ring-surface-700">
            <img :src="authStore.user.photoURL" :alt="authStore.user?.name" class="w-full h-full object-cover" />
          </div>
          <div v-else :class="['w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-default', avatarColor(authStore.user?.name)]">
            {{ initials(authStore.user?.name) }}
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Bell, LogOut, LayoutDashboard, ShieldCheck, Sun, Moon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useThemeStore } from '@/stores/theme'
import { avatarColor, initials, timeAgo } from '@/utils/helpers'
import { onClickOutside } from '@vueuse/core'

defineProps({ title: { type: String, default: '' } })

const authStore = useAuthStore()
const notifStore = useNotificationsStore()
const themeStore = useThemeStore()
const router = useRouter()

const notifOpen = ref(false)
const notifRef = ref(null)

onClickOutside(notifRef, () => { notifOpen.value = false })

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function markAllRead() {
  await notifStore.markAllRead(authStore.user.uid)
}

function handleNotifClick(notif) {
  notifStore.markRead(notif.id)
  notifOpen.value = false
  router.push(`/task/${notif.taskId}`)
}
</script>
