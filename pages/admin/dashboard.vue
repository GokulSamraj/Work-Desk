<template>
  <AppLayout title="User Management">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-surface-50">Team Members</h2>
          <p class="text-sm text-surface-400 mt-0.5">{{ users.length }} total members</p>
        </div>
        <button @click="showCreateModal = true" class="btn-primary" id="add-member-btn">
          <UserPlus :size="16" />
          Add Member
        </button>
      </div>

      <!-- Stats & Analysis -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Number Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-sm">
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Total Subscribed Roles</p>
            <p class="text-3xl font-bold text-surface-50 mt-1">{{ users.length }}</p>
          </div>
          <div class="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-sm">
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Active Workspace</p>
            <p class="text-3xl font-bold text-emerald-500 mt-1">{{ users.filter(u => u.active).length }}</p>
          </div>
          <div class="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-sm">
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Administrators</p>
            <p class="text-3xl font-bold text-brand-500 mt-1">{{ users.filter(u => u.role === 'admin').length }}</p>
          </div>
          <div class="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-sm">
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide">Standard Users</p>
            <p class="text-3xl font-bold text-blue-500 mt-1">{{ users.filter(u => u.role === 'user').length }}</p>
          </div>
        </div>

        <!-- Graph -->
        <div class="bg-surface-800 border border-surface-700 rounded-xl p-4 shadow-sm flex flex-col md:col-span-2">
          <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">User Productivity Analysis (Tasks & Time Utilized)</p>
          <div class="flex-1 relative min-h-[300px]">
            <Bar :data="chartData" :options="chartOptions" v-if="users.length > 0 && isTasksLoaded" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-sm text-surface-400">Loading analysis...</div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-700 flex items-center gap-3">
          <div class="relative flex-1 max-w-xs">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input v-model="search" placeholder="Search members..." class="input pl-9 py-1.5 text-sm" id="search-members" />
          </div>
          <!-- Role filter -->
          <select
            v-model="filterRole"
            class="h-9 px-3 bg-surface-900 border border-surface-700 rounded-lg text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Member</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-surface-700">
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Member</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Role</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Provider</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Joined</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-800">
              <tr v-for="user in filteredUsers" :key="user.uid" class="hover:bg-surface-700/30 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div v-if="user.photoURL" class="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-surface-700">
                      <img :src="user.photoURL" :alt="user.name" class="w-full h-full object-cover" />
                    </div>
                    <div v-else :class="['w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(user.name)]">
                      {{ initials(user.name) }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-surface-100">{{ user.name }}</p>
                      <p class="text-xs text-surface-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <select
                    v-if="user.uid !== authStore.user?.uid"
                    :value="user.role"
                    @change="changeRole(user, $event.target.value)"
                    class="text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
                    :class="user.role === 'admin'
                      ? 'bg-surface-800 text-surface-50 border-surface-300 shadow-sm'
                      : 'bg-surface-950 text-surface-400 border-surface-700'"
                  >
                    <option value="user">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-surface-100 text-white border border-surface-50 shadow-sm">
                    <ShieldCheck :size="11" />
                    Admin (You)
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="['badge', user.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-surface-900 text-surface-400 border border-surface-700']">
                    <span :class="['w-1.5 h-1.5 rounded-full', user.active ? 'bg-emerald-500' : 'bg-surface-500']"></span>
                    {{ user.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="flex items-center gap-1.5 text-xs text-surface-400">
                    <svg v-if="user.provider === 'google'" width="12" height="12" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <Mail v-else :size="12" />
                    {{ user.provider === 'google' ? 'Google' : 'Email' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-sm text-surface-400">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="user.uid !== authStore.user?.uid"
                      @click="toggleActive(user)"
                      :title="user.active ? 'Deactivate' : 'Activate'"
                      class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500 hover:text-surface-200 transition-colors"
                    >
                      <UserX v-if="user.active" :size="15" />
                      <UserCheck v-else :size="15" />
                    </button>
                    <button
                      v-if="user.uid !== authStore.user?.uid"
                      @click="confirmDelete(user)"
                      class="p-1.5 rounded-lg hover:bg-red-900/20 text-surface-500 hover:text-red-400 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 :size="15" />
                    </button>
                    <span v-if="user.uid === authStore.user?.uid" class="text-xs text-surface-600 pr-2">You</span>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="px-5 py-10 text-center text-sm text-surface-500">
                  No members found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content max-w-md bg-surface-800 border border-surface-700">
          <div class="px-6 py-5 border-b border-surface-700 flex items-center justify-between">
            <h2 class="font-bold text-surface-50">Add New Member</h2>
            <button @click="showCreateModal = false" class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
            <div class="space-y-1.5">
              <label class="label">Full Name</label>
              <input id="new-name" v-model="newUser.name" placeholder="John Doe" required class="input" />
            </div>
            <div class="space-y-1.5">
              <label class="label">Email Address</label>
              <input id="new-email" v-model="newUser.email" type="email" placeholder="john@example.com" required class="input" autocomplete="off" />
            </div>
            <div class="space-y-1.5">
              <label class="label">Password</label>
              <input id="new-password" v-model="newUser.password" type="password" placeholder="Set a password" required class="input" autocomplete="new-password" />
            </div>

            <div class="space-y-1.5">
              <label class="label">Role</label>
              <select id="new-role" v-model="newUser.role" class="select">
                <option value="user">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div v-if="createError" class="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <AlertCircle :size="14" class="text-red-400 shrink-0 mt-0.5" />
              <p class="text-xs text-red-400">{{ createError }}</p>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" class="btn-secondary flex-1 justify-center" @click="showCreateModal = false">Cancel</button>
              <button type="submit" :disabled="createLoading" class="btn-primary flex-1 justify-center" id="create-member-btn">
                <Loader2 v-if="createLoading" :size="15" class="animate-spin" />
                {{ createLoading ? 'Creating...' : 'Create Member' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-content max-w-sm bg-surface-800 border border-surface-700">
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 :size="22" class="text-red-400" />
            </div>
            <h3 class="font-bold text-surface-50 mb-2">Delete Member</h3>
            <p class="text-sm text-surface-400 mb-6">
              Are you sure you want to delete <strong class="text-surface-200">{{ deleteTarget.name }}</strong>? This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1 justify-center" @click="deleteTarget = null">Cancel</button>
              <button :disabled="deleteLoading" class="btn-danger flex-1 justify-center" @click="handleDelete" id="confirm-delete-btn">
                <Loader2 v-if="deleteLoading" :size="15" class="animate-spin" />
                {{ deleteLoading ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { UserPlus, Search, ShieldCheck, UserX, UserCheck, Trash2, X, AlertCircle, Loader2, Mail } from 'lucide-vue-next'
import AppLayout from '~/components/AppLayout.vue'
import { useAuthStore } from '~/stores/auth'
import { subscribeToUsers, updateUser, deleteUser, createUserRecord, subscribeToTasks } from '~/firebase/firestore'
import { createAuthUser } from '~/firebase/auth'
import { avatarColor, initials, formatDate } from '~/utils/helpers'

definePageMeta({
  requiresAuth: true,
  requiresAdmin: true,
})

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const authStore = useAuthStore()

const users = ref([])
const search = ref('')
const filterRole = ref('')
const showCreateModal = ref(false)
const deleteTarget = ref(null)
const createLoading = ref(false)
const deleteLoading = ref(false)
const createError = ref('')
const isTasksLoaded = ref(false)

const newUser = ref({ name: '', email: '', password: '', role: 'user' })

let unsubscribeUsers = null
let unsubscribeTasks = null

const tasksMap = ref([]) // To store raw tasks

onMounted(() => {
  unsubscribeUsers = subscribeToUsers((data) => { users.value = data })
  unsubscribeTasks = subscribeToTasks((data) => {
    tasksMap.value = data
    isTasksLoaded.value = true
  })
})

onUnmounted(() => { 
  if (unsubscribeUsers) unsubscribeUsers()
  if (unsubscribeTasks) unsubscribeTasks()
})

const chartData = computed(() => {
  const activeUsers = users.value.filter(u => u.active)
  const labels = activeUsers.map(u => u.name)
  
  const taskCounts = activeUsers.map(u => {
    return tasksMap.value.filter(t => t.assignedTo === u.uid).length
  })

  // Calculate total elapsed time in MINUTES
  const timeUtilized = activeUsers.map(u => {
    const userTasks = tasksMap.value.filter(t => t.assignedTo === u.uid)
    const totalMs = userTasks.reduce((acc, t) => acc + (t.totalElapsed || 0), 0)
    return Math.floor(totalMs / (1000 * 60)) // minutes
  })

  return {
    labels,
    datasets: [
      {
        label: 'Tasks Assigned/Completed Count',
        data: taskCounts,
        backgroundColor: '#4f46e5',
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        label: 'Time Utilized (Minutes)',
        data: timeUtilized,
        backgroundColor: '#10b981',
        borderRadius: 4,
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { position: 'top' },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: { 
    x: { display: true },
    y: { 
      type: 'linear', 
      display: true, 
      position: 'left',
      title: { display: true, text: 'Task Count' }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false }, // avoid grid line overlaps
      title: { display: true, text: 'Minutes Utilized' }
    }
  }
}

const filteredUsers = computed(() => {
  let result = users.value
  if (filterRole.value) result = result.filter(u => u.role === filterRole.value)
  if (!search.value) return result
  const q = search.value.toLowerCase()
  return result.filter(u =>
    u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

async function handleCreateUser() {
  createError.value = ''
  createLoading.value = true
  try {
    const uid = await createAuthUser(newUser.value.email, newUser.value.password)
    await createUserRecord({ uid, name: newUser.value.name, email: newUser.value.email, role: newUser.value.role })
    showCreateModal.value = false
    newUser.value = { name: '', email: '', password: '', role: 'user' }
  } catch (e) {
    createError.value = e.message || 'Failed to create user.'
  } finally {
    createLoading.value = false
  }
}

async function toggleActive(user) {
  await updateUser(user.uid, { active: !user.active })
}

async function changeRole(user, newRole) {
  await updateUser(user.uid, { role: newRole })
}

function confirmDelete(user) {
  deleteTarget.value = user
}

async function handleDelete() {
  deleteLoading.value = true
  try {
    await deleteUser(deleteTarget.value.uid)
    deleteTarget.value = null
  } finally {
    deleteLoading.value = false
  }
}
</script>
