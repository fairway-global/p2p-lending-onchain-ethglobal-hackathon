"use client";

import { useState } from "react";
import { SavingLevel } from "@/hooks/use-saving-contract";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavingContract } from "@/hooks/use-saving-contract";
import { parseUnits, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import ERC20ABI from "@/lib/abi/ERC20.json";

interface PlanCreatorProps {
  selectedLevel: SavingLevel;
  customDays: number;
  customDailyAmount: string;
  tokenAddress: `0x${string}`;
  penaltyStake: string;
  onPlanCreated: () => void;
}

export function PlanCreator({
  selectedLevel,
  customDays,
  customDailyAmount,
  tokenAddress,
  penaltyStake,
  onPlanCreated,
}: PlanCreatorProps) {
  const { createPlan, isPending, isConfirming, isConfirmed, error, hash } = useSavingContract();
  const [isCreating, setIsCreating] = useState(false);

  // Get token info
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "symbol",
  });

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "decimals",
  }) as { data: number | undefined };

  const decimals = tokenDecimals || 18;

  const handleCreatePlan = async () => {
    // Debug logging
    console.log("Token Address in PlanCreator:", tokenAddress);
    console.log("Is zero address?", tokenAddress === "0x0000000000000000000000000000000000000000");
    
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      const envValue = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      alert(
        "Please set a valid token address in your .env.local file.\n\n" +
        "Current value: " + (envValue || "NOT SET") + "\n\n" +
        "Add this line to apps/web/.env.local:\n" +
        "NEXT_PUBLIC_TOKEN_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1\n\n" +
        "(This is cUSD on Celo Alfajores testnet)\n\n" +
        "IMPORTANT: Restart your dev server after creating/updating .env.local\n" +
        "Stop the server (Ctrl+C) and run 'npm run dev' again."
      );
      return;
    }

    setIsCreating(true);
    try {
      await createPlan(
        tokenAddress,
        customDailyAmount,
        customDays,
        penaltyStake,
        decimals
      );
    } catch (err) {
      console.error("Error creating plan:", err);
      alert("Failed to create plan. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Watch for successful transaction
  if (isConfirmed && hash) {
    onPlanCreated();
  }

  const totalStake = parseUnits(penaltyStake, decimals);
  const dailyAmountWei = parseUnits(customDailyAmount, decimals);
  const totalSavings = dailyAmountWei * BigInt(customDays);

  return (
    <Card className="p-8 border-2 border-black bg-celo-forest-green text-white">
      <h3 className="text-h3 font-alpina mb-6 text-white">Review Your Plan</h3>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Level:</span>
          <span className="text-body-m font-bold text-celo-yellow">{selectedLevel.name}</span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Daily Amount:</span>
          <span className="text-body-m font-bold text-white">
            ${customDailyAmount} {tokenSymbol ? `(${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Total Days:</span>
          <span className="text-body-m font-bold text-white">{customDays} days</span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Penalty Stake ({selectedLevel.penaltyPercent}%):</span>
          <span className="text-body-m font-bold text-celo-error">
            ${penaltyStake} {tokenSymbol ? `(${formatUnits(totalStake, decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Completion Reward (20%):</span>
          <span className="text-body-m font-bold text-celo-success">
            ${((Number(customDailyAmount) * customDays) * 0.2).toFixed(2)} {tokenSymbol ? `(${formatUnits(totalSavings * BigInt(20) / BigInt(100), decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t-4 border-celo-yellow">
          <span className="text-body-l font-bold text-white">Total Savings:</span>
          <span className="text-body-l font-bold text-celo-yellow">
            ${(Number(customDailyAmount) * customDays).toFixed(2)} {tokenSymbol ? `(${formatUnits(totalSavings, decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border-2 border-celo-error bg-black">
          <p className="text-body-s text-celo-error font-bold">Error: {error.message}</p>
        </div>
      )}

      <Button
        onClick={handleCreatePlan}
        disabled={isPending || isConfirming || isCreating}
        className="w-full"
        variant="default"
      >
        {isPending || isConfirming || isCreating ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin mr-2"></div>
            {isPending ? "Approving..." : isConfirming ? "Creating Plan..." : "Processing..."}
          </>
        ) : (
          "Create Plan & Stake"
        )}
      </Button>

      {hash && (
        <p className="mt-4 text-body-s text-celo-light-blue text-center font-inter">
          Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
        </p>
      )}
    </Card>
  );
}
