import { PasskeyServer, PasskeyKit, SignerStore } from "passkey-kit";
import { NextResponse } from "next/server";
import base64url from 'base64url';
import StellarSdk, { xdr, Networks, StrKey } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import { account, fundPubkey, fundSigner, native } from '@/lib/common';

// Constants
const ADMIN_KEY = "AAAAEAAAAAEAAAABAAAAAQ==";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;

// Validate required environment variables
const requiredEnvVars = {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    NEXT_PUBLIC_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_WALLET_WASM_HASH,
    NEXT_PUBLIC_LAUNCHTUBE_URL: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL || 'https://testnet.launchtube.xyz',
    LAUNCHTUBE_JWT: process.env.LAUNCHTUBE_JWT,
    NEXT_PUBLIC_MERCURY_PROJECT_NAME: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    NEXT_PUBLIC_MERCURY_URL: process.env.NEXT_PUBLIC_MERCURY_URL || 'https://api.mercurydata.app',
    MERCURY_JWT: process.env.MERCURY_JWT
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value && !key.startsWith('NEXT_PUBLIC_'))
    .map(([key]) => key);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize server for server-side operations
const server = new PasskeyServer({
    rpcUrl: requiredEnvVars.NEXT_PUBLIC_RPC_URL,
    launchtubeUrl: requiredEnvVars.NEXT_PUBLIC_LAUNCHTUBE_URL,
    launchtubeJwt: requiredEnvVars.LAUNCHTUBE_JWT,
    mercuryUrl: requiredEnvVars.NEXT_PUBLIC_MERCURY_URL,
    mercuryJwt: requiredEnvVars.MERCURY_JWT,
    mercuryProjectName: requiredEnvVars.NEXT_PUBLIC_MERCURY_PROJECT_NAME
});

// Initialize client for WebAuthn operations
const client = new PasskeyKit({
    rpcUrl: requiredEnvVars.NEXT_PUBLIC_RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    walletWasmHash: requiredEnvVars.NEXT_PUBLIC_WALLET_WASM_HASH || '',
    timeoutInSeconds: 30
});

// Function to store signer in Zephyr
async function storeSignerInZephyr(contractId: string, keyId: string, publicKey: string, isAdmin: boolean = false) {
    try {
        // Convert strings to base64url encoded buffers for BYTEA columns
        const addressBuffer = base64url(contractId);
        const keyBuffer = base64url(keyId);
        const valBuffer = base64url(publicKey);
        const limitsBuffer = isAdmin ? ADMIN_KEY : base64url("0");
        const storageBuffer = base64url("Temporary");
        const activeBuffer = base64url("1"); // true

        // GraphQL mutation to store signer
        const mutation = `
            mutation StoreSigner($input: SignerInput!) {
                createSigner(input: $input) {
                    signer {
                        address
                        key
                    }
                }
            }
        `;

        return await fetch(`${requiredEnvVars.NEXT_PUBLIC_MERCURY_URL}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${requiredEnvVars.MERCURY_JWT}`
            },
            body: JSON.stringify({
                query: mutation,
                variables: {
                    input: {
                        address: addressBuffer,
                        key: keyBuffer,
                        val: valBuffer,
                        limits: limitsBuffer,
                        exp: 0,
                        storage: storageBuffer,
                        active: activeBuffer
                    }
                }
            })
        });
    } catch (error) {
        console.error('Error storing signer:', error);
        throw error;
    }
}

// Function to verify signer exists
async function verifySignerExists(contractId: string, keyId: string) {
    try {
        const signers = await server.getSigners(contractId);
        return signers.some(signer => signer.key === keyId && !signer.evicted);
    } catch (error) {
        console.error('Error verifying signer:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, ...params } = body;
        console.log('Mercury request received:', { 
            action, 
            params: {
                ...params,
                signedTx: params.signedTx ? `${params.signedTx.substring(0, 50)}...` : undefined
            }
        });

        switch (action) {
            case 'get_addresses_by_signer': {
                const { key, kind } = params;
                if (!key || !kind) {
                    console.error('Missing required parameters:', { key: !!key, kind: !!kind });
                    return NextResponse.json({ 
                        error: 'Missing key or kind parameter' 
                    }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    console.log('Looking up addresses for signer:', { key, kind });
                    const response = await fetch(`${requiredEnvVars.NEXT_PUBLIC_MERCURY_URL}/zephyr/execute`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${requiredEnvVars.MERCURY_JWT}`
                        },
                        body: JSON.stringify({
                            project_name: requiredEnvVars.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
                            mode: {
                                Function: {
                                    fname: 'get_addresses_by_signer',
                                    arguments: JSON.stringify({ key, kind })
                                }
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error response from Mercury:', errorData);
                        throw new Error(errorData.error || `API call failed with status ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Found addresses:', {
                        key,
                        kind,
                        count: data.length
                    });

                    return NextResponse.json({ 
                        addresses: data || [] 
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error getting addresses by signer:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to get addresses' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'get_contract_id_by_keyid': {
                const { keyId } = params;
                if (!keyId) {
                    console.error('Missing keyId in get_contract_id_by_keyid request');
                    return NextResponse.json({ 
                        error: 'Missing keyId' 
                    }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    console.log('Looking up contract ID for keyId:', keyId);
                    const contractId = await server.getContractId({ keyId });
                    
                    if (!contractId) {
                        console.log('No contract ID found for keyId:', keyId);
                        return NextResponse.json({ 
                            error: 'No contract ID found for this keyId' 
                        }, { 
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    console.log('Found contract ID:', {
                        keyId,
                        contractId
                    });

                    return NextResponse.json({ 
                        contractId 
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error getting contract ID:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to get contract ID' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'get_auth_challenge': {
                const { keyId } = params;
                try {
                    console.log('Generating auth challenge for keyId:', keyId);
                    const challengeArray = new Uint8Array(32);
                    crypto.getRandomValues(challengeArray);
                    const challengeBase64Url = base64url.encode(Buffer.from(challengeArray));
                    
                    console.log('Generated challenge:', {
                        keyId,
                        challenge: challengeBase64Url
                    });
                    
                    return NextResponse.json({ 
                        challenge: challengeBase64Url 
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error generating auth challenge:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to generate authentication challenge' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'verify_auth_response': {
                const { keyId, assertion } = params;
                if (!keyId || !assertion) {
                    console.error('Missing required parameters:', { keyId: !!keyId, assertion: !!assertion });
                    return NextResponse.json({ 
                        error: 'Missing keyId or assertion' 
                    }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    console.log('Verifying auth response for keyId:', keyId);
                    
                    // TODO: Implement proper challenge verification
                    // For now, we'll just log the assertion and return success
                    console.log('Received assertion:', {
                        keyId,
                        assertionType: assertion.type,
                        hasClientDataJSON: !!assertion.response.clientDataJSON,
                        hasAuthenticatorData: !!assertion.response.authenticatorData,
                        hasSignature: !!assertion.response.signature
                    });

                    // Get the contractId associated with this keyId
                    const contractId = await server.getContractId({ keyId });
                    if (!contractId) {
                        throw new Error('No contract ID found for this keyId');
                    }

                    console.log('Authentication successful:', {
                        keyId,
                        contractId
                    });

                    return NextResponse.json({
                        success: true,
                        message: "Authentication successful",
                        contractId
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error verifying auth response:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to verify authentication response' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'register_passkey': {
                const { signedTx, expectedContractId, passkeyKeyId } = params;

                if (!signedTx) {
                    console.error('Missing signedTx in register_passkey request');
                    return NextResponse.json({ error: 'Missing signed transaction' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                if (!expectedContractId) {
                    console.error('Missing expectedContractId in register_passkey request');
                    return NextResponse.json({ error: 'Missing expectedContractId' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    console.log('Attempting to send transaction to server:', {
                        contractId: expectedContractId,
                        keyId: passkeyKeyId,
                        hasSignedTx: !!signedTx
                    });

                    let sendResult;
                    try {
                        sendResult = await server.send(signedTx);
                        if (!sendResult || typeof sendResult !== 'object') {
                            throw new Error('Invalid response from server.send');
                        }
                    } catch (sendError) {
                        console.error('Error sending transaction:', {
                            error: sendError,
                            message: sendError instanceof Error ? sendError.message : String(sendError),
                            stack: sendError instanceof Error ? sendError.stack : undefined
                        });
                        return NextResponse.json(
                            { error: `Failed to send transaction: ${sendError instanceof Error ? sendError.message : String(sendError)}` },
                            { status: 500, headers: { 'Content-Type': 'application/json' } }
                        );
                    }

                    console.log('Transaction sent successfully:', {
                        hash: sendResult.hash,
                        contractId: expectedContractId
                    });

                    const txHash = sendResult.hash;
                    if (!txHash) {
                        console.error('Transaction submission did not return a hash');
                        return NextResponse.json(
                            { error: 'Transaction submission did not return a hash' },
                            { status: 500, headers: { 'Content-Type': 'application/json' } }
                        );
                    }

                    return NextResponse.json({
                        success: true,
                        transactionHash: txHash,
                        contractId: expectedContractId
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error in register_passkey:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        name: error instanceof Error ? error.name : undefined
                    });

                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Registration failed' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'get_signers_by_address': {
                const { address } = params;
                if (!address) {
                    return NextResponse.json({ error: 'Missing address' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    const response = await fetch(`${requiredEnvVars.NEXT_PUBLIC_MERCURY_URL}/zephyr/execute`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${requiredEnvVars.MERCURY_JWT}`
                        },
                        body: JSON.stringify({
                            project_name: requiredEnvVars.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
                            mode: {
                                Function: {
                                    fname: 'get_signers_by_address',
                                    arguments: JSON.stringify({ address })
                                }
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `API call failed with status ${response.status}`);
                    }

                    const data = await response.json();
                    return NextResponse.json({ signers: data || [] }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error in get_signers_by_address:', error);
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to get signers' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'get_wallet_by_contract_id': {
                const { contractId } = params;
                if (!contractId) {
                    return NextResponse.json({ error: 'Missing contractId' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                try {
                    console.log('Fetching wallet data for contract:', contractId);
                    const response = await fetch(`${requiredEnvVars.NEXT_PUBLIC_MERCURY_URL}/zephyr/execute`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${requiredEnvVars.MERCURY_JWT}`
                        },
                        body: JSON.stringify({
                            project_name: requiredEnvVars.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
                            mode: {
                                Function: {
                                    fname: 'get_signers_by_address',
                                    arguments: JSON.stringify({ address: contractId })
                                }
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error response from Mercury:', errorData);
                        throw new Error(errorData.error || `API call failed with status ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Wallet data retrieved successfully:', { contractId });

                    return NextResponse.json({ signers: data || [] }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error in get_wallet_by_contract_id:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to get wallet data' },
                        { 
                            status: 500,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
            }

            case 'fund_wallet': {
                const { walletAddress, amount } = params;
                
                if (!walletAddress) {
                    return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 });
                }

                try {
                    console.log('Funding wallet:', { walletAddress, amount });
                    
                    const { built, ...transfer } = await native.transfer({
                        to: walletAddress,
                        from: await fundPubkey,
                        amount: BigInt(amount)
                    });

                    const fundSignerInstance = await fundSigner;
                    await transfer.signAuthEntries({
                        address: await fundPubkey,
                        signAuthEntry: fundSignerInstance.signAuthEntry,
                    });

                    const result = await server.send(built!);
                    console.log('Funding result:', result);

                    return NextResponse.json({ success: true, result });
                } catch (error) {
                    console.error('Error funding wallet:', error);
                    return NextResponse.json({ error: 'Failed to fund wallet' }, { status: 500 });
                }
            }

            default:
                console.error('Unsupported action:', action);
                return NextResponse.json({ error: 'Unsupported action' }, { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Mercury server error:', {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Server error' },
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}