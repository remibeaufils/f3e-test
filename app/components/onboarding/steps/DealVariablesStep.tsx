import React from 'react'
import { Input } from '../../ui'
import { useOnboarding } from '../../../context/OnboardingContext'

interface DealVariablesStepProps {
    dealUUID: string
    isEditing: boolean
    isRevisiting: boolean
}

export function DealVariablesStep({ dealUUID, isEditing, isRevisiting }: DealVariablesStepProps) {
    const { data, updateField } = useOnboarding()

    if (isRevisiting && !isEditing) {
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deal name
                    </label>
                    <p className="text-gray-900 dark:text-white py-2">
                        {data.dealName || <span className="text-gray-400 italic">No data entered</span>}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deal reference
                    </label>
                    <p className="text-gray-900 dark:text-white py-2">
                        {data.dealVariables || <span className="text-gray-400 italic">No data entered</span>}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deal UUID (auto-generated)
                    </label>
                    <p className="text-gray-900 dark:text-white py-2 font-mono text-sm">
                        {dealUUID}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Input
                label="Deal name"
                value={data.dealName}
                onChange={(e) => updateField('dealName', e.target.value)}
                placeholder="e.g., ABC Corp Q1 2024 Invoice Financing"
                required
            />

            <Input
                label="Deal reference"
                value={data.dealVariables}
                onChange={(e) => updateField('dealVariables', e.target.value)}
                placeholder="e.g., Q1-2024-DEAL-001"
                required
            />

            <Input
                label="Deal UUID (auto-generated)"
                value={dealUUID}
                disabled
                className="font-mono text-sm"
            />
        </div>
    )
} 