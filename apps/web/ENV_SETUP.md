# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `apps/web` directory with the following variables:

```env
# Contract Address (from deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Token Address (ERC20 token for savings)
# For Celo Alfajores Testnet, use cUSD:
NEXT_PUBLIC_TOKEN_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# For Celo Mainnet, use cUSD:
# NEXT_PUBLIC_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a

# For Localhost/Testing, you'll need to deploy a test ERC20 token first
# Or use a testnet token address if testing against testnet
```

## Celo Token Addresses

### Alfajores Testnet (Chain ID: 44787)
- **cUSD (Celo Dollar)**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- **cEUR (Celo Euro)**: `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F`
- **CELO (Native)**: Not an ERC20, use wrapped version if needed

### Celo Mainnet (Chain ID: 42220)
- **cUSD (Celo Dollar)**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **cEUR (Celo Euro)**: `0xD8763CBa276a3738E6D85e4F2dC36Fd3C3e5E3C1`

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

## Getting Test Tokens

For Alfajores testnet, get free test tokens from:
- https://faucet.celo.org
- Connect your wallet and request cUSD tokens

