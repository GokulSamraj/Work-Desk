import { formatDistanceToNow, format } from 'date-fns'

// Format milliseconds to HH:MM:SS
export function formatTimer(ms) {
  if (!ms || ms < 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

// Relative time from Firestore timestamp or JS Date
export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ''
  }
}

// Format date to readable string
export function formatDate(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  try {
    return format(date, 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

// Priority config
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
export const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done']

export function priorityClass(priority) {
  const map = {
    'Low': 'priority-low',
    'Medium': 'priority-medium',
    'High': 'priority-high',
    'Urgent': 'priority-urgent',
  }
  return map[priority] || 'priority-low'
}

export function priorityDot(priority) {
  const map = {
    'Low': 'bg-emerald-500',
    'Medium': 'bg-amber-500',
    'High': 'bg-orange-500',
    'Urgent': 'bg-red-500',
  }
  return map[priority] || 'bg-surface-400'
}

export function statusClass(status) {
  const map = {
    'To Do': 'status-todo',
    'In Progress': 'status-inprogress',
    'In Review': 'status-inreview',
    'Done': 'status-done',
  }
  return map[status] || 'status-todo'
}

export function statusDot(status) {
  const map = {
    'To Do': 'bg-surface-400',
    'In Progress': 'bg-blue-500',
    'In Review': 'bg-purple-500',
    'Done': 'bg-emerald-500',
  }
  return map[status] || 'bg-surface-400'
}

// Generate consistent color for avatar from name
export function avatarColor(name = '') {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
    'bg-teal-500', 'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
