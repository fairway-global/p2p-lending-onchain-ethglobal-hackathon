# SimpleSavingPlan Contract Deployment Guide

## Overview
The SimpleSavingPlan contract is a daily savings commitment contract with penalty stakes, grace periods, and reward pools.

## Features
- Daily payment tracking
- 2-day grace period for first missed payment
- Automatic penalty deduction after grace period
- 20% completion bonus
- Reward pool distribution to completers
- Penalty stakes slashed on failure

## Prerequisites
1. Node.js and npm installed
2. Hardhat installed (`npm install` in contracts directory)
3. Private key with CELO tokens for deployment
4. Environment variables set up

## Environment Setup

Create a `.env` file in the `apps/contracts` directory:

```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here (optional, for verification)
```

## Deployment Steps

### 1. Compile the Contract
```bash
cd apps/contracts
npm run compile
```

### 2. Deploy to Celo Alfajores (Testnet)
```bash
npm run deploy:alfajores
```

### 3. Deploy to Celo Mainnet
```bash
npm run deploy:celo
```

### 4. Verify Contract (Optional)
After deployment, you can verify the contract on Celoscan:
```bash
npx hardhat verify --network alfajores <CONTRACT_ADDRESS>
```

## Contract Address Configuration

After deployment, update the contract address in your frontend:

1. Update `apps/web/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_deployed_contract_address...
```

2. The ABI is automatically copied to `apps/web/src/lib/abi/SimpleSavingPlan.json` after compilation.

## Contract Functions

### User Functions
- `createPlan(token, dailyAmount, totalDays, penaltyStake)` - Create a new saving plan
- `payDaily(planId)` - Make a daily payment
- `withdraw(planId)` - Withdraw savings and rewards when completed
- `getPlan(planId)` - Get plan details

### Public Functions
- `checkAndDeductPenalty(planId)` - Check and deduct penalties for missed payments
- `markFailedNoPayments(planId, allowAfterSeconds)` - Mark plan as failed if no payments

### View Functions
- `plans(planId)` - Get plan struct
- `getRewardPoolBalance(token)` - Get reward pool balance for a token

## Important Notes

1. **Grace Period**: Users get a 2-day grace period for their first missed payment
2. **Penalties**: After grace period, 10% of daily amount is deducted per missed day
3. **Reward Pool**: All penalties go to the reward pool, distributed to completers
4. **Completion Bonus**: 20% bonus on total savings when plan is completed
5. **Token Approvals**: Users must approve the contract to transfer tokens before creating plans or making payments

## Gas Considerations

- Each daily payment requires a transaction
- Consider implementing meta-transactions or batching for better UX
- The contract uses ReentrancyGuard for security

## Security

- Contract uses OpenZeppelin's ReentrancyGuard
- Uses Ownable for admin functions
- All external functions are nonReentrant
- Penalty stakes are slashed on failure

## Testing

Before deploying to mainnet, thoroughly test on Alfajores testnet:
1. Create a plan
2. Make daily payments
3. Test missed payment scenarios
4. Test completion and withdrawal
5. Test penalty deduction

## Support

For issues or questions, refer to the contract code comments or the main README.

