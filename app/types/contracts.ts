export interface FunctionInput {
  name: string
  type: string
  internalType?: string
  indexed?: boolean
  components?: FunctionInput[] // For structs/tuples
}

export interface FunctionOutput {
  name: string
  type: string
  internalType?: string
}

export interface ContractFunction {
  name: string
  type: 'function' | 'constructor' | 'receive' | 'fallback'
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable'
  inputs: FunctionInput[]
  outputs: FunctionOutput[]
}

export interface ContractEvent {
  name: string
  type: 'event'
  inputs: FunctionInput[]
  anonymous: boolean
}

export interface ContractABI {
  name: string
  abi: (ContractFunction | ContractEvent)[]
  addresses: Record<string, string> // chainId -> deployed address
}

export interface SCVersion {
  id: string
  name: string
  version: string
  description: string
  contracts: ContractABI[]
  createdAt: string
}

export interface ParsedFunction extends ContractFunction {
  signature: string
  isReadOnly: boolean
  isPayable: boolean
}

export interface FunctionCall {
  id: string
  contractName: string
  functionName: string
  inputs: Record<string, unknown>
  chainId: number
  timestamp: string
  status: 'pending' | 'success' | 'failed'
  result?: unknown
  error?: string
  transactionHash?: string
}

export interface CallExecutionOptions {
  chainId: number
  contractAddress: string
  functionSignature: string
  inputs: unknown[]
  value?: string // for payable functions
  gasLimit?: string
}

// Input field types for dynamic form generation
export type SolidityType = 
  | 'address'
  | 'bool'
  | 'string'
  | 'bytes'
  | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'uint128' | 'uint256'
  | 'int8' | 'int16' | 'int32' | 'int64' | 'int128' | 'int256'
  | 'bytes1' | 'bytes4' | 'bytes8' | 'bytes16' | 'bytes32'
  | `${string}[]` // arrays
  | `${string}[${number}]` // fixed arrays

export interface TypedInput {
  name: string
  type: SolidityType
  value: unknown
  error?: string
}