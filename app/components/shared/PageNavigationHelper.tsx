'use client'

import React, { useState, useEffect } from 'react'

interface NavigationSection {
  id: string
  title: string
  icon: React.ReactNode
  isVisible: boolean
  isActive?: boolean
}

interface PageNavigationHelperProps {
  sections: NavigationSection[]
}

export function PageNavigationHelper({ sections }: PageNavigationHelperProps) {
  const [activeSection, setActiveSection] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const yOffset = -80 // Offset for fixed headers
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'auto' })
      // Collapse the navigation menu immediately after selection
      setIsCollapsed(true)
    }
  }

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const visibleSections = sections.filter(section => section.isVisible)
      
      for (const section of visibleSections) {
        const element = document.getElementById(section.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Check if section is in the top half of the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const visibleSections = sections.filter(section => section.isVisible)

  if (visibleSections.length === 0) {
    return null
  }

  if (isCollapsed) {
    return (
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Show Page Navigation"
        >
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {/* Active indicator when collapsed */}
          {activeSection && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-64">
        {/* Collapse Button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Collapse Navigation"
          >
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full flex items-center space-x-3 p-2.5 rounded-lg text-left transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className={`flex-shrink-0 ${
                activeSection === section.id 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              }`}>
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  activeSection === section.id 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {section.title}
                </div>
              </div>
              {activeSection === section.id && (
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}