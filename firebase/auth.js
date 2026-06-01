import { auth, db, firebaseConfig } from '~/firebase/config'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore'

export async function loginWithCredentials(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password)
  return resolveUserProfile(result.user)
}

export async function resolveUserProfile(firebaseUser) {
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      // Auto-provision a Firestore record for a Firebase Auth user that has no doc yet
      const isAdmin = firebaseUser.email?.toLowerCase() === 'gokulsamraj2001@gmail.com'
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email.toLowerCase(),
        role: isAdmin ? 'admin' : 'user',
        active: true,
        createdAt: serverTimestamp(),
      })
      const fresh = await getDoc(userDocRef)
      const data = fresh.data()
      return { uid: firebaseUser.uid, ...data }
    }

    const data = userDoc.data()

    if (data.active === false) {
      await firebaseSignOut(auth)
      throw new Error('Your account has been deactivated. Contact your administrator.')
    }

    return { uid: firebaseUser.uid, ...data }
  } catch (err) {
    if (err.message?.includes('offline')) {
      throw new Error('Cannot connect to the database. Ensure no proxies are blocking Firestore.')
    }
    throw err
  }
}

// Creates a Firebase Auth account using a secondary app instance so the
// current admin session is not displaced.
export async function createAuthUser(email, password) {
  const { initializeApp, deleteApp } = await import('firebase/app')
  const { getAuth, createUserWithEmailAndPassword: createFbUser } = await import('firebase/auth')

  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const result = await createFbUser(secondaryAuth, email.trim(), password)
    return result.user.uid
  } finally {
    await secondaryAuth.signOut()
    await deleteApp(secondaryApp)
  }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() }
}
