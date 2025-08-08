'use client'

import { useState, useEffect } from 'react'
import { ParsedFunction } from '../../types/contracts'
import { FunctionInput } from '../ui/FunctionInput'
import { Card, CardContent, CardTitle, LoadingSpinner } from '../ui'
import { parseSolidityType, convertInputValue } from '../../lib/solidityTypes'
import { encodeFunction, decodeTransaction } from '../../lib/abiEncoding'

interface FunctionExecutorProps {
  selectedFunction: ParsedFunction
  contractName: string
  contractAddress: string
  chainId: string
  selectedDeal?: {
    id: string
    name: string
    role: string
    creation: string
    is_active: boolean
  }
  selectedContractDetails?: {
    address: string
    type: string
    source: string
    id: string
  }
  onAddressChange: (address: string) => void
  onChainIdChange: (chainId: string) => void
  addressError?: string
  chainIdError?: string
}

interface FormData {
  [inputName: string]: string
}

interface FormErrors {
  [inputName: string]: string
}

export function FunctionExecutor({ 
  selectedFunction, 
  contractName, 
  contractAddress, 
  chainId, 
  selectedDeal,
  selectedContractDetails,
  onAddressChange, 
  onChainIdChange, 
  addressError, 
  chainIdError 
}: FunctionExecutorProps) {
  const [formData, setFormData] = useState<FormData>({})
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [encodedData, setEncodedData] = useState<ReturnType<typeof encodeFunction> | null>(null)
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('')
  const [transactionData, setTransactionData] = useState<string>('')
  const [decodedTransaction, setDecodedTransaction] = useState<ReturnType<typeof decodeTransaction> | null>(null)

  // Helper functions for datetime conversion
  const getUnixTimestamp = (dateTimeString: string): number => {
    if (!dateTimeString) return 0
    // Treat the datetime-local input as UTC by appending 'Z'
    const utcDateString = dateTimeString + ':00.000Z'
    return Math.floor(new Date(utcDateString).getTime() / 1000)
  }

  const getHexTimestamp = (dateTimeString: string): string => {
    if (!dateTimeString) return '0x0'
    const unixTimestamp = getUnixTimestamp(dateTimeString)
    return '0x' + unixTimestamp.toString(16)
  }

  const formatUTCDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return ''
    // Treat the datetime-local input as UTC by appending 'Z'
    const utcDateString = dateTimeString + ':00.000Z'
    return new Date(utcDateString).toUTCString()
  }

  // Initialize form with default values when function changes
  useEffect(() => {
    const defaultData: FormData = {}
    selectedFunction.inputs.forEach(input => {
      const config = parseSolidityType(input)
      defaultData[input.name] = config.defaultValue
    })
    setFormData(defaultData)
    setFormErrors({})
  }, [selectedFunction])

  // Update encoded data when form data changes
  useEffect(() => {
    try {
      const encoded = encodeFunction(selectedFunction, formData, {
        selectedDealDetails: selectedDeal,
        waterfallConfig: null // Will be added when available
      })
      setEncodedData(encoded)
    } catch (error) {
      console.error('Error encoding function:', error)
      setEncodedData(null)
    }
  }, [selectedFunction, formData, selectedDeal])

  // Update decoded transaction when transaction data changes
  useEffect(() => {
    if (transactionData.trim()) {
      try {
        const decoded = decodeTransaction(selectedFunction, transactionData, {
          selectedDealDetails: selectedDeal,
          waterfallConfig: null // Will be added when available
        })
        setDecodedTransaction(decoded)
      } catch (error) {
        console.error('Error decoding transaction:', error)
        setDecodedTransaction(null)
      }
    } else {
      setDecodedTransaction(null)
    }
  }, [selectedFunction, transactionData, selectedDeal])
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [executionHistory, setExecutionHistory] = useState<Array<{
    timestamp: string
    inputs: FormData
    contractAddress: string
    chainId: string
    result?: unknown
    error?: string
  }>>([])

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    // Address and chain validation is handled by parent component
    if (addressError) isValid = false
    if (chainIdError) isValid = false

    // Validate function inputs
    selectedFunction.inputs.forEach(input => {
      const config = parseSolidityType(input)
      const value = formData[input.name] || ''
      
      const error = config.validation(value)
      if (error) {
        errors[input.name] = error
        isValid = false
      }
    })

    setFormErrors(errors)
    return isValid
  }

  const executeFunction = async () => {
    if (!validateForm()) {
      return
    }

    setIsExecuting(true)
    setError(null)
    setResult(null)

    try {
      // Convert form data to properly typed values
      const convertedInputs = selectedFunction.inputs.map(input => {
        const value = formData[input.name] || ''
        return convertInputValue(value, input.type)
      })

      // Simulate contract call execution
      // In a real implementation, this would call the actual smart contract
      const simulatedResult = await simulateContractCall({
        contractName,
        contractAddress,
        chainId: parseInt(chainId),
        functionName: selectedFunction.name,
        inputs: convertedInputs,
        isReadOnly: selectedFunction.isReadOnly
      })

      setResult(simulatedResult)
      
      // Add to execution history
      setExecutionHistory(prev => [{
        timestamp: new Date().toLocaleString(),
        inputs: { ...formData },
        contractAddress,
        chainId,
        result: simulatedResult
      }, ...prev.slice(0, 4)]) // Keep last 5 executions

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed'
      setError(errorMessage)
      
      // Add to execution history
      setExecutionHistory(prev => [{
        timestamp: new Date().toLocaleString(),
        inputs: { ...formData },
        contractAddress,
        chainId,
        error: errorMessage
      }, ...prev.slice(0, 4)])
      
    } finally {
      setIsExecuting(false)
    }
  }

  const hasRequiredInputs = selectedFunction.inputs.length > 0

  return (
    <div className="space-y-6">
      {/* Function Signature */}
      <Card>
        <CardContent>
          <CardTitle className="mb-4 flex items-center justify-between">
            <span>Execute: {selectedFunction.name}</span>
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
          </CardTitle>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
              {selectedFunction.signature}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              State Mutability: {selectedFunction.stateMutability}
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Function Inputs */}
      {hasRequiredInputs && (
        <Card>
          <CardContent>
            <CardTitle className="mb-6">Function Parameters</CardTitle>
            
            <div className="space-y-4">
              {selectedFunction.inputs.map((input, index) => (
                <FunctionInput
                  key={index}
                  input={input}
                  value={formData[input.name] || ''}
                  onChange={handleInputChange}
                  error={formErrors[input.name]}
                  context={{
                    selectedDealDetails: selectedDeal,
                    waterfallConfig: null, // Will be available when waterfall config is passed
                    selectedFunction: selectedFunction
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encoded Call Data */}
      {encodedData && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Encoded Call Data</CardTitle>
            
            <div className="space-y-4">
              {/* Function Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Function Selector
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                  <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {encodedData.functionSelector}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    First 4 bytes of keccak256({encodedData.decodedView.signature})
                  </div>
                </div>
              </div>

              {/* Encoded Parameters */}
              {encodedData.decodedView.parameters.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Encoded Parameters
                  </label>
                  <div className="space-y-2">
                    {encodedData.decodedView.parameters.map((param, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            {param.name} ({param.type})
                          </span>
                        </div>
                        <div className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all mb-1">
                          Value: {JSON.stringify(param.value)}
                        </div>
                        {param.decimalInfo && (
                          <div className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all mb-1">
                            Decimal: {param.decimalInfo.formatted} (using {param.decimalInfo.decimals} decimals)
                          </div>
                        )}
                        <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
                          Encoded: {param.encoded}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Call Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complete Call Data
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                  <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {encodedData.fullCallData}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This is the exact data that would be sent to the contract
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(encodedData.fullCallData)}
                    className="mt-2 text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Decoder */}
      <div id="transaction-decoder">
        <Card>
        <CardContent>
          <CardTitle className="mb-4">Transaction Decoder</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Debug failing transactions by pasting the raw transaction data below. This will decode the parameters based on the selected function&apos;s signature.
          </p>
          
          <div className="space-y-4">
            {/* Transaction Data Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Data (Hex)
              </label>
              <textarea
                value={transactionData}
                onChange={(e) => setTransactionData(e.target.value)}
                placeholder="0x12345678abcdef..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Paste the complete transaction data including function selector and parameters
              </p>
            </div>

            {/* Decoded Result */}
            {decodedTransaction && (
              <div className="space-y-4">
                {/* Function Selector Validation */}
                <div className={`p-4 rounded-lg border ${
                  decodedTransaction.isValid 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {decodedTransaction.isValid ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      decodedTransaction.isValid 
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      Function Selector {decodedTransaction.isValid ? 'Match' : 'Mismatch'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Found: </span>
                      <span className="font-mono">{decodedTransaction.functionSelector}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Expected: </span>
                      <span className="font-mono">{decodedTransaction.expectedSelector}</span>
                    </div>
                    {decodedTransaction.error && (
                      <div className="mt-2">
                        <span className="font-medium text-red-600 dark:text-red-400">Error: </span>
                        <span className="text-red-700 dark:text-red-300">{decodedTransaction.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decoded Parameters */}
                {decodedTransaction.decodedParameters.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Decoded Parameters
                    </h4>
                    <div className="space-y-3">
                      {decodedTransaction.decodedParameters.map((param, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                {param.name}
                              </span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {param.type}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigator.clipboard.writeText(param.value)}
                                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                              >
                                Copy Raw
                              </button>
                              {param.decimalInfo && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(param.decimalInfo!.formatted)}
                                  className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-800 dark:text-green-200 rounded border border-green-300 dark:border-green-600 transition-colors"
                                >
                                  Copy Decimal
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Decoded Value
                              </label>
                              <div className="bg-white dark:bg-gray-700 p-2 rounded border font-mono text-sm text-gray-900 dark:text-white break-all">
                                {param.displayValue}
                              </div>
                            </div>

                            {param.decimalInfo && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Decimal Formatted
                                </label>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <div className="font-mono text-sm text-blue-900 dark:text-blue-100" title={`Full precision: ${param.decimalInfo.fullPrecision}`}>
                                    {param.decimalInfo.formatted}
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Raw: {param.decimalInfo.raw} • Decimals: {param.decimalInfo.decimals}
                                  </div>
                                  {param.decimalInfo.formatted.includes('...') && (
                                    <div className="text-xs text-blue-500 dark:text-blue-300 mt-1 italic">
                                      Hover to see full precision
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {param.decodedElements && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Array Elements
                                </label>
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
                                  <div className="text-xs text-green-600 dark:text-green-400 mb-2">
                                    {param.decodedElements.length} elements:
                                  </div>
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {param.decodedElements.map((element, index) => (
                                      <div key={index} className="font-mono text-xs text-green-800 dark:text-green-200 bg-white dark:bg-gray-800 p-2 rounded border">
                                        <div className="font-semibold text-green-600 dark:text-green-400 mb-1">[{index}]:</div>
                                        {typeof element === 'object' && element !== null ? (
                                          <div className="space-y-1 pl-2">
                                            {Object.entries(element as Record<string, unknown>).map(([key, value]) => (
                                              <div key={key} className="text-green-700 dark:text-green-300">
                                                <span className="text-green-600 dark:text-green-400 font-medium">{key}:</span> {String(value)}
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="pl-2">{String(element)}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {param.decodedFields && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Struct Fields
                                </label>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-200 dark:border-purple-700">
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {Object.entries(param.decodedFields).map(([fieldName, fieldValue]) => (
                                      <div key={fieldName} className="font-mono text-xs text-purple-800 dark:text-purple-200 bg-white dark:bg-gray-800 p-1 rounded">
                                        <span className="text-purple-600 dark:text-purple-400">{fieldName}:</span> {typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : fieldValue}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Raw Hex Data
                              </label>
                              <div className="bg-white dark:bg-gray-700 p-2 rounded border font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                                {param.hexData}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setTransactionData('')
                      setDecodedTransaction(null)
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 transition-colors"
                  >
                    Clear Decoder
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Optional Execution Scheduling */}
      <Card>
        <CardContent>
          <CardTitle className="mb-4">Execution Scheduling (Optional)</CardTitle>
          
          <div className="space-y-4">
            {/* DateTime Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Execution Date & Time (UTC)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    input?.focus()
                    input?.showPicker?.()
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select the date and time when the transaction should be executed (in UTC timezone)
              </p>
            </div>

            {/* Conversion Display */}
            {scheduledDateTime && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timestamp Conversions
                </div>
                
                {/* UTC Format */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    UTC DateTime
                  </label>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border font-mono text-sm text-gray-900 dark:text-white">
                    {formatUTCDateTime(scheduledDateTime)}
                  </div>
                </div>

                {/* Unix Timestamp */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Unix Timestamp
                  </label>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border font-mono text-sm text-gray-900 dark:text-white flex items-center justify-between">
                    <span>{getUnixTimestamp(scheduledDateTime)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(getUnixTimestamp(scheduledDateTime).toString())}
                      className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Hex Representation */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Hex Representation
                  </label>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border font-mono text-sm text-gray-900 dark:text-white flex items-center justify-between">
                    <span>{getHexTimestamp(scheduledDateTime)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(getHexTimestamp(scheduledDateTime))}
                      className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Helpful Info */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 You can copy these timestamp values to use in function parameters that require time-based inputs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execute Button */}
      <Card>
        <CardContent>
          <button
            onClick={executeFunction}
            disabled={isExecuting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              selectedFunction.isReadOnly
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {isExecuting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Executing...
              </>
            ) : (
              selectedFunction.isReadOnly ? 'Call Function' : 'Send Transaction'
            )}
          </button>
        </CardContent>
      </Card>

      {/* Execution Result */}
      {(result !== null || error) && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Execution Result</CardTitle>
            
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 font-medium">Error:</p>
                <p className="text-red-700 dark:text-red-300 mt-1 font-mono text-sm">{error}</p>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-medium mb-2">Success:</p>
                <pre className="text-green-700 dark:text-green-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Recent Executions</CardTitle>
            
            <div className="space-y-3">
              {executionHistory.map((execution, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {execution.timestamp}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      execution.error 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {execution.error ? 'Failed' : 'Success'}
                    </span>
                  </div>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                      View Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <strong className="text-gray-600 dark:text-gray-400">Contract:</strong>
                          <p className="font-mono bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1">
                            {execution.contractAddress}
                          </p>
                        </div>
                        <div>
                          <strong className="text-gray-600 dark:text-gray-400">Chain ID:</strong>
                          <p className="font-mono bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1">
                            {execution.chainId}
                          </p>
                        </div>
                      </div>
                      <div>
                        <strong className="text-gray-600 dark:text-gray-400">Function Inputs:</strong>
                        <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1">
                          {JSON.stringify(execution.inputs, null, 2)}
                        </pre>
                      </div>
                      {execution.result && (
                        <div>
                          <strong className="text-gray-600 dark:text-gray-400">Result:</strong>
                          <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1">
                            {JSON.stringify(execution.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {execution.error && (
                        <div>
                          <strong className="text-gray-600 dark:text-gray-400">Error:</strong>
                          <p className="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 text-red-600 dark:text-red-400">
                            {execution.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Simulated contract call function
async function simulateContractCall({
  contractName,
  contractAddress,
  chainId,
  functionName,
  inputs,
  isReadOnly
}: {
  contractName: string
  contractAddress: string
  chainId: number
  functionName: string
  inputs: unknown[]
  isReadOnly: boolean
}): Promise<unknown> {
  // Use parameters to avoid unused variable warnings
  console.log(`Simulating ${functionName} on ${contractName} at ${contractAddress} on chain ${chainId}`)
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // Simulate different response types based on function
  if (isReadOnly) {
    // Simulate read function responses
    if (functionName.toLowerCase().includes('balance')) {
      return (Math.random() * 1000000).toFixed(0)
    }
    if (functionName.toLowerCase().includes('total')) {
      return (Math.random() * 10000000).toFixed(0)
    }
    if (functionName.toLowerCase().includes('address')) {
      return '0x742d35Cc6851C6c8A03DF4C40c68a7e18A2dF0A8'
    }
    if (functionName.toLowerCase().includes('bool') || functionName.toLowerCase().includes('is')) {
      return Math.random() > 0.5
    }
    
    // Default read response
    return `Simulated response for ${functionName}(${inputs.map(i => JSON.stringify(i)).join(', ')})`
  } else {
    // Simulate write function responses (transaction hash)
    return {
      transactionHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      gasUsed: Math.floor(Math.random() * 200000) + 21000
    }
  }
}