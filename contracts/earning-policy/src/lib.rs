#![no_std]

use smart_wallet_interface::{types::SignerKey, PolicyInterface};
use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env,
    TryFromVal, Vec, Map, Symbol, storage::Storage,
};

// Daily earning limit of 100 XLM (in stroops)
const DAILY_LIMIT: i128 = 100_000_000;
// Required passkey name for earning authorization
const REQUIRED_PASSKEY_NAME: &str = "earning_limit";

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    EarningLimitExceeded = 1,
    InvalidOperation = 2,
    InvalidPasskeyName = 3,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl PolicyInterface for Contract {
    fn policy__(env: Env, source: Address, signer: SignerKey, contexts: Vec<Context>) {
        // Verify the signer has the correct passkey name for earning authorization
        if let SignerKey::Ed25519(key) = signer {
            let passkey_name: Option<Symbol> = env.storage().instance().get(&key);
            if passkey_name != Some(Symbol::new(&env, REQUIRED_PASSKEY_NAME)) {
                return; // Skip policy check if passkey name doesn't match
            }
        } else {
            return; // Skip policy check for non-Ed25519 signers
        }

        // Calculate current day's timestamp for daily limit tracking
        let current_day = env.ledger().timestamp() / 86400;
        
        // Initialize or retrieve daily earning tracking map
        let earning_key = Symbol::new(&env, "daily_earning");
        let mut daily_earning: Map<u64, i128> = env.storage().instance().get(&earning_key)
            .unwrap_or_else(|| Map::new(&env));
        
        // Get current day's accumulated earnings
        let current_earning = daily_earning.get(current_day).unwrap_or(0);
        
        // Process each context to enforce earning limits
        for context in contexts.iter() {
            match context {
                Context::Contract(ContractContext { fn_name, args, .. }) => {
                    if fn_name == symbol_short!("transfer") {
                        // Verify incoming transfer by checking source address
                        if let Some(from_val) = args.get(0) {
                            if let Ok(from) = Address::try_from_val(&env, &from_val) {
                                if from != source {
                                    if let Some(amount_val) = args.get(2) {
                                        if let Ok(amount) = i128::try_from_val(&env, &amount_val) {
                                            // Enforce daily earning limit
                                            if current_earning + amount > DAILY_LIMIT {
                                                panic_with_error!(&env, Error::EarningLimitExceeded)
                                            }
                                            
                                            // Update daily earning tracking
                                            daily_earning.set(current_day, current_earning + amount);
                                            env.storage().instance().set(&earning_key, &daily_earning);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        panic_with_error!(&env, Error::InvalidOperation)
                    }
                }
                _ => panic_with_error!(&env, Error::InvalidOperation),
            }
        }
    }
} 