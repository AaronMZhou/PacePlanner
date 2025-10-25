import { encrypt, decrypt, generateEncryptionKey } from '../lib/crypto'

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: jest.fn(),
  subtle: {
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  }
}

// Mock the crypto module
jest.mock('crypto', () => ({
  webcrypto: mockCrypto
}))

describe('Crypto utilities', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Set up environment variable
    process.env.CANVAS_ENCRYPTION_KEY = 'base64:' + Buffer.from('a'.repeat(32)).toString('base64')
  })

  afterEach(() => {
    delete process.env.CANVAS_ENCRYPTION_KEY
  })

  describe('generateEncryptionKey', () => {
    it('should generate a valid encryption key', () => {
      const key = generateEncryptionKey()
      expect(key).toMatch(/^base64:/)
      expect(key.length).toBeGreaterThan(40) // base64: + 32 bytes in base64
    })
  })

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const plaintext = 'test-token-123'
      const mockIv = new Uint8Array(12).fill(1)
      const mockCiphertext = new Uint8Array(16).fill(2)
      
      // Mock crypto functions
      mockCrypto.getRandomValues.mockReturnValue(mockIv)
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key')
      mockCrypto.subtle.encrypt.mockResolvedValue(mockCiphertext)
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(plaintext))

      const { ciphertext, iv } = await encrypt(plaintext)
      
      expect(ciphertext).toBeDefined()
      expect(iv).toBeDefined()
      expect(typeof ciphertext).toBe('string')
      expect(typeof iv).toBe('string')

      const decrypted = await decrypt(ciphertext, iv)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle empty strings', async () => {
      const plaintext = ''
      const mockIv = new Uint8Array(12).fill(1)
      const mockCiphertext = new Uint8Array(0)
      
      mockCrypto.getRandomValues.mockReturnValue(mockIv)
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key')
      mockCrypto.subtle.encrypt.mockResolvedValue(mockCiphertext)
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(plaintext))

      const { ciphertext, iv } = await encrypt(plaintext)
      const decrypted = await decrypt(ciphertext, iv)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('error handling', () => {
    it('should throw error when encryption key is missing', async () => {
      delete process.env.CANVAS_ENCRYPTION_KEY
      
      await expect(encrypt('test')).rejects.toThrow('CANVAS_ENCRYPTION_KEY environment variable is required')
    })

    it('should throw error for invalid key format', async () => {
      process.env.CANVAS_ENCRYPTION_KEY = 'invalid-key'
      
      await expect(encrypt('test')).rejects.toThrow('CANVAS_ENCRYPTION_KEY must be a 32-byte base64-encoded key')
    })
  })
})
