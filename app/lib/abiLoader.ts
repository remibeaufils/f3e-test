import { SCVersion, ContractABI } from '../types/contracts'

// Cache to avoid repeated network requests
const versionCache = new Map<string, SCVersion>()
const contractCache = new Map<string, ContractABI>()

/**
 * Loads a single contract ABI from a JSON file
 */
async function loadContractABI(version: string, contractName: string): Promise<ContractABI> {
  const cacheKey = `${version}:${contractName}`
  
  // Check cache first
  if (contractCache.has(cacheKey)) {
    return contractCache.get(cacheKey)!
  }

  const response = await fetch(`/abis/${version}/${contractName}.json`)
  if (!response.ok) {
    throw new Error(`Failed to load contract ABI: /abis/${version}/${contractName}.json`)
  }
  
  const rawData = await response.json()
  
  // Handle both formats: direct ABI array or object with 'abi' field
  let abi
  let addresses = {}
  
  if (Array.isArray(rawData)) {
    // Direct ABI array format
    abi = rawData
  } else if (rawData.abi && Array.isArray(rawData.abi)) {
    // Object with 'abi' field (like your TranchedPool.json)
    abi = rawData.abi
    addresses = rawData.addresses || {}
  } else {
    throw new Error(`Invalid ABI format in ${contractName}.json`)
  }
  
  const contractABI: ContractABI = {
    name: contractName,
    abi,
    addresses
  }
  
  // Cache the result
  contractCache.set(cacheKey, contractABI)
  return contractABI
}

/**
 * Auto-discovers contract files in a version directory
 */
async function discoverContracts(versionId: string): Promise<string[]> {
  // Try to use the API endpoint first for real directory listing
  try {
    const response = await fetch(`/api/abis/${versionId}/contracts`)
    if (response.ok) {
      const data = await response.json()
      return data.contracts || []
    }
  } catch {
    // API not available, fall back to discovery method
  }

  // No fallback needed - if API is not available, return empty array
  // This will be handled gracefully by the caller
  return []
}

/**
 * Creates simple version metadata from the folder name
 */
function createVersionMetadata(versionId: string): {
  id: string
  name: string
  version: string
  description: string
  createdAt: string
} {
  return {
    id: versionId,
    name: versionId, // Just use the folder name directly
    version: versionId,
    description: `Smart contracts version ${versionId}`,
    createdAt: new Date().toISOString()
  }
}

/**
 * Loads a complete version with all its contracts
 */
export async function loadVersion(versionId: string): Promise<SCVersion> {
  // Check cache first
  if (versionCache.has(versionId)) {
    return versionCache.get(versionId)!
  }

  try {
    // Auto-discover contracts in this version
    const contractNames = await discoverContracts(versionId)
    
    // Load all discovered contracts
    const contracts: ContractABI[] = []
    for (const contractName of contractNames) {
      try {
        const contractABI = await loadContractABI(versionId, contractName)
        contracts.push(contractABI)
      } catch (error) {
        console.warn(`Failed to load contract ${contractName} from version ${versionId}:`, error)
        // Continue with other contracts
      }
    }

    // Create simple version metadata
    const metadata = createVersionMetadata(versionId)

    // Construct the full version object
    const version: SCVersion = {
      ...metadata,
      contracts
    }

    // Cache the result
    versionCache.set(versionId, version)
    return version

  } catch (error) {
    console.error(`Failed to load version ${versionId}:`, error)
    throw new Error(`Failed to load version ${versionId}`)
  }
}

/**
 * Gets the list of available versions by scanning for existing folders
 */
export async function getAvailableVersions(): Promise<string[]> {
  // Try to use the API endpoint first for real directory listing
  try {
    const response = await fetch('/api/abis/versions')
    if (response.ok) {
      const data = await response.json()
      return data.versions || []
    }
  } catch {
    // API not available, fall back to discovery method
  }

  // No fallback needed - if API is not available, return empty array
  // This ensures we only work with actual filesystem data
  return []
}

/**
 * Loads all available versions
 */
export async function loadAllVersions(): Promise<SCVersion[]> {
  const versionIds = await getAvailableVersions()
  const versions: SCVersion[] = []

  for (const versionId of versionIds) {
    try {
      const version = await loadVersion(versionId)
      versions.push(version)
    } catch (error) {
      console.error(`Failed to load version ${versionId}:`, error)
      // Continue loading other versions even if one fails
    }
  }

  return versions.sort((a, b) => {
    // Sort by version number (basic semantic versioning)
    const aVersion = a.version.replace(/[^\d.]/g, '')
    const bVersion = b.version.replace(/[^\d.]/g, '')
    
    const aParts = aVersion.split('.').map(Number)
    const bParts = bVersion.split('.').map(Number)
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0
      const bPart = bParts[i] || 0
      
      if (aPart !== bPart) {
        return bPart - aPart // Descending order (newest first)
      }
    }
    
    return 0
  })
}

/**
 * Loads a specific contract from a version
 */
export async function loadContract(versionId: string, contractName: string): Promise<ContractABI | null> {
  try {
    return await loadContractABI(versionId, contractName)
  } catch {
    return null
  }
}

/**
 * Clears the cache (useful for development or when data updates)
 */
export function clearCache(): void {
  versionCache.clear()
  contractCache.clear()
}

/**
 * Preloads versions for better performance
 */
export async function preloadVersions(versionIds: string[]): Promise<void> {
  const promises = versionIds.map(versionId => loadVersion(versionId))
  await Promise.allSettled(promises)
}