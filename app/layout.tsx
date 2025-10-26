import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PacePlanner - Canvas Assignment Planner',
  description: 'Plan your Canvas assignments with AI-powered time estimation and automatic task breakdown.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50">
          {/* Enhanced Navigation Bar */}
          <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-soft">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo Section */}
                <Link
                  href="/"
                  className="flex items-center space-x-3 group"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      role="img"
                      aria-label="PacePlanner icon"
                      className="h-10 w-10 transition-transform group-hover:scale-110 duration-300"
                    >
                      <defs>
                        <linearGradient id="ppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                      <rect
                        x="4"
                        y="4"
                        width="40"
                        height="40"
                        rx="10"
                        fill="none"
                        stroke="url(#ppGrad)"
                        strokeWidth="3"
                      />
                      <rect x="23" y="12" width="2" height="8" rx="1" fill="url(#ppGrad)" />
                      <path
                        d="M14 26 l8 8 l12 -12"
                        fill="none"
                        stroke="url(#ppGrad)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />
                    </svg>
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 bg-brand-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-full" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                    PacePlanner
                  </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-1">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all inline-flex items-center relative group"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-500 group-hover:w-3/4 transition-all duration-300" />
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all inline-flex items-center relative group"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-500 group-hover:w-3/4 transition-all duration-300" />
                  </Link>
                  <Link
                    href="/logout"
                    className="ml-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button 
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Brand Column */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="h-8 w-8"
                    >
                      <defs>
                        <linearGradient id="ppGradFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                      <rect
                        x="4"
                        y="4"
                        width="40"
                        height="40"
                        rx="10"
                        fill="none"
                        stroke="url(#ppGradFooter)"
                        strokeWidth="3"
                      />
                      <rect x="23" y="12" width="2" height="8" rx="1" fill="url(#ppGradFooter)" />
                      <path
                        d="M14 26 l8 8 l12 -12"
                        fill="none"
                        stroke="url(#ppGradFooter)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                      PacePlanner
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                    AI-powered assignment planning for Canvas LMS. Break down complex projects into manageable daily tasks automatically.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link href="/connect" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Get Started
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/settings" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Settings
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a href="#" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-slate-600 hover:text-brand-600 transition-colors">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500">
                  © {new Date().getFullYear()} PacePlanner. All rights reserved.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Made with</span>
                  <svg className="w-4 h-4 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-slate-500">for students</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
