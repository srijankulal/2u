import crypto from 'crypto'

// Derive a strong 32-byte key from available environment secrets
function getEncryptionKey(): Buffer {
    const env = process.env as Record<string, string | undefined>
    const secret =
        env.ENCRYPTION_SECRET ||
        env.CLERK_SECRET_KEY ||
        env.JWT_SECRET ||
        '2u-postal-letters-future-self-vault-secret-key-2026'

    // Use salt + scrypt for a deterministic 32-byte key
    return crypto.scryptSync(secret, '2u-postal-salt-vault', 32)
}

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

/**
 * Encrypts a text string or URL using AES-256-GCM.
 * Stored safely in database as `enc:v1:<iv>:<authTag>:<ciphertext>`
 */
export function encryptText(plainText: string | null | undefined): string | null | undefined {
    if (plainText === null || plainText === undefined || plainText === '') {
        return plainText
    }

    try {
        const key = getEncryptionKey()
        const iv = crypto.randomBytes(12) // 96-bit IV recommended for GCM
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let encrypted = cipher.update(plainText, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag().toString('hex')
        const ivHex = iv.toString('hex')

        return `${PREFIX}${ivHex}:${authTag}:${encrypted}`
    } catch (err) {
        console.error('Encryption failed, returning original:', err)
        return plainText
    }
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Gracefully returns original text if it was not encrypted.
 */
export function decryptText(encryptedText: string | null | undefined): string | null | undefined {
    if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith(PREFIX)) {
        return encryptedText
    }

    try {
        const key = getEncryptionKey()
        const parts = encryptedText.slice(PREFIX.length).split(':')
        if (parts.length !== 3) {
            return encryptedText
        }

        const [ivHex, authTagHex, cipherHex] = parts
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(cipherHex, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (err) {
        console.error('Decryption failed, returning ciphertext:', err)
        return encryptedText
    }
}
