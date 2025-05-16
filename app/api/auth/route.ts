import { PasskeyServer, PasskeyKit } from "passkey-kit";
import { NextResponse } from "next/server";
import base64url from 'base64url';
import { Buffer } from 'buffer';

// Initialize server for server-side operations
const server = new PasskeyServer({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    launchtubeUrl: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL || 'https://testnet.launchtube.xyz',
    launchtubeJwt: process.env.LAUNCHTUBE_JWT,
    mercuryUrl: process.env.NEXT_PUBLIC_MERCURY_URL || 'https://api.mercurydata.app',
    mercuryJwt: process.env.MERCURY_JWT,
    mercuryProjectName: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME
});

// Initialize client for WebAuthn operations
const client = new PasskeyKit({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    walletWasmHash: process.env.NEXT_PUBLIC_WALLET_WASM_HASH || '',
    timeoutInSeconds: 30
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...params } = body;
        console.log('Received request:', { action, params });

        switch (action) {
            case 'register_passkey': {
                const { keyName, displayName, credential } = params;
                
                try {
                    console.log('Creating wallet with:', {
                        name: keyName || displayName,
                        credentialId: credential.id,
                        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
                        launchtubeUrl: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
                        mercuryUrl: process.env.NEXT_PUBLIC_MERCURY_URL
                    });

                    // Create wallet using PasskeyKit
                    const result = await client.createWallet(keyName || displayName, credential.id);
                    console.log('Wallet creation result:', {
                        contractId: result.contractId,
                        keyId: credential.id,
                        hasSignedTx: !!result.signedTx
                    });
                    
                    // Get the signers to verify registration using PasskeyServer
                    console.log('Getting signers for contract:', result.contractId);
                    const signers = await server.getSigners(result.contractId);
                    console.log('Retrieved signers:', signers);
                    
                    const signerExists = signers.some(signer => signer.key === credential.id && !signer.evicted);
                    console.log('Signer verification:', { signerExists });
                    
                    return NextResponse.json({ 
                        success: true, 
                        contractId: result.contractId,
                        keyId: credential.id,
                        signedTx: result.signedTx,
                        signerVerified: signerExists
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Registration error details:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        name: error instanceof Error ? error.name : undefined
                    });

                    // Check if the error is from a fetch response
                    if (error instanceof Response) {
                        const responseText = await error.text();
                        console.error('Error response:', {
                            status: error.status,
                            statusText: error.statusText,
                            headers: Object.fromEntries(error.headers.entries()),
                            body: responseText
                        });
                    }

                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Registration failed' },
                        { 
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }
            }

            case 'getContractId': {
                const { keyId } = params;
                if (!keyId) {
                    return NextResponse.json({ error: 'Missing keyId' }, { 
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
                try {
                    console.log('Getting contract ID for keyId:', keyId);
                    // Use PasskeyKit for WebAuthn verification
                    const result = await client.connectWallet({ keyId });
                    console.log('Contract ID result:', result);
                    return NextResponse.json({ success: true, contractId: result.contractId }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
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
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }
            }

            case 'send': {
                const { signedTx, fee } = params;
                if (!signedTx) {
                    return NextResponse.json({ error: 'Missing signedTx' }, { 
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
                try {
                    console.log('Sending transaction:', { signedTx: signedTx.substring(0, 50) + '...', fee });
                    // Use PasskeyServer for sending transactions
                    const result = await server.send(signedTx, fee);
                    console.log('Transaction result:', result);
                    return NextResponse.json({ success: true, result }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Error sending transaction:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to send transaction' },
                        { 
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { 
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
        }
    } catch (error) {
        console.error('Auth server error:', {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Server error' },
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}