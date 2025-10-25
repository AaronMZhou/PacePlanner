import { validateCanvasBaseUrl, normalizeCanvasBaseUrl } from '../lib/canvas'

describe('Canvas utilities', () => {
  describe('validateCanvasBaseUrl', () => {
    it('should validate Canvas URLs', () => {
      const validUrls = [
        'https://osu.instructure.com',
        'https://canvas.illinois.edu',
        'https://myuniversity.instructure.com'
      ]

      validUrls.forEach(url => {
        expect(validateCanvasBaseUrl(url)).toBe(true)
      })
    })

    it('should reject non-Canvas URLs', () => {
      const invalidUrls = [
        'https://google.com',
        'https://github.com',
        'https://example.com',
        'not-a-url'
      ]

      invalidUrls.forEach(url => {
        expect(validateCanvasBaseUrl(url)).toBe(false)
      })
    })
  })

  describe('normalizeCanvasBaseUrl', () => {
    it('should normalize URLs correctly', () => {
      const testCases = [
        { input: 'https://osu.instructure.com/', expected: 'https://osu.instructure.com' },
        { input: 'https://canvas.illinois.edu', expected: 'https://canvas.illinois.edu' },
        { input: 'http://localhost.instructure.com:3000', expected: 'http://localhost.instructure.com:3000' }
      ]

      testCases.forEach(({ input, expected }) => {
        expect(normalizeCanvasBaseUrl(input)).toBe(expected)
      })
    })
  })
})
