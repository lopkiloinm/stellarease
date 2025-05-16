// Node.js script to explore Mercury GraphQL schema
import { Buffer } from 'buffer';

const MERCURY_URL = 'https://api.mercurydata.app:2083/graphql';
const MERCURY_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZ29vZ2xlb2F1dGgyMTEwMjI1MjA1Mjg4MzYxNjQxNjg5IiwiZXhwIjoxNzQ5Njc1MjEzLCJ1c2VyX2lkIjoxOTksInVzZXJuYW1lIjoic3VwYWZpcmVmb3hAZ21haWwuY29tIiwiaWF0IjoxNzQ3MDgzMjEzLCJhdWQiOiJwb3N0Z3JhcGhpbGUiLCJpc3MiOiJwb3N0Z3JhcGhpbGUifQ.n1P5NVnCxDjLdoNjHbggT-RKg_lYxQM_yN4LVuw6Bd0";

async function exploreSchema() {
    try {
        // Query all assets with the correct field names
        const query = `
            query {
                allAssets {
                    nodes {
                        nodeId
                        assetid
                        code
                        issuer
                        balancesByAsset {
                            nodes {
                                nodeId
                                balance
                                accountByAccount {
                                    accountid
                                }
                            }
                        }
                    }
                }
            }
        `;

        console.log('Sending request to:', MERCURY_URL);
        console.log('Query:', query);
        console.log('Using JWT:', MERCURY_JWT ? 'Yes (token present)' : 'No (token missing)');

        const response = await fetch(MERCURY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MERCURY_JWT}`
            },
            body: JSON.stringify({ query })
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        const data = JSON.parse(responseText);
        
        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            
            // If we get an error, try querying the Account type definition
            console.log('\nTrying to query Account type definition...');
            
            const schemaQuery = `
                query {
                    __type(name: "Account") {
                        name
                        fields {
                            name
                            type {
                                name
                                kind
                            }
                        }
                    }
                }
            `;
            
            const schemaResponse = await fetch(MERCURY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MERCURY_JWT}`
                },
                body: JSON.stringify({ query: schemaQuery })
            });
            
            console.log('Schema query response status:', schemaResponse.status);
            const schemaText = await schemaResponse.text();
            console.log('Schema query raw response:', schemaText);
            
            try {
                const schemaData = JSON.parse(schemaText);
                if (schemaData.errors) {
                    console.error('Schema query errors:', schemaData.errors);
                } else {
                    console.log('\n=== Schema Definition ===');
                    console.log(JSON.stringify(schemaData.data, null, 2));
                }
            } catch (parseError) {
                console.error('Error parsing schema response:', parseError);
            }
        } else {
            console.log('\n=== Assets Data ===');
            console.log(JSON.stringify(data.data, null, 2));
        }

    } catch (error) {
        console.error('Error exploring schema:', error);
    }
}

exploreSchema(); 