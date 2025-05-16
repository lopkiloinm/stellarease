import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Server } from "@stellar/stellar-sdk/minimal/rpc";

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

async function getEvents(startLedger: number, cursor?: string) {
  try {
    // Initialize RPC client
    const rpc = new Server(process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org');
    
    console.log('Querying Soroban events...');
    console.log('Configuration:', {
      rpcUrl: rpc.serverURL,
      startLedger,
      cursor
    });

    // Get the latest ledger
    const latestLedger = await rpc.getLatestLedger();
    console.log('Latest ledger:', latestLedger);

    // Query events
    const response = await fetchWithRetry(`${rpc.serverURL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getEvents',
        params: {
          startLedger,
          cursor,
          limit: 100
        }
      })
    });

    const data = await response.json();
    console.log('\nEvents response:', JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    return data.result;
  } catch (error) {
    console.error('Error querying events:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const startLedgerArg = args.find(arg => arg.startsWith('--start-ledger='));
    const cursorArg = args.find(arg => arg.startsWith('--cursor='));

    if (!startLedgerArg) {
      throw new Error('--start-ledger is required');
    }

    const startLedger = parseInt(startLedgerArg.split('=')[1]);
    const cursor = cursorArg ? cursorArg.split('=')[1] : undefined;

    console.log('Querying events with:', {
      startLedger,
      cursor
    });

    const events = await getEvents(startLedger, cursor);
    console.log('\nEvents:', JSON.stringify(events, null, 2));

  } catch (err) {
    console.error('Script failed:', err);
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
    process.exit(1);
  }
}

main(); 