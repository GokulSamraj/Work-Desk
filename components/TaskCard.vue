<template>
  <div
    :class="[
      'card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 group select-none',
      isRunning ? 'ring-2 ring-indigo-300 timer-running' : ''
    ]"
    @click="$emit('click')"
  >
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2 mb-3">
      <h3 class="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{{ task.title }}</h3>
      <span :class="['badge shrink-0', priorityClass(task.priority)]">
        <span :class="['w-1.5 h-1.5 rounded-full', priorityDot(task.priority)]"></span>
        {{ task.priority }}
      </span>
    </div>

    <!-- Description -->
    <p v-if="task.description" class="text-xs text-gray-500 line-clamp-2 mb-3">{{ task.description }}</p>

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
        isRunning ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-gray-200'
      ]"
      @click.stop
    >
      <div class="flex items-center gap-2">
        <div :class="['w-1.5 h-1.5 rounded-full', isRunning ? 'bg-indigo-500 animate-pulse' : task.timerStatus === 'paused' ? 'bg-amber-500' : 'bg-gray-300']"></div>
        <span :class="['font-mono text-xs font-medium tabular-nums', isRunning ? 'text-indigo-600' : 'text-gray-600']">
          {{ formatTimer(displayTime) }}
        </span>
        <span v-if="isRunning" class="text-[10px] font-semibold text-indigo-500">LIVE</span>
        <span v-else-if="task.timerStatus === 'paused'" class="text-[10px] font-semibold text-amber-600">PAUSED</span>
      </div>

      <div v-if="authStore.user?.role === 'admin' || task.assignedTo === authStore.user?.uid" class="flex items-center gap-1">
        <!-- Start button -->
        <button
          v-if="!isRunning"
          @click.stop="$emit('start-timer', task.id)"
          class="w-6 h-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
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
        <!-- Reset button -->
        <button
          v-if="task.timerStatus !== 'stopped' && displayTime > 0"
          @click.stop="$emit('reset-timer', task.id)"
          class="w-6 h-6 rounded-md bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
          title="Reset timer"
        >
          <RotateCcw :size="10" />
        </button>
      </div>
    </div>

    <!-- Reset Confirm Popover -->
    <Teleport to="body">
      <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
        <div class="modal-content max-w-xs bg-white border border-gray-200 shadow-xl">
          <div class="p-5 text-center">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <RotateCcw :size="18" class="text-red-600" />
            </div>
            <h3 class="font-bold text-gray-900 mb-1 text-sm">Reset Timer?</h3>
            <p class="text-xs text-gray-500 mb-1">This will reset the tracked time to zero.</p>
            <p class="text-xs font-mono font-bold text-gray-700 mb-4">{{ formatTimer(displayTime) }} will be lost.</p>
            <div class="flex gap-2">
              <button @click="showResetConfirm = false" class="btn-secondary flex-1 justify-center text-xs py-1.5">Cancel</button>
              <button @click="confirmReset" class="btn-danger flex-1 justify-center text-xs py-1.5">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Footer -->
    <div class="flex items-center justify-between">
      <!-- Assignee -->
      <div class="flex items-center gap-2">
        <img v-if="assigneePhoto" :src="assigneePhoto" class="w-6 h-6 rounded-full shrink-0 object-cover" />
        <div v-else :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', avatarColor(task.assignedToName)]">
          {{ initials(task.assignedToName) }}
        </div>
        <span class="text-xs text-gray-500 truncate max-w-[80px]">{{ task.assignedToName }}</span>
      </div>

      <!-- Counter + Due date -->
      <div class="flex items-center gap-2">
        <span v-if="task.counter != null" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-mono font-bold border border-indigo-200">
          #{{ task.counter }}
        </span>
        <div v-if="task.dueDate" class="flex items-center gap-1">
          <Calendar :size="11" :class="['text-gray-400', isOverdue ? 'text-red-500' : '']" />
          <span :class="['text-xs', isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400']">
            {{ formatDate(task.dueDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Assigned by -->
    <div class="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
      <ArrowRight :size="10" />
      <span>by <span class="font-medium text-gray-500">{{ task.assignedByName }}</span></span>
      <span class="ml-auto">{{ timeAgo(task.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Play, Pause, RotateCcw, Calendar, ArrowRight } from 'lucide-vue-next'
import { useTasksStore } from '~/stores/tasks'
import { useAuthStore } from '~/stores/auth'
import { formatTimer, priorityClass, priorityDot, statusClass, statusDot, avatarColor, initials, formatDate, timeAgo } from '~/utils/helpers'

const props = defineProps({
  task: { type: Object, required: true },
  assigneePhoto: { type: String, default: null }
})

const emit = defineEmits(['click', 'start-timer', 'pause-timer', 'reset-timer'])

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const showResetConfirm = ref(false)

const isRunning = computed(() => tasksStore.myActiveTimer?.taskId === props.task.id)
const displayTime = computed(() => tasksStore.getDisplayTime(props.task))
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return new Date(props.task.dueDate) < new Date() && props.task.status !== 'Done'
})

function confirmReset() {
  showResetConfirm.value = false
  emit('reset-timer', props.task.id)
}
</script>
