# Savelo - Habit-Driven Savings Platform

![Savelo](https://img.shields.io/badge/Built%20for-ETHGlobal-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.28-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Celo](https://img.shields.io/badge/Network-Celo-brightgreen)

**Save Daily. Keep the Streak.**

A decentralized savings platform that leverages behavioral psychology and blockchain technology to help users build sustainable saving habits through commitment stakes, penalties, and community rewards.

## 🎯 The Problem We Solve

People have always struggled to build and maintain new habits, particularly around financial discipline. Traditional savings apps lack sufficient incentive mechanisms to ensure long-term commitment. Our research shows that **loss aversion is a more powerful motivator than potential gains** - people fear losing $100 more than they desire gaining $100.

**Savelo harnesses years of behavioral psychology research to make saving an achievable habit by:**

- Creating financial consequences for missed commitments
- Providing immediate accountability through blockchain transparency
- Rewarding successful completion with community-driven incentives
- Gamifying the savings process with streaks and social features

## 🏗️ How It Works

### 1. **Commitment Contract**

- Users create a saving plan with daily amounts and duration
- **Penalty stake** required upfront (skin in the game)
- Stakes are locked in smart contracts until completion

### 2. **Behavioral Psychology Features**

- **Loss Aversion**: Penalty stake creates immediate loss fear
- **Grace Period**: 2-day buffer for first missed payment (realistic flexibility)
- **Progressive Penalties**: 10% of daily amount deducted per missed day
- **Social Proof**: Community leaderboards and shared success

### 3. **Reward Mechanisms**

- **20% Completion Bonus**: Extra reward for finishing the plan
- **Community Reward Pool**: Failed participants' penalties distributed to successful savers
- **Streak Tracking**: Visual progress and achievement badges
- **Compound Returns**: Larger stakes earn proportionally larger community rewards

## ⚡ Key Features

### 🔒 **Smart Contract Security**

- **ReentrancyGuard**: Protection against attack vectors
- **OpenZeppelin Standards**: Battle-tested ERC20 and security patterns
- **Transparent Operations**: All transactions verifiable on-chain

### 📱 **User Experience**

- **Farcaster Integration**: Social login and sharing
- **Mobile-First Design**: Progressive Web App optimized for daily use
- **Real-Time Notifications**: Payment reminders and streak updates
- **Intuitive Dashboard**: Clear progress tracking and reward visualization

### 🌐 **Multi-Platform Support**

- **Web Application**: Full-featured desktop experience
- **Farcaster Frame**: Native social media integration
- **Mobile Wallet**: MetaMask and WalletConnect support
- **Cross-Chain Ready**: Built for multi-network expansion

## 🛠️ Technical Architecture

### Smart Contracts (`/apps/contracts`)

```
SimpleSavingPlan.sol    # Core savings logic with penalties/rewards
MockERC20.sol          # Test token for development
```

**Key Contract Features:**

- Commitment-based saving plans
- Automated penalty system with grace periods
- Community reward pool distribution
- Emergency admin functions

### Frontend (`/apps/web`)

```
Next.js 14             # React framework with App Router
TailwindCSS           # Utility-first styling
wagmi + viem          # Ethereum wallet integration
@farcaster/frame-sdk  # Social features and authentication
TypeScript            # Type-safe development
```

### Deployment

- **Network**: Celo Mainnet (low fees, mobile-first)
- **Contract**: `0x37a4bba97bf04e88730bf329e5a94448d903c7f2`
- **Token**: TST (Test Savings Token) `0x028FD9BbC0c6B12c42586C2A2E33EB25fC5e0Ed3`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PNPM (recommended) or npm
- MetaMask or compatible wallet
- Celo network setup

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/fairway-global/p2p-lending-onchain-ethglobal-hackathon.git
cd p2p-lending-onchain-ethglobal-hackathon
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Environment Setup**

```bash
# Copy environment templates
cp apps/web/.env.template apps/web/.env
cp apps/contracts/.env.template apps/contracts/.env

# Add your private key and RPC URLs to .env files
```

4. **Run the development server**

```bash
pnpm dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Testing

```bash
# Run smart contract tests
pnpm contracts:test

# Test coverage
cd apps/contracts
npx hardhat coverage
```

## 💡 Usage Examples

### Creating a Saving Plan

```typescript
// Example: Save 5 TST daily for 7 days with 0.5 TST penalty stake
const plan = await createPlan(
  tokenAddress,    // TST token
  "5",            // 5 tokens daily
  7,              // 7 days duration
  "0.5"           // 0.5 token penalty stake
);
```

### Daily Payment Flow

```typescript
// 1. Approve tokens for contract
await approveToken(tokenAddress, dailyAmount);

// 2. Make daily payment
await payDaily(planId);
```

### Reward Calculation

- **Savings**: 5 TST × 7 days = 35 TST
- **Completion Bonus**: 35 TST × 20% = 7 TST
- **Penalty Stake Return**: 0.5 TST
- **Community Pool Share**: Variable (based on failed plans)
- **Total Return**: ~42.5+ TST

## 📊 Smart Contract API

### Core Functions

- `createPlan(token, dailyAmount, totalDays, penaltyStake)` - Create new saving plan
- `payDaily(planId)` - Make daily payment
- `checkAndDeductPenalty(planId)` - Process missed payment penalties
- `withdraw(planId)` - Claim rewards after completion
- `getPlan(planId)` - Get plan details and status

### View Functions

- `planCounter` - Total number of plans created
- `getRewardPoolBalance(token)` - Current community reward pool
- `plans(planId)` - Plan struct with all details

## 🔬 Behavioral Psychology Research

Our platform is built on proven psychological principles:

### **Loss Aversion** (Kahneman & Tversky)

- People weigh losses ~2x more heavily than equivalent gains
- Upfront penalty stakes create immediate loss fear
- More effective than traditional "carrot" incentives

### **Commitment Devices** (Behavioral Economics)

- Pre-commitment reduces decision fatigue
- Financial stakes increase follow-through rates
- Social accountability amplifies commitment

### **Variable Reward Schedules**

- Community reward pools create unpredictable bonuses
- Streak tracking provides consistent positive reinforcement
- Achievement badges satisfy completion psychology
