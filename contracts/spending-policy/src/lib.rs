#![no_std]

use smart_wallet_interface::{types::SignerKey, PolicyInterface};
use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env,
    TryFromVal, Vec, Map, Symbol, storage::Storage,
};

const DAILY_LIMIT: i128 = 100_000_000; // 100 XLM in stroops
const REQUIRED_PASSKEY_NAME: &str = "spending_limit";

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    SpendingLimitExceeded = 1,
    InvalidOperation = 2,
    InvalidPasskeyName = 3,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl PolicyInterface for Contract {
    fn policy__(env: Env, _source: Address, signer: SignerKey, contexts: Vec<Context>) {
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
        
        // Get or initialize the daily spending map
        let spending_key = Symbol::new(&env, "daily_spending");
        let mut daily_spending: Map<u64, i128> = env.storage().instance().get(&spending_key)
            .unwrap_or_else(|| Map::new(&env));
        
        // Get current day's spending
        let current_spending = daily_spending.get(current_day).unwrap_or(0);
        
        for context in contexts.iter() {
            match context {
                Context::Contract(ContractContext { fn_name, args, .. }) => {
                    if fn_name == symbol_short!("transfer") {
                        if let Some(amount_val) = args.get(2) {
                            if let Ok(amount) = i128::try_from_val(&env, &amount_val) {
                                // Check if this transaction would exceed the daily limit
                                if current_spending + amount > DAILY_LIMIT {
                                    panic_with_error!(&env, Error::SpendingLimitExceeded)
                                }
                                
                                // Update the daily spending
                                daily_spending.set(current_day, current_spending + amount);
                                env.storage().instance().set(&spending_key, &daily_spending);
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