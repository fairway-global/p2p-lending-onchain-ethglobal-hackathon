"use client";

import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, formatUnits, decodeEventLog } from "viem";
import { useState, useEffect } from "react";
import SimpleSavingPlanABI from "@/lib/abi/SimpleSavingPlan.json";
import ERC20ABI from "@/lib/abi/ERC20.json";

import { env } from "@/lib/env";

// Contract address - should be set via environment variable
const CONTRACT_ADDRESS = (env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface Plan {
  user: `0x${string}`;
  token: `0x${string}`;
  dailyAmount: bigint;
  totalDays: bigint;
  penaltyStake: bigint;
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
        // Look for PlanCreated event in the logs
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: SimpleSavingPlanABI,
              data: log.data,
              topics: log.topics,
            });
            // If the contract emits a PlanCreated event with planId, extract it
            if (decoded.eventName === "PlanCreated" && (decoded as any).args?.planId) {
              setCreatedPlanId((decoded as any).args.planId);
            }
          } catch (e) {
            // Not the event we're looking for, continue
          }
        }
      } catch (error) {
        console.error("Error decoding transaction receipt:", error);
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

  // Approve token for contract
  const approveToken = async (tokenAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const amountWei = parseUnits(amount, decimals);
    
    return writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amountWei],
    });
  };

  // Create a new saving plan
  const createPlan = async (
    tokenAddr: `0x${string}`,
    dailyAmount: string,
    totalDays: number,
    penaltyStake: string,
    tokenDecimals: number = 18
  ) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // First approve the penalty stake
    const stakeAmount = parseUnits(penaltyStake, tokenDecimals);
    await approveToken(tokenAddr, penaltyStake, tokenDecimals);

    // Wait for approval transaction
    // Note: In production, you'd want to wait for the approval tx to confirm first
    // For now, we'll proceed assuming approval will succeed

    // Create the plan
    const dailyAmountWei = parseUnits(dailyAmount, tokenDecimals);
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "createPlan",
      args: [tokenAddr, dailyAmountWei, BigInt(totalDays), stakeAmount],
    });
  };

  // Pay daily saving
  const payDaily = async (planId: bigint, tokenAddr: `0x${string}`, dailyAmount: string, tokenDecimals: number = 18) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // First approve the daily amount
    await approveToken(tokenAddr, dailyAmount, tokenDecimals);

    // Pay daily
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: SimpleSavingPlanABI,
      functionName: "payDaily",
      args: [planId],
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
    approveToken,
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

