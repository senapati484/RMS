// lib/encryption.ts
import crypto from 'crypto'

// Key must be provided via env — never fall back to a hardcoded value.
const ENCRYPTION_KEY = process.env.DIGILOCKER_ENCRYPTION_KEY
const ALGORITHM = 'aes-256-cbc'

if (!ENCRYPTION_KEY) {
  throw new Error('DIGILOCKER_ENCRYPTION_KEY environment variable is not defined')
}

function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY!).digest()
}

/**
 * Encrypts sensitive string data (e.g. DigiLocker raw payload, Aadhaar details)
 * using AES-256-CBC before saving to database. Throws on failure — sensitive
 * data must never be silently stored in plaintext.
 */
export function encryptData(text: string): string {
  if (!text) return ''
  const key = deriveKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const result = `${iv.toString('hex')}:${encrypted}`
  key.fill(0) // Wipes key material from V8 heap
  iv.fill(0)  // Wipes IV buffer from V8 heap
  return result
}

/**
 * Decrypts AES-256-CBC encrypted cipher string.
 */
export function decryptData(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText
  const key = deriveKey()
  const [ivHex, encryptedHex] = cipherText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  key.fill(0) // Wipes key material from V8 heap
  iv.fill(0)  // Wipes IV buffer from V8 heap
  return decrypted
}
