'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConnectFormProps {
  onSubmit: (baseUrl: string, token: string) => Promise<void>
}

export default function ConnectForm({ onSubmit }: ConnectFormProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await onSubmit(baseUrl, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect to Canvas</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Canvas Base URL
          </label>
          <input
            type="url"
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-school.instructure.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Access Token
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your Canvas token"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showHelp ? 'Hide' : 'How to get a token'} →
        </button>

        {showHelp && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
            <h3 className="font-semibold mb-2">How to get a Canvas Personal Access Token:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Log into your Canvas account</li>
              <li>Go to Account → Settings</li>
              <li>Scroll down to "Approved Integrations"</li>
              <li>Click "+ New Access Token"</li>
              <li>Give it a name like "PacePlanner"</li>
              <li>Set expiration date (optional)</li>
              <li>Click "Generate Token"</li>
              <li>Copy the token immediately (you won't see it again)</li>
            </ol>
            <p className="mt-2 text-xs text-gray-600">
              <strong>Note:</strong> Keep your token secure and don't share it with anyone.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
