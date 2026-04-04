import { auth, db } from '@/firebase/config'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore'

const googleProvider = new GoogleAuthProvider()

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid))
  if (!userDoc.exists()) throw new Error('User profile not found.')
  return { uid: cred.user.uid, ...userDoc.data() }
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  const firebaseUser = result.user

  // Check if the user already has a profile in Firestore
  const userDocRef = doc(db, 'users', firebaseUser.uid)
  const userDoc = await getDoc(userDocRef)

  if (!userDoc.exists()) {
    // This is a new Google user — check if they are pre-authorized
    // For security, we create the profile only if admin pre-approved the email
    // OR throw an error so only admins can explicitly create users first.
    // To allow self-registration via Google, change this to create profile:
    await setDoc(userDocRef, {
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || null,
      role: 'user',
      createdAt: serverTimestamp(),
      active: true,
      provider: 'google',
    })
  } else {
    // Update photoURL if changed
    if (firebaseUser.photoURL && !userDoc.data().photoURL) {
      await setDoc(userDocRef, { photoURL: firebaseUser.photoURL }, { merge: true })
    }
  }

  const updatedDoc = await getDoc(userDocRef)
  if (!updatedDoc.data().active) {
    await firebaseSignOut(auth)
    throw new Error('Your account has been deactivated. Please contact an administrator.')
  }

  return { uid: firebaseUser.uid, ...updatedDoc.data() }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function createUser(email, password, name, role = 'user') {
  // Create auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  // Store profile in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
    active: true,
    provider: 'email',
    photoURL: null,
  })
  return cred.user.uid
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() }
}
