# Fixed Deployment for Celo

## Problem

The Hardhat Ignition deployment was failing with:
```
ProviderError: invalid argument 0: json: cannot unmarshal hex string without 0x prefix into Go value of type common.Address
```

This is a known issue with Hardhat Ignition and Celo's RPC endpoints.

## Solution

I've created an alternative deployment script using standard Hardhat deployment (as recommended in the [Celo documentation](https://docs.celo.org/)), which works better with Celo's RPC.

## How to Deploy

### Step 1: Clear Corrupted State (if any)

```bash
cd apps/contracts
rmdir /s /q ignition\deployments 2>nul
```

### Step 2: Verify Environment

Make sure your `apps/contracts/.env` file has:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
```

### Step 3: Deploy

**To Celo Mainnet:**
```bash
npm run deploy:celo
```

**To Alfajores Testnet:**
```bash
npm run deploy:alfajores
```

**To Sepolia Testnet:**
```bash
npm run deploy:sepolia
```

## What Changed

1. ✅ Created `scripts/deploy.ts` - Standard Hardhat deployment script
2. ✅ Updated package.json - New deploy commands use the standard script
3. ✅ Fixed private key handling - Properly strips 0x prefix and trims whitespace
4. ✅ Kept Ignition commands - Available as `deploy:ignition:*` if needed

## New Commands

- `npm run deploy:celo` - Deploy to Celo Mainnet (standard script)
- `npm run deploy:alfajores` - Deploy to Alfajores Testnet (standard script)
- `npm run deploy:ignition:celo` - Deploy using Ignition (if you prefer)

## After Deployment

1. Copy the contract address from the output
2. Update `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_deployed_address...
   ```
3. Restart your Next.js dev server

## Verify Deployment

Visit Celoscan to verify your contract:
- Mainnet: https://celoscan.io/address/YOUR_CONTRACT_ADDRESS
- Alfajores: https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS

## Troubleshooting

### "Account has no balance"
- Get testnet tokens: https://faucet.celo.org
- Make sure you have CELO for gas fees

### "Invalid private key"
- Ensure PRIVATE_KEY doesn't have `0x` prefix
- Should be 64 hex characters

### Still having issues?
- Try deploying to Alfajores testnet first
- Check network connectivity
- Verify RPC endpoint is accessible

