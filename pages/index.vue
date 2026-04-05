<script setup lang="ts">
definePageMeta({ middleware: [] })

// Always redirect root to /login
// Auth middleware will then redirect to /dashboard if already logged in
const router = useRouter()
router.replace('/login')
</script>

<template>
  <div></div>
</template>
