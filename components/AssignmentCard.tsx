'use client'

import { useState } from 'react'
import { AssignmentStrategy } from '@/lib/validators'

interface Assignment {
  id: string
  title: string
  courseName: string
  dueAt: string | null
  pointsPossible: number | null
  htmlUrl: string
  estimatedMinutes: number | null
  strategy: string
  status: string
  subtasks: Array<{
    id: string
    label: string
    description?: string | null
    minutes: number
    completed: boolean
  }>
}

interface AssignmentCardProps {
  assignment: Assignment
  onUpdateEstimate: (assignmentId: string, minutes: number) => Promise<void>
  onUpdateStrategy: (assignmentId: string, strategy: AssignmentStrategy) => Promise<void>
  onAIEstimate: (assignmentId: string) => Promise<void>
}

export default function AssignmentCard({
  assignment,
  onUpdateEstimate,
  onUpdateStrategy,
  onAIEstimate
}: AssignmentCardProps) {
  const [estimatedMinutes, setEstimatedMinutes] = useState(assignment.estimatedMinutes || 0)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEstimateChange = async (minutes: number) => {
    setEstimatedMinutes(minutes)
    setIsUpdating(true)
    try {
      await onUpdateEstimate(assignment.id, minutes)
    } catch (error) {
      console.error('Failed to update estimate:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStrategyChange = async (strategy: AssignmentStrategy) => {
    setIsUpdating(true)
    try {
      await onUpdateStrategy(assignment.id, strategy)
    } catch (error) {
      console.error('Failed to update strategy:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAIEstimate = async () => {
    setIsUpdating(true)
    try {
      await onAIEstimate(assignment.id)
    } catch (error) {
      console.error('Failed to get AI estimate:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return 'No due date'
    const date = new Date(dueAt)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const completedSubtasks = assignment.subtasks.filter(st => st.completed).length
  const totalSubtasks = assignment.subtasks.length
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {assignment.courseName}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Due: {formatDueDate(assignment.dueAt)}</span>
            {assignment.pointsPossible && (
              <span>{assignment.pointsPossible} points</span>
            )}
          </div>
        </div>
        <a
          href={assignment.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Open in Canvas →
        </a>
      </div>

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Time estimation controls */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label htmlFor={`estimate-${assignment.id}`} className="text-sm font-medium text-gray-700">
            Estimated time (minutes):
          </label>
          <input
            type="number"
            id={`estimate-${assignment.id}`}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
            onBlur={() => handleEstimateChange(estimatedMinutes)}
            min="0"
            max="1440"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUpdating}
          />
          <button
            onClick={handleAIEstimate}
            disabled={isUpdating}
            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
          >
            AI Estimate
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <label htmlFor={`strategy-${assignment.id}`} className="text-sm font-medium text-gray-700">
            Strategy:
          </label>
          <select
            id={`strategy-${assignment.id}`}
            value={assignment.strategy}
            onChange={(e) => handleStrategyChange(e.target.value as AssignmentStrategy)}
            disabled={isUpdating}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="even">Even distribution</option>
            <option value="frontload">Frontload (more early)</option>
            <option value="backload">Backload (more late)</option>
          </select>
        </div>
      </div>

      {/* Subtasks preview */}
      {assignment.subtasks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subtasks:</h4>
          <div className="space-y-1">
            {assignment.subtasks.slice(0, 3).map((subtask) => (
              <div key={subtask.id} className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    readOnly
                    className="rounded"
                  />
                  <span className={subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                    {subtask.label} ({subtask.minutes} min)
                  </span>
                </div>
                {subtask.description && (
                  <p className="pl-6 text-xs text-gray-500">{subtask.description}</p>
                )}
              </div>
            ))}
            {assignment.subtasks.length > 3 && (
              <div className="text-xs text-gray-500">
                +{assignment.subtasks.length - 3} more subtasks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
