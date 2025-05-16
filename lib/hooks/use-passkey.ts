import { useState, useEffect } from 'react'
import { PasskeyKit, SACClient } from 'passkey-kit'
import { account, native, server, ADMIN_KEY } from '../common'
import { Keypair } from '@stellar/stellar-sdk/minimal'
import { SignerStore, SignerKey, type SignerLimits, type Signer } from 'passkey-kit'
import base64url from 'base64url'
import { Buffer } from 'buffer'

// Constants from the example
const NATIVE_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
const SAMPLE_POLICY = "CBJQC7FVOAJTBMOOSRUTAED3JVHGNHPKSKPXSREOWFHL7O6LW2ATQZAU"
const SECRET = "SBEIDWQVWNLPCP35EYQ6GLWKFQ2MDY7APRLOQ3AJNU6KSE7FXGA7C55W"
const PUBLIC = "GBVQMKYWGELU6IKLK2U6EIIHTNW5LIUYJE7FUQPG4FAB3QQ3KAINFVYS"

interface UsePasskeyOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onWalletUpdate?: (walletAddress: string) => void
}

// Define WebAuthn credential types
interface WebAuthnRegistrationCredential {
  id: string
  rawId: ArrayBuffer
  response: {
    attestationObject: ArrayBuffer
    clientDataJSON: ArrayBuffer
  }
  type: string
}

interface WebAuthnAuthenticationCredential {
  id: string
  rawId: ArrayBuffer
  response: {
    authenticatorData: ArrayBuffer
    clientDataJSON: ArrayBuffer
    signature: ArrayBuffer
  }
  type: string
}

export function usePasskey() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)
  const [signers, setSigners] = useState<Signer[]>([])
  const [keyName, setKeyName] = useState<string>('')
  const [adminSigner, setAdminSigner] = useState<Signer | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [balance, setBalance] = useState<string>('0')
  const [loadingStep, setLoadingStep] = useState<string | null>(null)

  // Load signers on initial mount only if we have a contract ID
  useEffect(() => {
    const loadInitialData = async () => {
      const storedContractId = localStorage.getItem('sp:contractId')
      
      if (storedContractId && !initialized) {
        try {
          setContractId(storedContractId)
          // Only get signers if we're not in the initialization flow
          if (authenticated) {
            await getWalletSigners(storedContractId)
          }
          setInitialized(true)
        } catch (err: unknown) {
          console.error('Error loading initial data:', err)
          // Only clear storage if it's not an initialization error
          if (err instanceof Error && !err.message.includes('Failed to get wallet signers')) {
            localStorage.removeItem('sp:keyId')
            localStorage.removeItem('sp:contractId')
          }
          setError(err instanceof Error ? err : new Error('Failed to load initial data'))
        }
      }
    }

    if (!initialized && !loading) {
      loadInitialData()
    }
  }, [initialized, loading, authenticated])

  // Create a new passkey credential
  const createPasskeyCredential = async (name: string): Promise<WebAuthnRegistrationCredential> => {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    
    const userId = new Uint8Array(32);
    crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Smart Wallet',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name,
          displayName: name
        },
        pubKeyCredParams: [{
          type: 'public-key',
          alg: -7 // ES256
        }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required'
        },
        timeout: 60000
      }
    }) as WebAuthnRegistrationCredential;

    if (!credential) {
      throw new Error('Failed to create WebAuthn credential');
    }

    return credential;
  };

  // Get wallet signers
  const getWalletSigners = async (walletId: string) => {
    try {
      const response = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_signers_by_address',
          address: walletId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get wallet signers');
      }

      const data = await response.json();
      
      // Handle case where data.signers exists
      const signersList = data.signers || data;
      if (!Array.isArray(signersList)) {
        console.warn('Unexpected signers data format:', data);
        setSigners([]);
        setAdminSigner(null);
        return;
      }

      setSigners(signersList);

      // Find the admin signer
      const adminKeys = signersList.filter((signer: Signer) => signer.limits === ADMIN_KEY);
      if (adminKeys.length > 0) {
        setAdminSigner(adminKeys[0]);
      } else {
        setAdminSigner(null);
      }
    } catch (err) {
      console.error('Error getting signers:', err);
      // Reset states on error
      setSigners([]);
      setAdminSigner(null);
      throw err;
    }
  };

  const register = async (options: UsePasskeyOptions & { keyName?: string } = {}) => {
    try {
      setLoading(true)
      setError(null)

      const nameToUse = options.keyName || keyName
      if (!nameToUse) {
        throw new Error('Please provide a name for your passkey')
      }

      // Create wallet using account.createWallet directly
      console.log('Creating wallet with name:', nameToUse);
      const { keyId: kid, contractId: cid, signedTx } = await account.createWallet("Super Peach", nameToUse);
      console.log('Wallet creation result:', { kid, cid, signedTx });

      // Log the request details
      const requestBody = {
        action: 'register_passkey',
        signedTx: signedTx.toXDR(),
        expectedContractId: cid,
        passkeyKeyId: kid
      };
      console.log('Sending registration request:', {
        url: '/api/mercury',
        method: 'POST',
        body: {
          ...requestBody,
          signedTx: requestBody.signedTx.substring(0, 50) + '...'
        }
      });

      // Send the signed transaction to Mercury service
      let response;
      try {
        response = await fetch('/api/mercury', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError) {
        console.error('Network error during registration:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }

      // Log response details
      console.log('Registration response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response details:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url,
          body: text.substring(0, 200) // Log first 200 chars of response
        });
        throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText}). Please try again.`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Registration error response:', data);
        throw new Error(data.error || `Failed to register passkey (${response.status} ${response.statusText})`);
      }

      console.log('Registration response data:', data);

      // The server response will provide contractId (the smart wallet address)
      const { contractId: newContractId } = data;

      if (!newContractId) {
        console.error('Missing contractId in response:', data);
        throw new Error('Server response missing contractId');
      }

      // Store the keyId and newContractId (Smart Contract ID, which is the wallet address)
      const keyIdBase64 = base64url(kid);
      setContractId(newContractId);
      localStorage.setItem('sp:keyId', keyIdBase64);
      localStorage.setItem('sp:contractId', newContractId);

      // Set authenticated to true after successful registration
      setAuthenticated(true);

      // Get the wallet data from Mercury using the newContractId
      console.log('Fetching wallet data for contract:', newContractId);
      let walletResponse;
      try {
        walletResponse = await fetch('/api/mercury', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_wallet_by_contract_id',
            contractId: newContractId
          })
        });
      } catch (fetchError) {
        console.error('Network error fetching wallet data:', fetchError);
        // Don't throw here, as the registration was successful
        console.warn('Failed to get wallet data: network error');
      }

      if (walletResponse) {
        // Log wallet response details
        console.log('Wallet response details:', {
          status: walletResponse.status,
          statusText: walletResponse.statusText,
          headers: Object.fromEntries(walletResponse.headers.entries()),
          url: walletResponse.url
        });

        // Check if wallet response is JSON
        const walletContentType = walletResponse.headers.get('content-type');
        if (!walletContentType || !walletContentType.includes('application/json')) {
          const text = await walletResponse.text();
          console.error('Non-JSON wallet response details:', {
            status: walletResponse.status,
            statusText: walletResponse.statusText,
            contentType: walletContentType,
            headers: Object.fromEntries(walletResponse.headers.entries()),
            url: walletResponse.url,
            body: text.substring(0, 200)
          });
          // Don't throw here, as the registration was successful
          console.warn('Failed to get wallet data: non-JSON response');
        } else if (!walletResponse.ok) {
          const errorData = await walletResponse.json();
          console.warn('Failed to get wallet data:', errorData);
        } else {
          const walletData = await walletResponse.json();
          console.log('Wallet data:', walletData);
          if (walletData.signers) {
            setSigners(walletData.signers);
            // Find the admin signer
            const adminKeys = walletData.signers.filter((signer: any) => signer.limits === ADMIN_KEY);
            if (adminKeys.length > 0) {
              setAdminSigner(adminKeys[0]);
            }
          }
        }
      }

      // Notify about wallet address update if callback provided, using the contractId
      if (options.onWalletUpdate && newContractId) {
        options.onWalletUpdate(newContractId);
      }

      options.onSuccess?.();
    } catch (err) {
      console.error('Registration error:', {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      const error = new Error(err instanceof Error ? err.message : String(err));
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const connect = async (keyId_?: string, options: UsePasskeyOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const storedKeyId = keyId_ || localStorage.getItem('sp:keyId');
      if (!storedKeyId) {
        throw new Error('No keyId found. Please register first.');
      }

      const { keyId: kid, contractId: cid } = await account.connectWallet({
        keyId: storedKeyId,
        getContractId: (keyId) => server.getContractId({ keyId })
      });

      const keyIdBase64 = base64url(kid);
      setContractId(cid);
      localStorage.setItem('sp:keyId', keyIdBase64);
      localStorage.setItem('sp:contractId', cid);
      
      // Get the wallet data using contractId
      const walletResponse = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_wallet_by_contract_id',
          contractId: cid
        })
      });

      if (!walletResponse.ok) {
        console.warn('Failed to get wallet data:', await walletResponse.json());
      } else {
        const walletData = await walletResponse.json();
        console.log('Wallet data:', walletData);
        if (walletData.signers) {
          setSigners(walletData.signers);
          // Find the admin signer
          const adminKeys = walletData.signers.filter((signer: any) => signer.limits === ADMIN_KEY);
          if (adminKeys.length > 0) {
            setAdminSigner(adminKeys[0]);
          }
        }
      }

      // Notify about wallet address update if callback provided, using contractId
      if (options?.onWalletUpdate) {
        options.onWalletUpdate(cid);
      }

      options?.onSuccess?.();
    } catch (err) {
      console.error('Connection error:', err);
      const error = new Error(err instanceof Error ? err.message : String(err));
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const authenticate = async (options: UsePasskeyOptions = {}) => {
    // Don't authenticate if we're already authenticated
    if (authenticated) {
      console.log("Already authenticated, skipping authenticate call.");
      options.onSuccess?.(); // Call success if already authenticated
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStep('waiting_for_passkey');

      const storedKeyId = localStorage.getItem('sp:keyId');
      if (!storedKeyId) {
        throw new Error('No keyId found in localStorage. Please register first.');
      }

      console.log(`Attempting to connect wallet with keyId: ${storedKeyId}`);
      
      // Wait for passkey entry
      const { keyId: connectedKeyId, contractId: connectedContractId } = await account.connectWallet({
        keyId: storedKeyId,
        getContractId: async (kId: string) => {
          setLoadingStep('processing_passkey');
          console.log(`getContractId callback invoked with keyId: ${kId}`);
          try {
            const cid = await server.getContractId({ keyId: kId });
            console.log(`server.getContractId resolved to: ${cid}`);
            if (!cid) throw new Error("server.getContractId did not return a contract ID.");
            return cid;
          } catch (err) {
            console.error("Error in getContractId callback:", err);
            throw err;
          }
        }
      });

      setLoadingStep('finalizing');
      console.log('Wallet connected:', { connectedKeyId, connectedContractId });

      // Store/update the keyId and contractId
      const newKeyIdBase64 = typeof connectedKeyId === 'string' 
          ? connectedKeyId 
          : base64url(Buffer.from(connectedKeyId as Uint8Array));
      localStorage.setItem('sp:keyId', newKeyIdBase64);
      setContractId(connectedContractId);
      localStorage.setItem('sp:contractId', connectedContractId);
      setAuthenticated(true);

      // Get the signers after successful authentication
      await getWalletSigners(connectedContractId);

      if (options.onWalletUpdate) {
        options.onWalletUpdate(connectedContractId);
      }
      options.onSuccess?.();

    } catch (err) {
      console.error('Authentication error (using account.connectWallet):', err);
      const error = new Error(err instanceof Error ? err.message : String(err));
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }

  const addSigner = async (key: string, options: UsePasskeyOptions = {}) => {
    try {
      setLoading(true)
      setError(null)

      const contractId = localStorage.getItem('sp:contractId')
      if (!contractId) {
        throw new Error('No contract ID found')
      }

      let id: Uint8Array
      let pk: Uint8Array

      if (key.startsWith('G')) {
        const buf = base64url.toBuffer(key)
        id = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
        pk = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
      } else {
        const buf = base64url.toBuffer(key)
        id = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
        pk = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
      }

      const { sequence } = await account.rpc.getLatestLedger()
      const at = await account.addSecp256r1(id, pk, undefined, SignerStore.Temporary, sequence + 518_400)
      await account.sign(at, { keyId: adminSigner?.key })

      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          signedTx: at.built!.toXDR(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }

      await getWalletSigners(contractId)

      options.onSuccess?.()
    } catch (err) {
      console.error('Add signer error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const error = new Error(`Add signer failed: ${errorMessage}`)
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeSigner = async (type: 'Policy' | 'Ed25519' | 'Secp256r1', options: UsePasskeyOptions = {}) => {
    try {
      setLoading(true)
      setError(null)

      const contractId = localStorage.getItem('sp:contractId')
      if (!contractId) {
        throw new Error('No contract ID found')
      }

      const signer = signers.find((s) => s.kind === type)
      if (!signer) {
        throw new Error(`No ${type} signer found`)
      }

      let key: SignerKey
      switch (type) {
        case 'Policy':
          key = SignerKey.Policy(signer.key)
          break
        case 'Ed25519':
          key = SignerKey.Ed25519(signer.key)
          break
        case 'Secp256r1':
          key = SignerKey.Secp256r1(signer.key)
          break
        default:
          throw new Error('Invalid signer type')
      }

      const at = await account.remove(key)
      await account.sign(at, { keyId: adminSigner?.key })

      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          signedTx: at.built!.toXDR(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }

      await getWalletSigners(contractId)

      options.onSuccess?.()
    } catch (err) {
      console.error('Remove signer error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const error = new Error(`Remove signer failed: ${errorMessage}`)
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const addEd25519Signer = async (options: UsePasskeyOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const contractId = localStorage.getItem('sp:contractId');
      if (!contractId) {
        throw new Error('No contract ID found');
      }

      const signer_limits = undefined;
      const at = await account.addEd25519(PUBLIC, signer_limits, SignerStore.Temporary);

      await account.sign(at, { keyId: adminSigner?.key });
      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          signedTx: at.built!.toXDR(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }

      await getWalletSigners(contractId);
      options.onSuccess?.();
    } catch (err) {
      console.error('Add Ed25519 signer error:', err);
      const error = new Error(err instanceof Error ? err.message : String(err));
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addPolicySigner = async (options: UsePasskeyOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const contractId = localStorage.getItem('sp:contractId');
      if (!contractId) {
        throw new Error('No contract ID found');
      }

      const signer_limits: SignerLimits = new Map();
      const signer_keys: SignerKey[] = [];
      signer_keys.push(SignerKey.Ed25519(PUBLIC));
      signer_limits.set(NATIVE_SAC, signer_keys);

      const at = await account.addPolicy(SAMPLE_POLICY, signer_limits, SignerStore.Temporary);

      await account.sign(at, { keyId: adminSigner?.key });
      const response = await fetch('/api/passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          signedTx: at.built!.toXDR(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }

      await getWalletSigners(contractId);
      options.onSuccess?.();
    } catch (err) {
      console.error('Add policy signer error:', err);
      const error = new Error(err instanceof Error ? err.message : String(err));
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getWalletBalance = async () => {
    try {
      const contractId = localStorage.getItem('sp:contractId');
      if (!contractId) {
        throw new Error('No contract ID found');
      }

      const { result } = await native.balance({ id: contractId });
      setBalance(result.toString());
    } catch (err) {
      console.error('Get wallet balance error:', err);
      setError(err instanceof Error ? err : new Error('Failed to get wallet balance'));
    }
  };

  const handleSignOut = () => {
    // Clear all states
    setLoading(false)
    setError(null)
    setContractId(null)
    setSigners([])
    setKeyName('')
    setAdminSigner(null)
    setInitialized(false)
    setAuthenticated(false)

    // Clear localStorage
    localStorage.removeItem('sp:keyId')
    localStorage.removeItem('sp:contractId')
  }

  return {
    loading,
    error,
    walletAddress: contractId, // Wallet Address is the Smart Contract ID (C...)
    contractId, // Also exposing contractId directly for clarity if needed, though it's same as walletAddress
    signers,
    keyName,
    setKeyName,
    adminSigner,
    register,
    connect,
    authenticate,
    handleSignOut,
    addSigner,
    removeSigner,
    addEd25519Signer,
    addPolicySigner,
    getWalletBalance,
    balance,
    initialized,
    authenticated,
    loadingStep
  }
}