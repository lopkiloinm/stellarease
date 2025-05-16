import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PasskeyKit, PasskeyServer, SACClient } from "passkey-kit";
import { Account, Keypair, StrKey } from "@stellar/stellar-sdk/minimal"
import { Buffer } from "buffer";
import { basicNodeSigner } from "@stellar/stellar-sdk/minimal/contract";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";

// Constants
export const ADMIN_KEY = "AAAAEAAAAAEAAAABAAAAAQ==";
export const NATIVE_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const SAMPLE_POLICY = "CBQZU3JQ2HEBQHSUSADNXQAKKEGU3EZDWMSPX2Y5RGTLX6ICVXZMUQB3";
export const SECRET = "SBEIDWQVWNLPCP35EYQ6GLWKFQ2MDY7APRLOQ3AJNU6KSE7FXGA7C55W";
export const PUBLIC = "GBVQMKYWGELU6IKLK2U6EIIHTNW5LIUYJE7FUQPG4FAB3QQ3KAINFVYS";

// Initialize RPC server
export const rpc = new Server(process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org');

// Constants
export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32))
export const mockSource = new Account(mockPubkey, '0')

// Initialize fund keypair with deterministic generation
export const fundKeypair = new Promise<Keypair>(async (resolve) => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    const keypair = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer))
    const publicKey = keypair.publicKey()

    rpc.getAccount(publicKey)
        .catch(() => rpc.requestAirdrop(publicKey))
        .catch(() => { })

    resolve(keypair)
})

export const fundPubkey = fundKeypair.then(kp => kp.publicKey())
export const fundSigner = fundKeypair.then(kp => basicNodeSigner(kp, process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'))

// Initialize account
export const account = new PasskeyKit({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    walletWasmHash: process.env.NEXT_PUBLIC_WALLET_WASM_HASH || '',
});

// Initialize server
export const server = new PasskeyServer({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    launchtubeUrl: process.env.NEXT_PUBLIC_LAUNCHTUBE_URL,
    launchtubeJwt: process.env.LAUNCHTUBE_JWT,
    mercuryProjectName: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    mercuryUrl: process.env.NEXT_PUBLIC_MERCURY_URL,
    mercuryJwt: process.env.MERCURY_JWT,
});

// Validate server configuration
if (!process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT && !process.env.LAUNCHTUBE_JWT) {
    console.error('LAUNCHTUBE_JWT is not set. This is required for the Launchtube service.');
    throw new Error('LAUNCHTUBE_JWT environment variable is required');
}

// Manually set Launchtube headers if not set by PasskeyServer
if (!server.launchtubeHeaders) {
    server.launchtubeHeaders = {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
}

// Log JWT token details (safely)
console.log('JWT Token details:', {
    hasToken: !!(process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT),
    tokenLength: (process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT)?.length,
    tokenPrefix: (process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT)?.substring(0, 20) + '...',
    hasHeaders: !!server.launchtubeHeaders,
    headerKeys: server.launchtubeHeaders ? Object.keys(server.launchtubeHeaders) : [],
    contentType: server.launchtubeHeaders?.['Content-Type']
});

// Validate Launchtube headers
if (!server.launchtubeHeaders) {
    console.error('Launchtube headers are not set. This indicates an issue with the JWT token.');
    console.error('JWT Token details:', {
        hasToken: !!(process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT),
        tokenLength: (process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT)?.length,
        tokenPrefix: (process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT || process.env.LAUNCHTUBE_JWT)?.substring(0, 20) + '...',
        launchtubeUrl: server.launchtubeUrl
    });
    throw new Error('Invalid Launchtube JWT token configuration');
}

// Log server configuration (without sensitive data)
console.log('Server initialized with:', {
    rpcUrl: server.rpcUrl,
    launchtubeUrl: server.launchtubeUrl,
    hasLaunchtubeHeaders: !!server.launchtubeHeaders,
    launchtubeContentType: server.launchtubeHeaders?.['Content-Type'],
    mercuryProjectName: process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME,
    mercuryUrl: process.env.NEXT_PUBLIC_MERCURY_URL,
    hasMercuryJwt: !!process.env.MERCURY_JWT
});

// Initialize SAC client
export const sac = new SACClient({
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
});

// Initialize native client
export const native = sac.getSACClient(process.env.NEXT_PUBLIC_NATIVE_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');