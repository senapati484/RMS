// lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DIGILOCKER_ENCRYPTION_KEY || 'lease360_digilocker_secure_key_2026_32bytes!'
const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypts sensitive string data (e.g. DigiLocker raw payload, Aadhaar details)
 * using AES-256-CBC before saving to database.
 */
export function encryptData(text: string): string {
  if (!text) return ''
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  } catch (err) {
    console.error('[ENCRYPT ERROR]', err)
    return text
  }
}

/**
 * Decrypts AES-256-CBC encrypted cipher string.
 */
export function decryptData(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
    const [ivHex, encryptedHex] = cipherText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('[DECRYPT ERROR]', err)
    return ''
  }
}
