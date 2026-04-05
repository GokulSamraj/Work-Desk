import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginWithPopupCompact, resolveUserProfile, signOut, onAuthChange } from '~/firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  let unsubscribe = null

  function initAuth() {
    unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await resolveUserProfile(firebaseUser)
          
          if (profile && profile.active !== false) {
            user.value = profile
          } else {
            user.value = null
            await signOut()
          }
        } catch (err) {
          console.error("Auth provisioning error:", err)
          if (err.message === 'timeout' || err.message.includes('offline')) {
            error.value = "Taking unusually long to connect to database. It might be blocked by an anti-tracker plugin."
          }
          user.value = null
        }
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  async function loginWithGoogle() {
    error.value = null
    try {
      const profile = await loginWithPopupCompact()
      user.value = profile
      return profile
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function logout() {
    await signOut()
    user.value = null
  }

  function cleanup() {
    if (unsubscribe) unsubscribe()
  }

  return { user, loading, error, isAuthenticated, isAdmin, loginWithGoogle, logout, initAuth, cleanup }
})
