<template>
  <SeparatorRoot
    v-bind="$props"
    :class="cn('shrink-0 bg-surface-200 dark:bg-surface-700', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', $attrs.class)"
  />
</template>

<script setup>
import { Separator as SeparatorRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

defineProps({
  orientation: { type: String, default: 'horizontal' },
  decorative: { type: Boolean, default: true },
})
</script>
