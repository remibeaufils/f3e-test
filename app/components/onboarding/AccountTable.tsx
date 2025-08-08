import React, { useState } from 'react'
import { Account, AccountRole, NewAccountForm } from '../../types'
import { Button, Input, LoadingSpinner } from '../ui'
import { useOnboarding } from '../../context/OnboardingContext'

interface AccountTableProps {
    role: AccountRole
    accounts: Account[]
    selectedId: string
    isCollapsed: boolean
    loading: boolean
    onAccountSelect: (accountId: string, accountName: string) => void
    onToggleCollapse: () => void
    onCreateAccount: (form: NewAccountForm) => Promise<void>
}

export function AccountTable({
    role,
    accounts,
    selectedId,
    isCollapsed,
    loading,
    onAccountSelect,
    onToggleCollapse,
    onCreateAccount
}: AccountTableProps) {
    const { auth, authenticate } = useOnboarding()
    const [isCreating, setIsCreating] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState<NewAccountForm>({ name: '', email: '' })

    const filteredAccounts = accounts.filter(account => account.role === role)

    const handleCreateAccount = async () => {
        if (!form.name || !form.email) return

        setCreating(true)
        try {
            await onCreateAccount(form)
            setForm({ name: '', email: '' })
            setIsCreating(false)
            // The parent will handle account selection and UI updates
        } finally {
            setCreating(false)
        }
    }

    const handleCancelCreate = () => {
        setIsCreating(false)
        setForm({ name: '', email: '' })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" className="text-blue-600" />
            </div>
        )
    }

    if (!auth.isAuthenticated) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Authentication required to fetch accounts
                </p>
                <Button onClick={authenticate}>
                    Authenticate
                </Button>
            </div>
        )
    }

    if (isCreating) {
        return (
            <div className="mt-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Create New {role === 'LENDER' ? 'Lender' : 'Borrower'} Account
                </h3>
                <div className="space-y-4">
                    <Input
                        label="Account Name"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleCreateAccount}
                            loading={creating}
                            disabled={!form.name || !form.email}
                            className="flex-1"
                        >
                            Create Account
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelCreate}
                            disabled={creating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Show collapsed view if an account is selected
    if (selectedId && isCollapsed) {
        const selectedAccount = filteredAccounts.find(acc => acc.id === selectedId)
        return (
            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                Selected {role.toLowerCase()} account
                            </p>
                            {selectedAccount && (
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        {selectedAccount.name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {selectedAccount.email} • Tax ID: {selectedAccount.tax_id}
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleCollapse}
                        >
                            Change selection
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredAccounts.length} {role.toLowerCase()} account{filteredAccounts.length !== 1 ? 's' : ''} found
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                >
                    + Create New Account
                </Button>
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">
                        No {role.toLowerCase()} accounts found. Create one to continue.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Select
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tax ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAccounts.map((account) => (
                                <tr
                                    key={account.id}
                                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 ${selectedId === account.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    onClick={() => onAccountSelect(account.id, account.name)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name={`${role.toLowerCase()}-account`}
                                            checked={selectedId === account.id}
                                            onChange={() => onAccountSelect(account.id, account.name)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {account.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {account.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {account.tax_id}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
} 