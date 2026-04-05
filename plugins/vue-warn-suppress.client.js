// Suppresses internal Vue/Nuxt warnings that are noisy but harmless
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.warnHandler = (msg, _vm, trace) => {
    // Suppress: <Suspense> experimental feature warning (Nuxt uses it internally)
    if (msg.includes('<Suspense> is an experimental feature')) return
    // Log everything else
    console.warn('[Vue warn]:', msg, trace)
  }
})
