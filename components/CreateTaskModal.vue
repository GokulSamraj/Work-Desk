<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content max-w-lg w-full bg-surface-800 border border-surface-700">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-700 flex items-center justify-between sticky top-0 bg-surface-800 z-10">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand-900/50 flex items-center justify-center">
              <Plus :size="16" class="text-brand-400" />
            </div>
            <h2 class="font-bold text-surface-50">Create New Task</h2>
          </div>
          <button @click="$emit('close')" class="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 transition-colors">
            <X :size="18" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- Title -->
          <div>
            <label class="label">Task Title <span class="text-red-400">*</span></label>
            <input
              v-model="form.title"
              placeholder="What needs to be done?"
              class="input"
              required
              autofocus
            />
          </div>

          <!-- Description -->
          <div>
            <label class="label">Description</label>
            <textarea
              v-model="form.description"
              placeholder="Add more details about this task..."
              class="input resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Row: Assigned To + Priority -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Assign To <span class="text-red-400">*</span></label>
              <select v-model="form.assignedTo" class="select" required>
                <option value="" disabled>Select person</option>
                <option v-for="user in activeUsers" :key="user.uid" :value="user.uid">
                  {{ user.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Priority</label>
              <select v-model="form.priority" class="select">
                <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>

          <!-- Row: Status + Due Date -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Status</label>
              <select v-model="form.status" class="select">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="label">Due Date</label>
              <input v-model="form.dueDate" type="date" class="input" />
            </div>
          </div>

          <!-- Assigned By (read-only) -->
          <div class="flex items-center gap-2 p-3 bg-surface-900 rounded-lg border border-surface-700">
            <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', avatarColor(authStore.user?.name)]">
              {{ initials(authStore.user?.name) }}
            </div>
            <span class="text-xs text-surface-400">Assigned by <strong class="text-surface-200">{{ authStore.user?.name }}</strong> (you)</span>
          </div>

          <div v-if="error" class="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
            <AlertCircle :size="14" class="text-red-400 shrink-0" />
            <p class="text-xs text-red-400">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" @click="$emit('close')" class="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" :disabled="loading" class="btn-primary flex-1 justify-center">
              <Loader2 v-if="loading" :size="15" class="animate-spin" />
              {{ loading ? 'Creating...' : 'Create Task' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, X, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { createTask, createNotification, sendTaskAssignmentEmail, logAction, getAllUsers } from '~/firebase/firestore'
import { PRIORITIES, STATUSES, avatarColor, initials } from '~/utils/helpers'

const emit = defineEmits(['close', 'created'])

const authStore = useAuthStore()

const users = ref([])
const loading = ref(false)
const error = ref('')

const form = ref({
  title: '',
  description: '',
  assignedTo: '',
  priority: 'Medium',
  status: 'To Do',
  dueDate: '',
})

onMounted(async () => {
  users.value = await getAllUsers()
})

const activeUsers = computed(() => users.value.filter(u => u.active !== false))

async function handleSubmit() {
  error.value = ''
  if (!form.value.assignedTo) {
    error.value = 'Please select a person to assign this task to.'
    return
  }

  loading.value = true
  try {
    const assignedUser = users.value.find(u => u.uid === form.value.assignedTo)

    const taskData = {
      title: form.value.title,
      description: form.value.description,
      assignedTo: form.value.assignedTo,
      assignedToName: assignedUser?.name || '',
      assignedBy: authStore.user.uid,
      assignedByName: authStore.user.name,
      priority: form.value.priority,
      status: form.value.status,
      dueDate: form.value.dueDate || null,
      lastUpdatedBy: authStore.user.name,
    }

    const taskId = await createTask(taskData)

    // Create in-app notification (don't notify yourself)
    if (form.value.assignedTo !== authStore.user.uid) {
      await createNotification(
        form.value.assignedTo,
        taskId,
        `${authStore.user.name} assigned you a new task`,
        form.value.title
      )

      // Send email notification
      if (assignedUser?.email) {
        await sendTaskAssignmentEmail(
          assignedUser.email,
          assignedUser.name,
          { ...taskData, id: taskId },
          authStore.user.name
        )
      }
    }

    logAction(
      authStore.user.uid,
      authStore.user.name,
      'task_assigned',
      `Assigned task "${form.value.title}" to ${assignedUser?.name || 'Self'}`
    ).catch(()=>{})

    emit('created', taskId)
    emit('close')
  } catch (e) {
    error.value = 'Failed to create task. Please try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
