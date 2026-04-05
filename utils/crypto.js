import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'secret_taskflow_key_123'

export function encryptData(text) {
  if (!text) return text
  try {
    return CryptoJS.AES.encrypt(text.toString(), SECRET_KEY).toString()
  } catch (e) {
    return text
  }
}

export function decryptData(ciphered) {
  if (!ciphered) return ciphered
  try {
    const bytes = CryptoJS.AES.decrypt(ciphered.toString(), SECRET_KEY)
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    // If decryption fails, it usually returns an empty string or throws. 
    // We strictly fallback to the original string to avoid breaking legacy unencrypted data.
    return originalText || ciphered
  } catch (e) {
    return ciphered
  }
}
