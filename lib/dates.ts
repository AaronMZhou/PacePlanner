import { WorkWindows } from './validators'

/**
 * Get start of day in a specific timezone
 */
export function startOfDay(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  if (!year || !month || !day) {
    throw new Error('Failed to format date')
  }
  
  return new Date(`${year}-${month}-${day}T00:00:00`)
}

/**
 * Get end of day in a specific timezone
 */
export function endOfDay(date: Date, timezone: string): Date {
  const start = startOfDay(date, timezone)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Check if a date is a working day based on work windows
 */
export function isWorkingDay(date: Date, workWindows: WorkWindows, timezone: string): boolean {
  const dayOfWeek = date.getDay().toString()
  const windows = workWindows[dayOfWeek]
  return windows && windows.length > 0
}

/**
 * Enumerate working days from start date to end date (exclusive)
 */
export function enumerateWorkingDays(
  startDate: Date,
  endDate: Date,
  workWindows: WorkWindows,
  timezone: string
): Date[] {
  const workingDays: Date[] = []
  const current = new Date(startDate)
  
  while (current < endDate) {
    if (isWorkingDay(current, workWindows, timezone)) {
      workingDays.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return workingDays
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Get current date in timezone
 */
export function nowInTimezone(timezone: string): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
}

/**
 * Format date for display
 */
export function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date, timezone: string): boolean {
  const d1 = startOfDay(date1, timezone)
  const d2 = startOfDay(date2, timezone)
  return d1.getTime() === d2.getTime()
}
