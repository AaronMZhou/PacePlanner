'use client'

import { useState } from 'react'

interface TimeEstimateControlProps {
  value: number
  onChange: (minutes: number) => void
  onAIEstimate: () => void
  disabled?: boolean
  label?: string
}

export default function TimeEstimateControl({
  value,
  onChange,
  onAIEstimate,
  disabled = false,
  label = 'Estimated time (minutes)'
}: TimeEstimateControlProps) {
  const [isAIEstimating, setIsAIEstimating] = useState(false)

  const handleAIEstimate = async () => {
    setIsAIEstimating(true)
    try {
      await onAIEstimate()
    } catch (error) {
      console.error('AI estimate failed:', error)
    } finally {
      setIsAIEstimating(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center space-x-3">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min="0"
          max="1440"
          disabled={disabled}
          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <span className="text-sm text-gray-500">
          {formatTime(value)}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAIEstimate}
          disabled={disabled || isAIEstimating}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAIEstimating ? 'Estimating...' : 'AI Estimate'}
        </button>
        
        <span className="text-xs text-gray-500">
          Let AI suggest time based on assignment details
        </span>
      </div>
    </div>
  )
}
