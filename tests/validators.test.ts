import { canvasBaseUrlSchema, canvasTokenSchema, workWindowsSchema } from '../lib/validators'

describe('Validators', () => {
  describe('canvasBaseUrlSchema', () => {
    it('should accept valid Canvas URLs', () => {
      const validUrls = [
        'https://osu.instructure.com',
        'https://canvas.illinois.edu',
        'https://myuniversity.instructure.com',
        'http://localhost.instructure.com:3000'
      ]

      validUrls.forEach(url => {
        expect(() => canvasBaseUrlSchema.parse(url)).not.toThrow()
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'https://google.com',
        'https://github.com',
        'ftp://example.instructure.com'
      ]

      invalidUrls.forEach(url => {
        expect(() => canvasBaseUrlSchema.parse(url)).toThrow()
      })
    })

    it('should normalize URLs', () => {
      const result = canvasBaseUrlSchema.parse('https://osu.instructure.com/')
      expect(result).toBe('https://osu.instructure.com')
    })
  })

  describe('canvasTokenSchema', () => {
    it('should accept valid tokens', () => {
      const validTokens = [
        '1234567890',
        'abcdefghijklmnopqrstuvwxyz',
        '~1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      ]

      validTokens.forEach(token => {
        expect(() => canvasTokenSchema.parse(token)).not.toThrow()
      })
    })

    it('should reject empty tokens', () => {
      expect(() => canvasTokenSchema.parse('')).toThrow()
    })

    it('should reject overly long tokens', () => {
      const longToken = 'a'.repeat(1001)
      expect(() => canvasTokenSchema.parse(longToken)).toThrow()
    })
  })

  describe('workWindowsSchema', () => {
    it('should accept valid work windows', () => {
      const validWindows = {
        "1": [["09:00", "17:00"]],
        "2": [["09:00", "12:00"], ["14:00", "17:00"]],
        "0": [["10:00", "16:00"]]
      }

      expect(() => workWindowsSchema.parse(validWindows)).not.toThrow()
    })

    it('should reject invalid work windows', () => {
      const invalidWindows = [
        { "1": [["25:00", "17:00"]] }, // Invalid time
        { "1": [["09:00"]] }, // Missing end time
        { "1": [["17:00", "09:00"]] }, // End before start
      ]

      invalidWindows.forEach(windows => {
        expect(() => workWindowsSchema.parse(windows)).toThrow()
      })
    })
  })
})
