'use client'

import { useEffect, useMemo, useState } from 'react'
import SubtaskItem from './SubtaskItem'

interface Subtask {
  id: string
  label: string
  description?: string | null
  minutes: number
  completed: boolean
  order: number
  assignment: {
    id: string
    title: string
    courseName: string
    dueAt: string | null
    pointsPossible: number | null
    status: string
  }
}

interface WeekGridProps {
  subtasks: Record<string, Subtask[]>
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>
  onMoveSubtask: (subtaskId: string, newDate: Date) => Promise<void>
  onEditSubtask?: (subtaskId: string, updates: { label?: string; description?: string | null; minutes?: number }) => Promise<void>
  timezone: string
}

export default function WeekGrid({
  subtasks,
  onToggleSubtask,
  onMoveSubtask,
  onEditSubtask,
  timezone
}: WeekGridProps) {
  const [draggedSubtask, setDraggedSubtask] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [previewSubtask, setPreviewSubtask] = useState<{
    subtask: Subtask
    assignment: Subtask['assignment']
    date: Date
  } | null>(null)
  const [isPreviewEditing, setIsPreviewEditing] = useState(false)
  const [shouldAutoEditPreview, setShouldAutoEditPreview] = useState(false)
  const [previewDraftLabel, setPreviewDraftLabel] = useState('')
  const [previewDraftMinutes, setPreviewDraftMinutes] = useState('')
  const [previewDraftDescription, setPreviewDraftDescription] = useState('')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isSavingPreview, setIsSavingPreview] = useState(false)

  const formatterCache = useMemo(() => {
    return {
      weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone }),
      day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: timezone }),
      range: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: timezone }),
      year: new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: timezone })
    }
  }, [timezone])

  useEffect(() => {
    if (!previewSubtask) {
      setPreviewDraftLabel('')
      setPreviewDraftMinutes('')
      setPreviewDraftDescription('')
      setIsPreviewEditing(false)
      setPreviewError(null)
      setShouldAutoEditPreview(false)
      return
    }

    setPreviewDraftLabel(previewSubtask.subtask.label)
    setPreviewDraftMinutes(previewSubtask.subtask.minutes.toString())
    setPreviewDraftDescription(previewSubtask.subtask.description ?? '')
    setIsPreviewEditing(shouldAutoEditPreview)
    setShouldAutoEditPreview(false)
    setPreviewError(null)
  }, [previewSubtask, shouldAutoEditPreview])

  useEffect(() => {
    if (!previewSubtask) {
      return
    }

    const dateKey = formatDate(previewSubtask.date)
    const daySubtasks = subtasks[dateKey] || []
    const updated = daySubtasks.find((item) => item.id === previewSubtask.subtask.id)

    if (!updated) {
      setPreviewSubtask(null)
      return
    }

    setPreviewSubtask((current) =>
      current
        ? {
            ...current,
            subtask: updated,
            assignment: updated.assignment
          }
        : current
    )
  }, [subtasks])

  useEffect(() => {
    setPreviewSubtask(null)
    setIsPreviewEditing(false)
    setShouldAutoEditPreview(false)
  }, [weekOffset])

  const getTodayInTimezone = () => {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(now)

    const year = Number(parts.find((p) => p.type === 'year')?.value)
    const month = Number(parts.find((p) => p.type === 'month')?.value)
    const day = Number(parts.find((p) => p.type === 'day')?.value)

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      const fallback = new Date()
      return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()))
    }

    return new Date(Date.UTC(year, month - 1, day))
  }

  const todayInTimezone = useMemo(() => getTodayInTimezone(), [timezone])

  // Generate week dates (Monday to Sunday)
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(todayInTimezone)
    const dayOfWeek = startOfWeek.getUTCDay()
    const offsetToMonday = (dayOfWeek + 6) % 7
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - offsetToMonday + weekOffset * 7)

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek)
      date.setUTCDate(startOfWeek.getUTCDate() + index)
      return date
    })
  }, [todayInTimezone, weekOffset])

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDayHeader = (date: Date) => {
    const todayKey = formatDate(todayInTimezone)
    const isToday = weekOffset === 0 && formatDate(date) === todayKey

    return (
      <div className={`text-center ${isToday ? 'font-bold text-blue-600' : ''}`}>
        <div className="text-sm font-medium">
          {formatterCache.weekday.format(date)}
        </div>
        <div className="text-xs text-gray-500">
          {formatterCache.day.format(date)}
        </div>
      </div>
    )
  }

  const handleDragStart = (e: React.DragEvent, subtaskId: string) => {
    setDraggedSubtask(subtaskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(formatDate(date))
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    
    if (draggedSubtask) {
      try {
        await onMoveSubtask(draggedSubtask, date)
      } catch (error) {
        console.error('Failed to move subtask:', error)
      }
    }
    
    setDraggedSubtask(null)
    setDragOverDate(null)
  }

  const getTotalMinutes = (date: Date) => {
    const dateKey = formatDate(date)
    const daySubtasks = subtasks[dateKey] || []
    return daySubtasks.reduce((total, subtask) => total + subtask.minutes, 0)
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) {
      return ''
    }

    const start = weekDates[0]
    const end = weekDates[weekDates.length - 1]

    const startLabel = formatterCache.range.format(start)
    const endLabel = formatterCache.range.format(end)
    const startYear = formatterCache.year.format(start)
    const endYear = formatterCache.year.format(end)

    if (startYear === endYear) {
      return `${startLabel} - ${endLabel}, ${startYear}`
    }

    return `${startLabel}, ${startYear} - ${endLabel}, ${endYear}`
  }, [formatterCache, weekDates])

  const handlePreviewSubtask = (
    subtask: Subtask,
    assignment: Subtask['assignment'],
    date: Date,
    options?: { edit?: boolean }
  ) => {
    setShouldAutoEditPreview(Boolean(options?.edit))
    setPreviewError(null)
    setIsSavingPreview(false)
    setPreviewSubtask({
      subtask,
      assignment,
      date
    })
  }

  const closePreview = () => {
    setPreviewSubtask(null)
    setIsPreviewEditing(false)
    setPreviewError(null)
    setShouldAutoEditPreview(false)
    setIsSavingPreview(false)
  }

  const parsedPreviewMinutes = useMemo(() => {
    const value = Number(previewDraftMinutes)
    return Number.isFinite(value) && value >= 0 ? value : null
  }, [previewDraftMinutes])

  const handlePreviewSave = async () => {
    if (!previewSubtask || !onEditSubtask) {
      return
    }

    const trimmedLabel = previewDraftLabel.trim()
    if (!trimmedLabel) {
      setPreviewError('Label cannot be empty.')
      return
    }

    if (parsedPreviewMinutes === null) {
      setPreviewError('Minutes must be a non-negative number.')
      return
    }

    const updates: { label?: string; description?: string | null; minutes?: number } = {}

    if (trimmedLabel !== previewSubtask.subtask.label) {
      updates.label = trimmedLabel
    }

    const normalizedDescription = previewDraftDescription.trim()
    const nextDescription =
      normalizedDescription.length > 0 ? normalizedDescription : null
    if (normalizedDescription !== (previewSubtask.subtask.description ?? '')) {
      updates.description = nextDescription
    }

    if (parsedPreviewMinutes !== previewSubtask.subtask.minutes) {
      updates.minutes = parsedPreviewMinutes
    }

    if (Object.keys(updates).length === 0) {
      setIsPreviewEditing(false)
      return
    }

    setIsSavingPreview(true)
    setPreviewError(null)

    try {
      await onEditSubtask(previewSubtask.subtask.id, updates)
      setPreviewSubtask((current) =>
        current
          ? {
              ...current,
              subtask: {
                ...current.subtask,
                label: trimmedLabel,
                minutes: parsedPreviewMinutes ?? current.subtask.minutes,
                description:
                  updates.description !== undefined
                    ? updates.description
                    : current.subtask.description
              }
            }
          : current
      )
      setPreviewDraftLabel(trimmedLabel)
      setPreviewDraftMinutes(
        (parsedPreviewMinutes ?? previewSubtask.subtask.minutes).toString()
      )
      setPreviewDraftDescription(nextDescription ?? '')
      setIsPreviewEditing(false)
    } catch (error) {
      console.error('Failed to update subtask:', error)
      setPreviewError('Failed to save changes. Please try again.')
    } finally {
      setIsSavingPreview(false)
    }
  }

  const handlePreviewCancel = () => {
    if (!previewSubtask) {
      return
    }

    setPreviewDraftLabel(previewSubtask.subtask.label)
    setPreviewDraftMinutes(previewSubtask.subtask.minutes.toString())
    setPreviewDraftDescription(previewSubtask.subtask.description ?? '')
    setPreviewError(null)
    setIsPreviewEditing(false)
  }

  const navigationButtonClasses =
    'rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Week View</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className={navigationButtonClasses}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className={navigationButtonClasses}
            disabled={weekOffset === 0}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className={navigationButtonClasses}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-gray-600">{weekRangeLabel}</div>
      
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dateKey = formatDate(date)
          const daySubtasks = subtasks[dateKey] || []
          const totalMinutes = getTotalMinutes(date)
          const isDragOver = dragOverDate === dateKey
          
          return (
            <div
              key={dateKey}
              className={`
                min-h-32 p-3 border-2 border-dashed rounded-lg
                ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
                ${daySubtasks.length > 0 ? 'border-solid border-gray-300' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
            >
              <div className="mb-2">
                {formatDayHeader(date)}
                {totalMinutes > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatMinutes(totalMinutes)}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {daySubtasks.map((subtask) => (
                  <SubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    assignment={subtask.assignment}
                    onToggle={onToggleSubtask}
                    onMove={onMoveSubtask}
                    onEdit={onEditSubtask}
                    isDraggable={true}
                    showDescription={false}
                    onPreview={({ subtask: preview, assignment }, options) =>
                      handlePreviewSubtask(preview, assignment, date, options)
                    }
                    onDragStart={(event) => handleDragStart(event, subtask.id)}
                    onDragEnd={() => setDraggedSubtask(null)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {previewSubtask && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {isPreviewEditing ? (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="preview-label">
                        Label
                      </label>
                      <input
                        id="preview-label"
                        type="text"
                        value={previewDraftLabel}
                        onChange={(event) => setPreviewDraftLabel(event.target.value)}
                        disabled={isSavingPreview}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="preview-minutes">
                        Minutes
                      </label>
                      <input
                        id="preview-minutes"
                        type="number"
                        min={0}
                        value={previewDraftMinutes}
                        onChange={(event) => setPreviewDraftMinutes(event.target.value)}
                        disabled={isSavingPreview}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="preview-description">
                      Description (optional)
                    </label>
                    <textarea
                      id="preview-description"
                      rows={4}
                      value={previewDraftDescription}
                      onChange={(event) => setPreviewDraftDescription(event.target.value)}
                      disabled={isSavingPreview}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {previewError && <p className="text-xs text-red-600">{previewError}</p>}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePreviewSave}
                      disabled={isSavingPreview}
                      className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingPreview ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewCancel}
                      disabled={isSavingPreview}
                      className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 pt-2">
                    <div>
                      <span className="font-medium text-gray-700">Assignment:</span>{' '}
                      {previewSubtask.assignment.title}
                    </div>
                    <div>{previewSubtask.assignment.courseName}</div>
                    {previewSubtask.assignment.dueAt && (
                      <div>
                        Due:{' '}
                        {new Date(previewSubtask.assignment.dueAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900">
                      {previewSubtask.subtask.label}
                    </h4>
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                      {formatMinutes(previewSubtask.subtask.minutes)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    {formatterCache.weekday.format(previewSubtask.date)}, {formatterCache.range.format(previewSubtask.date)}
                  </p>

                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="font-medium">{previewSubtask.assignment.title}</div>
                    <div className="text-gray-500">{previewSubtask.assignment.courseName}</div>
                    {previewSubtask.assignment.dueAt && (
                      <div className="text-gray-500">
                        Due:{' '}
                        {new Date(previewSubtask.assignment.dueAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md bg-white p-3 shadow-inner">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {previewSubtask.subtask.description?.trim() || 'No additional details provided.'}
                    </p>
                  </div>

                  {onEditSubtask && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewEditing(true)
                        setPreviewError(null)
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Edit Details
                    </button>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={closePreview}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
