// Firebase config — client-side only initialization
// This module guards against SSR execution
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

// Firebase only runs on the client
// Use VITE_ prefixed vars which Nuxt/Vite exposes on the client
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Prevent re-initializing on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Corporate firewalls/VPNs often block WebSockets (wss://) completely,
// which causes Firebase to fail with "client is offline".
// This setting forces it to dynamically fall back to HTTP long-polling if WebSockets are dropped.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
})

export default app
