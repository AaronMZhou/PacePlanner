const OPENAI_API_URL = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = process.env.OPENAI_ESTIMATE_MODEL ?? 'gpt-4o-mini'

type EstimateRequest = {
  title: string
  description?: string | null
  courseName?: string | null
  dueAt?: Date | null
  pointsPossible?: number | null
  existingEstimate?: number | null
  subtasksCount?: number
  aiAggressiveness?: number
}

export type EstimateResponse = {
  minutes: number
  explanation?: string
  rawOutput?: string
}

const AGGRESSIVENESS_ADJUSTMENTS: Record<number, number> = {
  [-2]: 0.7,
  [-1]: 0.85,
  [0]: 1,
  [1]: 1.15,
  [2]: 1.3
}

function assertApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return key
}

function buildPrompt(payload: EstimateRequest): string {
  const dueAt = payload.dueAt ? payload.dueAt.toISOString() : 'unknown'
  const points = payload.pointsPossible ?? 'unknown'
  const existing = payload.existingEstimate ?? 'unknown'
  const subtasks = payload.subtasksCount ?? 0

  return [
    `Assignment title: ${payload.title}`,
    `Course: ${payload.courseName ?? 'unknown'}`,
    `Due at: ${dueAt}`,
    `Possible points: ${points}`,
    `Current manual estimate (minutes): ${existing}`,
    `Existing subtasks scheduled: ${subtasks}`,
    '',
    'Assignment description:',
    payload.description?.trim() || 'No description provided.'
  ].join('\n')
}

function adjustMinutes(minutes: number, aggressiveness: number | undefined): number {
  const multiplier = AGGRESSIVENESS_ADJUSTMENTS[aggressiveness ?? 0] ?? 1
  return Math.max(0, Math.round(minutes * multiplier))
}

function parseMinutesFromContent(content: string): EstimateResponse {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const textToParse = jsonMatch ? jsonMatch[0] : content

  try {
    const parsed = JSON.parse(textToParse)
    const minutes = Number(parsed.minutes ?? parsed.estimate ?? parsed.minutes_estimate)
    const explanation =
      typeof parsed.explanation === 'string'
        ? parsed.explanation
        : typeof parsed.reason === 'string'
        ? parsed.reason
        : undefined

    if (Number.isFinite(minutes) && minutes >= 0) {
      return { minutes, explanation, rawOutput: content }
    }
  } catch {
    // fall back to regex parsing below
  }

  const numericMatch = content.match(/(\d+(?:\.\d+)?)/)
  if (numericMatch) {
    return {
      minutes: Number.parseFloat(numericMatch[1]),
      explanation: content,
      rawOutput: content
    }
  }

  throw new Error('Unable to parse minutes from AI response')
}

export async function requestTimeEstimate(payload: EstimateRequest): Promise<EstimateResponse> {
  const apiKey = assertApiKey()

  const systemPrompt =
    'You are an academic planning assistant. Estimate how many minutes a student should budget to finish the assignment. ' +
    'Respond with JSON: {"minutes": <whole number of minutes>, "explanation": "<short reasoning>"}.'

  const userPrompt = buildPrompt(payload)

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.message ??
    data?.output_text ??
    ''

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Empty response from OpenAI')
  }

  const parsed = parseMinutesFromContent(content.trim())
  const adjustedMinutes = adjustMinutes(parsed.minutes, payload.aiAggressiveness)

  return {
    minutes: adjustedMinutes,
    explanation: parsed.explanation,
    rawOutput: parsed.rawOutput ?? content
  }
}
