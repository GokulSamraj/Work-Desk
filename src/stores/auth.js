import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { signIn, signOut, signInWithGoogle, getUserProfile, onAuthChange } from '@/firebase/auth'

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
        const profile = await getUserProfile(firebaseUser.uid)
        user.value = profile
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  async function login(email, password) {
    error.value = null
    try {
      const profile = await signIn(email, password)
      user.value = profile
      return profile
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function loginWithGoogle() {
    error.value = null
    try {
      const profile = await signInWithGoogle()
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

  return { user, loading, error, isAuthenticated, isAdmin, login, loginWithGoogle, logout, initAuth, cleanup }
})
