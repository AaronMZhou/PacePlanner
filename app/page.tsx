import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to PacePlanner
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plan your Canvas assignments with AI-powered time estimation and automatic task breakdown.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Canvas</h3>
            <p className="text-gray-600 mb-4">
              Securely connect to your Canvas instance using a personal access token.
            </p>
            <Link href="/connect" className="btn-primary inline-block">
              Get Started
            </Link>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Planning</h3>
            <p className="text-gray-600 mb-4">
              AI estimates time requirements and breaks assignments into daily subtasks.
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay on Track</h3>
            <p className="text-gray-600 mb-4">
              Drag-and-drop scheduling and automatic catch-up when you fall behind.
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Ready to get started?</h2>
          <p className="text-blue-700 mb-4">
            Connect your Canvas account to begin planning your assignments.
          </p>
          <Link href="/connect" className="btn-primary">
            Connect Canvas Account
          </Link>
        </div>
      </div>
    </div>
  )
}
