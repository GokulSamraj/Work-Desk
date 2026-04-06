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
import { cn } from '~/lib/utils'

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
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white shadow hover:bg-indigo-700 active:bg-indigo-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        outline: 'border border-gray-300 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-indigo-600 underline-offset-4 hover:underline',
        google: 'bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50',
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
