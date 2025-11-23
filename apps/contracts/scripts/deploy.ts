import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying SimpleSavingPlan contract to Celo...\n");

  // Get the deployer account using viem
  const [deployer] = await hre.viem.getWalletClients();
  const deployerAddress = deployer.account.address;
  console.log("📝 Deploying with account:", deployerAddress);
  
  try {
    const publicClient = await hre.viem.getPublicClient();
    const balance = await publicClient.getBalance({ address: deployerAddress });
    const balanceInCELO = Number(balance) / 1e18;
    console.log(`💰 Account balance: ${balanceInCELO.toFixed(4)} CELO\n`);
    
    if (balance === 0n) {
      console.error("❌ Error: Account has no balance. Please fund your account first.");
      console.log("Get testnet tokens from: https://faucet.celo.org");
      process.exit(1);
    }
  } catch (error) {
    console.log("⚠️  Could not check balance, continuing with deployment...\n");
  }

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const SimpleSavingPlan = await hre.viem.deployContract("SimpleSavingPlan", [], {
    walletClient: deployer,
  });

  const address = SimpleSavingPlan.address;
  console.log("\n✅ Deployment successful!");
  console.log("📍 Contract address:", address);
  console.log("\n🔍 Verify on Celoscan:");
  console.log(`   https://celoscan.io/address/${address}`);
  console.log("\n📋 Update your apps/web/.env.local with:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

