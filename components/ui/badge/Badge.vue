<template>
  <span :class="cn(badgeVariants({ variant }), $attrs.class)" v-bind="{ ...$attrs, class: undefined }">
    <slot />
  </span>
</template>

<script setup>
import { cva } from 'class-variance-authority'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

defineProps({
  variant: { type: String, default: 'default' }
})

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-600 text-white shadow dark:bg-brand-500',
        secondary: 'border-transparent bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100',
        destructive: 'border-transparent bg-red-600 text-white shadow dark:bg-red-500',
        outline: 'border-surface-200 text-surface-700 dark:border-surface-600 dark:text-surface-300',
        success: 'border-transparent bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
        admin: 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
</script>
