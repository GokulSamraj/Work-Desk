<template>
  <input
    v-bind="$attrs"
    :class="cn('flex h-9 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus-visible:border-brand-500', $attrs.class)"
  />
</template>

<script setup>
import { cn } from '~/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
