'use client'

import { useOnboarding } from '../context/OnboardingContext'
import { useEffect, useState } from 'react'

interface AnimatedToast {
    id: string
    visible: boolean
}

export function ToastContainer() {
    const { toasts, removeToast } = useOnboarding()
    const [animatedToasts, setAnimatedToasts] = useState<AnimatedToast[]>([])

    useEffect(() => {
        // Update animated toasts based on current toasts
        setAnimatedToasts(prev => {
            const newAnimatedToasts: AnimatedToast[] = []

            // Keep existing toasts that are still in the list
            toasts.forEach(toast => {
                const existing = prev.find(at => at.id === toast.id)
                if (existing) {
                    newAnimatedToasts.push(existing)
                } else {
                    // New toast, initially not visible
                    newAnimatedToasts.push({ id: toast.id, visible: false })
                }
            })

            return newAnimatedToasts
        })

        // Make new toasts visible after a short delay
        const timeouts: NodeJS.Timeout[] = []
        toasts.forEach(toast => {
            const animatedToast = animatedToasts.find(at => at.id === toast.id)
            if (animatedToast && !animatedToast.visible) {
                const timeout = setTimeout(() => {
                    setAnimatedToasts(prev =>
                        prev.map(at => at.id === toast.id ? { ...at, visible: true } : at)
                    )
                }, 10)
                timeouts.push(timeout)
            }
        })

        return () => {
            timeouts.forEach(clearTimeout)
        }
    }, [toasts])

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            {toasts.map((toast) => {
                const animatedToast = animatedToasts.find(at => at.id === toast.id)
                const isVisible = animatedToast?.visible ?? false

                return (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white
              transform transition-all duration-300 ease-in-out pointer-events-auto
              ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
              ${toast.type === 'success' ? 'bg-green-600' : ''}
              ${toast.type === 'error' ? 'bg-red-600' : ''}
              ${toast.type === 'info' ? 'bg-blue-600' : ''}
            `}
                    >
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {toast.type === 'error' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {toast.type === 'info' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        {/* Message */}
                        <p className="flex-1 text-sm font-medium pr-2">{toast.message}</p>

                        {/* Close button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 ml-2 hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded"
                            aria-label="Close notification"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )
            })}
        </div>
    )
} 