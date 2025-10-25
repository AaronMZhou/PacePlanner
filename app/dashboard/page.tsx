'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AssignmentCard from '@/components/AssignmentCard'
import WeekGrid from '@/components/WeekGrid'
import SubtaskItem from '@/components/SubtaskItem'
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
    order: number
  }>
}

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

type SubtaskUpdate = {
  label?: string
  description?: string | null
  minutes?: number
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [todaySubtasks, setTodaySubtasks] = useState<Subtask[]>([])
  const [weekSubtasks, setWeekSubtasks] = useState<Record<string, Subtask[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRecomputing, setIsRecomputing] = useState(false)
  const [showOverdueAssignments, setShowOverdueAssignments] = useState(false)
  const [showUndatedAssignments, setShowUndatedAssignments] = useState(false)
  const router = useRouter()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const datedAssignments: Assignment[] = []
  const overdueAssignments: Assignment[] = []
  const upcomingAssignments: Assignment[] = []
  const undatedAssignments: Assignment[] = []

  assignments.forEach((assignment) => {
    if (assignment.dueAt) {
      datedAssignments.push(assignment)
      const dueDate = new Date(assignment.dueAt)
      if (dueDate < today) {
        overdueAssignments.push(assignment)
      } else {
        upcomingAssignments.push(assignment)
      }
    } else {
      undatedAssignments.push(assignment)
    }
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load assignments
      const assignmentsResponse = await fetch('/api/assignments')
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData.data || [])
      }
      
      // Load upcoming subtasks
      const upcomingResponse = await fetch('/api/canvas/upcoming?days=7')
      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json()
        setWeekSubtasks(upcomingData.data || {})
        
        // Get today's subtasks
        const today = new Date().toISOString().split('T')[0]
        setTodaySubtasks(upcomingData.data?.[today] || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/sync', { method: 'POST' })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }
      
      // Reload data after sync
      await loadDashboardData()
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Failed to sync assignments. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRecompute = async () => {
    try {
      setIsRecomputing(true)
      const response = await fetch('/api/plan/recompute', { method: 'POST' })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Recompute failed')
      }
      
      // Reload data after recompute
      await loadDashboardData()
    } catch (error) {
      console.error('Recompute failed:', error)
      alert('Failed to recompute plan. Please try again.')
    } finally {
      setIsRecomputing(false)
    }
  }

  const handleUpdateEstimate = async (assignmentId: string, minutes: number) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedMinutes: minutes })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update estimate')
      }
      
      // Reload assignments
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update estimate:', error)
    }
  }

  const handleUpdateStrategy = async (assignmentId: string, strategy: AssignmentStrategy) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update strategy')
      }
      
      // Reload assignments
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update strategy:', error)
    }
  }

  const handleAIEstimate = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/estimate`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to fetch AI estimate')
      }

      const data = await response.json()

      await loadDashboardData()

      if (typeof window !== 'undefined') {
        const minutes = data.minutes ?? 'unknown'
        const explanation = data.explanation
        const messageLines = [
          `AI estimate: ${minutes} minutes.`,
          explanation ? `Reasoning: ${explanation}` : null
        ].filter(Boolean)
        alert(messageLines.join('\n'))
      }
    } catch (error) {
      console.error('Failed to get AI estimate:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to get AI estimate. Please try again.'
      )
    }
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle subtask')
      }
      
      // Reload data
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleMoveSubtask = async (subtaskId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() })
      })
      
      if (!response.ok) {
        throw new Error('Failed to move subtask')
      }
      
      // Reload data
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to move subtask:', error)
    }
  }

  const handleUpdateSubtask = async (subtaskId: string, updates: SubtaskUpdate) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to update subtask')
      }

      await loadDashboardData()
    } catch (error) {
      console.error('Failed to update subtask:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to update this subtask. Please try again.'
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-secondary disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync Assignments'}
          </button>
          <button
            onClick={handleRecompute}
            disabled={isRecomputing}
            className="btn-primary disabled:opacity-50"
          >
            {isRecomputing ? 'Recomputing...' : 'Recompute Plan'}
          </button>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Tasks</h2>
        {todaySubtasks.length > 0 ? (
          <div className="space-y-3">
            {todaySubtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                assignment={subtask.assignment}
                onToggle={handleToggleSubtask}
                onEdit={handleUpdateSubtask}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tasks scheduled for today.</p>
        )}
      </div>

      {/* Week View */}
      <WeekGrid
        subtasks={weekSubtasks}
        onToggleSubtask={handleToggleSubtask}
        onMoveSubtask={handleMoveSubtask}
        onEditSubtask={handleUpdateSubtask}
        timezone="America/New_York" // TODO: Get from user settings
      />

      {/* Assignments */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h2>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No assignments found.</p>
            <button
              onClick={handleSync}
              className="btn-primary"
            >
              Sync Assignments
            </button>
          </div>
        ) : (
          <>
            {/* Overdue assignments */}
            {overdueAssignments.length > 0 && (
              <div className="mb-6 border border-red-200 rounded-lg p-4 bg-red-50">
                <button
                  type="button"
                  onClick={() => setShowOverdueAssignments(prev => !prev)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-red-700 hover:text-red-900 focus:outline-none"
                >
                  <span>
                    {`${showOverdueAssignments ? 'Hide' : 'Show'} ${overdueAssignments.length} overdue assignment${overdueAssignments.length === 1 ? '' : 's'}`}
                  </span>
                  <span className="ml-2 text-xs text-red-600">
                    {showOverdueAssignments ? 'Collapse' : 'Expand'}
                  </span>
                </button>

                {showOverdueAssignments && (
                  <div className="mt-4 grid gap-4">
                    {overdueAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onUpdateEstimate={handleUpdateEstimate}
                        onUpdateStrategy={handleUpdateStrategy}
                        onAIEstimate={handleAIEstimate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Due-date assignments */}
            {upcomingAssignments.length > 0 ? (
              <div className="grid gap-4">
                {upcomingAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onUpdateEstimate={handleUpdateEstimate}
                    onUpdateStrategy={handleUpdateStrategy}
                    onAIEstimate={handleAIEstimate}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No upcoming assignments with due dates yet.
              </p>
            )}

            {/* Undated assignments */}
            {undatedAssignments.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUndatedAssignments(prev => !prev)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <span>
                    {`${showUndatedAssignments ? 'Hide' : 'Show'} ${undatedAssignments.length} assignment${undatedAssignments.length === 1 ? '' : 's'} with no due date`}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {showUndatedAssignments ? 'Collapse' : 'Expand'}
                  </span>
                </button>

                {showUndatedAssignments && (
                  <div className="mt-4 grid gap-4">
                    {undatedAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onUpdateEstimate={handleUpdateEstimate}
                        onUpdateStrategy={handleUpdateStrategy}
                        onAIEstimate={handleAIEstimate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
