'use client'

import React from 'react'
import { useOnboardingFlow } from '../hooks/useOnboardingFlow'
import { StepNavigation } from '../components/onboarding/StepNavigation'
import { AccountTable } from '../components/onboarding/AccountTable'
import { EntityCreation } from '../components/onboarding/EntityCreation'
import { DealVariablesStep } from '../components/onboarding/steps/DealVariablesStep'
import { BackendPRStep } from '../components/onboarding/steps/BackendPRStep'
import { Button, Card, CardContent } from '../components/ui'
import { useOnboarding } from '../context/OnboardingContext'

export default function OnboardingPage() {
    const {
        // State
        steps,
        currentStep,
        dealUUID,
        accounts,
        wallets,
        allCreatedLenders,
        createdBorrower,
        selectedLenderId,
        selectedBorrowerId,
        isLenderTableCollapsed,
        isBorrowerTableCollapsed,

        // Loading states
        loadingAccounts,
        loadingWallets,
        creatingDeal,

        // Computed
        isEditing,
        isRevisiting,
        isLastStep,

        // Actions
        handleStepClick,
        handleEdit,
        handleSubmit,
        handleAccountSelect,
        handleCreateAccount,
        handleCreateLender,
        handleCreateBorrower,
        handleLaunchPR,
        setIsLenderTableCollapsed,
        setIsBorrowerTableCollapsed,
    } = useOnboardingFlow()

    // Get auth state from context
    const { auth } = useOnboarding()

    const getStepContent = () => {
        switch (currentStep) {
            case 'deal-variables':
                return (
                    <DealVariablesStep
                        dealUUID={dealUUID}
                        isEditing={isEditing}
                        isRevisiting={isRevisiting}
                    />
                )

            case 'lender-account':
                return (
                    <AccountTable
                        role="LENDER"
                        accounts={accounts}
                        selectedId={selectedLenderId}
                        isCollapsed={isLenderTableCollapsed}
                        loading={loadingAccounts}
                        onAccountSelect={(id, name) => handleAccountSelect(id, name, 'lender')}
                        onToggleCollapse={() => setIsLenderTableCollapsed(!isLenderTableCollapsed)}
                        onCreateAccount={(form) => handleCreateAccount(form, 'lender')}
                    />
                )

            case 'create-lender':
                return (
                    <EntityCreation
                        entityType="lender"
                        accountId={selectedLenderId}
                        accountName={accounts.find(acc => acc.id === selectedLenderId)?.name || ''}
                        dealUUID={dealUUID}
                        wallets={wallets}
                        loadingWallets={loadingWallets}
                        createdEntities={allCreatedLenders}
                        onCreateEntity={handleCreateLender}
                    />
                )

            case 'borrower-account':
                return (
                    <AccountTable
                        role="BORROWER"
                        accounts={accounts}
                        selectedId={selectedBorrowerId}
                        isCollapsed={isBorrowerTableCollapsed}
                        loading={loadingAccounts}
                        onAccountSelect={(id, name) => handleAccountSelect(id, name, 'borrower')}
                        onToggleCollapse={() => setIsBorrowerTableCollapsed(!isBorrowerTableCollapsed)}
                        onCreateAccount={(form) => handleCreateAccount(form, 'borrower')}
                    />
                )

            case 'create-borrower':
                return (
                    <EntityCreation
                        entityType="borrower"
                        accountId={selectedBorrowerId}
                        accountName={accounts.find(acc => acc.id === selectedBorrowerId)?.name || ''}
                        dealUUID={dealUUID}
                        wallets={wallets}
                        loadingWallets={loadingWallets}
                        createdEntities={createdBorrower ? [createdBorrower] : []}
                        onCreateEntity={handleCreateBorrower}
                    />
                )

            case 'backend-pr':
                return (
                    <BackendPRStep
                        dealUUID={dealUUID}
                        allCreatedLenders={allCreatedLenders}
                        onLaunchPR={handleLaunchPR}
                    />
                )

            default:
                return null
        }
    }

    const getStepTitle = () => {
        const step = steps.find(s => s.id === currentStep)
        return step?.label || 'Unknown Step'
    }

    const getStepDescription = () => {
        if (currentStep === 'backend-pr') {
            return 'Review all onboarding data and create a pull request'
        }
        if (isRevisiting) {
            return 'Review your information'
        }
        if (isEditing) {
            return 'Update your information'
        }
        return 'Please enter the required information'
    }

    const shouldShowSubmitButton = () => {
        // Don't show submit button for backend PR step (has its own button)
        if (currentStep === 'backend-pr') return false

        // For entity creation steps, show button only if entities have been created
        if (currentStep === 'create-lender') {
            return allCreatedLenders.length > 0
        }
        if (currentStep === 'create-borrower') {
            return !!createdBorrower
        }

        return true
    }

    const getSubmitButtonText = () => {
        if (isEditing) return 'Save Changes'
        if (creatingDeal) return 'Creating Deal...'
        if (isLastStep) return 'Complete Onboarding'

        const nextStep = steps[steps.findIndex(s => s.id === currentStep) + 1]
        return nextStep ? `Continue to ${nextStep.label}` : 'Continue'
    }

    const isSubmitDisabled = () => {
        if (currentStep === 'lender-account' && !selectedLenderId) return true
        if (currentStep === 'borrower-account' && !selectedBorrowerId) return true
        if (currentStep === 'create-lender' && allCreatedLenders.length === 0) return true
        if (currentStep === 'create-borrower' && !createdBorrower) return true
        if (currentStep === 'deal-variables' && creatingDeal) return true
        return false
    }

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
            {/* Left Sidebar Navigation */}
            <StepNavigation
                steps={steps}
                currentStep={currentStep}
                onStepClick={handleStepClick}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
                {/* Auth Required Overlay */}
                {!auth.isAuthenticated && (
                    <div className="absolute inset-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="max-w-md w-full mx-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    API Authentication Required
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Please authenticate with the API using the authentication button in the sidebar to start the onboarding process.
                                </p>
                                <div className="flex items-center justify-center">
                                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                        </svg>
                                        Look for &ldquo;API Auth status&rdquo; on the left
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`max-w-4xl w-full space-y-12 my-8 ${!auth.isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
                    {/* Step Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {getStepTitle()}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {getStepDescription()}
                        </p>
                    </div>

                    {/* Step Content */}
                    {isRevisiting ? (
                        // Read-only view for completed steps
                        <div className="space-y-8">
                            <Card>
                                <CardContent>
                                    {getStepContent()}
                                </CardContent>
                            </Card>

                            <div className="flex gap-4 pb-8">
                                {currentStep !== 'backend-pr' && (
                                    <Button
                                        variant="outline"
                                        onClick={handleEdit}
                                        className="flex-1"
                                    >
                                        Edit
                                    </Button>
                                )}
                                {!isLastStep && (
                                    <Button
                                        onClick={() => {
                                            const nextStepIndex = steps.findIndex(s => s.id === currentStep) + 1
                                            if (nextStepIndex < steps.length) {
                                                handleStepClick(steps[nextStepIndex].id)
                                            }
                                        }}
                                        className="flex-1"
                                    >
                                        Next Step
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Editable form view
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
                            {currentStep === 'backend-pr' ? (
                                getStepContent()
                            ) : (
                                <Card>
                                    <CardContent>
                                        {getStepContent()}
                                    </CardContent>
                                </Card>
                            )}

                            {shouldShowSubmitButton() && (
                                <div className="pb-8">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitDisabled()}
                                        loading={creatingDeal}
                                        className="w-full"
                                    >
                                        {getSubmitButtonText()}
                                    </Button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
} 