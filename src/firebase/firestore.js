import { db } from '@/firebase/config'
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where, orderBy,
  serverTimestamp, writeBatch, Timestamp
} from 'firebase/firestore'

// ── USERS ──────────────────────────────────────────────────────────────────

export function subscribeToUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
  })
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid))
}

// ── TASKS ──────────────────────────────────────────────────────────────────

export async function createTask(taskData) {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    timerStatus: 'stopped',
    totalElapsed: 0,
    lastStarted: null,
    timerLog: [],
  })
  return ref.id
}

export async function updateTask(taskId, data) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getTask(taskId) {
  const snap = await getDoc(doc(db, 'tasks', taskId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function subscribeToTasks(callback) {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function deleteTask(taskId) {
  await deleteDoc(doc(db, 'tasks', taskId))
}

// ── TIMER ──────────────────────────────────────────────────────────────────

const ACTIVE_TIMER_DOC = 'activeTimer/current'

export function subscribeToActiveTimer(callback) {
  return onSnapshot(doc(db, 'activeTimer', 'current'), snap => {
    callback(snap.exists() ? snap.data() : null)
  })
}

export async function startTimer(taskId, currentElapsed) {
  const batch = writeBatch(db)

  // Set global active timer
  batch.set(doc(db, 'activeTimer', 'current'), {
    taskId,
    startedAt: serverTimestamp(),
  })

  // Update task timer state
  batch.update(doc(db, 'tasks', taskId), {
    timerStatus: 'running',
    lastStarted: serverTimestamp(),
    totalElapsed: currentElapsed,
  })

  await batch.commit()
}

export async function pauseTimer(taskId, totalElapsed) {
  const batch = writeBatch(db)

  // Clear global active timer
  batch.delete(doc(db, 'activeTimer', 'current'))

  // Update task
  batch.update(doc(db, 'tasks', taskId), {
    timerStatus: 'paused',
    totalElapsed,
    lastStarted: null,
  })

  await batch.commit()
}

export async function stopTimer(taskId, totalElapsed) {
  const batch = writeBatch(db)

  batch.delete(doc(db, 'activeTimer', 'current'))

  batch.update(doc(db, 'tasks', taskId), {
    timerStatus: 'stopped',
    totalElapsed: 0,
    lastStarted: null,
  })

  await batch.commit()
}

// When starting a new timer, pause any currently running one first
export async function switchTimer(newTaskId, currentlyRunningTaskId, currentRunningElapsed, newTaskElapsed) {
  const batch = writeBatch(db)

  // Pause the currently running task
  if (currentlyRunningTaskId && currentlyRunningTaskId !== newTaskId) {
    batch.update(doc(db, 'tasks', currentlyRunningTaskId), {
      timerStatus: 'paused',
      totalElapsed: currentRunningElapsed,
      lastStarted: null,
    })
  }

  // Set new active timer
  batch.set(doc(db, 'activeTimer', 'current'), {
    taskId: newTaskId,
    startedAt: serverTimestamp(),
  })

  // Start the new task's timer
  batch.update(doc(db, 'tasks', newTaskId), {
    timerStatus: 'running',
    lastStarted: serverTimestamp(),
    totalElapsed: newTaskElapsed,
  })

  await batch.commit()
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────

export async function createNotification(userId, taskId, message, taskTitle) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    taskId,
    message,
    taskTitle,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToNotifications(userId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, 'notifications', notifId), { read: true })
}

export async function markAllNotificationsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { read: true }))
  await batch.commit()
}

// ── EMAIL (triggers Firebase Extension) ────────────────────────────────────

export async function sendTaskAssignmentEmail(to, toName, taskData, assignedBy) {
  const { title, description, priority, dueDate, id } = taskData
  const appUrl = window.location.origin
  await addDoc(collection(db, 'mail'), {
    to,
    message: {
      subject: `[TaskFlow] New task assigned: ${title}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
          <div style="background: #6366f1; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📋 New Task Assigned</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #475569; margin-top: 0;">Hi ${toName},</p>
            <p style="color: #475569;">A new task has been assigned to you by <strong>${assignedBy}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px 12px; background: #f8fafc; font-weight: 600; color: #334155; width: 120px;">Title</td><td style="padding: 8px 12px; color: #475569;">${title}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: 600; color: #334155;">Priority</td><td style="padding: 8px 12px; color: #475569;">${priority}</td></tr>
              <tr><td style="padding: 8px 12px; background: #f8fafc; font-weight: 600; color: #334155;">Due Date</td><td style="padding: 8px 12px; color: #475569;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}</td></tr>
              ${description ? `<tr><td style="padding: 8px 12px; font-weight: 600; color: #334155; vertical-align: top;">Description</td><td style="padding: 8px 12px; color: #475569;">${description}</td></tr>` : ''}
            </table>
            <a href="${appUrl}/task/${id}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">View Task →</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; text-align: center;">TaskFlow · Project Management</p>
        </div>
      `
    }
  })
}
