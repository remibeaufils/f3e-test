import { ParsedFunction, FunctionInput } from '../types/contracts'
import { convertInputValue } from './solidityTypes'
import { keccak256 } from 'js-sha3'
import { formatUintWithDecimals, getDecimalsFromContext, shouldShowDecimals } from './decimalUtils'

/**
 * Convert ABI type to canonical format for function signatures
 * tuple(string,uint256) -> (string,uint256)
 * tuple(string,uint256)[] -> (string,uint256)[]
 */
function normalizeTypeForSignature(input: FunctionInput): string {
  if (input.type === 'tuple' && input.components) {
    // Convert tuple to canonical format with parentheses
    const componentTypes = input.components.map(comp => normalizeTypeForSignature(comp)).join(',')
    return `(${componentTypes})`
  }
  
  if (input.type.startsWith('tuple[') && input.components) {
    // Handle array of tuples: tuple[] -> (...)[] or tuple[N] -> (...)[N]
    const componentTypes = input.components.map(comp => normalizeTypeForSignature(comp)).join(',')
    const arrayPart = input.type.slice(5) // Remove "tuple" and keep the array part
    return `(${componentTypes})${arrayPart}`
  }
  
  // For basic types (uint256, address, etc.) and arrays of basic types, return as-is
  return input.type
}

/**
 * Generate canonical function signature for Ethereum
 * This properly handles structs/tuples by converting them to parentheses format
 */
export function getCanonicalSignature(functionName: string, inputs: FunctionInput[]): string {
  const paramTypes = inputs.map(input => normalizeTypeForSignature(input)).join(',')
  return `${functionName}(${paramTypes})`
}

/**
 * Generates the function selector (first 4 bytes of keccak256 hash of function signature)
 * This follows the Ethereum standard for function selectors
 */
export function getFunctionSelector(functionSignature: string): string {
  // Remove any whitespace and ensure proper format
  const cleanSignature = functionSignature.trim()
  
  // Calculate Keccak-256 hash of the function signature
  const hash = keccak256(cleanSignature)
  
  // Return first 4 bytes (8 hex characters) with 0x prefix
  return '0x' + hash.slice(0, 8)
}

/**
 * Generate function selector from ParsedFunction
 */
export function getFunctionSelectorFromInputs(functionName: string, inputs: FunctionInput[]): string {
  const canonicalSignature = getCanonicalSignature(functionName, inputs)
  return getFunctionSelector(canonicalSignature)
}

/**
 * Hash a string to simulate content-based encoding using Keccak-256
 */
function hashValue(value: string): string {
  const hash = keccak256(value || '')
  return hash.padStart(64, '0')
}

/**
 * Parse array type to get base type and size
 */
function parseArrayType(type: string): { baseType: string; isFixedSize: boolean; size?: number } {
  const arrayMatch = type.match(/^(.+)\[(\d*)\]$/)
  if (!arrayMatch) {
    return { baseType: type, isFixedSize: false }
  }
  
  const baseType = arrayMatch[1]
  const sizeStr = arrayMatch[2]
  
  if (sizeStr === '') {
    return { baseType, isFixedSize: false }
  } else {
    return { baseType, isFixedSize: true, size: parseInt(sizeStr) }
  }
}

/**
 * Parse tuple type to extract component types
 */
function parseTupleType(input: { components?: { type: string }[] }): string[] {
  if (input.components && Array.isArray(input.components)) {
    return input.components.map((comp: { type: string }) => comp.type)
  }
  return []
}

/**
 * Encode a single basic parameter (non-array, non-struct)
 */
function encodeBasicParameter(type: string, value: string): string {
  if (type === 'address') {
    // Clean and pad address
    const addr = value.replace('0x', '').toLowerCase()
    return addr.padStart(64, '0')
  } 
  
  if (type.startsWith('uint') || type.startsWith('int')) {
    // Handle large numbers with BigInt
    try {
      let num: bigint
      if (value.startsWith('0x')) {
        num = BigInt(value)
      } else {
        num = BigInt(value || '0')
      }
      return num.toString(16).padStart(64, '0')
    } catch {
      // Fallback for invalid numbers
      return '0'.padStart(64, '0')
    }
  }
  
  if (type === 'bool') {
    // Boolean as padded hex
    const boolVal = value.toLowerCase() === 'true' ? '1' : '0'
    return boolVal.padStart(64, '0')
  }
  
  if (type === 'string') {
    // For dynamic strings, we'll simulate with a hash for now
    return hashValue(value || '')
  }
  
  if (type.startsWith('bytes')) {
    // Handle static bytes (bytes1, bytes32, etc.)
    if (type.match(/^bytes\d+$/)) {
      const cleanHex = (value || '').replace('0x', '')
      return cleanHex.padEnd(64, '0').slice(0, 64)
    } else {
      // Dynamic bytes
      return hashValue(value || '0x')
    }
  }
  
  // Fallback: hash the raw value
  return hashValue(value || '')
}

/**
 * Encode a single parameter based on its type and value
 */
function encodeParameter(type: string, value: string, input?: { components?: { type: string }[] }): string {
  // Handle arrays
  if (type.includes('[')) {
    const { baseType, isFixedSize, size } = parseArrayType(type)
    
    try {
      const arrayData = JSON.parse(value || '[]')
      if (!Array.isArray(arrayData)) {
        throw new Error('Invalid array format')
      }
      
      const encodedElements: string[] = []
      
      // For fixed-size arrays, pad or truncate to the correct size
      const targetSize = isFixedSize ? size! : arrayData.length
      
      for (let i = 0; i < targetSize; i++) {
        const elementValue = i < arrayData.length ? arrayData[i] : ''
        const elementStr = typeof elementValue === 'object' ? JSON.stringify(elementValue) : String(elementValue)
        
        if (baseType.startsWith('tuple')) {
          // Handle array of structs - use simulated encoding
          if (input?.components && typeof elementValue === 'object') {
            const structEncoded = simulateStructEncoding(input.components, elementValue as Record<string, unknown>)
            encodedElements.push(structEncoded)
          } else {
            const encoded = encodeParameter(baseType, elementStr, input)
            encodedElements.push(encoded)
          }
        } else {
          // Handle array of basic types
          const encoded = encodeBasicParameter(baseType, elementStr)
          encodedElements.push(encoded)
        }
      }
      
      // For dynamic arrays, prepend the length
      if (!isFixedSize) {
        const lengthHex = arrayData.length.toString(16).padStart(64, '0')
        return lengthHex + encodedElements.join('')
      } else {
        return encodedElements.join('')
      }
      
    } catch {
      // Fallback: hash the array content
      return hashValue(value || '[]')
    }
  }
  
  // Handle structs/tuples
  if (type.startsWith('tuple')) {
    try {
      const structData = JSON.parse(value || '{}')
      const componentTypes = parseTupleType(input)
      const encodedFields: string[] = []
      
      if (componentTypes.length > 0) {
        // We have component type information
        componentTypes.forEach((componentType, index) => {
          const fieldValue = Array.isArray(structData) ? structData[index] : 
                           (typeof structData === 'object' ? Object.values(structData)[index] : '')
          const fieldStr = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue || '')
          
          const encoded = encodeParameter(componentType, fieldStr, input?.components?.[index])
          encodedFields.push(encoded)
        })
        
        return encodedFields.join('')
      } else {
        // Fallback: hash the struct content
        return hashValue(value || '{}')
      }
    } catch {
      // Fallback: hash the struct content
      return hashValue(value || '{}')
    }
  }
  
  // Handle basic types
  return encodeBasicParameter(type, value)
}

/**
 * Encodes function parameters with proper struct handling
 */
export function encodeParameters(func: ParsedFunction, inputs: Record<string, string>): string {
  const encodedParams: string[] = []
  
  func.inputs.forEach((input) => {
    const value = inputs[input.name] || ''
    const encoded = encodeParameter(input.type, value, input)
    encodedParams.push(encoded)
  })
  
  return encodedParams.join('')
}

/**
 * Decode basic parameter (non-array, non-struct)
 */
function decodeBasicParameter(
  type: string,
  hexData: string,
  parameterName?: string,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
    selectedFunction?: unknown
  }
): {
  value: string;
  displayValue: string;
  decimalInfo?: {
    raw: string;
    formatted: string;
    fullPrecision: string;
    decimals: number;
  }
} {
  // Remove 0x prefix if present
  const cleanHex = hexData.replace('0x', '')
  
  if (type === 'address') {
    // Extract last 40 characters (20 bytes) for address
    const addr = cleanHex.slice(-40)
    return {
      value: '0x' + addr,
      displayValue: '0x' + addr
    }
  }
  
  if (type.startsWith('uint') || type.startsWith('int')) {
    // Convert hex to decimal using BigInt for large numbers
    let rawValue: string
    try {
      if (cleanHex.length === 0) {
        rawValue = '0'
      } else {
        // Use BigInt to handle large numbers without scientific notation
        const bigIntValue = BigInt('0x' + cleanHex)
        rawValue = bigIntValue.toString()
      }
    } catch {
      // Fallback to regular parseInt for smaller numbers
      const num = parseInt(cleanHex, 16)
      rawValue = num.toString()
    }
    
    // Check if this should show decimal formatting
    if (shouldShowDecimals(type, parameterName)) {
      const decimals = getDecimalsFromContext({
        selectedDealDetails: context?.selectedDealDetails,
        waterfallConfig: context?.waterfallConfig,
        selectedFunction: context?.selectedFunction,
        parameterName
      })
      
      const decimalInfo = formatUintWithDecimals(rawValue, decimals)
      
      return {
        value: rawValue,
        displayValue: `${rawValue} (raw) | ${decimalInfo.formatted} (with ${decimals} decimals) | 0x${cleanHex}`,
        decimalInfo
      }
    } else {
      return {
        value: rawValue,
        displayValue: `${rawValue} (0x${cleanHex})`
      }
    }
  }
  
  if (type === 'bool') {
    // Boolean from hex
    const boolVal = parseInt(cleanHex, 16) !== 0
    return {
      value: boolVal.toString(),
      displayValue: boolVal ? 'true' : 'false'
    }
  }
  
  if (type === 'string') {
    return {
      value: '[Dynamic String]',
      displayValue: '[Dynamic String - see raw hex]'
    }
  }
  
  if (type.startsWith('bytes')) {
    if (type.match(/^bytes\d+$/)) {
      // Static bytes
      return {
        value: '0x' + cleanHex,
        displayValue: `0x${cleanHex.slice(0, 20)}${cleanHex.length > 20 ? '...' : ''}`
      }
    } else {
      // Dynamic bytes
      return {
        value: '[Dynamic Bytes]',
        displayValue: '[Dynamic Bytes - see raw hex]'
      }
    }
  }
  
  // Fallback
  return {
    value: '0x' + cleanHex,
    displayValue: '0x' + cleanHex
  }
}

/**
 * Calculate the size in hex characters needed for a specific type
 * This is a simplified version for testing - real ABI encoding is more complex
 */
function getTypeSize(type: string, components?: { type: string; name?: string }[]): number {
  if (type.startsWith('tuple') && components) {
    // For structs, sum up all component sizes (simplified)
    return components.reduce((total, component) => {
      if (component.type.includes('[')) {
        // Arrays in structs - give more space
        return total + 128
      }
      return total + 64 // Basic types
    }, 0)
  }
  
  if (type.includes('[')) {
    // Arrays need dynamic space
    return 128
  }
  
  // Basic types are 32 bytes = 64 hex characters
  return 64
}

/**
 * Simulate proper struct encoding for testing
 * In real ABI encoding, this would be much more complex
 */
function simulateStructEncoding(components: { name: string; type: string }[], structData: Record<string, unknown>): string {
  let encoded = ''
  
  components.forEach(component => {
    const fieldValue = structData[component.name]
    if (component.type === 'string') {
      // Simulate string encoding with hash
      encoded += hashValue(String(fieldValue || ''))
    } else if (component.type === 'uint256') {
      // Encode number
      const num = BigInt(String(fieldValue || '0'))
      encoded += num.toString(16).padStart(64, '0')
    } else if (component.type === 'bool') {
      // Encode boolean
      const boolVal = fieldValue ? '1' : '0'
      encoded += boolVal.padStart(64, '0')
    } else {
      // Fallback
      encoded += hashValue(String(fieldValue || ''))
    }
  })
  
  return encoded
}

/**
 * Decode array parameter with proper ABI decoding
 */
function decodeArrayParameter(
  type: string,
  hexData: string,
  input?: { components?: { type: string; name?: string }[] },
  parameterName?: string,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
    selectedFunction?: unknown
  }
): {
  value: string;
  displayValue: string;
  decodedElements?: unknown[];
} {
  const { baseType, isFixedSize, size } = parseArrayType(type)
  const cleanHex = hexData.replace('0x', '')
  
  try {
    let offset = 0
    let arrayLength: number
    
    if (!isFixedSize) {
      // Dynamic array - first 64 chars are the length
      const lengthHex = cleanHex.slice(0, 64)
      arrayLength = parseInt(lengthHex, 16)
      offset = 64
    } else {
      // Fixed array
      arrayLength = size!
    }
    
    const elements: unknown[] = []
    
    if (baseType.startsWith('tuple')) {
      // Array of structs - each struct needs proper field extraction
      const structSize = getTypeSize(baseType, input?.components)
      
      for (let i = 0; i < arrayLength && offset < cleanHex.length; i++) {
        const structHex = cleanHex.slice(offset, offset + structSize)
        
        // For array of structs, decode each struct properly
        const decoded = decodeStructParameter(baseType, structHex, input?.components, undefined, context)
        
        // Push the decoded fields object for better display
        if (decoded.decodedFields) {
          elements.push(decoded.decodedFields)
        } else {
          // Try to parse the JSON value
          try {
            const parsedValue = JSON.parse(decoded.value)
            elements.push(parsedValue)
          } catch {
            // If parsing fails, try to create a simplified object
            elements.push({ raw: decoded.value, display: decoded.displayValue })
          }
        }
        
        offset += structSize
      }
    } else {
      // Array of basic types
      for (let i = 0; i < arrayLength && offset < cleanHex.length; i++) {
        const elementHex = cleanHex.slice(offset, offset + 64)
        const decoded = decodeBasicParameter(baseType, elementHex, parameterName, context)
        elements.push(decoded.value)
        offset += 64
      }
    }
    
    return {
      value: JSON.stringify(elements),
      displayValue: `Array[${arrayLength}] of ${baseType}`,
      decodedElements: elements
    }
  } catch (error) {
    console.error('Array decoding error:', error)
    return {
      value: '[Array Decode Error]',
      displayValue: `[Array of ${baseType} - decode failed]`
    }
  }
}

/**
 * Decode struct parameter
 */
function decodeStructParameter(
  type: string,
  hexData: string,
  components?: { type: string; name?: string; components?: { type: string; name?: string }[] }[],
  parameterName?: string,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
    selectedFunction?: unknown
  }
): {
  value: string;
  displayValue: string;
  decodedFields?: Record<string, unknown>;
} {
  const cleanHex = hexData.replace('0x', '')
  
  try {
    if (!components || components.length === 0) {
      return {
        value: '[Struct - No Component Info]',
        displayValue: '[Struct - missing component definitions]'
      }
    }
    
    const fields: Record<string, unknown> = {}
    let offset = 0
    
    components.forEach((component, index) => {
      if (offset >= cleanHex.length) return
      
      const fieldName = component.name || `field_${index}`
      
      if (component.type.includes('[')) {
        // Field is an array - arrays can be complex, use larger slice
        const fieldHex = cleanHex.slice(offset, offset + 128) // Give more space for arrays
        const decoded = decodeArrayParameter(component.type, fieldHex, component, fieldName, context)
        
        // Store the actual decoded elements if available
        if (decoded.decodedElements) {
          fields[fieldName] = decoded.decodedElements
        } else {
          try {
            fields[fieldName] = JSON.parse(decoded.value)
          } catch {
            fields[fieldName] = decoded.value
          }
        }
        
        offset += 128
      } else if (component.type.startsWith('tuple')) {
        // Field is a nested struct
        const structSize = getTypeSize(component.type, component.components)
        const fieldHex = cleanHex.slice(offset, offset + structSize)
        const decoded = decodeStructParameter(component.type, fieldHex, component.components, fieldName, context)
        
        // Store the actual decoded fields if available
        if (decoded.decodedFields) {
          fields[fieldName] = decoded.decodedFields
        } else {
          try {
            fields[fieldName] = JSON.parse(decoded.value)
          } catch {
            fields[fieldName] = decoded.value
          }
        }
        
        offset += structSize
      } else {
        // Field is a basic type
        const fieldHex = cleanHex.slice(offset, offset + 64)
        const decoded = decodeBasicParameter(component.type, fieldHex, fieldName, context)
        fields[fieldName] = decoded.value
        offset += 64
      }
    })
    
    return {
      value: JSON.stringify(fields),
      displayValue: `Struct with ${components.length} fields`,
      decodedFields: fields
    }
  } catch {
    return {
      value: '[Struct Decode Error]',
      displayValue: '[Struct - decode failed]'
    }
  }
}

/**
 * Decode a parameter from hex data based on its type
 */
function decodeParameter(
  type: string, 
  hexData: string, 
  parameterName?: string,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
    selectedFunction?: unknown
  },
  input?: { components?: { type: string; name?: string }[] }
): { 
  value: string; 
  displayValue: string;
  decimalInfo?: {
    raw: string;
    formatted: string;
    fullPrecision: string;
    decimals: number;
  };
  decodedElements?: unknown[];
  decodedFields?: Record<string, unknown>;
} {
  // Handle arrays
  if (type.includes('[')) {
    const arrayResult = decodeArrayParameter(type, hexData, input, parameterName, context)
    return {
      value: arrayResult.value,
      displayValue: arrayResult.displayValue,
      decodedElements: arrayResult.decodedElements
    }
  }
  
  // Handle structs/tuples
  if (type.startsWith('tuple')) {
    const structResult = decodeStructParameter(type, hexData, input?.components, parameterName, context)
    return {
      value: structResult.value,
      displayValue: structResult.displayValue,
      decodedFields: structResult.decodedFields
    }
  }
  
  // Handle basic types
  const basicResult = decodeBasicParameter(type, hexData, parameterName, context)
  return {
    value: basicResult.value,
    displayValue: basicResult.displayValue,
    decimalInfo: basicResult.decimalInfo
  }
}

/**
 * Decode transaction data based on function signature
 */
export function decodeTransaction(
  func: ParsedFunction, 
  transactionData: string,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
  }
): {
  isValid: boolean
  functionSelector: string
  expectedSelector: string
  decodedParameters: Array<{
    name: string
    type: string
    value: string
    displayValue: string
    hexData: string
    decimalInfo?: {
      raw: string
      formatted: string
      fullPrecision: string
      decimals: number
    }
    decodedElements?: unknown[]
    decodedFields?: Record<string, unknown>
  }>
  error?: string
} {
  try {
    // Clean the input data
    const cleanData = transactionData.replace('0x', '')
    
    if (cleanData.length < 8) {
      return {
        isValid: false,
        functionSelector: '',
        expectedSelector: '',
        decodedParameters: [],
        error: 'Transaction data too short - missing function selector'
      }
    }
    
    // Extract function selector
    const functionSelector = '0x' + cleanData.slice(0, 8)
    const expectedSelector = getFunctionSelectorFromInputs(func.name, func.inputs)
    
    // Check if function selector matches
    const isValid = functionSelector === expectedSelector
    
    // Extract parameter data
    const parameterData = cleanData.slice(8)
    
    // Decode parameters (simplified - each parameter takes 64 characters/32 bytes)
    const decodedParameters: Array<{
      name: string
      type: string
      value: string
      displayValue: string
      hexData: string
      decimalInfo?: {
        raw: string
        formatted: string
        fullPrecision: string
        decimals: number
      }
      decodedElements?: unknown[]
      decodedFields?: Record<string, unknown>
    }> = []
    
    func.inputs.forEach((input, index) => {
      const startIndex = index * 64
      const endIndex = startIndex + 64
      
      if (startIndex < parameterData.length) {
        const hexData = parameterData.slice(startIndex, endIndex)
        const decoded = decodeParameter(input.type, hexData, input.name, {
          selectedDealDetails: context?.selectedDealDetails,
          waterfallConfig: context?.waterfallConfig,
          selectedFunction: func
        }, input)
        
        decodedParameters.push({
          name: input.name,
          type: input.type,
          value: decoded.value,
          displayValue: decoded.displayValue,
          hexData: '0x' + hexData,
          decimalInfo: decoded.decimalInfo,
          decodedElements: decoded.decodedElements,
          decodedFields: decoded.decodedFields
        })
      } else {
        // Parameter missing in transaction data
        decodedParameters.push({
          name: input.name,
          type: input.type,
          value: '[Missing]',
          displayValue: '[Missing in transaction data]',
          hexData: '[Missing]'
        })
      }
    })
    
    return {
      isValid,
      functionSelector,
      expectedSelector,
      decodedParameters,
      error: isValid ? undefined : 'Function selector mismatch'
    }
  } catch (error) {
    return {
      isValid: false,
      functionSelector: '',
      expectedSelector: '',
      decodedParameters: [],
      error: error instanceof Error ? error.message : 'Failed to decode transaction'
    }
  }
}

/**
 * Generates the complete encoded function call data
 */
export function encodeFunction(
  func: ParsedFunction, 
  inputs: Record<string, string>,
  context?: {
    selectedDealDetails?: unknown
    waterfallConfig?: unknown
  }
): {
  functionSelector: string
  encodedParameters: string
  fullCallData: string
  decodedView: {
    functionName: string
    signature: string
    parameters: Array<{
      name: string
      type: string
      value: unknown
      encoded: string
      decimalInfo?: {
        raw: string
        formatted: string
        fullPrecision: string
        decimals: number
      }
    }>
  }
} {
  const functionSelector = getFunctionSelectorFromInputs(func.name, func.inputs)
  const encodedParameters = encodeParameters(func, inputs)
  const fullCallData = functionSelector + encodedParameters
  
  // Create decoded view for display
  const parameters = func.inputs.map((input) => {
    const value = inputs[input.name] || ''
    const convertedValue = convertInputValue(value, input.type)
    
    // Encode this specific parameter
    const encoded = encodeParameter(input.type, value)
    
    // Add decimal info for uint types
    let decimalInfo
    if ((input.type.startsWith('uint') || input.type.startsWith('int')) && 
        shouldShowDecimals(input.type, input.name)) {
      const decimals = getDecimalsFromContext({
        selectedDealDetails: context?.selectedDealDetails,
        waterfallConfig: context?.waterfallConfig,
        selectedFunction: func,
        parameterName: input.name
      })
      
      decimalInfo = formatUintWithDecimals(value, decimals)
    }
    
    return {
      name: input.name,
      type: input.type,
      value: convertedValue,
      encoded: '0x' + encoded,
      decimalInfo
    }
  })
  
  return {
    functionSelector,
    encodedParameters: '0x' + encodedParameters,
    fullCallData: fullCallData,
    decodedView: {
      functionName: func.name,
      signature: func.signature,
      parameters
    }
  }
}