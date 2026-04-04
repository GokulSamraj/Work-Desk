<template>
  <div class="min-h-screen bg-surface-900 dark:bg-surface-950 flex items-center justify-center p-4 transition-colors duration-300">
    <!-- Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-900 rounded-full blur-3xl opacity-30"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-900 rounded-full blur-3xl opacity-20"></div>
    </div>

    <div class="w-full max-w-sm relative">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-900/50">
          <ShieldCheck :size="22" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
        <p class="text-surface-400 text-sm mt-1">Restricted to administrators only</p>
      </div>

      <div class="bg-surface-800 dark:bg-surface-900 border border-surface-700 rounded-2xl p-6 shadow-2xl">
        <!-- Google Sign In for Admin -->
        <Button
          variant="google"
          class="w-full mb-4 bg-surface-700 border-surface-600 text-white hover:bg-surface-600 dark:bg-surface-800 dark:border-surface-600"
          :disabled="googleLoading"
          @click="handleGoogleAdminLogin"
          id="admin-google-login-btn"
        >
          <Loader2 v-if="googleLoading" :size="16" class="animate-spin" />
          <svg v-else width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </Button>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px bg-surface-700"></div>
          <span class="text-xs text-surface-500">or use email</span>
          <div class="flex-1 h-px bg-surface-700"></div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="admin@company.com"
              class="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              required
              id="admin-email"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all pr-10"
                required
                id="admin-password"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                <Eye v-if="!showPassword" :size="15" />
                <EyeOff v-else :size="15" />
              </button>
            </div>
          </div>

          <div v-if="error" class="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
            <AlertCircle :size="14" class="text-red-400 shrink-0 mt-0.5" />
            <p class="text-xs text-red-400">{{ error }}</p>
          </div>

          <button type="submit" :disabled="loading" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-medium text-sm rounded-lg hover:bg-brand-500 transition-colors disabled:opacity-50" id="admin-submit-btn">
            <Loader2 v-if="loading" :size="16" class="animate-spin" />
            <span>{{ loading ? 'Authenticating...' : 'Sign in as Admin' }}</span>
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-surface-600 mt-6">
        Regular user?
        <RouterLink to="/login" class="text-brand-400 hover:underline font-medium">Sign in here</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const user = await authStore.login(email.value, password.value)
    if (user.role !== 'admin') {
      error.value = 'Access denied. This portal is for administrators only.'
      await authStore.logout()
      return
    }
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleGoogleAdminLogin() {
  error.value = ''
  googleLoading.value = true
  try {
    const user = await authStore.loginWithGoogle()
    if (user.role !== 'admin') {
      error.value = 'Access denied. Your Google account does not have admin privileges.'
      await authStore.logout()
      return
    }
    router.push('/admin/dashboard')
  } catch (e) {
    error.value = e.message || 'Google sign-in failed. Please try again.'
  } finally {
    googleLoading.value = false
  }
}
</script>
