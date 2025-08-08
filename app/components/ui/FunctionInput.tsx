'use client'

import { useState } from 'react'
import { FunctionInput as FunctionInputType } from '../../types/contracts'
import { parseSolidityType, StructField, generateEmptyTemplate, generateExampleTemplate } from '../../lib/solidityTypes'
import { getDecimalsFromContext, shouldShowDecimals, parseFromDecimals, formatWithDecimals } from '../../lib/decimalUtils'

interface FunctionInputProps {
  input: FunctionInputType
  value: string
  onChange: (name: string, value: string) => void
  error?: string
  context?: {
    selectedDealDetails?: Record<string, unknown>
    waterfallConfig?: Record<string, unknown>
    selectedFunction?: Record<string, unknown>
  }
}

export function FunctionInput({ input, value, onChange, error, context }: FunctionInputProps) {
  const config = parseSolidityType(input)
  const [focused, setFocused] = useState(false)
  const [showStructFormat, setShowStructFormat] = useState(false)
  
  // Decimal handling for uint types
  const shouldUseDecimals = shouldShowDecimals(input.type, input.name)
  const decimals = shouldUseDecimals ? getDecimalsFromContext({
    selectedDealDetails: context?.selectedDealDetails,
    waterfallConfig: context?.waterfallConfig,
    selectedFunction: context?.selectedFunction,
    parameterName: input.name
  }) : 0
  
  const [decimalValue, setDecimalValue] = useState('')
  const [customDecimals, setCustomDecimals] = useState(decimals.toString())
  
  const handleChange = (newValue: string) => {
    onChange(input.name, newValue)
  }

  const handleDecimalValueChange = (newDecimalValue: string) => {
    setDecimalValue(newDecimalValue)
    if (newDecimalValue.trim()) {
      const rawValue = parseFromDecimals(newDecimalValue, parseInt(customDecimals))
      handleChange(rawValue)
    } else {
      handleChange('')
    }
  }

  const handleDecimalsChange = (newDecimals: string) => {
    setCustomDecimals(newDecimals)
    if (decimalValue.trim()) {
      const rawValue = parseFromDecimals(decimalValue, parseInt(newDecimals) || 0)
      handleChange(rawValue)
    }
  }

  const handleRawValueChange = (newRawValue: string) => {
    handleChange(newRawValue)
    if (newRawValue.trim() && parseInt(customDecimals) > 0) {
      const formatted = formatWithDecimals(newRawValue, parseInt(customDecimals))
      setDecimalValue(formatted)
    } else {
      setDecimalValue('')
    }
  }

  const renderStructFields = (fields: StructField[], depth: number): JSX.Element[] => {
    return fields.map((field, index) => (
      <div key={index} className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-2' : ''}`}>
        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
          <span className="font-mono text-blue-600 dark:text-blue-400">{field.name}</span>
          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{field.type}</span>
        </div>
        {field.components && field.components.length > 0 && (
          <div className="mt-1 mb-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">
              {field.type.includes('[') ? 'Array items:' : 'Nested fields:'}
            </div>
            {renderStructFields(field.components, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  const renderInput = () => {
    if (config.type === 'bool') {
      return (
        <select
          value={value || 'false'}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      )
    }

    if (config.isArray) {
      // Calculate appropriate height based on content
      const lineCount = (value || config.defaultValue).split('\n').length
      const minRows = config.isStruct ? Math.max(6, Math.min(lineCount + 2, 20)) : Math.max(3, Math.min(lineCount + 1, 10))
      
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={config.placeholder}
          rows={minRows}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y"
        />
      )
    }

    if (config.isStruct) {
      // Calculate appropriate height based on content
      const lineCount = (value || config.defaultValue).split('\n').length
      const minRows = Math.max(6, Math.min(lineCount + 2, 20)) // Between 6-20 rows
      
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={config.placeholder}
          rows={minRows}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y"
        />
      )
    }

    // Special handling for uint types with decimal support
    if (shouldUseDecimals && (input.type.startsWith('uint') || input.type.startsWith('int'))) {
      return (
        <div className="space-y-3">
          {/* Decimal Input Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Decimal Amount Input
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={decimalValue}
                  onChange={(e) => handleDecimalValueChange(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter amount (e.g., 1.5)"
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">× 10^</span>
              
              <div className="w-20">
                <input
                  type="number"
                  value={customDecimals}
                  onChange={(e) => handleDecimalsChange(e.target.value)}
                  min="0"
                  max="36"
                  className="w-full px-2 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>
            </div>
            
            {decimalValue && (
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Will encode as: <span className="font-mono">{value}</span>
              </div>
            )}
          </div>

          {/* Raw Input Section */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Raw Value (Advanced)
              </span>
            </div>
            
            <input
              type="text"
              value={value}
              onChange={(e) => handleRawValueChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Raw uint value (e.g., 1500000000000000000)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            
            {value && parseInt(customDecimals) > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Decimal equivalent: <span className="font-mono">{formatWithDecimals(value, parseInt(customDecimals))}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={config.placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="flex items-center justify-between">
          <span>
            {input.name}
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {input.type}
            </span>
          </span>
          {input.internalType && input.internalType !== input.type && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {input.internalType}
            </span>
          )}
        </span>
      </label>
      
      {renderInput()}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {(config.isArray || config.isStruct) && config.structFields && config.structFields.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded border">
          {/* Collapsible Header */}
          <button
            onClick={() => setShowStructFormat(!showStructFormat)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
          >
            <strong className="text-gray-700 dark:text-gray-300">
              {config.isArray ? 'Array of Structs Format' : 'Struct Format'} ({config.structFields.length} fields)
            </strong>
            <svg 
              className={`w-4 h-4 transform transition-transform ${showStructFormat ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Collapsible Content */}
          {showStructFormat && (
            <div className="px-3 pb-3 space-y-2">
              <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                <div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Required fields:</div>
                {renderStructFields(config.structFields, 0)}
              </div>

              {/* Template Options */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <strong>Templates:</strong>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleChange(config.isArray ? `[${generateEmptyTemplate(config.structFields || [])}]` : generateEmptyTemplate(config.structFields || []))}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600 transition-colors"
                      >
                        Empty
                      </button>
                      <button
                        onClick={() => handleChange(config.isArray ? `[${generateExampleTemplate(config.structFields || [])}]` : generateExampleTemplate(config.structFields || []))}
                        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded border border-blue-300 dark:border-blue-600 transition-colors"
                      >
                        Example
                      </button>
                    </div>
                  </div>
                  
                  {/* Current Template Display */}
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current template:</div>
                    <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                      {config.defaultValue}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {focused && (config.isArray || config.isStruct) && (!config.structFields || config.structFields.length === 0) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
          <strong>Format:</strong> {config.isArray ? 'JSON Array' : 'JSON Object'}
          <br />
          <strong>Example:</strong> {config.isArray ? '["item1", "item2"]' : '{"field": "value"}'}
        </div>
      )}
    </div>
  )
}