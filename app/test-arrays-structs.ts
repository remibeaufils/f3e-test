/**
 * Test file to verify array and struct encoding/decoding functionality
 * This can be imported and run in the browser console or development environment
 */

import { encodeFunction, decodeTransaction, getCanonicalSignature, getFunctionSelectorFromInputs } from './lib/abiEncoding';
import { ParsedFunction } from './types/contracts';

// Test function definitions
const arrayTestFunction: ParsedFunction = {
  name: 'processAmounts',
  signature: 'processAmounts(uint256[])',
  inputs: [
    {
      name: 'amounts',
      type: 'uint256[]',
    }
  ],
  outputs: [],
  isReadOnly: false,
  isPayable: false,
  stateMutability: 'nonpayable'
};

const structTestFunction: ParsedFunction = {
  name: 'updateUser',
  signature: 'updateUser(tuple(string,uint256,bool))',
  inputs: [
    {
      name: 'user',
      type: 'tuple',
      components: [
        { name: 'name', type: 'string' },
        { name: 'balance', type: 'uint256' },
        { name: 'isActive', type: 'bool' }
      ]
    }
  ],
  outputs: [],
  isReadOnly: false,
  isPayable: false,
  stateMutability: 'nonpayable'
};

const nestedTestFunction: ParsedFunction = {
  name: 'processData',
  signature: 'processData(uint256[],tuple(string,uint256[])[])',
  inputs: [
    {
      name: 'values',
      type: 'uint256[]',
    },
    {
      name: 'users',
      type: 'tuple[]',
      components: [
        { name: 'name', type: 'string' },
        { name: 'balances', type: 'uint256[]' }
      ]
    }
  ],
  outputs: [],
  isReadOnly: false,
  isPayable: false,
  stateMutability: 'nonpayable'
};

export function testArrayEncoding() {
  console.log('🧪 Testing Array Encoding/Decoding');
  
  const testData = {
    amounts: '[100, 200, 300, 1000000000000000000]'
  };
  
  try {
    const encoded = encodeFunction(arrayTestFunction, testData);
    console.log('✅ Array encoding successful');
    console.log('Function selector:', encoded.functionSelector);
    console.log('Encoded parameters:', encoded.encodedParameters);
    
    const decoded = decodeTransaction(arrayTestFunction, encoded.fullCallData);
    console.log('✅ Array decoding successful');
    console.log('Decoded valid:', decoded.isValid);
    console.log('Decoded elements:', decoded.decodedParameters[0]?.decodedElements);
    
    return { success: true, encoded, decoded };
  } catch (error) {
    console.error('❌ Array test failed:', error);
    return { success: false, error };
  }
}

export function testStructEncoding() {
  console.log('🧪 Testing Struct Encoding/Decoding');
  
  const testData = {
    user: '{"name": "Alice", "balance": "1500000000000000000", "isActive": true}'
  };
  
  try {
    const encoded = encodeFunction(structTestFunction, testData);
    console.log('✅ Struct encoding successful');
    console.log('Function selector:', encoded.functionSelector);
    console.log('Encoded parameters:', encoded.encodedParameters);
    
    const decoded = decodeTransaction(structTestFunction, encoded.fullCallData);
    console.log('✅ Struct decoding successful');
    console.log('Decoded valid:', decoded.isValid);
    console.log('Decoded fields:', decoded.decodedParameters[0]?.decodedFields);
    
    return { success: true, encoded, decoded };
  } catch (error) {
    console.error('❌ Struct test failed:', error);
    return { success: false, error };
  }
}

export function testArrayOfStructsDecoding() {
  console.log('🧪 Testing Array of Structs Decoding (Specific)');
  
  // Simple array of structs test
  const arrayOfStructsFunction: ParsedFunction = {
    name: 'processUsers',
    signature: 'processUsers((string,uint256)[])',
    inputs: [
      {
        name: 'users',
        type: 'tuple[]',
        components: [
          { name: 'name', type: 'string' },
          { name: 'balance', type: 'uint256' }
        ]
      }
    ],
    outputs: [],
    isReadOnly: false,
    isPayable: false,
    stateMutability: 'nonpayable'
  };
  
  const testData = {
    users: '[{"name": "Alice", "balance": "1000"}, {"name": "Bob", "balance": "2000"}]'
  };
  
  try {
    const encoded = encodeFunction(arrayOfStructsFunction, testData);
    console.log('✅ Array of structs encoding successful');
    console.log('Function selector:', encoded.functionSelector);
    console.log('Encoded data length:', encoded.fullCallData.length);
    
    const decoded = decodeTransaction(arrayOfStructsFunction, encoded.fullCallData);
    console.log('✅ Array of structs decoding successful');
    console.log('Decoded valid:', decoded.isValid);
    console.log('Users parameter:');
    
    const usersParam = decoded.decodedParameters[0];
    if (usersParam) {
      console.log('  Display value:', usersParam.displayValue);
      console.log('  Decoded elements:', usersParam.decodedElements);
      
      if (usersParam.decodedElements && Array.isArray(usersParam.decodedElements)) {
        usersParam.decodedElements.forEach((user, index) => {
          console.log(`  User ${index}:`, user);
        });
      }
    }
    
    return { success: true, encoded, decoded };
  } catch (error) {
    console.error('❌ Array of structs test failed:', error);
    return { success: false, error };
  }
}

export function testNestedEncoding() {
  console.log('🧪 Testing Nested Array/Struct Encoding/Decoding');
  
  const testData = {
    values: '[10, 20, 30]',
    users: '[{"name": "Alice", "balances": [100, 200]}, {"name": "Bob", "balances": [300, 400, 500]}]'
  };
  
  try {
    const encoded = encodeFunction(nestedTestFunction, testData);
    console.log('✅ Nested encoding successful');
    console.log('Function selector:', encoded.functionSelector);
    console.log('Encoded parameters:', encoded.encodedParameters);
    
    const decoded = decodeTransaction(nestedTestFunction, encoded.fullCallData);
    console.log('✅ Nested decoding successful');
    console.log('Decoded valid:', decoded.isValid);
    console.log('Values array:', decoded.decodedParameters[0]?.decodedElements);
    console.log('Users struct array:', decoded.decodedParameters[1]?.decodedElements);
    
    return { success: true, encoded, decoded };
  } catch (error) {
    console.error('❌ Nested test failed:', error);
    return { success: false, error };
  }
}

export function testFunctionSelectors() {
  console.log('🧪 Testing Function Selector Calculation');
  
  const testCases = [
    {
      name: 'Simple function',
      functionName: 'transfer',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      expectedSignature: 'transfer(address,uint256)',
    },
    {
      name: 'Array function',
      functionName: 'batchTransfer',
      inputs: [
        { name: 'recipients', type: 'address[]' },
        { name: 'amounts', type: 'uint256[]' }
      ],
      expectedSignature: 'batchTransfer(address[],uint256[])',
    },
    {
      name: 'Struct function',
      functionName: 'updateUser',
      inputs: [
        { 
          name: 'user', 
          type: 'tuple',
          components: [
            { name: 'name', type: 'string' },
            { name: 'balance', type: 'uint256' },
            { name: 'isActive', type: 'bool' }
          ]
        }
      ],
      expectedSignature: 'updateUser((string,uint256,bool))',
    },
    {
      name: 'Array of structs',
      functionName: 'batchUpdateUsers',
      inputs: [
        { 
          name: 'users', 
          type: 'tuple[]',
          components: [
            { name: 'name', type: 'string' },
            { name: 'balance', type: 'uint256' }
          ]
        }
      ],
      expectedSignature: 'batchUpdateUsers((string,uint256)[])',
    }
  ];
  
  let allPassed = true;
  
  testCases.forEach((test, index) => {
    try {
      const actualSignature = getCanonicalSignature(test.functionName, test.inputs as { name: string; type: string; components?: { name: string; type: string }[] }[]);
      const selector = getFunctionSelectorFromInputs(test.functionName, test.inputs as { name: string; type: string; components?: { name: string; type: string }[] }[]);
      
      const passed = actualSignature === test.expectedSignature;
      allPassed = allPassed && passed;
      
      console.log(`${index + 1}. ${test.name}:`);
      console.log(`   Expected: ${test.expectedSignature}`);
      console.log(`   Actual:   ${actualSignature}`);
      console.log(`   Selector: ${selector}`);
      console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log('');
    } catch (error) {
      console.error(`${index + 1}. ${test.name}: ❌ ERROR -`, error);
      allPassed = false;
    }
  });
  
  return { success: allPassed };
}

export function runAllTests() {
  console.log('🚀 Running Array and Struct Encoding/Decoding Tests');
  console.log('=' .repeat(60));
  
  const selectorResult = testFunctionSelectors();
  console.log('');
  
  const arrayResult = testArrayEncoding();
  console.log('');
  
  const structResult = testStructEncoding();
  console.log('');
  
  const arrayOfStructsResult = testArrayOfStructsDecoding();
  console.log('');
  
  const nestedResult = testNestedEncoding();
  console.log('');
  
  console.log('📊 Test Results Summary:');
  console.log('- Selector test:', selectorResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Array test:', arrayResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Struct test:', structResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Array of structs test:', arrayOfStructsResult.success ? '✅ PASSED' : '❌ FAILED');
  console.log('- Nested test:', nestedResult.success ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = selectorResult.success && arrayResult.success && structResult.success && arrayOfStructsResult.success && nestedResult.success;
  console.log('');
  console.log(allPassed ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED');
  
  return { selectorResult, arrayResult, structResult, arrayOfStructsResult, nestedResult, allPassed };
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as unknown as { testArraysStructs: unknown }).testArraysStructs = {
    testFunctionSelectors,
    testArrayEncoding,
    testStructEncoding,
    testArrayOfStructsDecoding,
    testNestedEncoding,
    runAllTests
  };
  console.log('Array/Struct tests available at: window.testArraysStructs');
}