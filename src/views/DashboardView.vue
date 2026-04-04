<template>
  <AppLayout>
    <template #header-title>
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-surface-900 dark:text-surface-50">Dashboard</h1>
        <span class="badge bg-surface-100 text-surface-600 border border-surface-200 font-mono">
          {{ filteredTasks.length }} tasks
        </span>
        <!-- Running task indicator -->
        <div v-if="tasksStore.activeTimer" class="flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full">
          <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
          <span class="text-xs font-semibold text-brand-700 truncate max-w-[140px]">
            {{ runningTask?.title }}
          </span>
          <span class="font-mono text-xs text-brand-600 tabular-nums">{{ formatTimer(tasksStore.getDisplayTime(runningTask)) }}</span>
        </div>
      </div>
    </template>

    <div class="space-y-5">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Search -->
        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input v-model="search" placeholder="Search tasks..." class="input pl-9 py-1.5 text-sm w-56" />
        </div>

        <!-- Assignee filter -->
        <select v-model="filterAssignee" class="select py-1.5 text-sm w-40">
          <option value="">All Assignees</option>
          <option v-for="u in userList" :key="u.uid" :value="u.uid">{{ u.name }}</option>
        </select>

        <!-- Status filter -->
        <select v-model="filterStatus" class="select py-1.5 text-sm w-36">
          <option value="">All Statuses</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>

        <!-- Priority filter -->
        <select v-model="filterPriority" class="select py-1.5 text-sm w-36">
          <option value="">All Priorities</option>
          <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
        </select>

        <!-- Clear filters -->
        <button v-if="hasFilters" @click="clearFilters" class="btn-ghost py-1.5 text-surface-500">
          <X :size="14" />
          Clear
        </button>

        <div class="flex-1"></div>

        <!-- View toggle -->
        <div class="flex items-center bg-surface-100 rounded-lg p-1 gap-1">
          <button @click="viewMode = 'board'" :class="['p-1.5 rounded-md transition-colors', viewMode === 'board' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700']">
            <LayoutGrid :size="15" />
          </button>
          <button @click="viewMode = 'list'" :class="['p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700']">
            <List :size="15" />
          </button>
        </div>

        <!-- Create Task -->
        <button @click="showCreate = true" class="btn-primary">
          <Plus :size="16" />
          Create Task
        </button>
      </div>

      <!-- BOARD VIEW -->
      <div v-if="viewMode === 'board'" class="grid grid-cols-4 gap-5 items-start">
        <div v-for="status in STATUSES" :key="status" class="space-y-3">
          <!-- Column Header -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2">
              <span :class="['w-2.5 h-2.5 rounded-full', statusDot(status)]"></span>
              <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">{{ status }}</h3>
            </div>
            <span class="text-xs font-medium text-surface-400 tabular-nums">
              {{ tasksByStatus[status]?.length || 0 }}
            </span>
          </div>

          <!-- Column Drop Zone -->
          <div class="space-y-3 min-h-[120px]">
            <TaskCard
              v-for="task in tasksByStatus[status]"
              :key="task.id"
              :task="task"
              @click="openTask(task.id)"
              @start-timer="tasksStore.handleStartTimer"
              @pause-timer="tasksStore.handlePauseTimer"
              @stop-timer="tasksStore.handleStopTimer"
            />

            <div
              v-if="!tasksByStatus[status]?.length"
              class="border-2 border-dashed border-surface-200 rounded-xl p-6 text-center"
            >
              <p class="text-xs text-surface-400">No tasks</p>
            </div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="card dark:bg-surface-800 dark:border-surface-700 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Task</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Assigned To</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Priority</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Timer</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Due</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-50">
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              :class="[
                'hover:bg-surface-50/80 transition-colors cursor-pointer',
                tasksStore.activeTimer?.taskId === task.id ? 'bg-brand-50/30' : ''
              ]"
              @click="openTask(task.id)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <span v-if="tasksStore.activeTimer?.taskId === task.id" class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0"></span>
                  <span class="text-sm font-medium text-surface-900 dark:text-surface-100 line-clamp-1">{{ task.title }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(task.assignedToName)]">
                    {{ initials(task.assignedToName) }}
                  </div>
                  <span class="text-sm text-surface-700">{{ task.assignedToName }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span :class="['badge', priorityClass(task.priority)]">
                  <span :class="['w-1.5 h-1.5 rounded-full', priorityDot(task.priority)]"></span>
                  {{ task.priority }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span :class="['badge', statusClass(task.status)]">{{ task.status }}</span>
              </td>
              <td class="px-5 py-3.5" @click.stop>
                <div class="flex items-center gap-2">
                  <span :class="['font-mono text-xs tabular-nums font-medium', tasksStore.activeTimer?.taskId === task.id ? 'text-brand-700' : 'text-surface-600']">
                    {{ formatTimer(tasksStore.getDisplayTime(task)) }}
                  </span>
                  <button
                    v-if="tasksStore.activeTimer?.taskId !== task.id"
                    @click="tasksStore.handleStartTimer(task.id)"
                    class="w-5 h-5 rounded bg-brand-100 hover:bg-brand-200 text-brand-700 flex items-center justify-center transition-colors"
                  >
                    <Play :size="9" fill="currentColor" />
                  </button>
                  <button
                    v-else
                    @click="tasksStore.handlePauseTimer(task.id)"
                    class="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-colors"
                  >
                    <Pause :size="9" fill="currentColor" />
                  </button>
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-surface-500">
                {{ task.dueDate ? formatDate(task.dueDate) : '—' }}
              </td>
              <td class="px-5 py-3.5 text-xs text-surface-400">
                {{ timeAgo(task.createdAt) }}
              </td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-sm text-surface-400">
                <div class="flex flex-col items-center gap-3">
                  <ClipboardList :size="32" class="text-surface-300" />
                  <p>No tasks found</p>
                  <button @click="showCreate = true" class="btn-primary text-xs py-1.5 px-3">
                    <Plus :size="13" /> Create first task
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Task Modal -->
    <CreateTaskModal v-if="showCreate" @close="showCreate = false" @created="onTaskCreated" />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, X, LayoutGrid, List, Play, Pause, ClipboardList } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import TaskCard from '@/components/TaskCard.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'
import { useTasksStore } from '@/stores/tasks'
import { getAllUsers } from '@/firebase/firestore'
import {
  PRIORITIES, STATUSES, statusDot, priorityClass, priorityDot,
  statusClass, avatarColor, initials, formatDate, timeAgo, formatTimer
} from '@/utils/helpers'

const router = useRouter()
const tasksStore = useTasksStore()

const viewMode = ref('board')
const showCreate = ref(false)
const search = ref('')
const filterAssignee = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const userList = ref([])

onMounted(async () => {
  userList.value = await getAllUsers()
})

const hasFilters = computed(() =>
  search.value || filterAssignee.value || filterStatus.value || filterPriority.value
)

function clearFilters() {
  search.value = ''
  filterAssignee.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
}

const filteredTasks = computed(() => {
  return tasksStore.tasks.filter(task => {
    if (filterAssignee.value && task.assignedTo !== filterAssignee.value) return false
    if (filterStatus.value && task.status !== filterStatus.value) return false
    if (filterPriority.value && task.priority !== filterPriority.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!task.title?.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q) &&
          !task.assignedToName?.toLowerCase().includes(q)) return false
    }
    return true
  })
})

const tasksByStatus = computed(() => {
  const grouped = {}
  STATUSES.forEach(s => { grouped[s] = [] })
  filteredTasks.value.forEach(task => {
    if (grouped[task.status]) grouped[task.status].push(task)
  })
  return grouped
})

const runningTask = computed(() =>
  tasksStore.activeTimer
    ? tasksStore.tasks.find(t => t.id === tasksStore.activeTimer.taskId)
    : null
)

function openTask(id) {
  router.push(`/task/${id}`)
}

function onTaskCreated(taskId) {
  router.push(`/task/${taskId}`)
}
</script>
