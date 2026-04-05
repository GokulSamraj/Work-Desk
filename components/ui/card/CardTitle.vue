<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight text-surface-900 dark:text-surface-50', $attrs.class)" v-bind="{ ...$attrs, class: undefined }">
    <slot />
  </h3>
</template>
<script setup>
import { cn } from '~/lib/utils'
defineOptions({ inheritAttrs: false })
</script>
