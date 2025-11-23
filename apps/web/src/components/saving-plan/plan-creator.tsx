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
    <Card className="p-8 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70 text-[#16243D]">
      <h3 className="text-2xl font-semibold mb-6 text-[#16243D]">Review Your Plan</h3>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between border-b border-white/60 pb-2">
          <span className="text-sm text-[#4B5563]">Level:</span>
          <span className="text-sm font-semibold text-[#16243D]">{selectedLevel.name}</span>
        </div>
        <div className="flex justify-between border-b border-white/60 pb-2">
          <span className="text-sm text-[#4B5563]">Daily Amount:</span>
          <span className="text-sm font-semibold text-[#16243D]">
            ${customDailyAmount} {tokenSymbol ? `(${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/60 pb-2">
          <span className="text-sm text-[#4B5563]">Total Days:</span>
          <span className="text-sm font-semibold text-[#16243D]">{customDays} days</span>
        </div>
        <div className="flex justify-between border-b border-white/60 pb-2">
          <span className="text-sm text-[#4B5563]">Penalty Stake ({selectedLevel.penaltyPercent}%):</span>
          <span className="text-sm font-semibold text-[#D65A5A]">
            ${penaltyStake} {tokenSymbol ? `(${formatUnits(totalStake, decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between border-b border-white/60 pb-2">
          <span className="text-sm text-[#4B5563]">Completion Reward (20%):</span>
          <span className="text-sm font-semibold text-[#329F3B]">
            ${((Number(customDailyAmount) * customDays) * 0.2).toFixed(2)} {tokenSymbol ? `(${formatUnits(totalSavings * BigInt(20) / BigInt(100), decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
        <div className="flex justify-between pt-4 border-t-2 border-[#FBCC5C]">
          <span className="text-base font-semibold text-[#16243D]">Total Savings:</span>
          <span className="text-base font-semibold text-[#FBCC5C]">
            ${(Number(customDailyAmount) * customDays).toFixed(2)} {tokenSymbol ? `(${formatUnits(totalSavings, decimals)} ${tokenSymbol})` : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-[#D65A5A] bg-white/60 rounded-neo shadow-neoInset">
          <p className="text-sm text-[#D65A5A] font-semibold">Error: {error.message}</p>
        </div>
      )}

      <Button
        onClick={handleCreatePlan}
        disabled={isPending || isConfirming || isCreating}
        className="w-full rounded-full bg-[#FBCC5C] text-[#16243D] shadow-neo hover:shadow-neoSoft"
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
