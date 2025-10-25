import { detectUnits, splitTimeAcrossDays, generateSubtaskPlan } from '../lib/planner'
import { WorkWindows } from '../lib/validators'

describe('Planner', () => {
  describe('detectUnits', () => {
    it('should detect problem ranges', () => {
      const testCases = [
        { text: 'Problems 1-5', expected: { start: 1, end: 5, count: 5 } },
        { text: 'Exercises 10–15', expected: { start: 10, end: 15, count: 6 } },
        { text: 'Do problems 3-7 for homework', expected: { start: 3, end: 7, count: 5 } },
        { text: 'Complete problems 1-3 and 5-8', expected: { start: 1, end: 3, count: 3 } }, // First match
      ]

      testCases.forEach(({ text, expected }) => {
        const result = detectUnits(text)
        expect(result).toEqual(expected)
      })
    })

    it('should return null for no matches', () => {
      const testCases = [
        'Complete the assignment',
        'Read chapter 5',
        'Write an essay',
        'Problems 5-3', // Invalid range
      ]

      testCases.forEach(text => {
        const result = detectUnits(text)
        expect(result).toBeNull()
      })
    })
  })

  describe('splitTimeAcrossDays', () => {
    const workWindows: WorkWindows = {
      "1": [["09:00", "17:00"]], // Monday
      "2": [["09:00", "17:00"]], // Tuesday
      "3": [["09:00", "17:00"]], // Wednesday
      "4": [["09:00", "17:00"]], // Thursday
      "5": [["09:00", "17:00"]], // Friday
    }

    it('should split time evenly across working days', () => {
      const startDate = new Date('2024-01-01') // Monday
      const dueDate = new Date('2024-01-05') // Friday
      const totalMinutes = 300 // 5 hours
      const dailyMaxMinutes = 120

      const result = splitTimeAcrossDays(
        totalMinutes,
        startDate,
        dueDate,
        workWindows,
        'America/New_York',
        'even',
        dailyMaxMinutes
      )

      expect(result).toHaveLength(5) // 5 working days
      expect(result.reduce((sum, slot) => sum + slot.minutes, 0)).toBe(totalMinutes)
      
      // Each day should have 60 minutes (300/5)
      result.forEach(slot => {
        expect(slot.minutes).toBe(60)
      })
    })

    it('should respect daily maximum', () => {
      const startDate = new Date('2024-01-01')
      const dueDate = new Date('2024-01-02')
      const totalMinutes = 300
      const dailyMaxMinutes = 120

      const result = splitTimeAcrossDays(
        totalMinutes,
        startDate,
        dueDate,
        workWindows,
        'America/New_York',
        'even',
        dailyMaxMinutes
      )

      expect(result).toHaveLength(2)
      result.forEach(slot => {
        expect(slot.minutes).toBeLessThanOrEqual(dailyMaxMinutes)
      })
    })

    it('should handle frontload strategy', () => {
      const startDate = new Date('2024-01-01')
      const dueDate = new Date('2024-01-03')
      const totalMinutes = 300

      const result = splitTimeAcrossDays(
        totalMinutes,
        startDate,
        dueDate,
        workWindows,
        'America/New_York',
        'frontload',
        180
      )

      expect(result).toHaveLength(3)
      // First day should have more minutes than last day
      expect(result[0].minutes).toBeGreaterThan(result[2].minutes)
    })
  })

  describe('generateSubtaskPlan', () => {
    const workWindows: WorkWindows = {
      "1": [["09:00", "17:00"]],
      "2": [["09:00", "17:00"]],
    }

    it('should generate subtasks with unit labels', () => {
      const startDate = new Date('2024-01-01')
      const dueDate = new Date('2024-01-02')
      const totalMinutes = 120

      const result = generateSubtaskPlan(
        totalMinutes,
        startDate,
        dueDate,
        workWindows,
        'America/New_York',
        'even',
        180,
        'Problems 1-4',
        'Complete problems 1-4'
      )

      expect(result).toHaveLength(2)
      expect(result[0].label).toMatch(/Problems \d+–\d+/)
      expect(result[1].label).toMatch(/Problems \d+–\d+/)
    })

    it('should generate subtasks with generic labels', () => {
      const startDate = new Date('2024-01-01')
      const dueDate = new Date('2024-01-02')
      const totalMinutes = 120

      const result = generateSubtaskPlan(
        totalMinutes,
        startDate,
        dueDate,
        workWindows,
        'America/New_York',
        'even',
        180,
        'Essay Assignment',
        'Write a 5-page essay'
      )

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('Work 1/2')
      expect(result[1].label).toBe('Work 2/2')
    })
  })
})
