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
  const dailyAmountNumber = Number(customDailyAmount) || 0;
  const totalDaysNumber = Number(customDays) || 0;
  const completionRewardUsd = dailyAmountNumber * totalDaysNumber * 0.2;
  const totalSavingsUsd = dailyAmountNumber * totalDaysNumber;

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

  const totalStake = parseUnits(penaltyStake || "0", decimals);
  const scaledStake = totalStake / BigInt(DEMO_SCALE_FACTOR);
  const scaledStakeUsd = celoToUsd(Number(formatUnits(scaledStake, decimals)));

  return (
    <Card className="p-8 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70 text-[#16243D]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-[#16243D]">Review Your Plan</h3>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#4B5563] bg-white/80 border border-white/80 rounded-full px-3 py-1 shadow-neoInset">
          Demo Preview
        </span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between rounded-neo bg-white/80 shadow-neoInset border border-white/60 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Level</span>
          <span className="text-sm font-semibold text-[#16243D]">{selectedLevel.name}</span>
        </div>
        <div className="flex items-center justify-between rounded-neo bg-white/80 shadow-neoInset border border-white/60 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Daily Amount</p>
            <p className="text-[11px] text-[#6B7280]">Auto-converted to CELO</p>
          </div>
          <p className="text-lg font-semibold text-[#16243D]">{formatUsdWithCelo(customDailyAmount)}</p>
        </div>
        <div className="flex items-center justify-between rounded-neo bg-white/80 shadow-neoInset border border-white/60 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Total Days</span>
          <span className="text-sm font-semibold text-[#16243D]">{totalDaysNumber} days</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-start justify-between rounded-neo bg-white shadow-neo border border-white/70 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Penalty Stake ({selectedLevel.penaltyPercent}%)
            </p>
            <p className="text-sm text-[#4B5563]">Held as a safeguard while you save</p>
          </div>
          <p className="text-lg font-semibold text-[#D65A5A]">{formatUsdWithCelo(penaltyStake || "0")}</p>
        </div>

        <div className="flex items-start justify-between rounded-neo bg-white shadow-neo border border-white/70 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Completion Reward (20%)</p>
            <p className="text-sm text-[#4B5563]">Earn a bonus when you finish the streak</p>
          </div>
          <p className="text-lg font-semibold text-[#118C76]">
            {formatUsdWithCelo(completionRewardUsd)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-neo bg-white shadow-neo border border-white/80 px-4 py-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Total Savings</p>
          <p className="text-sm text-[#4B5563]">If you stay on track</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-[#16243D]">{formatUsdWithCelo(totalSavingsUsd)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-neo bg-white/80 border border-white/70 shadow-neo p-4 mb-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#16243D]">
          <span className="text-[#D65A5A]">⚠️</span> Demo Mode
        </p>
        <p className="text-sm text-[#4B5563] mt-1">
          Actual contract amounts will be {DEMO_SCALE_FACTOR}x smaller for POC testing.
        </p>
        <p className="text-sm font-semibold text-[#16243D] mt-2">
          Contract will receive: <span className="text-[#FBCC5C]">{formatUsdWithCelo(scaledStakeUsd)}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-[#D65A5A] bg-white/60 rounded-neo shadow-neoInset">
          <p className="text-sm text-[#D65A5A] font-semibold">Error: {error.message}</p>
        </div>
      )}

      <Button
        onClick={handleCreatePlan}
        disabled={isPending || isConfirming || isCreating}
        className="w-full rounded-full bg-[#FBCC5C] text-[#16243D] shadow-neo hover:shadow-neoSoft border border-white/80"
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
