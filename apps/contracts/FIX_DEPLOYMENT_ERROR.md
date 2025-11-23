# Fixing Deployment Error: "cannot unmarshal hex string without 0x prefix"

## The Problem

The error `cannot unmarshal hex string without 0x prefix into Go value of type common.Address` typically occurs due to:

1. **Corrupted deployment state** - Partial deployment files causing conflicts
2. **Private key format issue** - Private key may have incorrect format
3. **RPC endpoint issues** - Network connectivity problems

## Solution Steps

### Step 1: Clear Corrupted Deployment State

The error mentions "Resuming existing deployment" - this means there's a corrupted state. Clear it:

```bash
cd apps/contracts

# Option A: Use the clear script
npm run clear-deployments

# Option B: Manually delete the deployments folder
rm -rf ignition/deployments/chain-42220
# Or on Windows:
rmdir /s ignition\deployments\chain-42220
```

### Step 2: Verify Private Key Format

In your `apps/contracts/.env` file, make sure your private key:

- **Should NOT have `0x` prefix** (Hardhat will add it automatically)
- Should be 64 characters long (32 bytes in hex)
- Example: `abc123...` (64 chars) NOT `0xabc123...`

```env
# Correct format:
PRIVATE_KEY=your_64_character_hex_string_without_0x

# Wrong format:
PRIVATE_KEY=0xyour_64_character_hex_string  # Don't include 0x
```

### Step 3: Try Deployment Again

After clearing the state and verifying the private key:

```bash
npm run deploy:celo
```

## Alternative: Deploy to Testnet First

If mainnet deployment continues to fail, try testnet first:

```bash
# Deploy to Alfajores testnet
npm run deploy:alfajores
```

## If Still Failing

### Check Your Private Key

1. Verify the key is correct and has funds
2. Make sure it's the full 64-character hex string
3. Try generating a new test key if needed

### Use Alternative RPC

Add to `.env`:
```env
# For Celo Mainnet, try alternative RPC
CELO_RPC_URL=https://rpc.ankr.com/celo
```

Then update `hardhat.config.ts` to use `process.env.CELO_RPC_URL` for the celo network.

### Manual Deployment

If automated deployment fails, you can deploy manually using Remix IDE:
1. Go to https://remix.ethereum.org
2. Paste your contract code
3. Compile
4. Deploy via Injected Web3 (MetaMask connected to Celo)

## Quick Fix Command

```bash
cd apps/contracts
npm run clear-deployments
npm run deploy:celo
```

