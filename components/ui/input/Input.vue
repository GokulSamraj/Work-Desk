<template>
  <input
    v-bind="$attrs"
    :class="cn('flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50', $attrs.class)"
  />
</template>

<script setup>
import { cn } from '~/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
