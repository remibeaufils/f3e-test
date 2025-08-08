import React, { useState } from 'react'
import { EntityType, Wallet, CreatedEntity, RampingProvider } from '../../types'
import { Button, Input, Select, LoadingSpinner, Card, CardContent, CardTitle } from '../ui'

interface EntityCreationProps {
    entityType: EntityType
    accountId: string
    accountName: string
    dealUUID: string
    wallets: Wallet[]
    loadingWallets: boolean
    createdEntities: CreatedEntity[]
    onCreateEntity: (data: EntityCreationData) => Promise<void>
}

export interface EntityCreationData {
    accountId: string
    walletId: string
    dealId: string
    provider: RampingProvider
    address: string
}

const RAMPING_PROVIDERS: RampingProvider[] = ['MONERIUM', 'CIRCLE']

export function EntityCreation({
    entityType,
    accountId,
    accountName,
    dealUUID,
    wallets,
    loadingWallets,
    createdEntities,
    onCreateEntity
}: EntityCreationProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState('')
    const [selectedProvider, setSelectedProvider] = useState<RampingProvider | ''>('')
    const [address, setAddress] = useState('0x0')

    const handleCreateEntity = async () => {
        if (!selectedWallet || !selectedProvider || !address) return

        setCreating(true)
        try {
            await onCreateEntity({
                accountId,
                walletId: selectedWallet,
                dealId: dealUUID,
                provider: selectedProvider,
                address
            })

            // Reset form
            setSelectedWallet('')
            setSelectedProvider('')
            setAddress('0x0')
            setIsCreating(false)
        } finally {
            setCreating(false)
        }
    }

    const handleCancel = () => {
        setIsCreating(false)
        setSelectedWallet('')
        setSelectedProvider('')
        setAddress('0x0')
    }

    const handleNewEntity = () => {
        setIsCreating(true)
        setSelectedWallet('')
        setSelectedProvider('')
        setAddress('0x0')
    }

    // Show created entities (for lenders, show all; for borrowers, show single)
    if (createdEntities.length > 0 && !isCreating) {
        return (
            <div className="space-y-4">
                {createdEntities.map((entity, index) => (
                    <Card key={entity.id || index}>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle>
                                    {entityType === 'lender' ? `Lender #${index + 1}` : 'Borrower Created'}
                                </CardTitle>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Account
                                    </label>
                                    <p className="text-gray-900 dark:text-white">{entity.accountName || accountName}</p>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Deal ID
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-mono text-xs">
                                        {entity.deal_id || dealUUID}
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Wallet
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-mono text-xs">
                                        {entity.wallet_id || entity.wallet_address || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Ramping Provider
                                    </label>
                                    <p className="text-gray-900 dark:text-white">
                                        {entity.on_off_ramp || entity.ramping_provider || 'N/A'}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Address
                                    </label>
                                    <p className="text-gray-900 dark:text-white font-mono text-xs">
                                        {entity.l_a_address || entity.spv_address || entity.address || 'N/A'}
                                    </p>
                                </div>

                                {entity.id && (
                                    <div className="md:col-span-2">
                                        <label className="block font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            {entityType === 'lender' ? 'Lender' : 'Borrower'} ID
                                        </label>
                                        <p className="text-gray-900 dark:text-white font-mono text-xs">
                                            {entity.id}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* For lenders, allow creating multiple */}
                {entityType === 'lender' && (
                    <Button onClick={handleNewEntity} className="w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New {entityType}
                    </Button>
                )}
            </div>
        )
    }

    // Show creation form or empty state
    if (!isCreating) {
        return (
            <div className="text-center py-12">
                <div className="mb-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No {entityType} created yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Create a {entityType} for the selected account
                </p>
                <Button onClick={handleNewEntity}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New {entityType}
                </Button>
            </div>
        )
    }

    return (
        <Card>
            <CardContent>
                <CardTitle className="mb-4">
                    Create {entityType === 'lender' ? 'Lender' : 'Borrower'}
                </CardTitle>

                <div className="space-y-4">
                    <Input
                        label="Account ID"
                        value={accountId}
                        disabled
                        helperText={`From selected account: ${accountName}`}
                    />

                    <Input
                        label="Deal ID"
                        value={dealUUID}
                        disabled
                        className="font-mono text-sm"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Wallet to use *
                        </label>
                        {loadingWallets ? (
                            <div className="flex items-center justify-center py-4">
                                <LoadingSpinner className="text-blue-600" />
                            </div>
                        ) : (
                            <Select
                                value={selectedWallet}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                options={wallets.map(wallet => ({
                                    value: wallet.id || wallet.address || '',
                                    label: wallet.name || wallet.address || wallet.id || ''
                                }))}
                                placeholder="Select a wallet"
                                required
                            />
                        )}
                    </div>

                    <Select
                        label="On/Off Ramping Provider"
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value as RampingProvider)}
                        options={RAMPING_PROVIDERS.map(provider => ({
                            value: provider,
                            label: provider
                        }))}
                        placeholder="Select a provider"
                        required
                    />

                    <Input
                        label="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="0x..."
                        className="font-mono text-sm"
                        required
                    />

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleCreateEntity}
                            loading={creating}
                            disabled={!selectedWallet || !selectedProvider || !address}
                            className="flex-1"
                        >
                            Create {entityType}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={creating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 