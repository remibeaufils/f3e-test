import React from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '../ThemeToggle'
import { useOnboarding } from '../../context/OnboardingContext'
import { Button } from '../ui'
import { SCCallHelper } from './SCCallHelper'
import { Deal, DealDetails, WaterfallConfigResponse, ParsedFunction } from '../../types/contracts'

interface AdminSidebarProps {
  title: string
  children?: React.ReactNode
  helperData?: {
    selectedDeal: Deal | null
    selectedDealDetails: DealDetails | null
    waterfallConfig: WaterfallConfigResponse | null
    selectedContractDetails: {
      address: string
      type: string
      source: string
      id: string
    } | null
    selectedFunction: ParsedFunction | null
    onValueClick: (value: string, label: string) => void
  }
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminSidebar({ title, children, helperData, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter()
  const { auth, authenticate, logout } = useOnboarding()

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-10 transition-all duration-300 ${
      isCollapsed ? 'w-16 p-4' : 'w-80 p-8'
    }`}>
      {/* Collapse Toggle Button */}
      <div className="mb-6 flex items-center justify-between">
        {!isCollapsed && (
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1 flex items-center justify-center gap-2 mr-2"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Panel
          </Button>
        )}
        
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isCollapsed ? 'w-full' : 'flex-shrink-0'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        )}
        
        {isCollapsed && (
          <div className="mb-4">
            <button
              onClick={() => router.push('/')}
              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Back to Admin Panel"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <ThemeToggle className="" />
        </div>
      )}

      {isCollapsed && (
        <div className="mb-8 flex justify-center">
          <ThemeToggle className="" />
        </div>
      )}

      {/* Auth Status */}
      <div className={`mb-8 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between'} p-3 rounded-lg transition-all duration-300 ${!auth.isAuthenticated
        ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 shadow-lg'
        : 'bg-gray-50 dark:bg-gray-700'
        }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${auth.isAuthenticated ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                }`} />
              <span className={`text-sm font-medium ${!auth.isAuthenticated
                ? 'text-red-800 dark:text-red-200'
                : 'text-gray-700 dark:text-gray-300'
                }`}>
                API Auth status
              </span>
            </div>
            <button
              onClick={auth.isAuthenticated ? logout : authenticate}
              className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${!auth.isAuthenticated
                ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 ring-2 ring-red-300 dark:ring-red-700'
                : ''
                }`}
              disabled={auth.isLoading}
              aria-label={auth.isAuthenticated ? 'Logout' : 'Authenticate'}
            >
              {auth.isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              ) : auth.isAuthenticated ? (
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <>
            <div className={`w-3 h-3 rounded-full ${auth.isAuthenticated ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              }`} />
            <button
              onClick={auth.isAuthenticated ? logout : authenticate}
              className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${!auth.isAuthenticated
                ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 ring-2 ring-red-300 dark:ring-red-700'
                : ''
                }`}
              disabled={auth.isLoading}
              title={auth.isAuthenticated ? 'Logout' : 'Authenticate'}
            >
              {auth.isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              ) : auth.isAuthenticated ? (
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Helper Data Section */}
      {helperData && !isCollapsed && (
        <div className="mb-8">
          <SCCallHelper
            selectedDeal={helperData.selectedDeal}
            selectedDealDetails={helperData.selectedDealDetails}
            waterfallConfig={helperData.waterfallConfig}
            selectedContractDetails={helperData.selectedContractDetails}
            selectedFunction={helperData.selectedFunction}
            onValueClick={helperData.onValueClick}
          />
        </div>
      )}

      {/* Additional Content */}
      {children && !isCollapsed && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}