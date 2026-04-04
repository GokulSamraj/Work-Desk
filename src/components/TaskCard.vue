<template>
  <div
    :class="[
      'card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 group select-none',
      isRunning ? 'ring-2 ring-brand-400/40 timer-running' : ''
    ]"
    @click="$emit('click')"
  >
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2 mb-3">
      <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-snug line-clamp-2 flex-1">{{ task.title }}</h3>
      <span :class="['badge shrink-0', priorityClass(task.priority)]">
        <span :class="['w-1.5 h-1.5 rounded-full', priorityDot(task.priority)]"></span>
        {{ task.priority }}
      </span>
    </div>

    <!-- Description -->
    <p v-if="task.description" class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mb-3">{{ task.description }}</p>

    <!-- Status -->
    <div class="mb-3">
      <span :class="['badge', statusClass(task.status)]">
        <span :class="['w-1.5 h-1.5 rounded-full', statusDot(task.status)]"></span>
        {{ task.status }}
      </span>
    </div>

    <!-- Timer -->
    <div
      :class="[
        'flex items-center justify-between rounded-lg px-3 py-2 mb-3',
        isRunning ? 'bg-brand-50 border border-brand-200/60 dark:bg-brand-900/20 dark:border-brand-800/60' : 'bg-surface-50 border border-surface-100 dark:bg-surface-700/50 dark:border-surface-700'
      ]"
      @click.stop
    >
      <div class="flex items-center gap-2">
        <div :class="['w-1.5 h-1.5 rounded-full', isRunning ? 'bg-brand-500 animate-pulse' : task.timerStatus === 'paused' ? 'bg-amber-500' : 'bg-surface-300']"></div>
        <span :class="['font-mono text-xs font-medium tabular-nums', isRunning ? 'text-brand-700' : 'text-surface-600']">
          {{ formatTimer(displayTime) }}
        </span>
        <span v-if="isRunning" class="text-[10px] font-semibold text-brand-600 animate-timer-tick">LIVE</span>
        <span v-else-if="task.timerStatus === 'paused'" class="text-[10px] font-semibold text-amber-600">PAUSED</span>
      </div>

      <div class="flex items-center gap-1">
        <!-- Start button -->
        <button
          v-if="!isRunning"
          @click.stop="$emit('start-timer', task.id)"
          class="w-6 h-6 rounded-md bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition-colors"
          title="Start timer"
        >
          <Play :size="10" fill="white" />
        </button>
        <!-- Pause button -->
        <button
          v-else
          @click.stop="$emit('pause-timer', task.id)"
          class="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors"
          title="Pause timer"
        >
          <Pause :size="10" fill="white" />
        </button>
        <!-- Stop button -->
        <button
          v-if="task.timerStatus !== 'stopped'"
          @click.stop="$emit('stop-timer', task.id)"
          class="w-6 h-6 rounded-md bg-surface-200 hover:bg-red-100 hover:text-red-600 text-surface-500 flex items-center justify-center transition-colors"
          title="Reset timer"
        >
          <Square :size="10" fill="currentColor" />
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between">
      <!-- Assignee -->
      <div class="flex items-center gap-2">
        <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', avatarColor(task.assignedToName)]">
          {{ initials(task.assignedToName) }}
        </div>
        <span class="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[80px]">{{ task.assignedToName }}</span>
      </div>

      <!-- Due date -->
      <div v-if="task.dueDate" class="flex items-center gap-1">
        <Calendar :size="11" :class="['text-surface-400', isOverdue ? 'text-red-500' : '']" />
        <span :class="['text-xs', isOverdue ? 'text-red-500 font-semibold' : 'text-surface-400']">
          {{ formatDate(task.dueDate) }}
        </span>
      </div>
    </div>

    <!-- Assigned by -->
    <div class="mt-2 flex items-center gap-1.5 text-[11px] text-surface-400 dark:text-surface-500">
      <ArrowRight :size="10" />
      <span>by <span class="font-medium text-surface-500">{{ task.assignedByName }}</span></span>
      <span class="ml-auto">{{ timeAgo(task.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Play, Pause, Square, Calendar, ArrowRight } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { formatTimer, priorityClass, priorityDot, statusClass, statusDot, avatarColor, initials, formatDate, timeAgo } from '@/utils/helpers'

const props = defineProps({
  task: { type: Object, required: true }
})

defineEmits(['click', 'start-timer', 'pause-timer', 'stop-timer'])

const tasksStore = useTasksStore()

const isRunning = computed(() => tasksStore.activeTimer?.taskId === props.task.id)
const displayTime = computed(() => tasksStore.getDisplayTime(props.task))
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return new Date(props.task.dueDate) < new Date() && props.task.status !== 'Done'
})
</script>
