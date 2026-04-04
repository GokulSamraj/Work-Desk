<template>
  <AppLayout title="User Management">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50">Team Members</h2>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{{ users.length }} total members</p>
        </div>
        <Button @click="showCreateModal = true" id="add-member-btn">
          <UserPlus :size="16" />
          Add Member
        </Button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <Card class="p-4">
          <p class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Total Users</p>
          <p class="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{{ users.length }}</p>
        </Card>
        <Card class="p-4">
          <p class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Active</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ users.filter(u => u.active).length }}</p>
        </Card>
        <Card class="p-4">
          <p class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Admins</p>
          <p class="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">{{ users.filter(u => u.role === 'admin').length }}</p>
        </Card>
      </div>

      <!-- Users Table -->
      <Card class="overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center gap-3">
          <div class="relative flex-1 max-w-xs">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <Input v-model="search" placeholder="Search members..." class="pl-9 py-1.5 text-sm" id="search-members" />
          </div>
          <!-- Role filter -->
          <select
            v-model="filterRole"
            class="h-9 px-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Member</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-surface-100 dark:border-surface-700">
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Member</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Role</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Status</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Provider</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Joined</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-50 dark:divide-surface-800">
              <tr v-for="user in filteredUsers" :key="user.uid" class="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div v-if="user.photoURL" class="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-surface-200 dark:ring-surface-700">
                      <img :src="user.photoURL" :alt="user.name" class="w-full h-full object-cover" />
                    </div>
                    <div v-else :class="['w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor(user.name)]">
                      {{ initials(user.name) }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">{{ user.name }}</p>
                      <p class="text-xs text-surface-400 dark:text-surface-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <!-- Role toggle dropdown -->
                  <select
                    v-if="user.uid !== authStore.user?.uid"
                    :value="user.role"
                    @change="changeRole(user, $event.target.value)"
                    class="text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
                    :class="user.role === 'admin'
                      ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800'
                      : 'bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:border-surface-600'"
                  >
                    <option value="user">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Badge v-else variant="admin" class="flex items-center gap-1">
                    <ShieldCheck :size="11" />
                    Admin (You)
                  </Badge>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="['badge', user.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-surface-100 text-surface-500 border border-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:border-surface-600']">
                    <span :class="['w-1.5 h-1.5 rounded-full', user.active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-surface-400']"></span>
                    {{ user.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
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
                <td class="px-5 py-3.5 text-sm text-surface-500 dark:text-surface-400">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="user.uid !== authStore.user?.uid"
                      @click="toggleActive(user)"
                      :title="user.active ? 'Deactivate' : 'Activate'"
                      class="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                    >
                      <UserX v-if="user.active" :size="15" />
                      <UserCheck v-else :size="15" />
                    </button>
                    <button
                      v-if="user.uid !== authStore.user?.uid"
                      @click="confirmDelete(user)"
                      class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 :size="15" />
                    </button>
                    <span v-if="user.uid === authStore.user?.uid" class="text-xs text-surface-300 dark:text-surface-600 pr-2">You</span>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="px-5 py-10 text-center text-sm text-surface-400 dark:text-surface-500">
                  No members found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>

    <!-- Create User Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content max-w-md dark:bg-surface-800 dark:border dark:border-surface-700">
          <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <h2 class="font-bold text-surface-900 dark:text-surface-50">Add New Member</h2>
            <button @click="showCreateModal = false" class="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400">
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="handleCreateUser" class="p-6 space-y-4">
            <div class="space-y-1.5">
              <Label for="new-name">Full Name</Label>
              <Input id="new-name" v-model="newUser.name" placeholder="John Doe" required />
            </div>
            <div class="space-y-1.5">
              <Label for="new-email">Email Address</Label>
              <Input id="new-email" v-model="newUser.email" type="email" placeholder="john@company.com" required />
            </div>
            <div class="space-y-1.5">
              <Label for="new-password">Password</Label>
              <Input id="new-password" v-model="newUser.password" type="password" placeholder="Min. 6 characters" minlength="6" required />
            </div>
            <div class="space-y-1.5">
              <Label for="new-role">Role</Label>
              <select id="new-role" v-model="newUser.role" class="select dark:bg-surface-900 dark:border-surface-700 dark:text-surface-100">
                <option value="user">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div v-if="createError" class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
              <AlertCircle :size="14" class="text-red-500 shrink-0 mt-0.5" />
              <p class="text-xs text-red-600 dark:text-red-400">{{ createError }}</p>
            </div>

            <div class="flex gap-3 pt-2">
              <Button type="button" variant="secondary" class="flex-1" @click="showCreateModal = false">Cancel</Button>
              <Button type="submit" :disabled="createLoading" class="flex-1" id="create-member-btn">
                <Loader2 v-if="createLoading" :size="15" class="animate-spin" />
                {{ createLoading ? 'Creating...' : 'Create Member' }}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal-content max-w-sm dark:bg-surface-800 dark:border dark:border-surface-700">
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 :size="22" class="text-red-600 dark:text-red-400" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-50 mb-2">Delete Member</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mb-6">
              Are you sure you want to delete <strong class="dark:text-surface-200">{{ deleteTarget.name }}</strong>? This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <Button variant="secondary" class="flex-1" @click="deleteTarget = null">Cancel</Button>
              <Button variant="destructive" :disabled="deleteLoading" class="flex-1" @click="handleDelete" id="confirm-delete-btn">
                <Loader2 v-if="deleteLoading" :size="15" class="animate-spin" />
                {{ deleteLoading ? 'Deleting...' : 'Delete' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { UserPlus, Search, ShieldCheck, UserX, UserCheck, Trash2, X, AlertCircle, Loader2, Mail } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { subscribeToUsers, updateUser, deleteUser } from '@/firebase/firestore'
import { createUser } from '@/firebase/auth'
import { avatarColor, initials, formatDate } from '@/utils/helpers'

const authStore = useAuthStore()

const users = ref([])
const search = ref('')
const filterRole = ref('')
const showCreateModal = ref(false)
const deleteTarget = ref(null)
const createLoading = ref(false)
const deleteLoading = ref(false)
const createError = ref('')

const newUser = ref({ name: '', email: '', password: '', role: 'user' })

let unsubscribe = null

onMounted(() => {
  unsubscribe = subscribeToUsers((data) => { users.value = data })
})

onUnmounted(() => { if (unsubscribe) unsubscribe() })

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
    await createUser(newUser.value.email, newUser.value.password, newUser.value.name, newUser.value.role)
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
