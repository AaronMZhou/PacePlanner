'use client'

import { useState, useEffect } from 'react'
import { WorkWindows } from '@/lib/validators'

interface WorkWindowEditorProps {
  workWindows: WorkWindows
  onChange: (workWindows: WorkWindows) => void
}

const DAYS = [
  { key: '0', name: 'Sunday' },
  { key: '1', name: 'Monday' },
  { key: '2', name: 'Tuesday' },
  { key: '3', name: 'Wednesday' },
  { key: '4', name: 'Thursday' },
  { key: '5', name: 'Friday' },
  { key: '6', name: 'Saturday' },
]

export default function WorkWindowEditor({
  workWindows,
  onChange
}: WorkWindowEditorProps) {
  const [localWindows, setLocalWindows] = useState<WorkWindows>(workWindows)

  useEffect(() => {
    setLocalWindows(workWindows)
  }, [workWindows])

  const addTimeSlot = (dayKey: string) => {
    const newWindows = { ...localWindows }
    if (!newWindows[dayKey]) {
      newWindows[dayKey] = []
    }
    newWindows[dayKey].push(['09:00', '17:00'])
    setLocalWindows(newWindows)
    onChange(newWindows)
  }

  const removeTimeSlot = (dayKey: string, index: number) => {
    const newWindows = { ...localWindows }
    if (newWindows[dayKey]) {
      newWindows[dayKey].splice(index, 1)
      if (newWindows[dayKey].length === 0) {
        delete newWindows[dayKey]
      }
    }
    setLocalWindows(newWindows)
    onChange(newWindows)
  }

  const updateTimeSlot = (dayKey: string, index: number, field: 'start' | 'end', value: string) => {
    const newWindows = { ...localWindows }
    if (newWindows[dayKey] && newWindows[dayKey][index]) {
      newWindows[dayKey][index] = [
        field === 'start' ? value : newWindows[dayKey][index][0],
        field === 'end' ? value : newWindows[dayKey][index][1]
      ]
    }
    setLocalWindows(newWindows)
    onChange(newWindows)
  }

  const toggleDay = (dayKey: string) => {
    const newWindows = { ...localWindows }
    if (newWindows[dayKey] && newWindows[dayKey].length > 0) {
      delete newWindows[dayKey]
    } else {
      newWindows[dayKey] = [['09:00', '17:00']]
    }
    setLocalWindows(newWindows)
    onChange(newWindows)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Work Windows</h3>
      <p className="text-sm text-gray-600">
        Set your available work times for each day of the week. PacePlanner will schedule subtasks within these windows.
      </p>
      
      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayWindows = localWindows[day.key] || []
          const isEnabled = dayWindows.length > 0
          
          return (
            <div key={day.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleDay(day.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{day.name}</span>
                </label>
                
                {isEnabled && (
                  <button
                    onClick={() => addTimeSlot(day.key)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add time slot
                  </button>
                )}
              </div>
              
              {isEnabled && (
                <div className="space-y-2">
                  {dayWindows.map((window, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={window[0]}
                        onChange={(e) => updateTimeSlot(day.key, index, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={window[1]}
                        onChange={(e) => updateTimeSlot(day.key, index, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {dayWindows.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(day.key, index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
