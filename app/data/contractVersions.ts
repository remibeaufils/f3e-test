import { ContractABI, ContractFunction } from '../types/contracts'
import { getCanonicalSignature } from '../lib/abiEncoding'

// Helper function to get parsed functions with additional metadata
export function parseContractFunctions(contract: ContractABI) {
  return contract.abi
    .filter((item) => item.type === 'function')
    .map((func) => {
      if (func.type === 'function') {
        return {
          ...func,
          signature: getCanonicalSignature(func.name, func.inputs),
          isReadOnly: func.stateMutability === 'view' || func.stateMutability === 'pure',
          isPayable: func.stateMutability === 'payable'
        }
      }
      return func
    })
    .filter((func): func is ContractFunction & { signature: string; isReadOnly: boolean; isPayable: boolean } => 
      func.type === 'function'
    )
}