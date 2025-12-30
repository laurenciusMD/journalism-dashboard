import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16

/**
 * Generates or retrieves encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }

  // Ensure key is exactly 32 bytes
  const keyBuffer = Buffer.from(key, 'hex')

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (64 hex characters)`)
  }

  return keyBuffer
}

/**
 * Encrypts sensitive data (e.g., API keys)
 * @param {string} plaintext - Text to encrypt
 * @returns {string} Encrypted text in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty value')
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:ciphertext
  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    ciphertext
  ].join(':')
}

/**
 * Decrypts encrypted data
 * @param {string} encryptedText - Text in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedText) {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty value')
  }

  const key = getEncryptionKey()
  const parts = encryptedText.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivHex, authTagHex, ciphertext] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8')
  plaintext += decipher.final('utf8')

  return plaintext
}

/**
 * Generates a new random encryption key
 * Use this once during setup, then store in environment
 * @returns {string} Hex-encoded 32-byte key
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Test encryption/decryption to verify key is valid
 * @returns {boolean} True if encryption is working
 */
export function testEncryption() {
  try {
    const testData = 'test-api-key-12345'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return decrypted === testData
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}
