<template>
  <label
    :class="cn('text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400', $attrs.class)"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <slot />
  </label>
</template>

<script setup>
import { cn } from '@/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
