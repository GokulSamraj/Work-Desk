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

        <!-- Google Sign In -->
        <button
          id="google-login-btn"
          class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs rounded-full transition-all duration-150 disabled:opacity-50 shadow-md border border-gray-100"
          :disabled="loading"
          @click="handleGoogleLogin"
        >
          <Loader2 v-if="loading" :size="18" class="animate-spin text-gray-600" />
          <svg v-else width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ loading ? 'Signing in...' : 'Continue with Google' }}</span>
        </button>

        <p class="text-center text-xs text-surface-600 mt-5">
          By signing in you agree to our terms of service
        </p>
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

const loading = ref(authStore.loading) // Sync initial load state to prevent flashes
const error = ref('')

async function handleGoogleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    // It will securely redirect the webpage to Google.
    // The auth.global.ts middleware will gracefully handle the route callback after login.
  } catch (e) {
    error.value = e.message || 'Google sign-in failed. Please try again.'
    loading.value = false
  }
}
</script>
