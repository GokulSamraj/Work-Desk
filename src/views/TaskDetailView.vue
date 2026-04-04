<template>
  <AppLayout>
    <template #header-title>
      <div class="flex items-center gap-2 text-sm text-surface-500">
        <RouterLink to="/dashboard" class="hover:text-surface-900 transition-colors">Dashboard</RouterLink>
        <ChevronRight :size="14" />
        <span class="text-surface-900 font-semibold truncate max-w-xs">{{ task?.title || 'Task' }}</span>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 :size="28" class="animate-spin text-brand-500" />
    </div>

    <!-- Not found -->
    <div v-else-if="!task" class="text-center py-24">
      <p class="text-surface-500">Task not found.</p>
      <RouterLink to="/dashboard" class="btn-primary mt-4 inline-flex">Back to Dashboard</RouterLink>
    </div>

    <!-- Task Detail -->
    <div v-else class="max-w-4xl mx-auto space-y-5">

      <!-- Main card -->
      <div class="card p-6">
        <!-- Title + Actions -->
        <div class="flex items-start gap-4 mb-5">
          <div class="flex-1">
            <div v-if="!editingTitle" class="group flex items-start gap-2">
              <h1 class="text-xl font-bold text-surface-900 leading-tight">{{ task.title }}</h1>
              <button @click="startEditTitle" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-100 text-surface-400 transition-all mt-0.5 shrink-0">
                <Pencil :size="13" />
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <input v-model="editTitle" class="input text-lg font-bold flex-1" @keydown.enter="saveTitle" @keydown.escape="editingTitle = false" autofocus />
              <button @click="saveTitle" class="btn-primary py-1.5 px-3 text-xs">Save</button>
              <button @click="editingTitle = false" class="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button @click="confirmDeleteTask" class="btn-ghost py-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5">
              <Trash2 :size="14" />
              Delete
            </button>
          </div>
        </div>

        <!-- Meta badges row -->
        <div class="flex items-center gap-2 flex-wrap mb-5">
          <!-- Priority selector -->
          <div class="relative" ref="priorityRef">
            <button
              @click="showPriorityPicker = !showPriorityPicker"
              :class="['badge cursor-pointer hover:opacity-80 transition-opacity', priorityClass(task.priority)]"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', priorityDot(task.priority)]"></span>
              {{ task.priority }}
              <ChevronDown :size="11" />
            </button>
            <div v-if="showPriorityPicker" class="absolute top-8 left-0 bg-white border border-surface-200 rounded-xl shadow-dropdown z-30 overflow-hidden animate-fade-in min-w-[120px]">
              <button
                v-for="p in PRIORITIES" :key="p"
                @click="updateField('priority', p); showPriorityPicker = false"
                :class="['w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-50 transition-colors', p === task.priority ? 'font-semibold' : '']"
              >
                <span :class="['w-2 h-2 rounded-full', priorityDot(p)]"></span>
                {{ p }}
              </button>
            </div>
          </div>

          <!-- Status selector -->
          <div class="relative" ref="statusRef">
            <button
              @click="showStatusPicker = !showStatusPicker"
              :class="['badge cursor-pointer hover:opacity-80 transition-opacity', statusClass(task.status)]"
            >
              <span :class="['w-1.5 h-1.5 rounded-full', statusDot(task.status)]"></span>
              {{ task.status }}
              <ChevronDown :size="11" />
            </button>
            <div v-if="showStatusPicker" class="absolute top-8 left-0 bg-white border border-surface-200 rounded-xl shadow-dropdown z-30 overflow-hidden animate-fade-in min-w-[140px]">
              <button
                v-for="s in STATUSES" :key="s"
                @click="updateField('status', s); showStatusPicker = false"
                :class="['w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-50 transition-colors', s === task.status ? 'font-semibold' : '']"
              >
                <span :class="['w-2 h-2 rounded-full', statusDot(s)]"></span>
                {{ s }}
              </button>
            </div>
          </div>

          <div class="w-px h-4 bg-surface-200"></div>
          <span class="text-xs text-surface-400">Created {{ timeAgo(task.createdAt) }}</span>
          <span v-if="task.lastUpdatedBy" class="text-xs text-surface-400">· Updated by <span class="font-medium text-surface-600">{{ task.lastUpdatedBy }}</span></span>
        </div>

        <!-- Description -->
        <div class="mb-0">
          <div v-if="!editingDesc" class="group">
            <div class="flex items-start gap-2 mb-1">
              <label class="label mb-0">Description</label>
              <button @click="startEditDesc" class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-100 text-surface-400 transition-all">
                <Pencil :size="11" />
              </button>
            </div>
            <p v-if="task.description" class="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{{ task.description }}</p>
            <p v-else class="text-sm text-surface-400 italic">No description provided. Click to add one.</p>
          </div>
          <div v-else>
            <label class="label">Description</label>
            <textarea v-model="editDesc" class="input resize-none" rows="4" autofocus></textarea>
            <div class="flex gap-2 mt-2">
              <button @click="saveDesc" class="btn-primary py-1.5 px-3 text-xs">Save</button>
              <button @click="editingDesc = false" class="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timer Card -->
      <div :class="['card p-5', isRunning ? 'ring-2 ring-brand-400/30 timer-running' : '']">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Timer :size="16" :class="isRunning ? 'text-brand-600' : 'text-surface-500'" />
            <h3 class="font-semibold text-surface-900 text-sm">Time Tracker</h3>
            <span v-if="isRunning" class="badge bg-brand-100 text-brand-700 border border-brand-200 text-[10px] animate-timer-tick">RUNNING</span>
            <span v-else-if="task.timerStatus === 'paused'" class="badge bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">PAUSED</span>
          </div>
        </div>

        <!-- Big timer display -->
        <div class="flex items-center gap-6 mb-5">
          <div :class="['font-mono text-4xl font-bold tabular-nums', isRunning ? 'text-brand-700' : 'text-surface-800']">
            {{ formatTimer(displayTime) }}
          </div>
          <div class="flex items-center gap-2">
            <!-- Start/Pause -->
            <button
              v-if="!isRunning"
              @click="tasksStore.handleStartTimer(task.id)"
              class="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Play :size="14" fill="white" />
              {{ task.timerStatus === 'paused' ? 'Resume' : 'Start' }}
            </button>
            <button
              v-else
              @click="tasksStore.handlePauseTimer(task.id)"
              class="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Pause :size="14" fill="white" />
              Pause
            </button>

            <!-- Stop/Reset -->
            <button
              v-if="task.timerStatus !== 'stopped'"
              @click="tasksStore.handleStopTimer(task.id)"
              class="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-red-50 hover:text-red-600 text-surface-600 rounded-lg text-sm font-semibold transition-colors"
            >
              <Square :size="14" fill="currentColor" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-5">
        <!-- Assignee -->
        <div class="card p-5">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Assignment</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-surface-500">Assigned to</span>
              <div class="flex items-center gap-2">
                <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', avatarColor(task.assignedToName)]">
                  {{ initials(task.assignedToName) }}
                </div>
                <span class="text-sm font-medium text-surface-900">{{ task.assignedToName }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-surface-500">Assigned by</span>
              <div class="flex items-center gap-2">
                <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', avatarColor(task.assignedByName)]">
                  {{ initials(task.assignedByName) }}
                </div>
                <span class="text-sm font-medium text-surface-900">{{ task.assignedByName }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dates -->
        <div class="card p-5">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Dates</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-surface-500">Created</span>
              <span class="text-sm font-medium text-surface-900">{{ formatDate(task.createdAt) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-surface-500">Due date</span>
              <div v-if="!editingDue" class="flex items-center gap-1.5 group">
                <span :class="['text-sm font-medium', task.dueDate ? (isOverdue ? 'text-red-600' : 'text-surface-900') : 'text-surface-400']">
                  {{ task.dueDate ? formatDate(task.dueDate) : 'Not set' }}
                </span>
                <button @click="editingDue = true; editDue = task.dueDate || ''" class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-100 text-surface-400 transition-all">
                  <Pencil :size="11" />
                </button>
              </div>
              <div v-else class="flex items-center gap-1">
                <input v-model="editDue" type="date" class="input py-0.5 px-2 text-xs w-36" />
                <button @click="saveDue" class="text-brand-600 hover:text-brand-700 p-0.5"><Check :size="14" /></button>
                <button @click="editingDue = false" class="text-surface-400 hover:text-surface-600 p-0.5"><X :size="14" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content max-w-sm">
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 :size="22" class="text-red-600" />
            </div>
            <h3 class="font-bold text-surface-900 mb-2">Delete Task</h3>
            <p class="text-sm text-surface-500 mb-6">This task will be permanently deleted. This cannot be undone.</p>
            <div class="flex gap-3">
              <button @click="showDeleteConfirm = false" class="btn-secondary flex-1 justify-center">Cancel</button>
              <button @click="handleDeleteTask" class="btn-danger flex-1 justify-center">Delete Task</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  ChevronRight, ChevronDown, Pencil, Trash2, Timer, Play, Pause, Square,
  Loader2, Check, X
} from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import { getTask, updateTask, deleteTask } from '@/firebase/firestore'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  PRIORITIES, STATUSES, priorityClass, priorityDot, statusClass, statusDot,
  avatarColor, initials, formatDate, timeAgo, formatTimer
} from '@/utils/helpers'
import { onClickOutside } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const task = ref(null)
const loading = ref(true)
const showPriorityPicker = ref(false)
const showStatusPicker = ref(false)
const showDeleteConfirm = ref(false)

const editingTitle = ref(false)
const editTitle = ref('')
const editingDesc = ref(false)
const editDesc = ref('')
const editingDue = ref(false)
const editDue = ref('')

const priorityRef = ref(null)
const statusRef = ref(null)

onClickOutside(priorityRef, () => { showPriorityPicker.value = false })
onClickOutside(statusRef, () => { showStatusPicker.value = false })

let unsubscribe = null

onMounted(() => {
  // Real-time task subscription
  unsubscribe = onSnapshot(doc(db, 'tasks', route.params.id), (snap) => {
    if (snap.exists()) {
      task.value = { id: snap.id, ...snap.data() }
    } else {
      task.value = null
    }
    loading.value = false
  })
})

onUnmounted(() => { if (unsubscribe) unsubscribe() })

const isRunning = computed(() => tasksStore.activeTimer?.taskId === task.value?.id)
const displayTime = computed(() => task.value ? tasksStore.getDisplayTime(task.value) : 0)
const isOverdue = computed(() => {
  if (!task.value?.dueDate) return false
  return new Date(task.value.dueDate) < new Date() && task.value.status !== 'Done'
})

function startEditTitle() {
  editTitle.value = task.value.title
  editingTitle.value = true
}

async function saveTitle() {
  if (editTitle.value.trim()) {
    await updateField('title', editTitle.value.trim())
  }
  editingTitle.value = false
}

function startEditDesc() {
  editDesc.value = task.value.description || ''
  editingDesc.value = true
}

async function saveDesc() {
  await updateField('description', editDesc.value)
  editingDesc.value = false
}

async function saveDue() {
  await updateField('dueDate', editDue.value || null)
  editingDue.value = false
}

async function updateField(field, value) {
  await updateTask(route.params.id, {
    [field]: value,
    lastUpdatedBy: authStore.user.name,
  })
}

function confirmDeleteTask() {
  showDeleteConfirm.value = true
}

async function handleDeleteTask() {
  await deleteTask(route.params.id)
  router.push('/dashboard')
}
</script>
