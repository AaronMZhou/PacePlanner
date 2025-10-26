import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        </div>

        <div className="relative max-w-7xl mx-auto py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-50 border border-brand-200 mb-8">
              <svg className="w-4 h-4 text-brand-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-brand-700">Trusted by 2,000+ students</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
              Plan smarter, not harder with{' '}
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                AI-powered
              </span>{' '}
              scheduling
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Connect your Canvas account and let PacePlanner break down assignments into manageable daily tasks—automatically.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/connect"
                className="group relative px-8 py-4 bg-gradient-brand text-white font-semibold rounded-xl shadow-brand hover:shadow-large hover:scale-105 active:scale-100 transition-all duration-200 inline-flex items-center text-lg"
              >
                Connect Canvas Account
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl shadow-soft hover:shadow-medium border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 text-lg">
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>Privacy-first</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to stay on track
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              PacePlanner combines AI intelligence with intuitive planning tools to help you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="group relative bg-gradient-card rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 border border-slate-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-brand rounded-xl flex items-center justify-center mb-6 shadow-brand">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  AI-Powered Estimates
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Advanced AI analyzes your assignments and provides realistic time estimates based on complexity and requirements.
                </p>
                <Link href="/connect" className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium group/link">
                  Get started
                  <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Feature Card 2 - Smart Task Breakdown */}
              <div className="group relative bg-gradient-card rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 border border-slate-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  {/* FIXED: Changed from gradient to solid color */}
                  <div className="w-14 h-14 bg-success-500 rounded-xl flex items-center justify-center mb-6 shadow-medium">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Smart Task Breakdown
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Large projects automatically split into daily subtasks that fit your schedule and learning style.
                  </p>
                  <Link href="/connect" className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium group/link">
                    Learn more
                    <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Feature Card 3 - Drag & Drop Scheduling */}
              <div className="group relative bg-gradient-card rounded-2xl p-8 shadow-soft hover:shadow-large transition-all duration-300 border border-slate-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative">
                  {/* FIXED: Changed from gradient to solid color */}
                  <div className="w-14 h-14 bg-warning-500 rounded-xl flex items-center justify-center mb-6 shadow-medium">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    Drag & Drop Scheduling
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Intuitive weekly view lets you reschedule tasks with a simple drag. Fall behind? Auto-catch-up adjusts your plan.
                  </p>
                  <Link href="/connect" className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium group/link">
                    Try it now
                    <svg className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Get started in three simple steps
            </h2>
            <p className="text-xl text-slate-600">
              From Canvas connection to organized schedule in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines (desktop only) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200" style={{ top: '48px' }} />

            {/* Step 1 - Connect Canvas */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-600 rounded-2xl shadow-brand mb-6 relative z-10">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Connect Canvas
              </h3>
              <p className="text-slate-600">
                Securely link your Canvas account using a personal access token—takes less than a minute.
              </p>
            </div>

            {/* Step 2 - AI Plans Your Work */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-success-500 rounded-2xl shadow-medium mb-6 relative z-10">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                AI Plans Your Work
              </h3>
              <p className="text-slate-600">
                Our AI analyzes your assignments, estimates durations, and creates a personalized study plan.
              </p>
            </div>

            {/* Step 3 - Stay On Track */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-warning-500 rounded-2xl shadow-medium mb-6 relative z-10">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Stay On Track
              </h3>
              <p className="text-slate-600">
                Follow your daily tasks, adjust as needed, and never miss a deadline again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to take control of your schedule?
          </h2>
          <p className="text-xl text-brand-100 mb-10 leading-relaxed">
            Join thousands of students who have transformed their study habits with PacePlanner.
          </p>
          
          <Link
            href="/connect"
            className="inline-flex items-center justify-center px-10 py-4 bg-white text-brand-600 font-semibold rounded-xl shadow-large hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 text-lg group"
          >
            Start Planning Now
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <p className="mt-8 text-brand-100 text-sm">
            Free for students • No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>
    </>
  )
}