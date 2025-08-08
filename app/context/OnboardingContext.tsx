'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface OnboardingData {
    dealVariables: string
    dealName: string
    dealUUID: string
    lenderAccount: string
    lenderAccountId: string
    borrowerAccount: string
    borrowerAccountId: string
    createdLenderId: string
    createdBorrowerId: string
    completedSteps: string[]
}

interface AuthData {
    access_token: string | null
    token_type: string
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
}

interface OnboardingContextType {
    data: OnboardingData
    auth: AuthData
    toasts: Toast[]
    updateField: (field: keyof Omit<OnboardingData, 'completedSteps'>, value: string) => void
    markStepComplete: (stepId: string) => void
    resetData: () => void
    isStepCompleted: (stepId: string) => boolean
    authenticate: () => Promise<boolean>
    logout: () => void
    addToast: (message: string, type: Toast['type']) => void
    removeToast: (id: string) => void
}

const initialData: OnboardingData = {
    dealVariables: '',
    dealName: '',
    dealUUID: '',
    lenderAccount: '',
    lenderAccountId: '',
    borrowerAccount: '',
    borrowerAccountId: '',
    createdLenderId: '',
    createdBorrowerId: '',
    completedSteps: []
}

const initialAuth: AuthData = {
    access_token: null,
    token_type: 'bearer',
    isAuthenticated: false,
    isLoading: false,
    error: null
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<OnboardingData>(initialData)
    const [auth, setAuth] = useState<AuthData>(initialAuth)
    const [toasts, setToasts] = useState<Toast[]>([])

    const updateField = (field: keyof Omit<OnboardingData, 'completedSteps'>, value: string) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const markStepComplete = (stepId: string) => {
        setData(prev => ({
            ...prev,
            completedSteps: prev.completedSteps.includes(stepId)
                ? prev.completedSteps
                : [...prev.completedSteps, stepId]
        }))
    }

    const resetData = () => {
        setData(initialData)
    }

    const isStepCompleted = (stepId: string) => {
        return data.completedSteps.includes(stepId)
    }

    const addToast = (message: string, type: Toast['type']) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type }])

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id)
        }, 5000)
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const authenticate = async (): Promise<boolean> => {
        setAuth(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Authentication failed')
            }

            const authData = await response.json()
            setAuth({
                access_token: authData.access_token,
                token_type: authData.token_type,
                isAuthenticated: true,
                isLoading: false,
                error: null
            })

            addToast('Authentication successful! Token retrieved.', 'success')
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
            setAuth({
                ...initialAuth,
                isLoading: false,
                error: errorMessage
            })
            addToast(`Authentication failed: ${errorMessage}`, 'error')
            return false
        }
    }

    const logout = () => {
        setAuth(initialAuth)
        resetData()
        addToast('Logged out successfully', 'info')
    }

    return (
        <OnboardingContext.Provider value={{
            data,
            auth,
            toasts,
            updateField,
            markStepComplete,
            resetData,
            isStepCompleted,
            authenticate,
            logout,
            addToast,
            removeToast
        }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
} 