'use client'

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type DragEvent as ReactDragEvent
} from 'react'

type SubtaskData = {
  id: string
  label: string
  description?: string | null
  minutes: number
  completed: boolean
  order: number
}

type AssignmentData = {
  id: string
  title: string
  courseName: string
  dueAt: string | null
  pointsPossible: number | null
  status: string
}

type SubtaskUpdate = {
  label?: string
  description?: string | null
  minutes?: number
}

interface SubtaskItemProps {
  subtask: SubtaskData
  assignment: AssignmentData
  onToggle: (subtaskId: string, completed: boolean) => Promise<void>
  onMove?: (subtaskId: string, newDate: Date) => Promise<void>
  onEdit?: (subtaskId: string, updates: SubtaskUpdate) => Promise<void>
  isDraggable?: boolean
  showDescription?: boolean
  onPreview?: (
    details: { subtask: SubtaskData; assignment: AssignmentData },
    options?: { edit?: boolean }
  ) => void
  onDragStart?: (event: ReactDragEvent<HTMLDivElement>) => void
  onDragEnd?: (event: ReactDragEvent<HTMLDivElement>) => void
}

export default function SubtaskItem({
  subtask,
  assignment,
  onToggle,
  onMove,
  onEdit,
  isDraggable = false,
  showDescription = true,
  onPreview,
  onDragStart,
  onDragEnd
}: SubtaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(subtask.label)
  const [draftMinutes, setDraftMinutes] = useState(subtask.minutes.toString())
  const [draftDescription, setDraftDescription] = useState(subtask.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(subtask.label)
      setDraftMinutes(subtask.minutes.toString())
      setDraftDescription(subtask.description ?? '')
      setError(null)
    }
  }, [isEditing, subtask.label, subtask.minutes, subtask.description])

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      await onToggle(subtask.id, !subtask.completed)
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const parsedMinutes = useMemo(() => {
    const value = Number(draftMinutes)
    return Number.isFinite(value) && value >= 0 ? value : null
  }, [draftMinutes])

  const handleSaveEdit = async () => {
    if (!onEdit) {
      return
    }

    const trimmedLabel = draftLabel.trim()
    if (!trimmedLabel) {
      setError('Label cannot be empty.')
      return
    }

    if (parsedMinutes === null) {
      setError('Minutes must be a non-negative number.')
      return
    }

    const updates: SubtaskUpdate = {}
    if (trimmedLabel !== subtask.label) {
      updates.label = trimmedLabel
    }
    if ((draftDescription || '') !== (subtask.description || '')) {
      updates.description = draftDescription ? draftDescription.trim() : null
    }
    if (parsedMinutes !== subtask.minutes) {
      updates.minutes = parsedMinutes
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await onEdit(subtask.id, updates)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update subtask:', error)
      setError('Failed to save changes. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setDraftLabel(subtask.label)
    setDraftMinutes(subtask.minutes.toString())
    setDraftDescription(subtask.description ?? '')
    setError(null)
  }

  const handleSaveButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    void handleSaveEdit()
  }

  const handleCancelButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    handleCancelEdit()
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const handleRootClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!onPreview || isEditing || isDragging) {
      return
    }

    // Ignore clicks from nested interactive elements
    if (
      (event.target as HTMLElement).closest('button, input, textarea, select, a')
    ) {
      return
    }

    onPreview({ subtask, assignment })
  }

  const interactiveClass =
    isDraggable && !isEditing
      ? 'cursor-move hover:shadow-md transition-shadow'
      : onPreview && !isEditing
      ? 'cursor-pointer hover:shadow-md transition-shadow'
      : ''

  return (
    <div
      className={`
        flex flex-col gap-3 p-3 bg-white rounded-lg border border-gray-200
        ${interactiveClass}
        ${subtask.completed ? 'opacity-60' : ''}
        ${isEditing ? 'border-blue-300 ring-1 ring-blue-200' : ''}
      `}
      onClick={handleRootClick}
      draggable={isDraggable && !isEditing}
      onDragStart={(event) => {
        if (!isDraggable || isEditing) {
          return
        }
        setIsDragging(true)
        onDragStart?.(event)
      }}
      onDragEnd={(event) => {
        setIsDragging(false)
        onDragEnd?.(event)
      }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={handleToggle}
          onClick={(event) => event.stopPropagation()}
          disabled={isUpdating || isEditing}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />

        <div className="flex-1 min-w-0 space-y-2">
          {!isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {subtask.label}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {formatTime(subtask.minutes)}
                </span>
              </div>
              {showDescription && subtask.description && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {subtask.description}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={`subtask-label-${subtask.id}`}>
                  Label
                </label>
                <input
                  id={`subtask-label-${subtask.id}`}
                  type="text"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdating}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={`subtask-minutes-${subtask.id}`}>
                    Minutes
                  </label>
                  <input
                    id={`subtask-minutes-${subtask.id}`}
                    type="number"
                    min={0}
                    value={draftMinutes}
                    onChange={(e) => setDraftMinutes(e.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={`subtask-description-${subtask.id}`}>
                  Description (optional)
                </label>
                <textarea
                  id={`subtask-description-${subtask.id}`}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={isUpdating}
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveButtonClick}
                  disabled={isUpdating}
                  className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelButtonClick}
                  disabled={isUpdating}
                  className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <span className="font-medium">{assignment.title}</span>
            <span className="mx-1">•</span>
            <span>{assignment.courseName}</span>
          </div>
        </div>

        {onEdit && !isEditing && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()

              if (!showDescription && onPreview) {
                onPreview({ subtask, assignment }, { edit: true })
                return
              }

              setIsEditing(true)
            }}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Edit subtask"
            disabled={isUpdating}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l9.932-9.931z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
            </svg>
          </button>
        )}

        {isDraggable && !isEditing && (
          <div className="text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
