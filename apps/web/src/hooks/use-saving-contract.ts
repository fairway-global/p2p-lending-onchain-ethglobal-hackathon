"use client";

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, formatUnits, decodeEventLog } from "viem";
import { useState, useEffect } from "react";
import SimpleSavingPlanABI from "@/lib/abi/SimpleSavingPlan.json";
import ERC20ABI from "@/lib/abi/ERC20.json";
import { scaleForDemo } from "@/lib/celo-conversion";

import { env } from "@/lib/env";

// Contract address - should be set via environment variable
const CONTRACT_ADDRESS = (env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface Plan {
  user: `0x${string}`;
  dailyAmount: bigint;
  totalDays: bigint;
  penaltyStake: bigint;
  penaltyPercent: bigint;
  currentDay: bigint;
  missedDays: bigint;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  startTime: bigint;
}

export interface SavingLevel {
  name: string;
  minDays: number;
  maxDays: number;
  minDailyAmount: number;
  maxDailyAmount: number;
  penaltyPercent: number;
  description: string;
}

export const SAVING_LEVELS: SavingLevel[] = [
  {
    name: "Beginner",
    minDays: 7,
    maxDays: 15,
    minDailyAmount: 5,
    maxDailyAmount: 50,
    penaltyPercent: 10,
    description: "Choose 7-15 days, $5-$50 daily. Penalty: 10% of daily amount",
  },
  {
    name: "Intermediate",
    minDays: 16,
    maxDays: 30,
    minDailyAmount: 5,
    maxDailyAmount: 50,
    penaltyPercent: 15,
    description: "Choose 16-30 days, $5-$50 daily. Penalty: 15% of daily amount",
  },
  {
    name: "Hard",
    minDays: 31,
    maxDays: 90,
    minDailyAmount: 5,
    maxDailyAmount: 50,
    penaltyPercent: 20,
    description: "Choose 31-90 days, $5-$50 daily. Penalty: 20% of daily amount",
  },
];

export function useSavingContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const [selectedPlanId, setSelectedPlanId] = useState<bigint | null>(null);
  const [createdPlanId, setCreatedPlanId] = useState<bigint | null>(null);

  // Extract plan ID from transaction receipt
  useEffect(() => {
    if (receipt && publicClient) {
      try {
        console.log("📋 Processing transaction receipt, logs:", receipt.logs.length);
        // Look for PlanCreated event in the logs
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: SimpleSavingPlanABI,
              data: log.data,
              topics: log.topics,
            });
            console.log("🔍 Decoded event:", decoded.eventName, decoded);
            // If the contract emits a PlanCreated event with planId, extract it
            if (decoded.eventName === "PlanCreated") {
              const planId = (decoded as any).args?.planId;
              if (planId !== undefined) {
                console.log("✅ Found PlanCreated event with planId:", planId.toString());
                console.log("🔄 Setting createdPlanId state to:", planId.toString());
                setCreatedPlanId(planId);
                console.log("✅ State update triggered for createdPlanId");
              } else {
                console.warn("⚠️ PlanCreated event found but planId is missing");
              }
            }
          } catch (e) {
            // Not the event we're looking for, continue
            // console.log("Event decode failed (expected for non-PlanCreated events):", e);
          }
        }
      } catch (error) {
        console.error("❌ Error decoding transaction receipt:", error);
      }
    }
  }, [receipt, publicClient]);

  // Read plan data
  const { data: planData, refetch: refetchPlan } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SimpleSavingPlanABI,
    functionName: "getPlan",
    args: selectedPlanId !== null ? [selectedPlanId] : undefined,
    query: {
      enabled: selectedPlanId !== null && isConnected,
    },
  }) as { data: Plan | undefined; refetch: () => void };

  // Create a new saving plan (using native CELO)
  const createPlan = async (
    dailyAmount: string,
    totalDays: number,
    penaltyStake: string,
    penaltyPercent: number
  ) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // Convert amounts to wei (CELO uses 18 decimals)
    const dailyAmountWei = parseUnits(dailyAmount, 18);
    const stakeAmount = parseUnits(penaltyStake, 18);
    
    // Scale down for demo/POC (divide by 1000)
    const scaledDailyAmount = scaleForDemo(dailyAmountWei);
    const scaledStake = scaleForDemo(stakeAmount);
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "createPlan",
      args: [scaledDailyAmount, BigInt(totalDays), scaledStake, BigInt(penaltyPercent)],
      value: scaledStake, // Send scaled penalty stake as native CELO for demo
    });
  };

  // Pay daily saving (using native CELO)
  const payDaily = async (planId: bigint, dailyAmount: string) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // Convert daily amount to wei (CELO uses 18 decimals)
    const dailyAmountWei = parseUnits(dailyAmount, 18);
    
    // Scale down for demo/POC (divide by 1000)
    const scaledDailyAmount = scaleForDemo(dailyAmountWei);

    // Pay daily with native CELO
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "payDaily",
      args: [planId],
      value: scaledDailyAmount, // Send scaled daily amount as native CELO for demo
    });
  };

  // Check and deduct penalty for missed payments
  const checkAndDeductPenalty = async (planId: bigint) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "checkAndDeductPenalty",
      args: [planId],
    });
  };

  // Mark plan as failed (for admin/community)
  const markFailed = async (planId: bigint) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "markFailed",
      args: [planId],
    });
  };

  // Withdraw completed plan
  const withdraw = async (planId: bigint) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "withdraw",
      args: [planId],
    });
  };

  return {
    createPlan,
    payDaily,
    checkAndDeductPenalty,
    markFailed,
    withdraw,
    planData,
    refetchPlan,
    selectedPlanId,
    setSelectedPlanId,
    createdPlanId,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    isConnected,
    address,
  };
}

