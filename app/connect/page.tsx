'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConnectForm from '@/components/ConnectForm'

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  const handleConnect = async (baseUrl: string, token: string) => {
    setIsConnecting(true)
    
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ baseUrl, token }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect')
      }
      
      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (error) {
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Connect to Canvas
        </h1>
        <p className="text-gray-600">
          Enter your Canvas instance URL and personal access token to get started.
        </p>
      </div>
      
      <ConnectForm onSubmit={handleConnect} />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Your token is encrypted and stored securely. We never see your actual Canvas credentials.
        </p>
      </div>
    </div>
  )
}
