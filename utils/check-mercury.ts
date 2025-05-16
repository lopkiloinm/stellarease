import { xdr } from '@stellar/stellar-sdk';

const MERCURY_URL = 'https://api.mercurydata.app';
const MERCURY_PROJECT_NAME = 'smart-wallets-next-dima';
const MERCURY_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZ29vZ2xlb2F1dGgyMTEwMjI1MjA1Mjg4MzYxNjQxNjg5IiwiZXhwIjoxNzQ5NjEwNjkwLCJ1c2VyX2lkIjoxOTksInVzZXJuYW1lIjoic3VwYWZpcmVmb3hAZ21haWwuY29tIiwiaWF0IjoxNzQ3MDE4NjkwLCJhdWQiOiJwb3N0Z3JhcGhpbGUiLCJpc3MiOiJwb3N0Z3JhcGhpbGUifQ.LJGRYzCvAF118nqLnHWOxDNmNkHJx3Nwmco4xxc52SA';
const contractId = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

async function checkMercury() {
  try {
    console.log('Checking Mercury service with:');
    console.log('- URL:', MERCURY_URL);
    console.log('- Project:', MERCURY_PROJECT_NAME);
    console.log('- Contract:', contractId);

    const response = await fetch(`${MERCURY_URL}/zephyr/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCURY_JWT}`
      },
      body: JSON.stringify({
        project_name: MERCURY_PROJECT_NAME,
        mode: {
          Function: {
            fname: "get_signers_by_address",
            arguments: JSON.stringify({
              address: contractId
            })
          }
        }
      })
    });

    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const rawText = await response.text();
    console.log('\nRaw response:', rawText);

    if (rawText) {
      const data = JSON.parse(rawText);
      console.log('\nParsed response:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('\n✅ Contract found in Mercury service');
        console.log('Signers:', data);
      } else {
        console.log('\n❌ Error from Mercury service:', data);
      }
    } else {
      console.log('\n❌ Empty response from Mercury service');
    }
  } catch (error) {
    console.error('\n❌ Error checking Mercury service:', error);
  }
}

checkMercury(); 