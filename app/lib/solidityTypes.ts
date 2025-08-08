import { FunctionInput } from '../types/contracts'

export interface StructField {
  name: string
  type: string
  internalType?: string
  components?: StructField[] // For nested structs
}

export interface InputFieldConfig {
  name: string
  type: string
  placeholder: string
  validation: (value: string) => string | null
  defaultValue: string
  isArray: boolean
  arrayItemType?: string
  isStruct: boolean
  structFields?: StructField[]
}

/**
 * Extracts struct fields from a function input if it has components (handles nested structs)
 */
export function extractStructFields(input: FunctionInput): StructField[] {
  if ('components' in input && Array.isArray(input.components)) {
    return input.components.map(component => ({
      name: component.name,
      type: component.type,
      internalType: component.internalType,
      components: component.components ? extractStructFields(component) : undefined
    }))
  }
  return []
}

/**
 * Generates a template JSON structure for a struct (handles nested structs)
 */
export function generateStructTemplate(fields: StructField[]): string {
  if (fields.length === 0) return '{}'
  
  const template: Record<string, any> = {}
  fields.forEach(field => {
    if (field.type.startsWith('tuple') && field.components) {
      // Handle nested struct
      template[field.name] = JSON.parse(generateStructTemplate(field.components))
    } else if (field.type.includes('[') && field.type.startsWith('tuple')) {
      // Handle array of nested structs
      template[field.name] = field.components ? [JSON.parse(generateStructTemplate(field.components))] : []
    } else {
      template[field.name] = getDefaultValueForType(field.type)
    }
  })
  
  return JSON.stringify(template, null, 2)
}

/**
 * Generates an array template for struct arrays
 */
export function generateArrayTemplate(fields: StructField[]): string {
  if (fields.length === 0) return '[]'
  
  const template = generateStructTemplate(fields)
  return `[${template}]`
}

/**
 * Generates a realistic example template with sample values
 */
export function generateExampleTemplate(fields: StructField[]): string {
  if (fields.length === 0) return '{}'
  
  const template: Record<string, any> = {}
  fields.forEach(field => {
    if (field.type.startsWith('tuple') && field.components) {
      template[field.name] = JSON.parse(generateExampleTemplate(field.components))
    } else if (field.type.includes('[') && field.type.startsWith('tuple')) {
      template[field.name] = field.components ? [JSON.parse(generateExampleTemplate(field.components))] : []
    } else {
      template[field.name] = getExampleValueForType(field.type)
    }
  })
  
  return JSON.stringify(template, null, 2)
}

/**
 * Gets realistic example values for Solidity types
 */
function getExampleValueForType(type: string): any {
  if (type === 'address') return '0x742d35Cc6851C6c8A03DF4C40c68a7e18A2dF0A8'
  if (type === 'bool') return true
  if (type === 'string') return 'example'
  if (type.startsWith('uint') || type.startsWith('int')) return '1000'
  if (type.startsWith('bytes')) return '0x1234567890abcdef'
  if (type.includes('[')) return []
  if (type.startsWith('tuple')) return {}
  return 'example'
}

/**
 * Generates empty template with proper structure but empty values
 */
export function generateEmptyTemplate(fields: StructField[]): string {
  if (fields.length === 0) return '{}'
  
  const template: Record<string, any> = {}
  fields.forEach(field => {
    if (field.type.startsWith('tuple') && field.components) {
      template[field.name] = JSON.parse(generateEmptyTemplate(field.components))
    } else if (field.type.includes('[') && field.type.startsWith('tuple')) {
      template[field.name] = []
    } else {
      template[field.name] = getEmptyValueForType(field.type)
    }
  })
  
  return JSON.stringify(template, null, 2)
}

/**
 * Gets empty/default values for Solidity types
 */
function getEmptyValueForType(type: string): any {
  if (type === 'address') return '0x0000000000000000000000000000000000000000'
  if (type === 'bool') return false
  if (type === 'string') return ''
  if (type.startsWith('uint') || type.startsWith('int')) return '0'
  if (type.startsWith('bytes')) return '0x'
  if (type.includes('[')) return []
  if (type.startsWith('tuple')) return {}
  return ''
}

/**
 * Gets default array values for basic types
 */
function getArrayDefaultValue(baseType: string): string {
  if (baseType === 'address') {
    return '["0x0000000000000000000000000000000000000000", "0x742d35Cc6851C6c8A03DF4C40c68a7e18A2dF0A8"]'
  }
  if (baseType === 'bool') {
    return '[true, false]'
  }
  if (baseType === 'string') {
    return '["example1", "example2"]'
  }
  if (baseType.startsWith('uint') || baseType.startsWith('int')) {
    return '[1000, 2000]'
  }
  if (baseType.startsWith('bytes')) {
    return '["0x1234567890abcdef", "0xfedcba0987654321"]'
  }
  return '[]'
}

/**
 * Gets default placeholder value for a given Solidity type
 */
function getDefaultValueForType(type: string): any {
  if (type === 'address') return '<address>'
  if (type === 'bool') return '<true|false>'
  if (type === 'string') return '<string>'
  if (type.startsWith('uint') || type.startsWith('int')) return '<number>'
  if (type.startsWith('bytes')) return '<0x...>'
  if (type.includes('[')) return []
  if (type.startsWith('tuple')) return {}
  return '<value>'
}

/**
 * Parses Solidity type to determine input field configuration
 */
export function parseSolidityType(input: FunctionInput): InputFieldConfig {
  const { name, type } = input
  
  // Check if it's an array
  const arrayMatch = type.match(/^(.+?)(\[\d*\])$/)
  if (arrayMatch) {
    const baseType = arrayMatch[1]
    const isStructArray = baseType.startsWith('tuple')
    const structFields = isStructArray ? extractStructFields(input) : []
    
    return {
      name,
      type,
      placeholder: isStructArray 
        ? `Enter ${name} (array of structs)` 
        : `Enter ${name} (array of ${baseType})`,
      validation: validateArray(baseType),
      defaultValue: isStructArray ? `[${generateEmptyTemplate(structFields)}]` : getArrayDefaultValue(baseType),
      isArray: true,
      arrayItemType: baseType,
      isStruct: isStructArray,
      structFields
    }
  }
  
  // Check if it's a struct/tuple
  if (type.startsWith('tuple')) {
    const structFields = extractStructFields(input)
    return {
      name,
      type,
      placeholder: `Enter ${name} (struct)`,
      validation: validateStruct,
      defaultValue: generateEmptyTemplate(structFields),
      isArray: false,
      isStruct: true,
      structFields
    }
  }
  
  // Handle basic types
  switch (type) {
    case 'address':
      return {
        name,
        type,
        placeholder: '0x742d35cc...',
        validation: validateAddress,
        defaultValue: '0x0000000000000000000000000000000000000000',
        isArray: false,
        isStruct: false
      }
      
    case 'bool':
      return {
        name,
        type,
        placeholder: 'true/false',
        validation: validateBoolean,
        defaultValue: 'false',
        isArray: false,
        isStruct: false
      }
      
    case 'string':
      return {
        name,
        type,
        placeholder: 'Enter text...',
        validation: validateString,
        defaultValue: 'example',
        isArray: false,
        isStruct: false
      }
      
    case 'bytes':
      return {
        name,
        type,
        placeholder: '0x1234abcd...',
        validation: validateBytes,
        defaultValue: '0x1234567890abcdef',
        isArray: false,
        isStruct: false
      }
      
    default:
      // Handle uint/int types
      if (type.startsWith('uint') || type.startsWith('int')) {
        return {
          name,
          type,
          placeholder: 'Enter number...',
          validation: validateNumber(type),
          defaultValue: '1000',
          isArray: false,
          isStruct: false
        }
      }
      
      // Handle fixed bytes
      if (type.startsWith('bytes') && /^bytes\d+$/.test(type)) {
        const bytesLength = parseInt(type.slice(5)) // extract number from "bytesN"
        const hexValue = '0x' + '12'.repeat(Math.min(bytesLength, 8)) // Generate appropriate length hex
        return {
          name,
          type,
          placeholder: '0x1234...',
          validation: validateFixedBytes(type),
          defaultValue: hexValue,
          isArray: false,
          isStruct: false
        }
      }
      
      // Fallback for unknown types
      return {
        name,
        type,
        placeholder: `Enter ${type}...`,
        validation: validateGeneric,
        defaultValue: 'example',
        isArray: false,
        isStruct: false
      }
  }
}

/**
 * Validation functions
 */
function validateAddress(value: string): string | null {
  if (!value) return 'Address is required'
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return 'Invalid address format (must be 0x followed by 40 hex characters)'
  }
  return null
}

function validateBoolean(value: string): string | null {
  const lower = value.toLowerCase().trim()
  if (lower !== 'true' && lower !== 'false') {
    return 'Must be "true" or "false"'
  }
  return null
}

function validateString(value: string): string | null {
  // Strings are generally valid as-is
  return null
}

function validateBytes(value: string): string | null {
  if (!value.startsWith('0x')) {
    return 'Bytes must start with 0x'
  }
  if (!/^0x[a-fA-F0-9]*$/.test(value)) {
    return 'Invalid hex format'
  }
  return null
}

function validateNumber(type: string): (value: string) => string | null {
  return (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null // Allow empty values
    
    if (!/^\d+$/.test(trimmed)) {
      return 'Must be a positive integer'
    }
    
    // Basic range checking for common types
    const bigNum = BigInt(trimmed)
    if (type === 'uint8' && bigNum > BigInt(255)) {
      return 'Value too large for uint8 (max: 255)'
    }
    if (type === 'uint16' && bigNum > BigInt(65535)) {
      return 'Value too large for uint16 (max: 65535)'
    }
    if (type === 'uint32' && bigNum > BigInt(4294967295)) {
      return 'Value too large for uint32'
    }
    
    return null
  }
}

function validateFixedBytes(type: string): (value: string) => string | null {
  return (value: string) => {
    if (!value.startsWith('0x')) {
      return 'Must start with 0x'
    }
    
    const bytesLength = parseInt(type.slice(5)) // extract number from "bytesN"
    const expectedLength = bytesLength * 2 + 2 // 2 chars per byte + "0x"
    
    if (value.length !== expectedLength) {
      return `Must be exactly ${bytesLength} bytes (${expectedLength} characters including 0x)`
    }
    
    if (!/^0x[a-fA-F0-9]*$/.test(value)) {
      return 'Invalid hex format'
    }
    
    return null
  }
}

function validateArray(baseType: string): (value: string) => string | null {
  return (value: string) => {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) {
        return 'Must be a valid JSON array'
      }
      
      // TODO: Validate each array item based on baseType
      return null
    } catch {
      return 'Must be valid JSON array format'
    }
  }
}

function validateStruct(value: string): string | null {
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return 'Must be a valid JSON object'
    }
    return null
  } catch {
    return 'Must be valid JSON object format'
  }
}

function validateGeneric(value: string): string | null {
  // Basic validation for unknown types
  return null
}

/**
 * Converts form input values to properly typed values for contract calls
 */
export function convertInputValue(value: string, type: string): unknown {
  // Handle arrays
  if (type.includes('[')) {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  
  // Handle structs/tuples
  if (type.startsWith('tuple')) {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  
  // Handle basic types
  switch (type) {
    case 'bool':
      return value.toLowerCase().trim() === 'true'
      
    case 'string':
      return value
      
    case 'address':
    case 'bytes':
      return value
      
    default:
      if (type.startsWith('uint') || type.startsWith('int')) {
        return value.trim()
      }
      if (type.startsWith('bytes') && /^bytes\d+$/.test(type)) {
        return value
      }
      
      return value
  }
}