'use client'

import { useState, useEffect } from 'react'
import WorkWindowEditor from '@/components/WorkWindowEditor'
import { WorkWindows } from '@/lib/validators'

interface UserSettings {
  workWindowsJson: string
  dailyMaxMinutes: number
  timezone: string
  useAIEstimates: boolean
  aiAggressiveness: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    workWindowsJson: JSON.stringify({
      "1": [["19:00", "22:00"]],
      "2": [["19:00", "22:00"]],
      "3": [["19:00", "22:00"]],
      "4": [["19:00", "22:00"]],
      "5": [["19:00", "22:00"]],
      "6": [["10:00", "16:00"]],
      "0": [["10:00", "16:00"]],
    }),
    dailyMaxMinutes: 180,
    timezone: 'America/New_York',
    useAIEstimates: false,
    aiAggressiveness: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleWorkWindowsChange = (workWindows: WorkWindows) => {
    setSettings(prev => ({
      ...prev,
      workWindowsJson: JSON.stringify(workWindows)
    }))
  }

  const workWindows: WorkWindows = JSON.parse(settings.workWindowsJson)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <div className="card">
        <WorkWindowEditor
          workWindows={workWindows}
          onChange={handleWorkWindowsChange}
        />
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="dailyMax" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Maximum Minutes
            </label>
            <input
              type="number"
              id="dailyMax"
              value={settings.dailyMaxMinutes}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                dailyMaxMinutes: parseInt(e.target.value) || 180
              }))}
              min="1"
              max="1440"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum minutes to schedule per day (1-1440)
            </p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                timezone: e.target.value
              }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="useAI"
              checked={settings.useAIEstimates}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                useAIEstimates: e.target.checked
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="useAI" className="text-sm font-medium text-gray-700">
              Enable AI time estimation
            </label>
          </div>

          {settings.useAIEstimates && (
            <div>
              <label htmlFor="aiAggressiveness" className="block text-sm font-medium text-gray-700 mb-1">
                AI Aggressiveness: {settings.aiAggressiveness}
              </label>
              <input
                type="range"
                id="aiAggressiveness"
                min="-2"
                max="2"
                value={settings.aiAggressiveness}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  aiAggressiveness: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative (-2)</span>
                <span>Balanced (0)</span>
                <span>Aggressive (+2)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
