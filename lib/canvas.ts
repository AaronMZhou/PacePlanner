/**
 * Canvas API utilities for PacePlanner
 */

export interface CanvasUser {
  id: number
  name: string
  email: string
}

export interface CanvasCalendarEvent {
  id: number
  title: string
  start_at: string
  end_at: string | null
  due_at: string | null
  all_day: boolean
  all_day_date: string | null
  created_at: string
  updated_at: string
  location_name: string | null
  location_address: string | null
  context_code: string
  effective_context_code: string
  context_name: string
  all_context_codes: string
  description: string | null
  html_url: string
  url: string
  type: string
  assignment?: {
    id: number
    name: string
    description: string | null
    due_at: string | null
    points_possible: number | null
    grading_type: string
    assignment_group_id: number
    position: number
    course_id: number
    html_url: string
    url: string
  }
}

export interface CanvasPaginatedResponse<T> {
  data: T[]
  next?: string
  prev?: string
}

/**
 * Fetch JSON from Canvas API
 */
export async function fetchCanvasJson<T>(
  baseUrl: string,
  path: string,
  token: string
): Promise<T> {
  const url = `${baseUrl}/api/v1${path}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Canvas token')
    }
    if (response.status === 403) {
      throw new Error('Canvas token does not have required permissions')
    }
    throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get all pages from a paginated Canvas API endpoint
 */
export async function getAllWithPagination<T>(
  baseUrl: string,
  path: string,
  token: string
): Promise<T[]> {
  const allData: T[] = []
  let nextUrl: string | null = `${baseUrl}/api/v1${path}`

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Canvas token')
      }
      if (response.status === 403) {
        throw new Error('Canvas token does not have required permissions')
      }
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    allData.push(...(Array.isArray(data) ? data : []))

    // Check for next page in Link header
    const linkHeader = response.headers.get('Link')
    nextUrl = null

    if (linkHeader) {
      const links = linkHeader.split(',').map(link => {
        const [url, rel] = link.split(';').map(s => s.trim())
        return {
          url: url.slice(1, -1), // Remove < and >
          rel: rel.slice(5, -1), // Remove rel=" and "
        }
      })

      const nextLink = links.find(link => link.rel === 'next')
      if (nextLink) {
        nextUrl = nextLink.url
      }
    }
  }

  return allData
}

/**
 * Verify Canvas token by fetching user info
 */
export async function verifyCanvasToken(
  baseUrl: string,
  token: string
): Promise<CanvasUser> {
  return fetchCanvasJson<CanvasUser>(baseUrl, '/users/self', token)
}

/**
 * Get calendar events (assignments) for a date range
 */
export async function getCalendarEvents(
  baseUrl: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<CanvasCalendarEvent[]> {
  const path = `/users/self/calendar_events?type=assignment&all_events=true&start_date=${startDate}&end_date=${endDate}`
  return getAllWithPagination<CanvasCalendarEvent>(baseUrl, path, token)
}

/**
 * Validate Canvas base URL
 */
export function validateCanvasBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.endsWith('.instructure.com')
  } catch {
    return false
  }
}

/**
 * Normalize Canvas base URL
 */
export function normalizeCanvasBaseUrl(url: string): string {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.hostname}`
}
