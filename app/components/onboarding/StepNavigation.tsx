import React from 'react'
import { OnboardingStep } from '../../types'
import { useOnboarding } from '../../context/OnboardingContext'
import { AdminSidebar } from '../shared/AdminSidebar'

interface StepNavigationProps {
    steps: OnboardingStep[]
    currentStep: string
    onStepClick: (stepId: string) => void
}

export function StepNavigation({ steps, currentStep, onStepClick }: StepNavigationProps) {
    const { isStepCompleted } = useOnboarding()

    return (
        <AdminSidebar title="Onboarding Steps">
            <nav className="space-y-4">
                {steps.map((step) => {
                    const isCompleted = isStepCompleted(step.id)
                    const isCurrent = currentStep === step.id
                    const isClickable = isCompleted || isCurrent

                    return (
                        <div
                            key={step.id}
                            onClick={() => isClickable && onStepClick(step.id)}
                            className={`flex items-center p-4 rounded-lg transition-colors ${isCurrent
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                                : isCompleted
                                    ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30'
                                    : 'bg-gray-50 dark:bg-gray-800'
                                } ${!isClickable ? 'opacity-50' : ''}`}
                        >
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full mr-4 ${isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : isCompleted
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                {isCompleted && !isCurrent ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="text-sm font-semibold">{step.number}</span>
                                )}
                            </div>
                            <span
                                className={`text-sm font-medium ${isCurrent
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isCompleted
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </nav>
        </AdminSidebar>
    )
} 