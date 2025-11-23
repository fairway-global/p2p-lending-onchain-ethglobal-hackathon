# Clear Corrupted Deployment State

## Quick Fix

The error "Resuming existing deployment" means there's corrupted state. Here's how to fix it:

### Option 1: Use --reset flag (Easiest)

I've updated the deploy commands to automatically reset. Just run:

```bash
cd apps/contracts
npm run deploy:celo
```

The `--reset` flag will automatically clear the corrupted state.

### Option 2: Manually Delete Deployment State

If Option 1 doesn't work, manually delete the deployment folder:

**Windows:**
```bash
cd apps/contracts
rmdir /s /q ignition\deployments\chain-42220
```

**Mac/Linux:**
```bash
cd apps/contracts
rm -rf ignition/deployments/chain-42220
```

**Or delete all deployments:**
```bash
# Windows
rmdir /s /q ignition\deployments

# Mac/Linux
rm -rf ignition/deployments
```

### Option 3: Use the Clear Script

```bash
cd apps/contracts
node clear-deployment.js
```

## After Clearing

Once the state is cleared, try deploying again:

```bash
npm run deploy:celo
```

## Why This Happens

The deployment state can get corrupted if:
- Deployment was interrupted
- Network issues during deployment
- Private key format issues
- RPC endpoint problems

The `--reset` flag prevents this by starting fresh each time.

