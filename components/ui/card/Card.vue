<template>
  <div :class="cn('rounded-xl border border-surface-200 bg-white shadow-card dark:border-surface-700 dark:bg-surface-800', $attrs.class)"
    v-bind="{ ...$attrs, class: undefined }">
    <slot />
  </div>
</template>

<script setup>
import { cn } from '~/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
