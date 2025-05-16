import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const MERCURY_API_URL = process.env.NEXT_PUBLIC_MERCURY_URL || 'https://api.mercurydata.app';
const MERCURY_JWT = process.env.MERCURY_JWT;
const MERCURY_PROJECT_NAME = process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME || 'smart-wallets-next';

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

async function deployZephyr() {
  try {
    if (!MERCURY_JWT) {
      throw new Error('Mercury JWT not configured in environment variables');
    }

    console.log('Building smart wallet contract...');
    // First build the contract
    const buildProcess = await new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec('cd contracts && make build', (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error('Build error:', error);
          reject(error);
          return;
        }
        console.log('Build output:', stdout);
        if (stderr) console.error('Build stderr:', stderr);
        resolve(stdout);
      });
    });

    // Read the WASM file
    const wasmPath = path.join(process.cwd(), 'contracts', 'out', 'smart_wallet.optimized.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    const wasmBase64 = wasmBuffer.toString('base64');

    console.log('Deploying Zephyr program to Mercury...');
    const deployResponse = await fetchWithRetry(`${MERCURY_API_URL}/zephyr/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCURY_JWT}`
      },
      body: JSON.stringify({
        project_name: MERCURY_PROJECT_NAME,
        mode: {
          Function: {
            fname: 'deploy_zephyr_program',
            arguments: JSON.stringify({
              wasm: wasmBase64,
              functions: [
                'register_passkey',
                'verify_auth_response',
                'get_auth_challenge',
                'get_signers_by_address',
                'add_signer',
                'remove_signer'
              ]
            })
          }
        }
      })
    });

    const responseText = await deployResponse.text();
    console.log('Deploy response:', responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('Successfully deployed Zephyr program:', data);
    } catch (e) {
      if (responseText === 'no response') {
        console.log('Successfully deployed Zephyr program (no response)');
      } else {
        console.error('Failed to parse response:', e);
        throw e;
      }
    }

  } catch (error) {
    console.error('Failed to deploy Zephyr program:', error);
    throw error;
  }
}

// Run the deployment
deployZephyr().catch(console.error); 