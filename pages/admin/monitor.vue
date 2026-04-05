<template>
  <AppLayout title="Audit Monitor">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-surface-50">System Logs</h2>
          <p class="text-sm text-surface-400 mt-0.5">Real-time surveillance of user activities</p>
        </div>
      </div>

      <div class="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left min-w-[800px]">
            <thead>
              <tr class="border-b border-surface-700 bg-surface-800/50">
                <th class="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Time</th>
                <th class="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">User</th>
                <th class="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Event</th>
                <th class="px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-800">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-surface-700/30 transition-colors">
                <td class="px-5 py-3.5 text-xs text-surface-400 whitespace-nowrap">{{ log.createdAt ? formatDate(log.createdAt) : 'Wait...' }}</td>
                <td class="px-5 py-3.5">
                  <span class="text-sm font-semibold text-surface-200">{{ log.userName }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="badge border bg-surface-950 border-surface-700 text-surface-400 font-mono text-[10px]">{{ log.actionType.replace('_', ' ').toUpperCase() }}</span>
                </td>
                <td class="px-5 py-3.5">
                  <p class="text-sm text-surface-300 break-words max-w-xl">{{ log.details }}</p>
                </td>
              </tr>
              <tr v-if="logs.length === 0">
                <td colspan="4" class="px-5 py-12 text-center text-sm text-surface-500">No logs found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppLayout from '~/components/AppLayout.vue'
import { subscribeToAuditLogs } from '~/firebase/firestore'

definePageMeta({
  requiresAuth: true,
  requiresAdmin: true
})

const logs = ref([])
let unsub = null

onMounted(() => {
  unsub = subscribeToAuditLogs(data => {
    logs.value = data
  })
})

onUnmounted(() => {
  if (unsub) unsub()
})

const formatDate = (ts) => {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleString()
}
</script>
