<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-900 flex items-center justify-center p-4">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-900/20 rounded-full blur-3xl opacity-40"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl opacity-40"></div>
    </div>

    <div class="w-full max-w-sm relative">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 7h18M3 12h12M3 17h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-surface-50 tracking-tight">Welcome to TaskFlow</h1>
        <p class="text-surface-400 text-sm mt-1">Sign in to manage your tasks</p>
      </div>

      <!-- Card -->
      <div class="bg-surface-800 border border-surface-700 rounded-2xl p-8 shadow-2xl">
        <div v-if="error" class="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg mb-5">
          <AlertCircle :size="15" class="text-red-400 shrink-0 mt-0.5" />
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-surface-300">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
              class="w-full px-3 py-2.5 bg-surface-700 border border-surface-600 rounded-lg text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-surface-300">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              class="w-full px-3 py-2.5 bg-surface-700 border border-surface-600 rounded-lg text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ guest: true })

const router = useRouter()
const authStore = useAuthStore()

watchEffect(() => {
  if (authStore.isAuthenticated) {
    router.push(authStore.isAdmin ? '/admin/dashboard' : '/dashboard')
  }
})

const email = ref('')
const password = ref('')
const loading = ref(authStore.loading)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
  } catch (e) {
    error.value = e.message || 'Sign-in failed. Check your email and password.'
    loading.value = false
  }
}
</script>
