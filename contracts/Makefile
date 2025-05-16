export STELLAR_NETWORK=testnet
export STELLAR_ACCOUNT=default
# export STELLAR_NETWORK=vc
# export STELLAR_ACCOUNT=live

# TESTNET
export SMART_WALLET_WASM=ec78af49595fa4b2944543be53cfb4490df63c4b4e8c4a6330860f935f03b159
export SMART_WALLET_FACTORY=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

build:
	rm -rf out/
	rm -rf smart-wallet/target/wasm32-unknown-unknown/
	rm -rf spending-policy/target/wasm32-unknown-unknown/
	rm -rf earning-policy/target/wasm32-unknown-unknown/
	mkdir -p out/
	cargo build --target wasm32-unknown-unknown --release
	cd smart-wallet && cargo build --target wasm32-unknown-unknown --release --package smart-wallet
	cd spending-policy && cargo build --target wasm32-unknown-unknown --release --package spending-policy
	cd earning-policy && cargo build --target wasm32-unknown-unknown --release --package earning-policy
	cp target/wasm32-unknown-unknown/release/smart_wallet.wasm out/
	cp target/wasm32-unknown-unknown/release/spending_policy.wasm out/
	cp target/wasm32-unknown-unknown/release/earning_policy.wasm out/
	stellar contract optimize --wasm out/smart_wallet.wasm
	stellar contract optimize --wasm out/spending_policy.wasm
	stellar contract optimize --wasm out/earning_policy.wasm

upload:
	soroban contract upload --wasm ./out/smart_wallet.optimized.wasm --source $(STELLAR_ACCOUNT)
	soroban contract upload --wasm ./out/spending_policy.optimized.wasm --source $(STELLAR_ACCOUNT)
	soroban contract upload --wasm ./out/earning_policy.optimized.wasm --source $(STELLAR_ACCOUNT)

bindings:
	stellar contract bindings typescript --id CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC --network $(STELLAR_NETWORK) --output-dir ./out/sac-sdk --overwrite
	stellar contract bindings typescript --wasm ./target/wasm32-unknown-unknown/release/smart_wallet.wasm --network $(STELLAR_NETWORK) --output-dir ./out/passkey-kit-sdk --overwrite
	stellar contract bindings typescript --wasm ./spending-policy/target/wasm32-unknown-unknown/release/spending_policy.wasm --network $(STELLAR_NETWORK) --output-dir ./out/spending-policy-sdk --overwrite
	stellar contract bindings typescript --wasm ./earning-policy/target/wasm32-unknown-unknown/release/earning_policy.wasm --network $(STELLAR_NETWORK) --output-dir ./out/earning-policy-sdk --overwrite

fmt:
	@cd smart-wallet && cargo fmt --all
	@cd spending-policy && cargo fmt --all
	@cd earning-policy && cargo fmt --all

clean:
	rm -rf out/
	rm -rf smart-wallet/target/
	rm -rf spending-policy/target/
	rm -rf earning-policy/target/
	@cd smart-wallet && cargo clean
	@cd spending-policy && cargo clean
	@cd earning-policy && cargo clean