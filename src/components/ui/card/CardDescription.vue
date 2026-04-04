<template>
  <p :class="cn('text-sm text-surface-500 dark:text-surface-400', $attrs.class)" v-bind="{ ...$attrs, class: undefined }">
    <slot />
  </p>
</template>
<script setup>
import { cn } from '@/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
