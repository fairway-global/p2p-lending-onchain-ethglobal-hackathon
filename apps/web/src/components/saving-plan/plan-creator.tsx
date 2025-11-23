"use client";

import { useState, useEffect } from "react";
import { SavingLevel } from "@/contexts/saving-contract-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavingContract } from "@/contexts/saving-contract-context";
import { parseUnits, formatUnits } from "viem";
import { celoToUsd, formatUsdWithCelo, DEMO_SCALE_FACTOR } from "@/lib/celo-conversion";

interface PlanCreatorProps {
  selectedLevel: SavingLevel;
  customDays: number;
  customDailyAmount: string;
  penaltyStake: string;
}

export function PlanCreator({
  selectedLevel,
  customDays,
  customDailyAmount,
  penaltyStake,
}: PlanCreatorProps) {
  const { createPlan, isPending, isConfirming, isConfirmed, error, hash, createdPlanId } = useSavingContract();
  const [isCreating, setIsCreating] = useState(false);

  // CELO uses 18 decimals
  const decimals = 18;

  const handleCreatePlan = async () => {
    setIsCreating(true);
    try {
      await createPlan(
        customDailyAmount,
        customDays,
        penaltyStake,
        selectedLevel.penaltyPercent
      );
    } catch (err) {
      console.error("Error creating plan:", err);
      alert("Failed to create plan. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Log when transaction is confirmed and plan ID is extracted
  // Navigation is handled by the useEffect in page.tsx that watches createdPlanId
  useEffect(() => {
    if (isConfirmed && hash && createdPlanId) {
      console.log("✅ Transaction confirmed with planId:", createdPlanId.toString());
      console.log("📋 Navigation will be handled automatically by page.tsx useEffect");
    } else if (isConfirmed && hash && !createdPlanId) {
      console.log("⏳ Transaction confirmed but waiting for planId extraction...");
    }
  }, [isConfirmed, hash, createdPlanId]);

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
            {formatUsdWithCelo(customDailyAmount)}
          </span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Total Days:</span>
          <span className="text-body-m font-bold text-white">{customDays} days</span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Penalty Stake ({selectedLevel.penaltyPercent}%):</span>
          <span className="text-body-m font-bold text-celo-error">
            {formatUsdWithCelo(penaltyStake)}
          </span>
        </div>
        <div className="flex justify-between border-b-2 border-white pb-2">
          <span className="text-body-m text-white">Completion Reward (20%):</span>
          <span className="text-body-m font-bold text-celo-success">
            {formatUsdWithCelo((Number(customDailyAmount) * customDays) * 0.2)}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t-4 border-celo-yellow">
          <span className="text-body-l font-bold text-white">Total Savings:</span>
          <span className="text-body-l font-bold text-celo-yellow">
            {formatUsdWithCelo(Number(customDailyAmount) * customDays)}
          </span>
        </div>
        <div className="mt-4 p-3 border-2 border-celo-yellow bg-black">
          <p className="text-body-s text-celo-yellow font-bold">
            ⚠️ Demo Mode: Actual contract amounts will be {DEMO_SCALE_FACTOR}x smaller for POC testing
          </p>
          <p className="text-body-xs text-white mt-1">
            Contract will receive: {formatUsdWithCelo(celoToUsd(Number(formatUnits(totalStake / BigInt(DEMO_SCALE_FACTOR), decimals))))}
          </p>
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
            {isPending ? "Creating Plan..." : isConfirming ? "Confirming..." : "Processing..."}
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
