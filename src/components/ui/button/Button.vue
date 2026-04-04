<template>
  <component
    :is="as || 'button'"
    :class="cn(buttonVariants({ variant, size }), $attrs.class)"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <slot />
  </component>
</template>

<script setup>
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  size: {
    type: String,
    default: 'default',
  },
  as: {
    type: [String, Object],
    default: 'button',
  },
})

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white shadow hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-600',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
        outline: 'border border-surface-200 bg-white shadow-sm hover:bg-surface-100 hover:text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700 dark:text-surface-100',
        secondary: 'bg-surface-100 text-surface-900 shadow-sm hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600',
        ghost: 'hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800 dark:hover:text-surface-100',
        link: 'text-brand-600 underline-offset-4 hover:underline dark:text-brand-400',
        google: 'bg-white border border-surface-200 text-surface-700 shadow-sm hover:bg-surface-50 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-700',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
</script>
