<template>
  <AppLayout>
    <template #header-title>
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-surface-50">Dashboard</h1>
        <span class="badge bg-surface-700 text-surface-300 border border-surface-600 font-mono">
          {{ filteredTasks.length }} tasks
        </span>
        <span class="badge bg-surface-700 text-surface-300 border border-surface-600 font-mono flex items-center gap-1.5" title="Total time utilized">
          <Clock :size="12" />
          {{ formatTimer(totalTimeUtilized) }}
        </span>
        <!-- Running task indicator -->
        <div v-if="tasksStore.myActiveTimer" class="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full shadow-sm">
          <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span class="text-xs font-semibold text-indigo-700 truncate max-w-[140px]">
            {{ runningTask?.title }}
          </span>
          <span class="font-mono text-xs text-indigo-700 tabular-nums">{{ formatTimer(tasksStore.getDisplayTime(runningTask)) }}</span>
        </div>
      </div>
    </template>

    <div class="space-y-5">
      <!-- Toolbar -->
      <div class="space-y-3">
        <!-- Row 1: Search, Filters, View, Create -->
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

          <!-- Date filter -->
          <div class="flex items-center gap-2">
            <select v-model="filterDate" class="select py-1.5 text-sm w-36">
              <option value="all">All Dates</option>
              <option value="today">Today & Past Due</option>
              <option value="future">Future Only</option>
              <option value="custom">Custom Range</option>
            </select>

            <ClientOnly>
              <div v-if="filterDate === 'custom'" class="relative z-50">
                <VueDatePicker
                  v-model="filterDateRange"
                  range
                  :week-start="0"
                  :enable-time-picker="false"
                  auto-apply
                >
                  <template #trigger>
                    <div class="select py-1.5 px-3 text-sm flex items-center justify-between gap-2 min-w-[220px]">
                      <div class="flex items-center gap-2">
                        <Calendar :size="14" class="text-surface-400" />
                        <span v-if="filterDateRange && filterDateRange.length > 0" class="text-surface-100">
                          {{ new Date(filterDateRange[0]).toLocaleDateString() }} - {{ filterDateRange[1] ? new Date(filterDateRange[1]).toLocaleDateString() : '...' }}
                        </span>
                        <span v-else class="text-surface-500">Select Date Range...</span>
                      </div>
                      <X v-if="filterDateRange && filterDateRange.length > 0" @click.stop="filterDateRange = null" :size="14" class="text-surface-400 hover:text-surface-200 transition-colors shrink-0" />
                    </div>
                  </template>
                </VueDatePicker>
              </div>
            </ClientOnly>
          </div>

          <!-- Clear filters -->
          <button v-if="hasFilters" @click="clearFilters" class="btn-ghost py-1.5 text-surface-500">
            <X :size="14" />
            Clear
          </button>

          <div class="flex-1"></div>

          <!-- View toggle -->
          <div class="flex items-center bg-surface-800 rounded-lg p-1 gap-1">
            <button @click="toggleViewMode('board')" :class="['p-1.5 rounded-md transition-colors', viewMode === 'board' ? 'bg-surface-700 shadow-sm text-surface-100' : 'text-surface-500 hover:text-surface-300']">
              <LayoutGrid :size="15" />
            </button>
            <button @click="toggleViewMode('list')" :class="['p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-surface-700 shadow-sm text-surface-100' : 'text-surface-500 hover:text-surface-300']">
              <List :size="15" />
            </button>
          </div>

          <!-- Create Task -->
          <button @click="showCreate = true" class="btn-primary">
            <Plus :size="16" />
            Create Task
          </button>
        </div>

        <!-- Row 2: Sort -->
        <div class="flex items-center gap-3">
          <select v-model="sortBy" class="select py-1.5 text-sm w-40">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title A-Z</option>
            <option value="timer">Most Tracked</option>
          </select>
        </div>
      </div>

      <!-- BOARD VIEW -->
      <div v-if="viewMode === 'board'" class="flex overflow-x-auto pb-4 gap-5 items-start">
        <div v-for="status in STATUSES" :key="status" class="w-72 shrink-0 space-y-3">
          <!-- Column Header -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2">
              <span :class="['w-2.5 h-2.5 rounded-full', statusDot(status)]"></span>
              <h3 class="text-sm font-semibold text-surface-300">{{ status }}</h3>
            </div>
            <span class="text-xs font-medium text-surface-500 tabular-nums">
              {{ tasksByStatus[status]?.length || 0 }}
            </span>
          </div>

          <!-- Column Drop Zone -->
          <div class="space-y-3 min-h-[120px]">
            <TaskCard
              v-for="task in tasksByStatus[status]"
              :key="task.id"
              :task="task"
              :assigneePhoto="getUserPhoto(task.assignedTo)"
              @click="openTask(task.id)"
              @start-timer="tasksStore.handleStartTimer"
              @pause-timer="tasksStore.handlePauseTimer"
              @reset-timer="tasksStore.handleStopTimer"
            />

            <div
              v-if="!tasksByStatus[status]?.length"
              class="border-2 border-dashed border-surface-800 rounded-xl p-6 text-center"
            >
              <p class="text-xs text-surface-600">No tasks</p>
            </div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="bg-surface-800 border border-surface-700 rounded-xl overflow-x-auto">
        <table class="w-full text-left min-w-[950px]">
          <thead>
            <tr class="border-b border-surface-700 bg-surface-800/50">
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Task</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Description</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Assigned To</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Priority</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Timer</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Due</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-700/50">
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              :class="[
                'hover:bg-gray-50 transition-colors cursor-pointer',
                tasksStore.myActiveTimer?.taskId === task.id ? 'bg-indigo-50' : ''
              ]"
              @click="openTask(task.id)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <span v-if="tasksStore.myActiveTimer?.taskId === task.id" class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                  <span class="text-sm font-medium text-surface-100 line-clamp-1">{{ task.title }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-xs text-surface-400 line-clamp-2">{{ task.description || '—' }}</span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <img v-if="getUserPhoto(task.assignedTo)" :src="getUserPhoto(task.assignedTo)" class="w-6 h-6 rounded-full shrink-0 object-cover" />
                  <div v-else :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(task.assignedToName)]">
                    {{ initials(task.assignedToName) }}
                  </div>
                  <span class="text-sm text-surface-300">{{ task.assignedToName }}</span>
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
                  <span :class="['font-mono text-xs tabular-nums font-medium', tasksStore.myActiveTimer?.taskId === task.id ? 'text-indigo-600' : 'text-gray-500']">
                    {{ formatTimer(tasksStore.getDisplayTime(task)) }}
                  </span>
                  <template v-if="authStore.user?.role === 'admin' || task.assignedTo === authStore.user?.uid">
                    <button
                      v-if="tasksStore.myActiveTimer?.taskId !== task.id"
                    @click="tasksStore.handleStartTimer(task.id)"
                    class="w-5 h-5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors"
                  >
                    <Play :size="9" fill="currentColor" />
                  </button>
                  <button
                    v-else
                    @click="tasksStore.handlePauseTimer(task.id)"
                    class="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center transition-colors"
                  >
                    <Pause :size="9" fill="currentColor" />
                  </button>
                  </template>
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-surface-500">
                {{ task.dueDate ? formatDate(task.dueDate) : '—' }}
              </td>
              <td class="px-5 py-3.5 text-xs text-surface-600">
                {{ timeAgo(task.createdAt) }}
              </td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="8" class="px-5 py-12 text-center text-sm text-surface-500">
                <div class="flex flex-col items-center gap-3">
                  <ClipboardList :size="32" class="text-surface-700" />
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
import { Search, Plus, X, LayoutGrid, List, Play, Pause, ClipboardList, Calendar, Clock, ArrowUpDown } from 'lucide-vue-next'
import AppLayout from '~/components/AppLayout.vue'
import TaskCard from '~/components/TaskCard.vue'
import CreateTaskModal from '~/components/CreateTaskModal.vue'
import { useTasksStore } from '~/stores/tasks'
import { useAuthStore } from '~/stores/auth'
import { getAllUsers, updateUser } from '~/firebase/firestore'
import {
  STATUSES, statusDot, priorityClass, priorityDot,
  statusClass, avatarColor, initials, formatDate, timeAgo, formatTimer
} from '~/utils/helpers'
import { logAction } from '~/firebase/firestore'

import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

definePageMeta({
  requiresAuth: true,
})

const router = useRouter()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const viewMode = ref(authStore.user?.viewMode || 'board')
const showCreate = ref(false)
const search = ref('')
const filterAssignee = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterDate = ref('today') // Default: today, past due, and future
const filterDateRange = ref(null)
const sortBy = ref('newest')
const userList = ref([])

onMounted(async () => {
  userList.value = await getAllUsers()
  filterAssignee.value = authStore.user?.uid || '' // Default filter for users should be their user name
})

watchEffect(() => {
  if (!authStore.user || userList.value.length === 0) return
  let rangeStr = ''
  if (filterDate.value === 'custom' && filterDateRange.value?.length) {
    rangeStr = ' ' + new Date(filterDateRange.value[0]).toLocaleDateString() + ' - ' + new Date(filterDateRange.value[1]).toLocaleDateString()
  }
  const assigneeName = filterAssignee.value
    ? (userList.value.find(u => u.uid === filterAssignee.value)?.name || filterAssignee.value)
    : 'All'
  logAction(
    authStore.user.uid,
    authStore.user.name,
    'filter_changed',
    `Filters: [Assignee: ${assigneeName}], [Status: ${filterStatus.value || 'All'}], [Priority: ${filterPriority.value || 'All'}], [Date: ${filterDate.value}${rangeStr}]`
  ).catch(() => {})
})

const getUserPhoto = (uid) => {
  const user = userList.value.find(u => u.uid === uid)
  return user?.photoURL || null
}

async function toggleViewMode(mode) {
  viewMode.value = mode
  if (authStore.user) {
    authStore.user.viewMode = mode
    await updateUser(authStore.user.uid, { viewMode: mode })
  }
}

const hasFilters = computed(() =>
  search.value || filterAssignee.value || filterStatus.value || filterPriority.value || filterDate.value !== 'today' || sortBy.value !== 'newest' || (filterDate.value === 'custom' && filterDateRange.value !== null)
)

function clearFilters() {
  search.value = ''
  filterAssignee.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  filterDate.value = 'today'
  filterDateRange.value = null
  sortBy.value = 'newest'
}

function timeToMs(t) {
  return t?.toMillis?.() ? t.toMillis() : (t ? new Date(t).getTime() : 0)
}

const filteredTasks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 }

  let result = tasksStore.tasks.filter(task => {
    // Hide completed tasks from previous days (only when viewing "Today" filter)
    if (task.status === 'Done' && filterDate.value === 'today') {
      const completedAt = task.completedAt
      if (completedAt) {
        const completedDate = new Date(completedAt)
        completedDate.setHours(0, 0, 0, 0)
        if (completedDate < today) return false
      } else {
        // No completedAt means it was done before this feature — hide it
        return false
      }
    }

    // Date Filtering Logic
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)

      if (filterDate.value === 'today') {
        // Show all tasks: today, past due, and future
      } else if (filterDate.value === 'future') {
        if (taskDate <= today) return false
      } else if (filterDate.value === 'custom') {
        if (filterDateRange.value && filterDateRange.value.length === 2 && filterDateRange.value[0] && filterDateRange.value[1]) {
          const start = new Date(filterDateRange.value[0])
          start.setHours(0, 0, 0, 0)
          const end = new Date(filterDateRange.value[1])
          end.setHours(23, 59, 59, 999)

          if (taskDate < start || taskDate > end) return false
        }
      }
      // 'all' passes through
    } else {
      // No due date — use createdAt for date filtering
      if (filterDate.value === 'future') return false
      if (filterDate.value === 'custom') {
        const taskCreated = new Date(timeToMs(task.createdAt))
        if (filterDateRange.value && filterDateRange.value.length === 2 && filterDateRange.value[0] && filterDateRange.value[1]) {
          const start = new Date(filterDateRange.value[0])
          start.setHours(0, 0, 0, 0)
          const end = new Date(filterDateRange.value[1])
          end.setHours(23, 59, 59, 999)
          if (taskCreated < start || taskCreated > end) return false
        }
      }
    }

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

  // Apply sorting
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return timeToMs(b.createdAt) - timeToMs(a.createdAt)
      case 'oldest':
        return timeToMs(a.createdAt) - timeToMs(b.createdAt)
      case 'dueDate': {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return da - db
      }
      case 'priority':
        return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      case 'title':
        return (a.title || '').localeCompare(b.title || '')
      case 'timer':
        return (b.totalElapsed || 0) - (a.totalElapsed || 0)
      default:
        return 0
    }
  })

  return result
})

const totalTimeUtilized = computed(() => {
  return filteredTasks.value.reduce((total, task) => {
    return total + (tasksStore.getDisplayTime(task) || 0)
  }, 0)
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
  tasksStore.myActiveTimer
    ? tasksStore.tasks.find(t => t.id === tasksStore.myActiveTimer.taskId)
    : null
)

function openTask(id) {
  router.push(`/task/${id}`)
}

function onTaskCreated(taskId) {
  router.push(`/task/${taskId}`)
}
</script>
