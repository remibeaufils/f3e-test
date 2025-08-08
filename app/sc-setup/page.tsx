'use client'

import { useState } from 'react'
import { AdminSidebar } from '../components/shared/AdminSidebar'
import { Card, CardContent, CardTitle, Select, Button } from '../components/ui'
import { useOnboarding } from '../context/OnboardingContext'

interface Chain {
  id: string
  name: string
  chainId: number
  rpcUrl: string
  blockExplorer: string
}

const AVAILABLE_CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  {
    id: 'polygon',
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    id: 'mumbai',
    name: 'Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  }
]

export default function SCSetupPage() {
  const { auth } = useOnboarding()
  const [selectedChain, setSelectedChain] = useState<string>('')

  const selectedChainData = AVAILABLE_CHAINS.find(chain => chain.id === selectedChain)

  const handleDeploy = () => {
    if (!selectedChainData) return
    // TODO: Implement deployment logic
    console.log('Deploying to chain:', selectedChainData)
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <AdminSidebar title="SC Deployment" />

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
                  Please authenticate with the API using the authentication button in the sidebar to access smart contract deployment.
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

        <div className={`max-w-4xl w-full space-y-8 my-8 ${!auth.isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Deploy Smart Contract Setup
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Select a blockchain network and deploy smart contract configuration
            </p>
          </div>

          {/* Chain Selection */}
          <Card>
            <CardContent>
              <CardTitle className="mb-6">Network Configuration</CardTitle>
              
              <div className="space-y-6">
                <div>
                  <Select
                    label="Select Blockchain Network"
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value)}
                    placeholder="Choose a blockchain network..."
                    options={AVAILABLE_CHAINS.map((chain) => ({
                      value: chain.id,
                      label: `${chain.name} (Chain ID: ${chain.chainId})`
                    }))}
                  />
                </div>

                {/* Chain Details */}
                {selectedChainData && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      Network Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-200">Network:</span>
                        <span className="ml-2 text-blue-700 dark:text-blue-300">{selectedChainData.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800 dark:text-blue-200">Chain ID:</span>
                        <span className="ml-2 text-blue-700 dark:text-blue-300">{selectedChainData.chainId}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-blue-800 dark:text-blue-200">RPC URL:</span>
                        <span className="ml-2 text-blue-700 dark:text-blue-300 break-all">{selectedChainData.rpcUrl}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-blue-800 dark:text-blue-200">Block Explorer:</span>
                        <a 
                          href={selectedChainData.blockExplorer} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedChainData.blockExplorer}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deploy Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleDeploy}
                    disabled={!selectedChain}
                    className="w-full"
                  >
                    {selectedChain ? `Deploy to ${selectedChainData?.name}` : 'Select a network to deploy'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}