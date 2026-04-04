import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  subscribeToTasks, createTask, updateTask, deleteTask,
  subscribeToActiveTimer, startTimer, pauseTimer, stopTimer, switchTimer
} from '@/firebase/firestore'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const activeTimer = ref(null)
  const localTickInterval = ref(null)
  const localElapsed = ref({}) // taskId -> extra ms since lastStarted

  let unsubTasks = null
  let unsubTimer = null

  function init() {
    unsubTasks = subscribeToTasks((data) => {
      tasks.value = data
    })

    unsubTimer = subscribeToActiveTimer((data) => {
      activeTimer.value = data

      // Clear any existing interval
      if (localTickInterval.value) clearInterval(localTickInterval.value)

      if (data?.taskId) {
        // Start local ticking
        const startedAt = data.startedAt?.toMillis?.() || Date.now()
        localTickInterval.value = setInterval(() => {
          localElapsed.value = {
            ...localElapsed.value,
            [data.taskId]: Date.now() - startedAt
          }
        }, 1000)
      }
    })
  }

  function getDisplayTime(task) {
    if (!task) return 0
    const base = task.totalElapsed || 0
    if (task.timerStatus === 'running' && activeTimer.value?.taskId === task.id) {
      return base + (localElapsed.value[task.id] || 0)
    }
    return base
  }

  async function handleStartTimer(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const runningTaskId = activeTimer.value?.taskId

    if (runningTaskId && runningTaskId !== taskId) {
      // Pause the currently running task first
      const runningTask = tasks.value.find(t => t.id === runningTaskId)
      const runningElapsed = getDisplayTime(runningTask)
      await switchTimer(taskId, runningTaskId, runningElapsed, task.totalElapsed || 0)
    } else {
      await startTimer(taskId, task.totalElapsed || 0)
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
    tasks, activeTimer, localElapsed,
    init, cleanup, getDisplayTime,
    createTask, updateTask, deleteTask,
    handleStartTimer, handlePauseTimer, handleStopTimer
  }
})
