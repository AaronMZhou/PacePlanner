import { z } from 'zod';

export const canvasBaseUrlSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().url('Must be a valid URL'))
  .refine((url) => {
    try {
      const p = new URL(url);
      return p.hostname.endsWith('.instructure.com');
    } catch {
      return false;
    }
  }, 'Must be a Canvas instance URL (ending with .instructure.com)')
  .transform((url) => {
    const p = new URL(url);
    return `${p.protocol}//${p.hostname}`;
  });

export const canvasTokenSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(20, 'Token looks too short').max(1000, 'Token is too long'));


// User settings validation
export const userSettingsSchema = z.object({
  workWindowsJson: z.string().refine(
    (json) => {
      try {
        const parsed = JSON.parse(json)
        return typeof parsed === 'object' && parsed !== null
      } catch {
        return false
      }
    },
    'Invalid work windows format'
  ),
  dailyMaxMinutes: z.number().int().min(1).max(1440), // 1 minute to 24 hours
  timezone: z.string().min(1),
  useAIEstimates: z.boolean(),
  aiAggressiveness: z.number().int().min(-2).max(2),
})

// Assignment strategy validation
export const assignmentStrategySchema = z.enum(['even', 'frontload', 'backload', 'custom'])

// Assignment status validation
export const assignmentStatusSchema = z.enum(['planned', 'in_progress', 'done'])

// Work window format: { "1": [["19:00", "22:00"]], "2": [["09:00", "12:00"], ["14:00", "17:00"]] }
export const workWindowsSchema = z.record(
  z.string(), // day of week (0-6, where 0 is Sunday)
  z.array(z.tuple([z.string(), z.string()])) // array of [start, end] time pairs
)

export type WorkWindows = z.infer<typeof workWindowsSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>
export type AssignmentStrategy = z.infer<typeof assignmentStrategySchema>
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>
