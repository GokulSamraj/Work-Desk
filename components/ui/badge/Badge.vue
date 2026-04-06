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
        default: 'border-transparent bg-indigo-600 text-white shadow',
        secondary: 'border-transparent bg-gray-100 text-gray-700',
        destructive: 'border-transparent bg-red-600 text-white shadow',
        outline: 'border-gray-300 text-gray-600',
        success: 'border-transparent bg-emerald-100 text-emerald-700 border border-emerald-200',
        warning: 'border-transparent bg-amber-100 text-amber-700 border border-amber-200',
        admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
</script>
