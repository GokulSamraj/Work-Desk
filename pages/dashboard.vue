<template>
  <AppLayout>
    <template #header-title>
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-surface-50">Dashboard</h1>
        <span class="badge bg-surface-700 text-surface-300 border border-surface-600 font-mono">
          {{ filteredTasks.length }} tasks
        </span>
        <!-- Running task indicator -->
        <div v-if="tasksStore.activeTimer" class="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-semibold text-emerald-700 truncate max-w-[140px]">
            {{ runningTask?.title }}
          </span>
          <span class="font-mono text-xs text-emerald-700 tabular-nums">{{ formatTimer(tasksStore.getDisplayTime(runningTask)) }}</span>
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

        <!-- Date filter -->
        <select v-model="filterDate" class="select py-1.5 text-sm w-36">
          <option value="all">All Dates</option>
          <option value="today">Today & Past Due</option>
          <option value="future">Future Only</option>
        </select>

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
              @stop-timer="tasksStore.handleStopTimer"
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
        <table class="w-full text-left min-w-[800px]">
          <thead>
            <tr class="border-b border-surface-700 bg-surface-800/50">
              <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Task</th>
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
                'hover:bg-surface-700/30 transition-colors cursor-pointer',
                tasksStore.activeTimer?.taskId === task.id ? 'bg-brand-900/10' : ''
              ]"
              @click="openTask(task.id)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <span v-if="tasksStore.activeTimer?.taskId === task.id" class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0"></span>
                  <span class="text-sm font-medium text-surface-100 line-clamp-1">{{ task.title }}</span>
                </div>
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
                  <span :class="['font-mono text-xs tabular-nums font-medium', tasksStore.activeTimer?.taskId === task.id ? 'text-brand-400' : 'text-surface-400']">
                    {{ formatTimer(tasksStore.getDisplayTime(task)) }}
                  </span>
                  <template v-if="authStore.user?.role === 'admin' || task.assignedTo === authStore.user?.uid">
                    <button
                      v-if="tasksStore.activeTimer?.taskId !== task.id"
                    @click="tasksStore.handleStartTimer(task.id)"
                    class="w-5 h-5 rounded bg-brand-900/50 hover:bg-brand-900 text-brand-400 flex items-center justify-center transition-colors"
                  >
                    <Play :size="9" fill="currentColor" />
                  </button>
                  <button
                    v-else
                    @click="tasksStore.handlePauseTimer(task.id)"
                    class="w-5 h-5 rounded bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 flex items-center justify-center transition-colors"
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
              <td colspan="7" class="px-5 py-12 text-center text-sm text-surface-500">
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
import { Search, Plus, X, LayoutGrid, List, Play, Pause, ClipboardList } from 'lucide-vue-next'
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
const filterDate = ref('today') // Default based on user preference
const userList = ref([])

onMounted(async () => {
  userList.value = await getAllUsers()
  filterAssignee.value = authStore.user?.uid || '' // Default filter for users should be their user name
})

watch([filterAssignee, filterStatus, filterPriority, filterDate], () => {
  if (!authStore.user) return
  logAction(
    authStore.user.uid, 
    authStore.user.name, 
    'filter_changed', 
    `Filters: [Assignee: ${filterAssignee.value || 'All'}], [Status: ${filterStatus.value || 'All'}], [Priority: ${filterPriority.value || 'All'}], [Date: ${filterDate.value}]`
  ).catch(()=>{})
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
  search.value || filterAssignee.value || filterStatus.value || filterPriority.value || filterDate.value !== 'today'
)

function clearFilters() {
  search.value = ''
  filterAssignee.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  filterDate.value = 'today'
}

const filteredTasks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return tasksStore.tasks.filter(task => {
    // Date Filtering Logic
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)
      
      if (filterDate.value === 'today') {
        if (taskDate > today) return false
      } else if (filterDate.value === 'future') {
        if (taskDate <= today) return false
      }
      // 'all' passes through
    } else {
      if (filterDate.value === 'future') return false // No due date implies shouldn't be counted as future
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
