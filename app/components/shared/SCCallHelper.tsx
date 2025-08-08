'use client'

import React, { useState } from 'react'
import { Deal, DealDetails, WaterfallConfigResponse, ParsedFunction } from '../../types/contracts'

interface SCCallHelperProps {
  selectedDeal: Deal | null
  selectedDealDetails: DealDetails | null
  waterfallConfig: WaterfallConfigResponse | null
  selectedContractDetails: {
    address: string
    type: string
    source: string
    id: string
  } | null
  selectedFunction: ParsedFunction | null
  onValueClick: (value: string, label: string) => void
}

interface ClickableValueProps {
  label: string
  value: string
  onCopy: (value: string, label: string) => void
  type?: 'address' | 'number' | 'string'
}

function ClickableValue({ label, value, onCopy, type = 'string' }: ClickableValueProps) {
  const handleClick = () => {
    onCopy(value, label)
  }

  const formatValue = (val: string, valueType: string) => {
    if (valueType === 'address' && val.length === 42) {
      return `${val.slice(0, 6)}...${val.slice(-4)}`
    }
    return val
  }

  const getIcon = () => {
    switch (type) {
      case 'address':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'number':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        )
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group w-full text-left p-2 rounded-md border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
      title={`Click to use: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="text-gray-400 group-hover:text-blue-500">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
              {label}
            </div>
            <div className="text-sm font-mono text-gray-900 dark:text-white truncate">
              {formatValue(value, type)}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  count?: number
}

function CollapsibleSection({ title, children, defaultOpen = false, icon, count }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {title}
          </span>
          {count !== undefined && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {count}
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 space-y-2 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}

export function SCCallHelper({
  selectedDeal,
  selectedDealDetails,
  waterfallConfig,
  selectedContractDetails,
  selectedFunction,
  onValueClick
}: SCCallHelperProps) {
  const handleValueClick = (value: string, label: string) => {
    onValueClick(value, label)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Helper Data
        </h3>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        💡 Click any value below to use it in your transaction inputs
      </div>

      <div className="space-y-3">
        {/* Deal Information */}
        {selectedDeal && (
          <CollapsibleSection
            title="Deal Information"
            defaultOpen={false}
            icon={
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            <ClickableValue
              label="Deal ID"
              value={selectedDeal.id}
              onCopy={handleValueClick}
              type="string"
            />
            <ClickableValue
              label="Deal Name"
              value={selectedDeal.name}
              onCopy={handleValueClick}
              type="string"
            />
            <ClickableValue
              label="Role"
              value={selectedDeal.role}
              onCopy={handleValueClick}
              type="string"
            />
            {selectedDealDetails?.chain_id && (
              <ClickableValue
                label="Chain ID"
                value={selectedDealDetails.chain_id}
                onCopy={handleValueClick}
                type="number"
              />
            )}
            {selectedDealDetails?.sc_version && (
              <ClickableValue
                label="SC Version"
                value={selectedDealDetails.sc_version}
                onCopy={handleValueClick}
                type="string"
              />
            )}
          </CollapsibleSection>
        )}

        {/* Current Contract */}
        {selectedContractDetails && (
          <CollapsibleSection
            title="Selected Contract"
            defaultOpen={false}
            icon={
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            }
          >
            <ClickableValue
              label="Contract Address"
              value={selectedContractDetails.address}
              onCopy={handleValueClick}
              type="address"
            />
            <ClickableValue
              label="Contract Type"
              value={selectedContractDetails.type}
              onCopy={handleValueClick}
              type="string"
            />
            <ClickableValue
              label="Source"
              value={selectedContractDetails.source}
              onCopy={handleValueClick}
              type="string"
            />
          </CollapsibleSection>
        )}

        {/* Selected Function */}
        {selectedFunction && (
          <CollapsibleSection
            title="Selected Function"
            defaultOpen={false}
            icon={
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          >
            <ClickableValue
              label="Function Name"
              value={selectedFunction.name}
              onCopy={handleValueClick}
              type="string"
            />
            <ClickableValue
              label="State Mutability"
              value={selectedFunction.stateMutability}
              onCopy={handleValueClick}
              type="string"
            />
            {selectedFunction.inputs.map((input, index) => (
              <div key={index} className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                <ClickableValue
                  label={`Input: ${input.name} (${input.type})`}
                  value={input.name}
                  onCopy={handleValueClick}
                  type="string"
                />
              </div>
            ))}
          </CollapsibleSection>
        )}

        {/* Waterfall Configuration */}
        {waterfallConfig && (
          <>
            {/* Pool Addresses */}
            {(() => {
              const poolAddresses = new Set<string>()
              waterfallConfig.borrowers.forEach(b => {
                if (b.pool_address) poolAddresses.add(b.pool_address)
              })
              waterfallConfig.lenders.forEach(l => {
                if (l.pool_address) poolAddresses.add(l.pool_address)
                if (l.waterfall_config?.pool_address) poolAddresses.add(l.waterfall_config.pool_address)
              })
              
              return poolAddresses.size > 0 ? (
                <CollapsibleSection
                  title="Pool Addresses"
                  count={poolAddresses.size}
                  icon={
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                >
                  {Array.from(poolAddresses).map((address, index) => (
                    <ClickableValue
                      key={index}
                      label={`Pool ${index + 1}`}
                      value={address}
                      onCopy={handleValueClick}
                      type="address"
                    />
                  ))}
                </CollapsibleSection>
              ) : null
            })()}

            {/* Lender Addresses */}
            {(() => {
              const lenderAddresses = new Set<string>()
              waterfallConfig.lenders.forEach(l => {
                if (l.l_a_address) lenderAddresses.add(l.l_a_address)
                if (l.waterfall_config?.lender_address) lenderAddresses.add(l.waterfall_config.lender_address)
              })
              
              return lenderAddresses.size > 0 ? (
                <CollapsibleSection
                  title="Lender Addresses"
                  count={lenderAddresses.size}
                  icon={
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                >
                  {Array.from(lenderAddresses).map((address, index) => (
                    <ClickableValue
                      key={index}
                      label={`Lender ${index + 1}`}
                      value={address}
                      onCopy={handleValueClick}
                      type="address"
                    />
                  ))}
                </CollapsibleSection>
              ) : null
            })()}

            {/* Borrower Addresses */}
            {(() => {
              const borrowerAddresses = new Set<string>()
              waterfallConfig.borrowers.forEach(b => {
                if (b.waterfall_config?.borrower_address) borrowerAddresses.add(b.waterfall_config.borrower_address)
              })
              waterfallConfig.lenders.forEach(l => {
                if (l.waterfall_config?.borrower_address) borrowerAddresses.add(l.waterfall_config.borrower_address)
              })
              
              return borrowerAddresses.size > 0 ? (
                <CollapsibleSection
                  title="Borrower Addresses"
                  count={borrowerAddresses.size}
                  icon={
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
                  {Array.from(borrowerAddresses).map((address, index) => (
                    <ClickableValue
                      key={index}
                      label={`Borrower ${index + 1}`}
                      value={address}
                      onCopy={handleValueClick}
                      type="address"
                    />
                  ))}
                </CollapsibleSection>
              ) : null
            })()}

            {/* Permissions Registry */}
            {(() => {
              const permissionsAddresses = new Set<string>()
              waterfallConfig.borrowers.forEach(b => {
                if (b.waterfall_config?.tranche_params) {
                  b.waterfall_config.tranche_params.forEach((tp: any) => {
                    if (tp.tranche_permissions_registry) permissionsAddresses.add(tp.tranche_permissions_registry)
                  })
                }
              })
              waterfallConfig.lenders.forEach(l => {
                if (l.waterfall_config?.tranche_params?.tranche_permissions_registry) {
                  permissionsAddresses.add(l.waterfall_config.tranche_params.tranche_permissions_registry)
                }
              })
              
              return permissionsAddresses.size > 0 ? (
                <CollapsibleSection
                  title="Permissions Registry"
                  count={permissionsAddresses.size}
                  icon={
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                >
                  {Array.from(permissionsAddresses).map((address, index) => (
                    <ClickableValue
                      key={index}
                      label={`Registry ${index + 1}`}
                      value={address}
                      onCopy={handleValueClick}
                      type="address"
                    />
                  ))}
                </CollapsibleSection>
              ) : null
            })()}

            {/* Rates Oracle */}
            {(() => {
              const oracleAddresses = new Set<string>()
              waterfallConfig.borrowers.forEach(b => {
                if (b.waterfall_config?.tranche_params) {
                  b.waterfall_config.tranche_params.forEach((tp: any) => {
                    if (tp.rates_oracle) oracleAddresses.add(tp.rates_oracle)
                  })
                }
              })
              waterfallConfig.lenders.forEach(l => {
                if (l.waterfall_config?.tranche_params?.rates_oracle) {
                  oracleAddresses.add(l.waterfall_config.tranche_params.rates_oracle)
                }
              })
              
              return oracleAddresses.size > 0 ? (
                <CollapsibleSection
                  title="Rates Oracle"
                  count={oracleAddresses.size}
                  icon={
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                >
                  {Array.from(oracleAddresses).map((address, index) => (
                    <ClickableValue
                      key={index}
                      label={`Oracle ${index + 1}`}
                      value={address}
                      onCopy={handleValueClick}
                      type="address"
                    />
                  ))}
                </CollapsibleSection>
              ) : null
            })()}

            {/* Lender Waterfall Configs */}
            {waterfallConfig.lenders.some(l => l.waterfall_config) && (
              <CollapsibleSection
                title="Lender Waterfall Configs"
                count={waterfallConfig.lenders.filter(l => l.waterfall_config).length}
                icon={
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              >
                {waterfallConfig.lenders.map((lender, lenderIndex) => {
                  if (!lender.waterfall_config) return null
                  const config = lender.waterfall_config
                  return (
                    <div key={lenderIndex} className="space-y-3 p-3 border-2 border-cyan-200 dark:border-cyan-700 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10">
                      {/* Lender Header */}
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-cyan-900 dark:text-cyan-100 text-sm">
                          {lender.name}
                        </div>
                        <div className="text-xs bg-cyan-100 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 px-2 py-1 rounded">
                          {lender.type}
                        </div>
                      </div>

                      {/* Basic Config Fields */}
                      <div className="space-y-2">
                        {config.tranche_id !== undefined && (
                          <ClickableValue
                            label="Tranche ID"
                            value={config.tranche_id.toString()}
                            onCopy={handleValueClick}
                            type="number"
                          />
                        )}
                        
                        {config.pool_address && (
                          <ClickableValue
                            label="Pool Address"
                            value={config.pool_address}
                            onCopy={handleValueClick}
                            type="address"
                          />
                        )}
                        
                        {config.lender_address && (
                          <ClickableValue
                            label="Lender Address"
                            value={config.lender_address}
                            onCopy={handleValueClick}
                            type="address"
                          />
                        )}
                        
                        {config.borrower_address && (
                          <ClickableValue
                            label="Borrower Address"
                            value={config.borrower_address}
                            onCopy={handleValueClick}
                            type="address"
                          />
                        )}
                      </div>

                      {/* Tranche Params */}
                      {config.tranche_params && (
                        <div className="border-l-4 border-indigo-300 dark:border-indigo-600 pl-3 space-y-2">
                          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                            Tranche Parameters
                          </div>
                          
                          {typeof config.tranche_params.tranche_id !== 'undefined' && (
                            <ClickableValue
                              label="Params Tranche ID"
                              value={config.tranche_params.tranche_id.toString()}
                              onCopy={handleValueClick}
                              type="number"
                            />
                          )}
                          
                          {config.tranche_params.tranche_permissions_registry && (
                            <ClickableValue
                              label="Tranche Permissions Registry"
                              value={config.tranche_params.tranche_permissions_registry}
                              onCopy={handleValueClick}
                              type="address"
                            />
                          )}
                          
                          {config.tranche_params.rates_oracle && (
                            <ClickableValue
                              label="Rates Oracle"
                              value={config.tranche_params.rates_oracle}
                              onCopy={handleValueClick}
                              type="address"
                            />
                          )}

                          {/* Handle any other tranche_params fields dynamically */}
                          {Object.entries(config.tranche_params).map(([key, value]) => {
                            // Skip already handled fields
                            if (['tranche_id', 'tranche_permissions_registry', 'rates_oracle'].includes(key)) {
                              return null
                            }
                            
                            // Only show if value exists and is not null/undefined
                            if (value === null || value === undefined || value === '') {
                              return null
                            }
                            
                            return (
                              <ClickableValue
                                key={key}
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                value={value.toString()}
                                onCopy={handleValueClick}
                                type={typeof value === 'string' && value.startsWith('0x') && value.length === 42 ? 'address' : 'string'}
                              />
                            )
                          })}
                        </div>
                      )}

                      {/* Handle any other waterfall_config fields dynamically */}
                      {Object.entries(config).map(([key, value]) => {
                        // Skip already handled fields
                        if (['tranche_id', 'pool_address', 'lender_address', 'borrower_address', 'tranche_params'].includes(key)) {
                          return null
                        }
                        
                        // Only show if value exists and is not null/undefined
                        if (value === null || value === undefined || value === '' || typeof value === 'object') {
                          return null
                        }
                        
                        return (
                          <div key={key} className="border-l-4 border-gray-300 dark:border-gray-600 pl-3">
                            <ClickableValue
                              label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              value={value.toString()}
                              onCopy={handleValueClick}
                              type={typeof value === 'string' && value.startsWith('0x') && value.length === 42 ? 'address' : 'string'}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </CollapsibleSection>
            )}
          </>
        )}
      </div>
    </div>
  )
}