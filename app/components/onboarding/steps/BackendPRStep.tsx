import React, { useState } from 'react'
import { Card, CardContent, CardTitle, Button, Textarea } from '../../ui'
import { CreatedEntity } from '../../../types'
import { useOnboarding } from '../../../context/OnboardingContext'

interface BackendPRStepProps {
    dealUUID: string
    allCreatedLenders: CreatedEntity[]
    onLaunchPR: () => void
}

export function BackendPRStep({}: BackendPRStepProps) {
    const { data } = useOnboarding()
    const [copySuccess, setCopySuccess] = useState(false)

    // LLM prompt with dynamic deal reference
    const defaultPrompt = `You are a coding-AI.  Create a new deal called **${data.dealVariables}** in the repo, following these steps exactly:

1. Duplicate the folder base_deal in core-lib/deals and all its contents

2. Go through each file of the new folder and rename all classes and files necessary to be called according to the new deal and not base_deal

3. Integration  
   • Add any needed registrations/imports in factory or registry modules under common/ so the new deal is discoverable

7. Constraints  
   • Keep changes constrained to changing names where the base_deal deal name applied and now needs to be changed to ${data.dealVariables} 
   • Follow existing lint/typing rules; suppress unused-variable warnings if needed.  
   • Use one-line docstrings only.

8. Deliverables  
   • All new files in the base_deal deal *plus* updated factory/registry files (including for the base repositories for assets/ contracts/ insights that did not create new AI files), so that the project builds and tests pass.

Execute the steps in order.  Stop when all deliverables satisfy CI.`

    const [prompt, setPrompt] = useState(defaultPrompt)

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            console.error('Failed to copy prompt:', err)
        }
    }

    const handleLaunchChatGPT = () => {
        window.open('https://chatgpt.com/codex', '_blank')
    }

    return (
        <div className="space-y-6">
            {/* LLM Prompt Section */}
            <Card>
                <CardContent>
                    <CardTitle className="mb-4">Backend PR Creation Prompt</CardTitle>

                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions:</h4>
                        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                            <li>Review and edit the prompt below if necessary</li>
                            <li>Copy the prompt using the button below</li>
                            <li>Navigate to the ChatGPT link and launch it in the fence-backend environment to create the PR</li>
                        </ol>
                    </div>

                    {/* Editable Prompt */}
                    <Textarea
                        label="LLM Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Enter your LLM prompt here..."
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={handleCopyPrompt}
                            variant="outline"
                            className="flex-1"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {copySuccess ? 'Copied!' : 'Copy Prompt'}
                        </Button>

                        <Button
                            onClick={handleLaunchChatGPT}
                            className="flex-1"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Open Codex
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 