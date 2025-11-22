# Deployment Troubleshooting Guide

## Connection Timeout Issues

If you're getting `ConnectTimeoutError` when deploying, try these solutions:

### 1. Use Alternative RPC Endpoints

The default Celo RPC endpoints might be slow or unavailable. Try using alternative endpoints:

#### Option A: Use Infura (Recommended)
1. Sign up at https://infura.io
2. Create a new project and get your API key
3. Add to `.env`:
   ```env
   ALFAJORES_RPC_URL=https://celo-alfajores.infura.io/v3/YOUR_INFURA_KEY
   ```

#### Option B: Use Ankr
Add to `.env`:
```env
ALFAJORES_RPC_URL=https://rpc.ankr.com/celo_alfajores
```

#### Option C: Use PublicNode
Add to `.env`:
```env
ALFAJORES_RPC_URL=https://alfajores.celoscan.io/api
```

### 2. Check Network Connectivity

Test if you can reach the RPC endpoint:
```bash
# Test Alfajores RPC
curl https://alfajores-forno.celo-testnet.org

# Should return JSON-RPC response
```

### 3. Increase Timeout (Already Added)

The config now has `timeout: 120000` (120 seconds). If you need more:
```typescript
timeout: 300000, // 5 minutes
```

### 4. Check Firewall/Proxy

- If behind a corporate firewall, you may need to configure proxy settings
- Check if your network blocks certain ports
- Try from a different network (mobile hotspot, etc.)

### 5. Use Localhost for Testing

If network issues persist, deploy to localhost first:
```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy to localhost
npm run deploy
```

### 6. Verify Environment Variables

Make sure your `.env` file in `apps/contracts/` has:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
```

### 7. Try Different Network

If Alfajores is having issues, try Sepolia:
```bash
npm run deploy:sepolia
```

## Common Error Solutions

### Error: "Connect Timeout"
- **Solution**: Use alternative RPC endpoint (see above)
- **Solution**: Check internet connection
- **Solution**: Try again later (RPC might be temporarily down)

### Error: "Invalid Private Key"
- **Solution**: Make sure PRIVATE_KEY doesn't have `0x` prefix
- **Solution**: Verify the key is correct

### Error: "Insufficient Funds"
- **Solution**: Get testnet tokens from https://faucet.celo.org
- **Solution**: Make sure you have enough CELO for gas

### Error: "Nonce too high"
- **Solution**: Reset your account nonce
- **Solution**: Wait a few minutes and try again

## Quick Fix Commands

```bash
# Test RPC connectivity
curl -X POST https://alfajores-forno.celo-testnet.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Deploy with verbose logging
DEBUG=hardhat:* npm run deploy:alfajores

# Check network status
npx hardhat node --help
```

## Alternative Deployment Methods

### Using Remix IDE
1. Go to https://remix.ethereum.org
2. Paste your contract code
3. Compile and deploy via Injected Web3 (MetaMask)
4. Connect to Celo Alfajores network

### Using Foundry
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Deploy
forge create SimpleSavingPlan --rpc-url https://alfajores-forno.celo-testnet.org --private-key $PRIVATE_KEY
```

## Still Having Issues?

1. Check Celo network status: https://status.celo.org
2. Join Celo Discord for support
3. Check Hardhat documentation: https://hardhat.org/docs
4. Verify your network configuration matches Celo's requirements

