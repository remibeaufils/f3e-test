import { useState, useEffect } from 'react'
import { useOnboarding } from '../context/OnboardingContext'
import { api } from '../lib/api'
import { Account, Wallet, CreatedEntity, NewAccountForm, OnboardingStep } from '../types'
import { EntityCreationData } from '../components/onboarding/EntityCreation'

const STEPS: OnboardingStep[] = [
    { id: 'deal-variables', label: 'Deal variables', number: 1 },
    { id: 'lender-account', label: 'Lender account', number: 2 },
    { id: 'create-lender', label: 'Create lender', number: 3 },
    { id: 'borrower-account', label: 'Borrower account', number: 4 },
    { id: 'create-borrower', label: 'Create borrower', number: 5 },
    { id: 'backend-pr', label: 'Backend PR', number: 6 },
]

export function useOnboardingFlow() {
    const { data, auth, updateField, markStepComplete, isStepCompleted, addToast } = useOnboarding()

    // Step management
    const [currentStep, setCurrentStep] = useState('deal-variables')
    const [editingStep, setEditingStep] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // Data states
    const [accounts, setAccounts] = useState<Account[]>([])
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [allCreatedLenders, setAllCreatedLenders] = useState<CreatedEntity[]>([])
    const [createdBorrower, setCreatedBorrower] = useState<CreatedEntity | null>(null)

    // Loading states
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const [loadingWallets, setLoadingWallets] = useState(false)
    const [creatingDeal, setCreatingDeal] = useState(false)

    // Selection states
    const [selectedLenderId, setSelectedLenderId] = useState<string>(data.lenderAccountId || '')
    const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>(data.borrowerAccountId || '')
    const [isLenderTableCollapsed, setIsLenderTableCollapsed] = useState(false)
    const [isBorrowerTableCollapsed, setIsBorrowerTableCollapsed] = useState(false)

    // Deal UUID
    const [dealUUID, setDealUUID] = useState<string>('')

    // Initialize step based on completed steps
    useEffect(() => {
        if (!isInitialized) {
            if (isStepCompleted('create-borrower')) {
                setCurrentStep('create-borrower')
            } else if (isStepCompleted('borrower-account')) {
                setCurrentStep('create-borrower')
            } else if (isStepCompleted('create-lender')) {
                setCurrentStep('borrower-account')
            } else if (isStepCompleted('lender-account')) {
                setCurrentStep('create-lender')
            } else if (isStepCompleted('deal-variables')) {
                setCurrentStep('lender-account')
            }
            setIsInitialized(true)
        }
    }, [isInitialized, isStepCompleted])

    // Generate UUID on mount
    useEffect(() => {
        const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0
                const v = c === 'x' ? r : (r & 0x3 | 0x8)
                return v.toString(16)
            })
        }

        if (!dealUUID && !data.dealUUID) {
            const newUUID = generateUUID()
            setDealUUID(newUUID)
            updateField('dealUUID', newUUID)
        } else if (data.dealUUID && !dealUUID) {
            setDealUUID(data.dealUUID)
        }
    }, [data.dealUUID, dealUUID, updateField])

    // Fetch accounts when needed
    useEffect(() => {
        if ((currentStep === 'lender-account' || currentStep === 'borrower-account') && auth.isAuthenticated && auth.access_token) {
            fetchAccounts()
        }
    }, [currentStep, auth.isAuthenticated, auth.access_token])

    // Fetch wallets when needed
    useEffect(() => {
        if ((currentStep === 'create-lender' || currentStep === 'create-borrower') && auth.isAuthenticated && auth.access_token) {
            fetchWallets()
        }
    }, [currentStep, auth.isAuthenticated, auth.access_token])

    // Sync selected IDs with context data
    useEffect(() => {
        if (currentStep === 'lender-account' && data.lenderAccountId) {
            setSelectedLenderId(data.lenderAccountId)
            setIsLenderTableCollapsed(true)
        } else if (currentStep === 'borrower-account' && data.borrowerAccountId) {
            setSelectedBorrowerId(data.borrowerAccountId)
            setIsBorrowerTableCollapsed(true)
        }
    }, [currentStep, data.lenderAccountId, data.borrowerAccountId])

    // Initialize created entities from context
    useEffect(() => {
        if (data.createdBorrowerId && !createdBorrower) {
            setCreatedBorrower({ id: data.createdBorrowerId })
        }
    }, [data.createdBorrowerId, createdBorrower])

    const fetchAccounts = async () => {
        setLoadingAccounts(true)
        try {
            const result = await api.get('/v1/onboarding/get_accounts', auth.access_token)
            setAccounts(result)
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
            addToast('Failed to fetch accounts', 'error')
        } finally {
            setLoadingAccounts(false)
        }
    }

    const fetchWallets = async () => {
        setLoadingWallets(true)
        try {
            const result = await api.get('/v1/onboarding/get_wallets', auth.access_token)
            setWallets(result)
        } catch (error) {
            console.error('Failed to fetch wallets:', error)
            addToast('Failed to fetch wallets', 'error')
        } finally {
            setLoadingWallets(false)
        }
    }

    const handleAccountSelect = (accountId: string, accountName: string, role: 'lender' | 'borrower') => {
        if (role === 'lender') {
            setSelectedLenderId(accountId)
            updateField('lenderAccount', accountName)
            updateField('lenderAccountId', accountId)
            setIsLenderTableCollapsed(true)
        } else {
            setSelectedBorrowerId(accountId)
            updateField('borrowerAccount', accountName)
            updateField('borrowerAccountId', accountId)
            setIsBorrowerTableCollapsed(true)
        }
    }

    const handleCreateAccount = async (form: NewAccountForm, role: 'lender' | 'borrower') => {
        const accountRole = role === 'lender' ? 'LENDER' : 'BORROWER'
        const newAccount = {
            email: form.email,
            name: form.name,
            role: accountRole
        }

        const result = await api.post('/v1/onboarding/create_account', newAccount, auth.access_token)
        setAccounts(prev => [...prev, result])
        handleAccountSelect(result.id, result.name, role)
        addToast(`Account "${result.name}" created and selected successfully`, 'success')
    }

    const handleCreateDeal = async () => {
        if (!data.dealVariables || !data.dealName) {
            addToast('Please enter deal reference and name', 'error')
            return false
        }

        setCreatingDeal(true)
        try {
            const payload = {
                deal_reference: data.dealVariables,
                name: data.dealName,
                deal_id: dealUUID
            }

            await api.post('/v1/onboarding/create_deal', payload, auth.access_token)
            addToast('Deal created successfully', 'success')
            return true
        } catch (error) {
            console.error('Failed to create deal:', error)
            addToast('Failed to create deal', 'error')
            return false
        } finally {
            setCreatingDeal(false)
        }
    }

    const handleCreateLender = async (data: EntityCreationData) => {
        const payload = {
            account_id: data.accountId,
            wallet_id: data.walletId,
            deal_id: data.dealId,
            on_off_ramp: data.provider,
            l_a_address: data.address
        }

        const result = await api.post('/v1/onboarding/create_lender', payload, auth.access_token)

        if (result.id) {
            updateField('createdLenderId', result.id)
        }

        setAllCreatedLenders(prev => [...prev, {
            ...result,
            accountName: accounts.find(acc => acc.id === data.accountId)?.name
        }])

        addToast('Lender created successfully', 'success')
    }

    const handleCreateBorrower = async (data: EntityCreationData) => {
        const payload = {
            account_id: data.accountId,
            wallet_id: data.walletId,
            deal_id: data.dealId,
            on_off_ramp: data.provider,
            spv_address: data.address
        }

        const result = await api.post('/v1/onboarding/create_borrower', payload, auth.access_token)

        if (result.id) {
            updateField('createdBorrowerId', result.id)
        }

        setCreatedBorrower(result)
        addToast('Borrower created successfully', 'success')
    }

    const handleStepClick = (stepId: string) => {
        if (isStepCompleted(stepId) || stepId === currentStep) {
            setCurrentStep(stepId)
            setEditingStep(null)

            // Reset collapsed state when navigating to account steps
            if (stepId === 'lender-account') {
                setIsLenderTableCollapsed(!!data.lenderAccountId)
            } else if (stepId === 'borrower-account') {
                setIsBorrowerTableCollapsed(!!data.borrowerAccountId)
            }
        }
    }

    const handleEdit = () => {
        setEditingStep(currentStep)
        if (currentStep === 'lender-account') {
            setIsLenderTableCollapsed(false)
        } else if (currentStep === 'borrower-account') {
            setIsBorrowerTableCollapsed(false)
        }
    }

    const handleSubmit = async () => {
        if (editingStep) {
            setEditingStep(null)
            return
        }

        // Validation and step progression logic
        if (currentStep === 'deal-variables') {
            const success = await handleCreateDeal()
            if (success) {
                markStepComplete('deal-variables')
                setCurrentStep('lender-account')
            }
        } else if (currentStep === 'lender-account') {
            if (!selectedLenderId) {
                addToast('Please select a lender account', 'error')
                return
            }
            markStepComplete('lender-account')
            setCurrentStep('create-lender')
        } else if (currentStep === 'create-lender') {
            if (allCreatedLenders.length === 0) {
                addToast('Please create at least one lender', 'error')
                return
            }
            markStepComplete('create-lender')
            setCurrentStep('borrower-account')
        } else if (currentStep === 'borrower-account') {
            if (!selectedBorrowerId) {
                addToast('Please select a borrower account', 'error')
                return
            }
            markStepComplete('borrower-account')
            setCurrentStep('create-borrower')
        } else if (currentStep === 'create-borrower') {
            if (!createdBorrower) {
                addToast('Please create a borrower', 'error')
                return
            }
            markStepComplete('create-borrower')
            setCurrentStep('backend-pr')
        }
    }

    const handleLaunchPR = () => {
        addToast('Launching PR creation...', 'info')
        markStepComplete('backend-pr')
    }

    return {
        // State
        steps: STEPS,
        currentStep,
        editingStep,
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
        isEditing: editingStep === currentStep,
        isRevisiting: isStepCompleted(currentStep) && editingStep !== currentStep,
        isLastStep: currentStep === 'backend-pr',

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
    }
} 