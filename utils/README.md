# Utilities

Helper scripts and tools for managing Mercury and Zephyr programs.

## Structure

- `delete-program.js` - Node.js script for deleting Zephyr programs
- `check-mercury.ts` - TypeScript script for checking Mercury service status
- `mercury-test.ts` - TypeScript script for testing Mercury functionality

## Usage

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export MERCURY_JWT="your-jwt-token"
```

3. Run scripts:
```bash
# Delete a program
node delete-program.js

# Check Mercury status
ts-node check-mercury.ts

# Run Mercury tests
ts-node mercury-test.ts
``` 