import { auth, db } from '~/firebase/config'
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import {
  doc, setDoc, getDoc, getDocs,
  collection, query, where, serverTimestamp
} from 'firebase/firestore'

const googleProvider = new GoogleAuthProvider()

// Define permitted company domains here
const ALLOWED_DOMAINS = ['lmes.in', 'lmes.ai']

/**
 * Google Sign-In flow:
 * 1. Sign in with Google popup
 * 2. Check if users/{uid} doc exists → if yes, allow
 * 3. If not, check users collection for matching email (admin pre-created the record)
 *    → if found by email, move that record to users/{uid}
 * 4. If still not found → sign out, throw "User not found"
 * 5. If account is deactivated → sign out, throw error
 */
export async function loginWithPopupCompact() {
  // `hd` hints Google to prefer this domain in the selection popup
  googleProvider.setCustomParameters({ 
    prompt: 'select_account',
    hd: ALLOWED_DOMAINS[0]
  })

  // Intercept window.open to forcefully resize Firebase's hardcoded OAuth popup
  const originalOpen = window.open
  window.open = function(url, name, features) {
    const w = 420
    const h = 580
    const left = (window.screen.width / 2) - (w / 2)
    const top = (window.screen.height / 2) - (h / 2)
    return originalOpen.call(this, url, name, `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`)
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    return await resolveUserProfile(result.user) // Dynamically provisions the db schema locally before resolving
  } finally {
    window.open = originalOpen // Assure garbage collection and unhijacking
  }
}

export async function resolveUserProfile(firebaseUser) {
  try {
    const userDomain = firebaseUser.email.split('@')[1]?.toLowerCase()
    
    // Strict domain authorization check
    if (!ALLOWED_DOMAINS.includes(userDomain)) {
      await firebaseSignOut(auth)
      throw new Error(`Access Denied: Only accounts from ${ALLOWED_DOMAINS.join(' or ')} are authorized.`)
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid)
    let userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', firebaseUser.email.toLowerCase())
      )
      const emailSnap = await getDocs(emailQuery)

      if (!emailSnap.empty) {
        const docSnap = emailSnap.docs[0]
        const existing = docSnap.data()
        await setDoc(userDocRef, {
          ...existing,
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL || existing.photoURL || null,
          provider: 'google',
        })
        if (docSnap.id !== firebaseUser.uid) {
          const { deleteDoc } = await import('firebase/firestore')
          await deleteDoc(docSnap.ref)
        }
        userDoc = await getDoc(userDocRef)
      } else {
        const isSuperAdmin = firebaseUser.email.toLowerCase() === 'gokul_s@lmes.in'
        
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email.toLowerCase(),
          role: isSuperAdmin ? 'admin' : 'user',
          active: true,
          createdAt: serverTimestamp(),
          provider: 'google',
          photoURL: firebaseUser.photoURL || null,
        })
        userDoc = await getDoc(userDocRef)
      }
    }
    
    const data = userDoc.data()

    if (data.active === false) {
      await firebaseSignOut(auth)
      throw new Error('Your account has been deactivated. Contact your administrator.')
    }

    if (firebaseUser.photoURL && !data.photoURL) {
      await setDoc(userDocRef, { photoURL: firebaseUser.photoURL }, { merge: true })
    }

    return {
      uid: firebaseUser.uid,
      ...data,
      photoURL: firebaseUser.photoURL || data.photoURL || null,
    }
  } catch (err) {
    if (err.message && err.message.includes('offline')) {
      throw new Error("Cannot connect to the database. Ensure no proxies are blocking Firestore.")
    }
    throw err
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
