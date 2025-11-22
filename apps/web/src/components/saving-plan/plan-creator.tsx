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
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Plan</h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Level:</span>
          <span className="font-semibold">{selectedLevel.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Daily Amount:</span>
          <span className="font-semibold">
            {selectedLevel.dailyAmount} {tokenSymbol || "tokens"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Days:</span>
          <span className="font-semibold">{selectedLevel.totalDays} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Penalty Stake:</span>
          <span className="font-semibold text-red-600">
            {penaltyStake} {tokenSymbol || "tokens"}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="text-gray-900 font-semibold">Total Savings:</span>
          <span className="font-bold text-green-600">
            {formatUnits(totalSavings, decimals)} {tokenSymbol || "tokens"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">Error: {error.message}</p>
        </div>
      )}

      <Button
        onClick={handleCreatePlan}
        disabled={isPending || isConfirming || isCreating}
        className="w-full"
      >
        {isPending || isConfirming || isCreating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {isPending ? "Approving..." : isConfirming ? "Creating Plan..." : "Processing..."}
          </>
        ) : (
          "Create Plan & Stake"
        )}
      </Button>

      {hash && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
        </p>
      )}
    </Card>
  );
}

