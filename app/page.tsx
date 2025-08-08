'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from './context/OnboardingContext'
import { ThemeToggle } from './components/ThemeToggle'
import { Button, LoadingSpinner, Card, CardContent } from './components/ui'

export default function Home() {
  const router = useRouter()
  const { auth, authenticate } = useOnboarding()

  useEffect(() => {
    const handleAuth = async () => {
      // Try to authenticate automatically on page load if not already authenticated
      if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
        await authenticate()
      }
    }

    handleAuth()
  }, [auth.isAuthenticated, auth.isLoading, auth.error, authenticate])

  const adminOptions = [
    {
      id: 'db-onboarding',
      title: 'New DB Onboarding',
      description: 'Onboard new databases and set up account structures',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16m-1 4l-3 3m0-3l3 3" />
        </svg>
      ),
      route: '/onboarding',
      available: true
    },
    {
      id: 'sc-setup',
      title: 'Deploy New SC Setup',
      description: 'Deploy and configure new smart contract setups',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      route: '/sc-setup',
      available: true
    },
    {
      id: 'sc-call',
      title: 'Launch SC Call',
      description: 'Execute smart contract calls and transactions',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      route: '/sc-call',
      available: true
    },
    {
      id: 'facility-checks',
      title: 'Main Facility Checks',
      description: 'Perform system health checks and facility monitoring',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      route: '/facility-checks',
      available: false
    }
  ]

  const handleOptionClick = (option: typeof adminOptions[0]) => {
    if (!option.available) {
      // TODO: Show coming soon message
      return
    }
    
    router.push(option.route)
  }

  // Show loading state
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative py-12">
        <ThemeToggle />
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative py-12">
        <ThemeToggle />
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {auth.error}
            </p>
            <Button onClick={() => authenticate()}>
              Retry Authentication
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <ThemeToggle />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive administrative tools for database onboarding, smart contract deployment, and system management
          </p>
        </div>

        {/* Auth Status */}
        {!auth.isAuthenticated && (
          <div className="mb-8">
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      API authentication required to access admin tools
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => authenticate()}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-800"
                >
                  Authenticate
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminOptions.map((option) => (
            <Card 
              key={option.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                option.available 
                  ? 'hover:border-blue-300 dark:hover:border-blue-700' 
                  : 'opacity-60 cursor-not-allowed'
              } ${!auth.isAuthenticated && option.available ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${
                    option.available 
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {option.title}
                      </h3>
                      {!option.available && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an admin tool to get started. Additional features will be available soon.
          </p>
        </div>
      </div>
    </div>
  )
}
