import fetch from 'node-fetch';

const MERCURY_API_URL = 'https://api.mercurydata.app';
const MERCURY_JWT = process.env.MERCURY_JWT;
const PROJECT_NAME = 'smart-wallets-next-dima';

async function deleteProgram() {
  try {
    console.log('Attempting to delete program:', PROJECT_NAME);
    
    const response = await fetch(`${MERCURY_API_URL}/zephyr/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCURY_JWT}`
      },
      body: JSON.stringify({
        project_name: PROJECT_NAME,
        mode: {
          Function: {
            fname: 'delete_program',
            arguments: '{}'
          }
        }
      })
    });

    const rawText = await response.text();
    console.log('Response:', rawText);

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      console.error('Response body:', rawText);
      process.exit(1);
    }

    console.log('Program deleted successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteProgram(); 