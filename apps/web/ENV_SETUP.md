# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `apps/web` directory with the following variables:

```env
# Contract Address (from deployment)
# Get this after deploying the SimpleSavingPlan contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Note:** The contract now uses **native CELO** instead of ERC20 tokens, so no token address is needed!

## Quick Setup

1. Create `.env.local` in `apps/web/`:
   ```bash
   cd apps/web
   touch .env.local
   ```

2. Add the variables above

3. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

## Getting Test CELO

For Alfajores testnet, get free test CELO from:
- https://faucet.celo.org
- Connect your wallet and request CELO tokens (native token)

The contract uses native CELO for all transactions:
- Daily payments are made in CELO
- Penalty stakes are in CELO
- Rewards are distributed in CELO

