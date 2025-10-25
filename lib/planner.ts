import { WorkWindows } from './validators'
import { enumerateWorkingDays, startOfDay, nowInTimezone } from './dates'

export interface UnitDetection {
  start: number
  end: number
  count: number
}

export interface TimeSlot {
  date: Date
  minutes: number
}

export interface SubtaskPlan {
  date: Date
  minutes: number
  label: string
  order: number
}

export type Strategy = 'even' | 'frontload' | 'backload' | 'custom'

/**
 * Detect problem ranges in assignment title/description
 * Matches patterns like "Problems 1-3", "Exercises 5-10", etc.
 */
export function detectUnits(text: string): UnitDetection | null {
  const regex = /problems?\s*(\d+)\s*(?:-|\u2013|\u2014|to)\s*(\d+)/i
  const match = text.match(regex)
  
  if (!match) {
    return null
  }
  
  const start = parseInt(match[1], 10)
  const end = parseInt(match[2], 10)
  
  if (start > end) {
    return null
  }
  
  return {
    start,
    end,
    count: end - start + 1
  }
}

/**
 * Split estimated minutes across working days using the specified strategy
 */
export function splitTimeAcrossDays(
  totalMinutes: number,
  startDate: Date,
  dueDate: Date,
  workWindows: WorkWindows,
  timezone: string,
  strategy: Strategy = 'even',
  dailyMaxMinutes: number = 180
): TimeSlot[] {
  const normalizedStrategy = strategy === 'custom' ? 'even' : strategy
  const workingDays = enumerateWorkingDays(startDate, dueDate, workWindows, timezone)
  
  if (workingDays.length === 0) {
    if (totalMinutes <= 0) {
      return []
    }
    
    const fallbackDate = startOfDay(dueDate, timezone)
    return [
      {
        date: fallbackDate,
        minutes: Math.min(totalMinutes, dailyMaxMinutes)
      }
    ]
  }
  
  const slots: TimeSlot[] = []
  
  if (normalizedStrategy === 'even') {
    const minutesPerDay = Math.floor(totalMinutes / workingDays.length)
    const remainder = totalMinutes % workingDays.length
    
    workingDays.forEach((day, index) => {
      let minutes = minutesPerDay
      if (index < remainder) {
        minutes += 1
      }
      
      // Cap at daily maximum
      minutes = Math.min(minutes, dailyMaxMinutes)
      
      if (minutes > 0) {
        slots.push({ date: day, minutes })
      }
    })
  } else if (normalizedStrategy === 'frontload') {
    // Frontload: more work at the beginning
    const denominator = Math.max(workingDays.length - 1, 1)
    const weights = workingDays.map((_, index) => {
      const progress = index / denominator
      return 1.5 - 0.5 * progress // 1.5 to 1.0
    })
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    
    workingDays.forEach((day, index) => {
      let minutes = Math.floor((totalMinutes * weights[index]) / totalWeight)
      minutes = Math.min(minutes, dailyMaxMinutes)
      
      if (minutes > 0) {
        slots.push({ date: day, minutes })
      }
    })
  } else if (normalizedStrategy === 'backload') {
    // Backload: more work at the end
    const denominator = Math.max(workingDays.length - 1, 1)
    const weights = workingDays.map((_, index) => {
      const progress = index / denominator
      return 1.0 + 0.5 * progress // 1.0 to 1.5
    })
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    
    workingDays.forEach((day, index) => {
      let minutes = Math.floor((totalMinutes * weights[index]) / totalWeight)
      minutes = Math.min(minutes, dailyMaxMinutes)
      
      if (minutes > 0) {
        slots.push({ date: day, minutes })
      }
    })
  } else {
    // Any other strategy falls back to even distribution
    return splitTimeAcrossDays(
      totalMinutes,
      startDate,
      dueDate,
      workWindows,
      timezone,
      'even',
      dailyMaxMinutes
    )
  }
  
  return slots
}

/**
 * Generate subtask plan with labels
 */
export function generateSubtaskPlan(
  totalMinutes: number,
  startDate: Date,
  dueDate: Date,
  workWindows: WorkWindows,
  timezone: string,
  strategy: Strategy = 'even',
  dailyMaxMinutes: number = 180,
  title: string = '',
  description: string = ''
): SubtaskPlan[] {
  const timeSlots = splitTimeAcrossDays(
    totalMinutes,
    startDate,
    dueDate,
    workWindows,
    timezone,
    strategy,
    dailyMaxMinutes
  )
  
  // Try to detect units for better labeling
  const units = detectUnits(title + ' ' + (description || ''))
  
  const plans: SubtaskPlan[] = []
  let order = 0
  
  timeSlots.forEach((slot) => {
    if (units) {
      // Create labeled ranges for detected units
      const unitsPerSlot = Math.ceil(units.count / timeSlots.length)
      const startUnit = Math.floor((order * units.count) / timeSlots.length) + units.start
      const endUnit = Math.min(startUnit + unitsPerSlot - 1, units.end)
      
      plans.push({
        date: slot.date,
        minutes: slot.minutes,
        label: `Problems ${startUnit}-${endUnit}`,
        order: order++
      })
    } else {
      // Generic labels
      plans.push({
        date: slot.date,
        minutes: slot.minutes,
        label: `Work ${order + 1}/${timeSlots.length}`,
        order: order++
      })
    }
  })
  
  return plans
}

/**
 * Reflow incomplete subtasks forward to available dates
 */
export function reflowSubtasks(
  incompleteSubtasks: Array<{
    id: string
    date: Date
    minutes: number
    label: string
    order: number
  }>,
  workWindows: WorkWindows,
  timezone: string,
  dailyMaxMinutes: number,
  dueDate: Date
): Array<{
  id: string
  date: Date
  minutes: number
  label: string
  order: number
}> {
  const now = nowInTimezone(timezone)
  const today = startOfDay(now, timezone)
  
  // Filter out subtasks that are already past due
  const validSubtasks = incompleteSubtasks.filter(
    subtask => subtask.date < dueDate
  )
  
  // Sort by original order to maintain sequence
  validSubtasks.sort((a, b) => a.order - b.order)
  
  // Get available working days from today to due date
  const availableDays = enumerateWorkingDays(today, dueDate, workWindows, timezone)
  
  const reflowed: Array<{
    id: string
    date: Date
    minutes: number
    label: string
    order: number
  }> = []
  
  // Track daily minutes usage
  const dailyUsage = new Map<string, number>()
  
  for (const subtask of validSubtasks) {
    let placed = false
    
    // Try to place in the next available day
    for (const day of availableDays) {
      const dayKey = day.toISOString().split('T')[0]
      const currentUsage = dailyUsage.get(dayKey) || 0
      
      if (currentUsage + subtask.minutes <= dailyMaxMinutes) {
        reflowed.push({
          ...subtask,
          date: day
        })
        
        dailyUsage.set(dayKey, currentUsage + subtask.minutes)
        placed = true
        break
      }
    }
    
    // If couldn't place within limits, try to squeeze in with 5-minute increments
    if (!placed) {
      for (const day of availableDays) {
        const dayKey = day.toISOString().split('T')[0]
        const currentUsage = dailyUsage.get(dayKey) || 0
        const remaining = dailyMaxMinutes - currentUsage
        
        if (remaining > 0) {
          const adjustedMinutes = Math.min(subtask.minutes, remaining)
          
          reflowed.push({
            ...subtask,
            date: day,
            minutes: adjustedMinutes
          })
          
          dailyUsage.set(dayKey, currentUsage + adjustedMinutes)
          placed = true
          break
        }
      }
    }
    
    // If still couldn't place, keep original date (will be overdue)
    if (!placed) {
      reflowed.push(subtask)
    }
  }
  
  return reflowed
}

/**
 * Calculate total minutes for a date range
 */
export function calculateTotalMinutes(
  startDate: Date,
  endDate: Date,
  workWindows: WorkWindows,
  timezone: string,
  dailyMaxMinutes: number
): number {
  const workingDays = enumerateWorkingDays(startDate, endDate, workWindows, timezone)
  return workingDays.length * dailyMaxMinutes
}
