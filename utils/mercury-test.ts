import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { account, server } from './lib/common';
import fetch from 'node-fetch';

// Add delay function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add retry logic for API calls
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${maxRetries}...`);
      const response = await fetch(url, options);
      
      // Log detailed response information
      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      if (response.ok) {
        return response;
      }
      
      // If we get a 520 error, wait and retry
      if (response.status === 520) {
        console.log(`Attempt ${i + 1} failed with 520 error, retrying in ${(i + 1) * 1000}ms...`);
        await delay((i + 1) * 1000);
        continue;
      }
      
      // For other errors, try to get more information
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed with error:`, error);
      if (i === maxRetries - 1) break;
      console.log(`Retrying in ${(i + 1) * 1000}ms...`);
      await delay((i + 1) * 1000);
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function deleteAllWallets() {
  try {
    console.log('Deleting all wallets...');
    const mercuryUrl = process.env.NEXT_PUBLIC_MERCURY_URL || 'https://api.mercurydata.app';
    const mercuryProject = process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME;
    const mercuryJwt = process.env.MERCURY_JWT;

    if (!mercuryProject || !mercuryJwt) {
      throw new Error('Mercury project name or JWT not set in environment variables');
    }

    const response = await fetchWithRetry(`${mercuryUrl}/zephyr/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercuryJwt}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        project_name: mercuryProject,
        mode: {
          Function: {
            fname: 'delete_all_wallets',
            arguments: JSON.stringify({})
          }
        }
      })
    });

    const rawText = await response.text();
    console.log('Delete wallets response:', rawText);

    if (rawText === 'no response') {
      console.log('No wallets to delete');
    } else {
      console.log('Successfully deleted all wallets');
    }
  } catch (error) {
    console.error('Error deleting wallets:', error);
    throw error;
  }
}

async function queryMercury(endpoint: string, requestBody: any, mercuryJwt: string) {
  try {
    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercuryJwt}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    console.log('Raw Mercury response:', rawText);

    if (!rawText || rawText === 'no response') {
      console.log('No data returned from Mercury.');
      return null;
    }

    try {
      const data = JSON.parse(rawText);
      console.log('Parsed Mercury response:', JSON.stringify(data, null, 2));
      return data;
    } catch (e) {
      console.error('Failed to parse Mercury response as JSON:', e);
      console.error('Raw response text:', rawText);
      return null;
    }
  } catch (error) {
    console.error('Mercury query error:', error);
    return null;
  }
}

async function main() {
  try {
    // First, delete all existing wallets
    await deleteAllWallets();

    // 1. Create a mock wallet (registers contract in Mercury)
    console.log('\nCreating mock wallet...');
    const mockWallet = {
      contractId: 'mock-contract-id-123',
      keyName: 'MyKeyName',
      displayName: 'Super Peach'
    };
    console.log('Mock wallet created:', mockWallet);

    const contractId = mockWallet.contractId;

    // 2. Query Mercury for the contract's signers
    const mercuryUrl = process.env.NEXT_PUBLIC_MERCURY_URL || 'https://api.mercurydata.app';
    const mercuryProject = process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME;
    const mercuryJwt = process.env.MERCURY_JWT;

    // Log Mercury configuration (safely)
    console.log('\nMercury configuration:', {
      url: mercuryUrl,
      project: mercuryProject,
      hasJwt: !!mercuryJwt,
      jwtLength: mercuryJwt?.length
    });

    if (!mercuryProject || !mercuryJwt) {
      throw new Error('Mercury project name or JWT not set in environment variables');
    }

    console.log('\nQuerying Mercury for signers...');
    const requestBody = {
      project_name: mercuryProject,
      mode: {
        Function: {
          fname: 'get_signers_by_address',
          arguments: JSON.stringify({ address: contractId }),
        },
      },
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Try both endpoint formats
    const endpoints = [
      `${mercuryUrl}/zephyr/execute`,
      `${mercuryUrl}/api/zephyr/execute`
    ];

    let lastError: Error | null = null;
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying endpoint: ${endpoint}`);
        const data = await queryMercury(endpoint, requestBody, mercuryJwt);
        if (data) {
          console.log('Successfully queried Mercury API');
          return;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed with endpoint ${endpoint}:`, error);
        continue;
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed');

  } catch (err) {
    console.error('Test failed:', err);
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
  }
}

main(); 