'use client'

import { useState, useMemo, useEffect } from 'react'
import { AdminSidebar } from '../components/shared/AdminSidebar'
import { PageNavigationHelper } from '../components/shared/PageNavigationHelper'
import { Card, CardContent, CardTitle, Select, LoadingSpinner } from '../components/ui'
import { FunctionExecutor } from '../components/contracts/FunctionExecutor'
import { useOnboarding } from '../context/OnboardingContext'
import { loadAllVersions } from '../lib/abiLoader'
import { parseContractFunctions } from '../data/contractVersions'
import { ParsedFunction, SCVersion, Deal, DealDetails, WaterfallConfigResponse } from '../types/contracts'
import { getActiveDeals, getDealDetails, getWaterfallConfig } from '../lib/api'

export default function SCCallPage() {
  const { auth } = useOnboarding()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loadingDeals, setLoadingDeals] = useState(true)
  const [selectedDealId, setSelectedDealId] = useState<string>('')
  const [selectedDealDetails, setSelectedDealDetails] = useState<DealDetails | null>(null)
  const [loadingDealDetails, setLoadingDealDetails] = useState(false)
  const [dealSearch, setDealSearch] = useState<string>('')
  const [showDealDropdown, setShowDealDropdown] = useState(false)
  const [dealHighlightedIndex, setDealHighlightedIndex] = useState<number>(-1)
  const [waterfallConfigResponse, setWaterfallConfigResponse] = useState<WaterfallConfigResponse | null>(null)
  const [loadingWaterfallConfig, setLoadingWaterfallConfig] = useState(false)
  const [selectedSmartContract, setSelectedSmartContract] = useState<string>('')
  const [contractSearch, setContractSearch] = useState<string>('')
  const [showContractDropdown, setShowContractDropdown] = useState(false)
  const [contractHighlightedIndex, setContractHighlightedIndex] = useState<number>(-1)
  const [versions, setVersions] = useState<SCVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [selectedContractName, setSelectedContractName] = useState<string>('')
  const [selectedFunction, setSelectedFunction] = useState<ParsedFunction | null>(null)
  const [functionSearch, setFunctionSearch] = useState<string>('')
  const [showFunctionDropdown, setShowFunctionDropdown] = useState(false)
  const [functionHighlightedIndex, setFunctionHighlightedIndex] = useState<number>(-1)
  const [showReadFunctions, setShowReadFunctions] = useState(false)
  const [showWriteFunctions, setShowWriteFunctions] = useState(false)
  const [contractAddress, setContractAddress] = useState('')
  const [chainId, setChainId] = useState('')
  const [addressError, setAddressError] = useState<string>('')
  const [chainIdError, setChainIdError] = useState<string>('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load deals from API
  useEffect(() => {
    const loadDeals = async () => {
      if (!auth.isAuthenticated || !auth.access_token) {
        setLoadingDeals(false)
        return
      }

      try {
        setLoadingDeals(true)
        const activeDeals = await getActiveDeals(auth.access_token)
        setDeals(activeDeals)
      } catch (error) {
        console.error('Failed to load deals:', error)
      } finally {
        setLoadingDeals(false)
      }
    }

    loadDeals()
  }, [auth.isAuthenticated, auth.access_token])

  // Load deal details when a deal is selected
  useEffect(() => {
    const loadDealDetails = async () => {
      if (!selectedDealId || !auth.access_token) {
        setSelectedDealDetails(null)
        return
      }

      try {
        setLoadingDealDetails(true)
        const dealDetails = await getDealDetails(selectedDealId, auth.access_token)
        setSelectedDealDetails(dealDetails)
      } catch (error) {
        console.error('Failed to load deal details:', error)
        setSelectedDealDetails(null)
      } finally {
        setLoadingDealDetails(false)
      }
    }

    loadDealDetails()
  }, [selectedDealId, auth.access_token])

  // Load waterfall config when deal details are successfully loaded
  useEffect(() => {
    const loadWaterfallConfig = async () => {
      if (!selectedDealDetails || !auth.access_token) {
        setWaterfallConfigResponse(null)
        setSelectedSmartContract('')
        return
      }

      try {
        setLoadingWaterfallConfig(true)
        const configResponse = await getWaterfallConfig(selectedDealDetails.id, auth.access_token)
        setWaterfallConfigResponse(configResponse)
        
        // Auto-select first available smart contract (prefer Pool type)
        // This will be computed in the smartContractOptions memoization
      } catch (error) {
        console.error('Failed to load waterfall config:', error)
        setWaterfallConfigResponse(null)
        setSelectedSmartContract('')
      } finally {
        setLoadingWaterfallConfig(false)
      }
    }

    loadWaterfallConfig()
  }, [selectedDealDetails, auth.access_token])

  // Auto-populate chain ID from deal details
  useEffect(() => {
    if (selectedDealDetails?.chain_id) {
      setChainId(selectedDealDetails.chain_id)
      setChainIdError('') // Clear any previous errors
    } else {
      setChainId('')
    }
  }, [selectedDealDetails])

  // Load versions from folder structure
  useEffect(() => {
    const loadVersions = async () => {
      try {
        setLoadingVersions(true)
        const loadedVersions = await loadAllVersions()
        setVersions(loadedVersions)
      } catch (error) {
        console.error('Failed to load versions:', error)
      } finally {
        setLoadingVersions(false)
      }
    }

    loadVersions()
  }, [])

  // Get selected deal, version and contract data
  const selectedDeal = useMemo(() => 
    deals.find(d => d.id === selectedDealId),
    [deals, selectedDealId]
  )

  // Use SC version from deal details instead of user selection
  const selectedVersion = useMemo(() => {
    if (!selectedDealDetails?.sc_version) return null
    return versions.find(v => v.id === selectedDealDetails.sc_version)
  }, [versions, selectedDealDetails?.sc_version])

  const selectedContract = useMemo(() => 
    selectedVersion?.contracts.find(c => c.name === selectedContractName),
    [selectedVersion, selectedContractName]
  )

  const contractFunctions = useMemo(() => 
    selectedContract ? parseContractFunctions(selectedContract) : [],
    [selectedContract]
  )

  // Filter deals based on search
  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(dealSearch.toLowerCase()) ||
    deal.id.toLowerCase().includes(dealSearch.toLowerCase())
  )

  // Create smart contract options from waterfall config response
  const smartContractOptions = waterfallConfigResponse ? (() => {
    const contracts: Array<{address: string, type: string, source: string, id: string}> = []
    
    // Pool addresses
    waterfallConfigResponse.borrowers.forEach((b, i) => {
      if (b.pool_address) {
        contracts.push({
          address: b.pool_address,
          type: 'Pool',
          source: `Borrower: ${b.name}`,
          id: `pool_borrower_${i}`
        })
      }
    })
    
    waterfallConfigResponse.lenders.forEach((l, i) => {
      if (l.pool_address) {
        contracts.push({
          address: l.pool_address,
          type: 'Pool',
          source: `Lender: ${l.name} (${l.type})`,
          id: `pool_lender_${i}`
        })
      }
      if (l.waterfall_config?.pool_address && l.waterfall_config.pool_address !== l.pool_address) {
        contracts.push({
          address: l.waterfall_config.pool_address,
          type: 'Pool',
          source: `Lender Config: ${l.name} (${l.type})`,
          id: `pool_config_lender_${i}`
        })
      }
    })
    
    // Lender addresses
    waterfallConfigResponse.lenders.forEach((l, i) => {
      if (l.l_a_address) {
        contracts.push({
          address: l.l_a_address,
          type: 'Lender',
          source: `${l.name} (${l.type})`,
          id: `lender_${i}`
        })
      }
      if (l.waterfall_config?.lender_address && l.waterfall_config.lender_address !== l.l_a_address) {
        contracts.push({
          address: l.waterfall_config.lender_address,
          type: 'Lender',
          source: `Config: ${l.name} (${l.type})`,
          id: `lender_config_${i}`
        })
      }
    })
    
    // Borrower addresses
    waterfallConfigResponse.borrowers.forEach((b, i) => {
      if (b.waterfall_config?.borrower_address) {
        contracts.push({
          address: b.waterfall_config.borrower_address,
          type: 'Borrower',
          source: `${b.name}`,
          id: `borrower_${i}`
        })
      }
    })
    
    waterfallConfigResponse.lenders.forEach((l, i) => {
      if (l.waterfall_config?.borrower_address) {
        contracts.push({
          address: l.waterfall_config.borrower_address,
          type: 'Borrower',
          source: `From Lender: ${l.name} (${l.type})`,
          id: `borrower_from_lender_${i}`
        })
      }
    })
    
    // Tranche Permissions Registry
    waterfallConfigResponse.borrowers.forEach((b, i) => {
      if (b.waterfall_config?.tranche_params) {
        b.waterfall_config.tranche_params.forEach((tp: any, j: number) => {
          if (tp.tranche_permissions_registry) {
            contracts.push({
              address: tp.tranche_permissions_registry,
              type: 'Permissions Registry',
              source: `Borrower: ${b.name} (Tranche ${j})`,
              id: `permissions_borrower_${i}_${j}`
            })
          }
        })
      }
    })
    
    waterfallConfigResponse.lenders.forEach((l, i) => {
      if (l.waterfall_config?.tranche_params?.tranche_permissions_registry) {
        contracts.push({
          address: l.waterfall_config.tranche_params.tranche_permissions_registry,
          type: 'Permissions Registry',
          source: `Lender: ${l.name} (${l.type})`,
          id: `permissions_lender_${i}`
        })
      }
    })
    
    // Rates Oracle
    waterfallConfigResponse.borrowers.forEach((b, i) => {
      if (b.waterfall_config?.tranche_params) {
        b.waterfall_config.tranche_params.forEach((tp: any, j: number) => {
          if (tp.rates_oracle) {
            contracts.push({
              address: tp.rates_oracle,
              type: 'Rates Oracle',
              source: `Borrower: ${b.name} (Tranche ${j})`,
              id: `oracle_borrower_${i}_${j}`
            })
          }
        })
      }
    })
    
    waterfallConfigResponse.lenders.forEach((l, i) => {
      if (l.waterfall_config?.tranche_params?.rates_oracle) {
        contracts.push({
          address: l.waterfall_config.tranche_params.rates_oracle,
          type: 'Rates Oracle',
          source: `Lender: ${l.name} (${l.type})`,
          id: `oracle_lender_${i}`
        })
      }
    })
    
    // Remove duplicates based on address and type combination
    const uniqueContracts = contracts.filter((contract, index, self) => 
      index === self.findIndex(c => c.address === contract.address && c.type === contract.type)
    )
    
    return uniqueContracts
  })() : []

  // Auto-select first contract (prefer Pool type) when options change
  useEffect(() => {
    if (smartContractOptions.length > 0 && !selectedSmartContract) {
      const poolContract = smartContractOptions.find(c => c.type === 'Pool')
      const firstContract = poolContract || smartContractOptions[0]
      setSelectedSmartContract(firstContract.id)
      setContractAddress(firstContract.address)
    }
  }, [smartContractOptions, selectedSmartContract])

  // Get selected contract details
  const selectedContractDetails = smartContractOptions.find(c => c.id === selectedSmartContract)

  // Map contract types to ABI file names
  const getAbiFileName = (contractType: string): string => {
    switch (contractType) {
      case 'Pool': return 'TranchedPool'
      case 'Lender': return 'LenderAccount'
      case 'Borrower': return 'BorrowerAccount'
      case 'Permissions Registry': return 'PermissionsRegistry'
      case 'Rates Oracle': return 'RatesOracle'
      default: return 'TranchedPool' // fallback
    }
  }

  // Load contract ABI when contract is selected and SC version is available
  useEffect(() => {
    const loadContractAbi = async () => {
      if (!selectedContractDetails || !selectedDealDetails?.sc_version) {
        setSelectedContractName('')
        return
      }

      try {
        const abiFileName = getAbiFileName(selectedContractDetails.type)
        console.log(`Loading ABI for ${selectedContractDetails.type}: ${abiFileName} from version ${selectedDealDetails.sc_version}`)
        
        // Find the version in the loaded versions
        const version = versions.find(v => v.id === selectedDealDetails.sc_version)
        if (!version) {
          console.error(`Version ${selectedDealDetails.sc_version} not found in loaded versions`)
          return
        }

        // Find the contract in the version
        const contract = version.contracts.find(c => c.name === abiFileName)
        if (!contract) {
          console.error(`Contract ${abiFileName} not found in version ${selectedDealDetails.sc_version}`)
          return
        }

        // Set the selected contract name which will trigger function parsing
        setSelectedContractName(abiFileName)
        console.log(`Successfully loaded ABI for ${abiFileName}`)
        
      } catch (error) {
        console.error('Failed to load contract ABI:', error)
        setSelectedContractName('')
      }
    }

    loadContractAbi()
  }, [selectedContractDetails, selectedDealDetails?.sc_version, versions])

  // Filter smart contracts based on search
  const filteredSmartContracts = smartContractOptions.filter(contract => 
    contract.type.toLowerCase().includes(contractSearch.toLowerCase()) ||
    contract.address.toLowerCase().includes(contractSearch.toLowerCase()) ||
    contract.source.toLowerCase().includes(contractSearch.toLowerCase())
  )

  // Update contract address when smart contract selection changes
  const handleSmartContractChange = (contractId: string) => {
    setSelectedSmartContract(contractId)
    const contract = smartContractOptions.find(c => c.id === contractId)
    if (contract) {
      setContractAddress(contract.address)
      setAddressError('') // Clear any address errors
      // Set the search to show the selected contract
      setContractSearch(`${contract.type} - ${contract.address.slice(0, 10)}...${contract.address.slice(-8)} (${contract.source})`)
    }
    // Reset function selection when contract changes
    setSelectedFunction(null)
    setFunctionSearch('')
    setShowContractDropdown(false)
    setContractHighlightedIndex(-1)
  }

  const handleContractKeyDown = (e: React.KeyboardEvent) => {
    if (!showContractDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setContractHighlightedIndex(prev => 
          prev < filteredSmartContracts.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setContractHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (contractHighlightedIndex >= 0 && contractHighlightedIndex < filteredSmartContracts.length) {
          const selectedContract = filteredSmartContracts[contractHighlightedIndex]
          handleSmartContractChange(selectedContract.id)
        }
        break
      case 'Escape':
        setShowContractDropdown(false)
        setContractHighlightedIndex(-1)
        break
    }
  }

  // Filter functions based on search and type
  const filteredReadFunctions = contractFunctions
    .filter(f => f.isReadOnly)
    .filter(f => f.name.toLowerCase().includes(functionSearch.toLowerCase()))
  
  const filteredWriteFunctions = contractFunctions
    .filter(f => !f.isReadOnly)
    .filter(f => f.name.toLowerCase().includes(functionSearch.toLowerCase()))

  const handleDealChange = (dealId: string, dealName: string) => {
    setSelectedDealId(dealId)
    setDealSearch(dealName) // Set the search to the selected deal name
    setShowDealDropdown(false) // Close the dropdown
    setDealHighlightedIndex(-1) // Reset highlight
    // Reset subsequent selections when deal changes (version comes from deal details)
    setSelectedContractName('')
    setSelectedFunction(null)
    setFunctionSearch('')
    // Reset waterfall config selections
    setSelectedSmartContract('')
  }

  const handleDealKeyDown = (e: React.KeyboardEvent) => {
    if (!showDealDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setDealHighlightedIndex(prev => 
          prev < filteredDeals.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setDealHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (dealHighlightedIndex >= 0 && dealHighlightedIndex < filteredDeals.length) {
          const selectedDeal = filteredDeals[dealHighlightedIndex]
          handleDealChange(selectedDeal.id, selectedDeal.name)
        }
        break
      case 'Escape':
        setShowDealDropdown(false)
        setDealHighlightedIndex(-1)
        break
    }
  }

  const handleContractChange = (contractName: string) => {
    setSelectedContractName(contractName)
    setSelectedFunction(null)
    setFunctionSearch('')
  }

  const handleFunctionSelect = (func: ParsedFunction) => {
    setSelectedFunction(func)
    setFunctionSearch(func.name) // Set the search to the selected function name
    setShowFunctionDropdown(false) // Close the dropdown
    setFunctionHighlightedIndex(-1) // Reset highlight
  }

  // Combined function list for keyboard navigation (read functions first, then write functions)
  const allFilteredFunctions = [...filteredReadFunctions, ...filteredWriteFunctions]

  const handleFunctionKeyDown = (e: React.KeyboardEvent) => {
    if (!showFunctionDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFunctionHighlightedIndex(prev => 
          prev < allFilteredFunctions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFunctionHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (functionHighlightedIndex >= 0 && functionHighlightedIndex < allFilteredFunctions.length) {
          const selectedFunc = allFilteredFunctions[functionHighlightedIndex]
          handleFunctionSelect(selectedFunc)
        }
        break
      case 'Escape':
        setShowFunctionDropdown(false)
        setFunctionHighlightedIndex(-1)
        break
    }
  }

  const handleAddressChange = (address: string) => {
    setContractAddress(address)
    // Validate address
    if (!address) {
      setAddressError('Contract address is required')
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setAddressError('Invalid address format (must be 0x followed by 40 hex characters)')
    } else {
      setAddressError('')
    }
  }

  const handleChainIdChange = (newChainId: string) => {
    setChainId(newChainId)
    // Validate chain ID
    if (!newChainId || !/^\d+$/.test(newChainId)) {
      setChainIdError('Chain ID must be a number')
    } else {
      setChainIdError('')
    }
  }

  // Handler for when user clicks a value in the helper sidebar
  const handleHelperValueClick = (value: string, label: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(value).then(() => {
      console.log(`Copied ${label}: ${value}`)
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err)
    })
    
    // TODO: In future, we could auto-populate form fields based on the label/context
    // For now, we just copy to clipboard for manual pasting
  }

  // Navigation sections for the page helper
  const navigationSections = [
    {
      id: 'deal-selection',
      title: 'Deal Selection',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      isVisible: true
    },
    {
      id: 'waterfall-config',
      title: 'Waterfall Configuration',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      isVisible: !!selectedDealDetails
    },
    {
      id: 'abi-loading',
      title: 'Contract ABI & Functions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      isVisible: !!selectedContractDetails && !!selectedDealDetails && !!selectedVersion
    },
    {
      id: 'contract-config',
      title: 'Contract Configuration',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isVisible: !!selectedDeal && !!selectedContractDetails && !!selectedContract
    },
    {
      id: 'function-selection',
      title: 'Function Selection',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      isVisible: !!selectedDeal && !!selectedContractDetails && contractFunctions.length > 0
    },
    {
      id: 'function-execution',
      title: 'Function Execution',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      isVisible: !!selectedFunction && !!selectedDeal
    },
    {
      id: 'transaction-decoder',
      title: 'Transaction Decoder',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      isVisible: !!selectedFunction && !!selectedDeal
    }
  ]

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <AdminSidebar 
        title="Smart Contract Calls"
        helperData={{
          selectedDeal,
          selectedDealDetails,
          waterfallConfig: waterfallConfigResponse,
          selectedContractDetails,
          selectedFunction,
          onValueClick: handleHelperValueClick
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-80'} flex items-center justify-center px-4 py-12 relative transition-all duration-300`}>
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
                  Please authenticate with the API using the authentication button in the sidebar to access smart contract calls.
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

        <div className={`max-w-6xl w-full space-y-8 my-8 ${!auth.isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Smart Contract Function Calls
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Select contract version, contract, and function to execute calls
            </p>
          </div>

          {/* Deal Selection */}
          <Card id="deal-selection">
            <CardContent>
              <CardTitle className="mb-4">Active Deal</CardTitle>
              {loadingDeals ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading deals...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Deal
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search deals by name or ID..."
                      value={dealSearch}
                      onChange={(e) => {
                        setDealSearch(e.target.value)
                        setDealHighlightedIndex(-1) // Reset highlight when typing
                      }}
                      onFocus={() => setShowDealDropdown(true)}
                      onKeyDown={handleDealKeyDown}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    {/* Dropdown */}
                    {showDealDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredDeals.length > 0 ? (
                          filteredDeals.map((deal, index) => (
                            <button
                              key={deal.id}
                              onClick={() => handleDealChange(deal.id, deal.name)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                                index === dealHighlightedIndex 
                                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {deal.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                ID: {deal.id} • Role: {deal.role} • Created: {new Date(deal.creation).toLocaleDateString()}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                            {dealSearch ? `No deals found matching "${dealSearch}"` : 'No active deals available'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Click outside to close dropdown */}
                  {showDealDropdown && (
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowDealDropdown(false)}
                    />
                  )}
                </div>
              )}
              {selectedDeal && (
                <div className="mt-4 space-y-3">
                  {/* Basic Deal Info */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <span className="font-medium">Selected:</span> {selectedDeal.name}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      <span className="font-medium">Deal ID:</span> {selectedDeal.id}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      <span className="font-medium">Role:</span> {selectedDeal.role}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      <span className="font-medium">Created:</span> {new Date(selectedDeal.creation).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Deal Details with SC Version */}
                  {loadingDealDetails ? (
                    <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">Loading deal details...</span>
                    </div>
                  ) : selectedDealDetails ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">SC Version:</span> {selectedDealDetails.sc_version || 'Not specified'}
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        <span className="font-medium">Chain ID:</span> {selectedDealDetails.chain_id || 'Not specified'}
                      </p>
                      {selectedVersion && (
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          <span className="font-medium">Version Description:</span> {selectedVersion.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Failed to load deal details
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waterfall Configuration - Only show when deal details are loaded */}
          {selectedDealDetails && (
            <Card id="waterfall-config">
              <CardContent>
                <CardTitle className="mb-4">Waterfall Configuration</CardTitle>
                
                {loadingWaterfallConfig ? (
                  <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading waterfall config...</span>
                  </div>
                ) : waterfallConfigResponse && smartContractOptions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Smart Contract Selector */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Smart Contract to Interact With
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search smart contracts by type, address, or source..."
                          value={contractSearch}
                          onChange={(e) => {
                            setContractSearch(e.target.value)
                            setContractHighlightedIndex(-1) // Reset highlight when typing
                          }}
                          onFocus={() => setShowContractDropdown(true)}
                          onKeyDown={handleContractKeyDown}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        
                        {/* Dropdown */}
                        {showContractDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredSmartContracts.length > 0 ? (
                              filteredSmartContracts.map((contract, index) => (
                                <button
                                  key={contract.id}
                                  onClick={() => handleSmartContractChange(contract.id)}
                                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                                    index === contractHighlightedIndex 
                                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {contract.type}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                    {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {contract.source}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                {contractSearch ? `No contracts found matching "${contractSearch}"` : 'No smart contracts available'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Click outside to close dropdown */}
                      {showContractDropdown && (
                        <div 
                          className="fixed inset-0 z-0" 
                          onClick={() => setShowContractDropdown(false)}
                        />
                      )}
                      
                      {/* Selected Contract Details */}
                      {selectedContractDetails && (
                        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                <span className="font-medium">Type:</span> {selectedContractDetails.type}
                              </p>
                              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                <span className="font-medium">Source:</span> {selectedContractDetails.source}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                <span className="font-medium">Address:</span>
                              </p>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-mono break-all mt-1">
                                {selectedContractDetails.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      No waterfall configuration available for this deal
                    </p>
                  </div>
                )}

                {/* Configuration Summary */}
                {waterfallConfigResponse && smartContractOptions.length > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <span className="font-medium">Deal Structure:</span> {waterfallConfigResponse.borrowers.length} Borrowers • {waterfallConfigResponse.lenders.length} Lenders
                    </p>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                      <span className="font-medium">Available Contracts:</span> {smartContractOptions.length} unique smart contracts found
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                      {['Pool', 'Lender', 'Borrower', 'Permissions Registry', 'Rates Oracle'].map(type => {
                        const count = smartContractOptions.filter(c => c.type === type).length
                        return count > 0 ? (
                          <p key={type} className="text-xs text-purple-700 dark:text-purple-300">
                            <span className="font-medium">{type}:</span> {count}
                          </p>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ABI Loading Status - Only show when smart contract is selected */}
          {selectedContractDetails && selectedDealDetails && selectedVersion && (
            <Card id="abi-loading">
              <CardContent>
                <CardTitle className="mb-4">Contract ABI & Functions</CardTitle>
                
                {/* ABI Loading Status */}
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-medium">Loading ABI for:</span> {selectedContractDetails.type} ({getAbiFileName(selectedContractDetails.type)})
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                    <span className="font-medium">SC Version:</span> {selectedDealDetails.sc_version}
                  </p>
                </div>

                {/* Contract Functions Info */}
                {selectedContract && contractFunctions.length > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <span className="font-medium">ABI Loaded:</span> {selectedContract.name}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      <span className="font-medium">Functions:</span> {contractFunctions.length} available
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      <span className="font-medium">Read:</span> {contractFunctions.filter(f => f.isReadOnly).length} • 
                      <span className="font-medium"> Write:</span> {contractFunctions.filter(f => !f.isReadOnly).length}
                    </p>
                  </div>
                )}

                {/* ABI Loading Error */}
                {selectedContractDetails && selectedContractName === '' && selectedDealDetails?.sc_version && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <span className="font-medium">ABI Loading Failed:</span> Could not find {getAbiFileName(selectedContractDetails.type)} in version {selectedDealDetails.sc_version}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract Configuration - Only show when deal and smart contract are selected */}
          {selectedDeal && selectedContractDetails && selectedContract && (
            <Card id="contract-config">
              <CardContent>
                <CardTitle className="mb-6">Contract Configuration</CardTitle>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Contract Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contract Address
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-2">(from selected contract)</span>
                    </label>
                    <input
                      type="text"
                      value={contractAddress}
                      readOnly
                      placeholder="Contract address will be loaded from selected smart contract..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed font-mono"
                    />
                    {addressError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {addressError}
                      </p>
                    )}
                  </div>

                  {/* Chain ID */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chain ID
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">(from deal)</span>
                    </label>
                    <input
                      type="text"
                      value={chainId}
                      readOnly
                      placeholder="Chain ID will be loaded from deal details..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                    {chainIdError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {chainIdError}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Function Selection - Only show when deal and smart contract with functions are available */}
          {selectedDeal && selectedContractDetails && contractFunctions.length > 0 && (
            <Card id="function-selection">
              <CardContent>
                <CardTitle className="mb-6">Available Functions</CardTitle>
                
                {/* Function Search and Selection */}
                <div className="mb-6 space-y-4">
                  {/* Autocomplete Function Search */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search and Select Function
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search functions by name..."
                        value={functionSearch}
                        onChange={(e) => {
                          setFunctionSearch(e.target.value)
                          setFunctionHighlightedIndex(-1) // Reset highlight when typing
                        }}
                        onFocus={() => setShowFunctionDropdown(true)}
                        onKeyDown={handleFunctionKeyDown}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      
                      {/* Function Dropdown */}
                      {showFunctionDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                          {/* Read Functions */}
                          {filteredReadFunctions.length > 0 && (
                            <div>
                              <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    View Functions ({filteredReadFunctions.length})
                                  </span>
                                </div>
                              </div>
                              {filteredReadFunctions.map((func, index) => (
                                <button
                                  key={`read-${index}`}
                                  onClick={() => handleFunctionSelect(func)}
                                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                                    index === functionHighlightedIndex 
                                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                                      : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  }`}
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {func.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {func.inputs.length} inputs • {func.outputs.length} outputs • {func.stateMutability}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Write Functions */}
                          {filteredWriteFunctions.length > 0 && (
                            <div>
                              <div className="sticky top-0 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                    Write Functions ({filteredWriteFunctions.length})
                                  </span>
                                </div>
                              </div>
                              {filteredWriteFunctions.map((func, index) => {
                                const adjustedIndex = filteredReadFunctions.length + index
                                return (
                                <button
                                  key={`write-${index}`}
                                  onClick={() => handleFunctionSelect(func)}
                                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                                    adjustedIndex === functionHighlightedIndex 
                                      ? 'bg-orange-100 dark:bg-orange-900/30' 
                                      : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                  }`}
                                >
                                  <div className="font-medium text-gray-900 dark:text-white flex items-center">
                                    {func.name}
                                    {func.isPayable && (
                                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                        PAYABLE
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {func.inputs.length} inputs • {func.stateMutability}
                                  </div>
                                </button>
                                )
                              })}
                            </div>
                          )}
                          
                          {/* No Results */}
                          {filteredReadFunctions.length === 0 && filteredWriteFunctions.length === 0 && (
                            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                              {functionSearch ? `No functions found matching "${functionSearch}"` : 'No functions available'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Click outside to close dropdown */}
                    {showFunctionDropdown && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowFunctionDropdown(false)}
                      />
                    )}
                  </div>
                </div>
                
                {/* Selected Function Display */}
                {selectedFunction && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Selected Function: {selectedFunction.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {selectedFunction.isReadOnly && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                            READ-ONLY
                          </span>
                        )}
                        {selectedFunction.isPayable && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                            PAYABLE
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFunction.inputs.length} inputs • {selectedFunction.outputs.length} outputs • {selectedFunction.stateMutability}
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setSelectedFunction(null)
                          setFunctionSearch('')
                        }}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Function Execution */}
          {selectedFunction && selectedDeal && (
            <div id="function-execution">
              <FunctionExecutor
              selectedFunction={selectedFunction}
              contractName={selectedContractName}
              contractAddress={contractAddress}
              chainId={chainId}
              selectedDeal={selectedDeal}
              selectedContractDetails={selectedContractDetails}
              onAddressChange={handleAddressChange}
              onChainIdChange={handleChainIdChange}
              addressError={addressError}
              chainIdError={chainIdError}
            />
            </div>
          )}
        </div>
      </div>

      {/* Right Navigation Helper */}
      <PageNavigationHelper sections={navigationSections} />
    </div>
  )
}