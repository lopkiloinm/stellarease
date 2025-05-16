import { PasskeyServer, PasskeyKit } from "passkey-kit";
import { NextResponse } from "next/server";

// Validate required environment variables
const requiredEnvVars = {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_WALLET_WASM_HASH: process.env.NEXT_PUBLIC_WALLET_WASM_HASH,
    NEXT_PUBLIC_LAUNCHTUBE_URL: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
    LAUNCHTUBE_JWT: process.env.LAUNCHTUBE_JWT,
    NEXT_PUBLIC_MERCURY_PROJECT_NAME: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    NEXT_PUBLIC_MERCURY_URL: process.env.NEXT_PUBLIC_MERCURY_URL,
    MERCURY_JWT: process.env.MERCURY_JWT
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize server for server-side operations
const server = new PasskeyServer({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    launchtubeUrl: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
    launchtubeJwt: process.env.LAUNCHTUBE_JWT,
    mercuryProjectName: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    mercuryUrl: process.env.NEXT_PUBLIC_MERCURY_URL,
    mercuryJwt: process.env.MERCURY_JWT
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
        // Parse the request body as JSON
        const body = await request.json();
        const { action, ...params } = body;
        console.log('Received request:', { action, params });

        switch (action) {
            case 'register_passkey':
                const { keyName, displayName, credential } = params;
                
                try {
                    // Create wallet using PasskeyKit
                    const result = await client.createWallet(keyName || displayName, credential.id);
                    
                    // Get the signers to verify registration using PasskeyServer
                    const signers = await server.getSigners(result.contractId);
                    const signerExists = signers.some(signer => signer.key === credential.id && !signer.evicted);
                    
                    return NextResponse.json({ 
                        success: true, 
                        contractId: result.contractId,
                        keyId: credential.id,
                        signedTx: result.signedTx,
                        signerVerified: signerExists
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Registration error:', error);
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Registration failed' },
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }

            case 'getContractId':
                const { keyId } = params;
                if (!keyId) {
                    return NextResponse.json({ error: 'Missing keyId' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                try {
                    // Use PasskeyKit for WebAuthn verification
                    const result = await client.connectWallet({ keyId });
                    return NextResponse.json({ success: true, contractId: result.contractId }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error getting contract ID:', error);
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to get contract ID' },
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }

            case 'send':
                const { signedTx, fee } = params;
                if (!signedTx) {
                    return NextResponse.json({ error: 'Missing signedTx' }, { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                try {
                    // Use PasskeyServer for sending transactions
                    const result = await server.send(signedTx, fee);
                    return NextResponse.json({ success: true, result }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error sending transaction:', error);
                    return NextResponse.json(
                        { error: error instanceof Error ? error.message : 'Failed to send transaction' },
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    );
                }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('Passkey server error:', {
            error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Server error' },
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 