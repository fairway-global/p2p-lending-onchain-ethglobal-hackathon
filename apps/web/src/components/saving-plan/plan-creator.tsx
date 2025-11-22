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
  tokenAddress: `0x${string}`;
  penaltyStake: string;
  onPlanCreated: () => void;
}

export function PlanCreator({
  selectedLevel,
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
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      alert("Please set a valid token address");
      return;
    }

    setIsCreating(true);
    try {
      await createPlan(
        tokenAddress,
        selectedLevel.dailyAmount,
        selectedLevel.totalDays,
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
  const dailyAmountWei = parseUnits(selectedLevel.dailyAmount, decimals);
  const totalSavings = dailyAmountWei * BigInt(selectedLevel.totalDays);

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
            {selectedLevel.dailyAmount} {tokenSymbol || "tokens"}
          </span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Total Days:</span>
          <span className="text-body-m font-bold text-white">{selectedLevel.totalDays} days</span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Penalty Stake:</span>
          <span className="text-body-m font-bold text-celo-error">
            {penaltyStake} {tokenSymbol || "tokens"}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t-4 border-celo-yellow">
          <span className="text-body-l font-bold text-white">Total Savings:</span>
          <span className="text-body-l font-bold text-celo-yellow">
            {formatUnits(totalSavings, decimals)} {tokenSymbol || "tokens"}
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
