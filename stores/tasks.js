import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  subscribeToTasks, createTask, updateTask, deleteTask,
  subscribeToActiveTimer, startTimer, pauseTimer, stopTimer, switchTimer, logAction
} from '~/firebase/firestore'
import { useAuthStore } from '~/stores/auth'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const activeTimer = ref(null)
  const localTickInterval = ref(null)
  const localElapsed = ref({}) // taskId -> extra ms since lastStarted

  let unsubTasks = null
  let unsubTimer = null

  const myActiveTimer = computed(() => {
    const authStore = useAuthStore()
    if (!activeTimer.value || !authStore.user) return null
    if (activeTimer.value.userId && activeTimer.value.userId !== authStore.user.uid) return null
    return activeTimer.value
  })

  let localStartTime = null // records Date.now() at start for immediate ticking

  function init() {
    unsubTasks = subscribeToTasks((data) => {
      tasks.value = data
    })

    unsubTimer = subscribeToActiveTimer((data) => {
      activeTimer.value = data

      // Clear any existing interval
      if (localTickInterval.value) clearInterval(localTickInterval.value)

      if (data?.taskId) {
        // If we already started ticking locally (user clicked start), keep our
        // precise local start time. Otherwise fall back to the server timestamp.
        const startedAt = localStartTime || data.startedAt?.toMillis?.() || Date.now()
        localStartTime = null
        localTickInterval.value = setInterval(() => {
          localElapsed.value = {
            ...localElapsed.value,
            [data.taskId]: Date.now() - startedAt
          }
        }, 1000)
        // Emit first tick immediately so the UI updates without a 1s delay
        localElapsed.value = {
          ...localElapsed.value,
          [data.taskId]: Date.now() - startedAt
        }
      }
    })
  }

  function getDisplayTime(task) {
    if (!task) return 0
    const base = task.totalElapsed || 0
    if (task.timerStatus === 'running' && myActiveTimer.value?.taskId === task.id) {
      return base + (localElapsed.value[task.id] || 0)
    }
    return base
  }

  async function handleStartTimer(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const authStore = useAuthStore()
    const userId = authStore.user?.uid
    const runningTaskId = myActiveTimer.value?.taskId

    if (runningTaskId && runningTaskId !== taskId) {
      const runningTask = tasks.value.find(t => t.id === runningTaskId)
      const runningElapsed = getDisplayTime(runningTask)
      await switchTimer(taskId, runningTaskId, runningElapsed, task.totalElapsed || 0, userId)
    } else {
      // Start ticking immediately — don't wait for Firestore round-trip
      localStartTime = Date.now()
      await startTimer(taskId, task.totalElapsed || 0, userId)
    }

    if (authStore.user) {
      logAction(authStore.user.uid, authStore.user.name, 'timer_started', `Started tracking time for task: ${task.title}`).catch(()=>{})
    }
  }

  async function handlePauseTimer(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    const elapsed = getDisplayTime(task)
    await pauseTimer(taskId, elapsed)
    // Clear local elapsed for this task
    const updated = { ...localElapsed.value }
    delete updated[taskId]
    localElapsed.value = updated
  }

  async function handleStopTimer(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    await stopTimer(taskId, 0)
    const updated = { ...localElapsed.value }
    delete updated[taskId]
    localElapsed.value = updated
  }

  function cleanup() {
    if (unsubTasks) unsubTasks()
    if (unsubTimer) unsubTimer()
    if (localTickInterval.value) clearInterval(localTickInterval.value)
  }

  return {
    tasks, activeTimer, myActiveTimer, localElapsed,
    init, cleanup, getDisplayTime,
    createTask, updateTask, deleteTask,
    handleStartTimer, handlePauseTimer, handleStopTimer
  }
})
