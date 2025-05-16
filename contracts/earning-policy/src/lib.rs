#![no_std]

use smart_wallet_interface::{types::SignerKey, PolicyInterface};
use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env,
    TryFromVal, Vec, Map, Symbol, storage::Storage,
};

const DAILY_LIMIT: i128 = 100_000_000; // 100 XLM in stroops
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
        // Check if the passkey name matches the required name
        if let SignerKey::Ed25519(key) = signer {
            let passkey_name: Option<Symbol> = env.storage().instance().get(&key);
            if passkey_name != Some(Symbol::new(&env, REQUIRED_PASSKEY_NAME)) {
                return; // Skip policy check if passkey name doesn't match
            }
        } else {
            return; // Skip policy check for non-Ed25519 signers
        }

        // Get the current day's timestamp (rounded to start of day)
        let current_day = env.ledger().timestamp() / 86400;
        
        // Get or initialize the daily earning map
        let earning_key = Symbol::new(&env, "daily_earning");
        let mut daily_earning: Map<u64, i128> = env.storage().instance().get(&earning_key)
            .unwrap_or_else(|| Map::new(&env));
        
        // Get current day's earnings
        let current_earning = daily_earning.get(current_day).unwrap_or(0);
        
        for context in contexts.iter() {
            match context {
                Context::Contract(ContractContext { fn_name, args, .. }) => {
                    if fn_name == symbol_short!("transfer") {
                        // Check if this is an incoming transfer
                        if let Some(from_val) = args.get(0) {
                            if let Ok(from) = Address::try_from_val(&env, &from_val) {
                                if from != source {
                                    if let Some(amount_val) = args.get(2) {
                                        if let Ok(amount) = i128::try_from_val(&env, &amount_val) {
                                            // Check if this transaction would exceed the daily limit
                                            if current_earning + amount > DAILY_LIMIT {
                                                panic_with_error!(&env, Error::EarningLimitExceeded)
                                            }
                                            
                                            // Update the daily earning
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