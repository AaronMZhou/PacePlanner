import { webcrypto } from 'crypto'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

/**
 * Get the encryption key from environment variable
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = process.env.CANVAS_ENCRYPTION_KEY
  if (!keyString) {
    throw new Error('CANVAS_ENCRYPTION_KEY environment variable is required')
  }

  // Remove 'base64:' prefix if present
  const base64Key = keyString.startsWith('base64:') ? keyString.slice(7) : keyString
  
  // Decode base64 key
  const keyBuffer = Buffer.from(base64Key, 'base64')
  
  if (keyBuffer.length !== 32) {
    throw new Error('CANVAS_ENCRYPTION_KEY must be a 32-byte base64-encoded key')
  }

  return await webcrypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encrypt(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await getEncryptionKey()
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await webcrypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encoded
  )

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  }
}

/**
 * Decrypt a string using AES-GCM
 */
export async function decrypt(ciphertext: string, iv: string): Promise<string> {
  const key = await getEncryptionKey()
  
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64')
  const ivBuffer = Buffer.from(iv, 'base64')
  
  const decrypted = await webcrypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivBuffer,
    },
    key,
    ciphertextBuffer
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Generate a random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  const key = webcrypto.getRandomValues(new Uint8Array(32))
  return 'base64:' + Buffer.from(key).toString('base64')
}
