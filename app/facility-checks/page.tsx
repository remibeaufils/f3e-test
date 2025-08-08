'use client'

import { useRouter } from 'next/navigation'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button, Card, CardContent } from '../components/ui'

export default function FacilityChecksPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <ThemeToggle />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Panel
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Main Facility Checks
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Perform system health checks and facility monitoring
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-6">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              System health check and facility monitoring tools are currently under development.
            </p>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
            >
              Back to Admin Tools
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}