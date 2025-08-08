/**
 * Utility functions for handling decimal formatting in smart contract interactions
 */

/**
 * Format a raw uint value considering decimal places
 * Handles very large numbers without scientific notation
 */
export function formatWithDecimals(rawValue: string | number, decimals: number): string {
  if (!rawValue || rawValue === '0' || decimals === 0) {
    return rawValue.toString()
  }
  
  // Always work with string to avoid JavaScript number limitations
  let valueStr = rawValue.toString()
  
  // Handle scientific notation by converting back to regular notation
  if (valueStr.includes('e') || valueStr.includes('E')) {
    try {
      // For very large numbers, try using BigInt if it's an integer
      if (!valueStr.includes('.')) {
        const num = BigInt(rawValue.toString().split('e')[0])
        const exponent = parseInt(rawValue.toString().split('e')[1] || '0')
        if (exponent >= 0) {
          valueStr = (num * (BigInt(10) ** BigInt(exponent))).toString()
        } else {
          // Negative exponent - this shouldn't happen for uint but handle gracefully
          valueStr = rawValue.toString()
        }
      }
    } catch {
      // If BigInt fails, fall back to the original string
      valueStr = rawValue.toString()
    }
  }
  
  // Remove any decimal point if present (shouldn't be for uint, but just in case)
  valueStr = valueStr.split('.')[0]
  
  // Ensure we have at least one digit
  if (valueStr.length === 0 || valueStr === '') {
    return '0'
  }
  
  const decimalPosition = valueStr.length - decimals
  
  if (decimalPosition <= 0) {
    // Value is smaller than 1 unit - add leading zeros
    const leadingZeros = Math.abs(decimalPosition)
    const paddedValue = '0'.repeat(leadingZeros) + valueStr
    return `0.${paddedValue}`
  } else {
    // Value has both integer and decimal parts
    const integerPart = valueStr.slice(0, decimalPosition)
    const decimalPart = valueStr.slice(decimalPosition)
    
    // Remove trailing zeros from decimal part for cleaner display
    const trimmedDecimalPart = decimalPart.replace(/0+$/, '')
    
    if (trimmedDecimalPart.length === 0) {
      return integerPart
    } else {
      // For very long decimal parts, show significant digits with ellipsis
      if (trimmedDecimalPart.length > 8) {
        // Find the first non-zero digit
        const firstNonZero = trimmedDecimalPart.search(/[1-9]/)
        if (firstNonZero >= 0) {
          // Show up to 6 significant digits
          const significantPart = trimmedDecimalPart.slice(firstNonZero, firstNonZero + 6)
          const leadingZeros = trimmedDecimalPart.slice(0, firstNonZero)
          return `${integerPart}.${leadingZeros}${significantPart}...`
        }
      }
      return `${integerPart}.${trimmedDecimalPart}`
    }
  }
}

/**
 * Convert a decimal value to raw uint format
 */
export function parseFromDecimals(decimalValue: string, decimals: number): string {
  if (!decimalValue || decimals === 0) {
    return decimalValue || '0'
  }
  
  const [integerPart = '0', decimalPart = ''] = decimalValue.split('.')
  
  // Pad or trim decimal part to match required decimals
  const paddedDecimalPart = decimalPart.padEnd(decimals, '0').slice(0, decimals)
  
  return (integerPart + paddedDecimalPart).replace(/^0+/, '') || '0'
}

/**
 * Get decimal places from various sources
 */
export function getDecimalsFromContext(context: {
  selectedDealDetails?: Record<string, unknown>
  waterfallConfig?: Record<string, unknown>
  selectedFunction?: Record<string, unknown>
  parameterName?: string
}): number {
  // Default decimals (commonly 18 for many ERC20 tokens)
  const DEFAULT_DECIMALS = 18
  
  // Try to extract from deal details if available
  if (context.selectedDealDetails?.asset_decimals) {
    return parseInt(context.selectedDealDetails.asset_decimals)
  }
  
  // Try to extract from waterfall config
  if (context.waterfallConfig?.asset_decimals) {
    return parseInt(context.waterfallConfig.asset_decimals)
  }
  
  // Try to infer from parameter name or function context
  if (context.parameterName) {
    const paramName = context.parameterName.toLowerCase()
    
    // Common parameter names that typically use token decimals
    if (paramName.includes('amount') || 
        paramName.includes('balance') || 
        paramName.includes('value') ||
        paramName.includes('supply') ||
        paramName.includes('borrow') ||
        paramName.includes('repay') ||
        paramName.includes('withdraw')) {
      return DEFAULT_DECIMALS
    }
    
    // Parameters that are typically whole numbers (no decimals)
    if (paramName.includes('id') ||
        paramName.includes('index') ||
        paramName.includes('count') ||
        paramName.includes('length') ||
        paramName.includes('tranche')) {
      return 0
    }
  }
  
  // Function-specific logic
  if (context.selectedFunction?.name) {
    const funcName = context.selectedFunction.name.toLowerCase()
    
    // Functions that typically deal with token amounts
    if (funcName.includes('supply') ||
        funcName.includes('borrow') ||
        funcName.includes('repay') ||
        funcName.includes('withdraw') ||
        funcName.includes('transfer') ||
        funcName.includes('approve')) {
      return DEFAULT_DECIMALS
    }
  }
  
  // Default to 18 decimals for unknown uint values
  return DEFAULT_DECIMALS
}

/**
 * Format a uint value with both raw and decimal representations
 */
export function formatUintWithDecimals(value: string, decimals: number): {
  raw: string
  formatted: string
  fullPrecision: string
  decimals: number
} {
  const fullPrecision = formatWithDecimals(value, decimals)
  const formatted = formatWithDecimals(value, decimals) // For now, same as full precision
  
  return {
    raw: value,
    formatted,
    fullPrecision,
    decimals
  }
}

/**
 * Check if a type is a uint that should show decimal formatting
 */
export function shouldShowDecimals(type: string, parameterName?: string): boolean {
  if (!type.startsWith('uint')) {
    return false
  }
  
  // Don't show decimals for IDs, indices, or other non-amount values
  if (parameterName) {
    const paramName = parameterName.toLowerCase()
    if (paramName.includes('id') ||
        paramName.includes('index') ||
        paramName.includes('count') ||
        paramName.includes('length') ||
        paramName.includes('tranche')) {
      return false
    }
  }
  
  return true
}