"use client";

import { Plan } from "@/hooks/use-saving-contract";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";
import { useSavingContract } from "@/hooks/use-saving-contract";
import { useState } from "react";
import { useReadContract } from "wagmi";
import ERC20ABI from "@/lib/abi/ERC20.json";

interface PlanCalendarProps {
  plan: Plan;
  planId: bigint;
  tokenAddress: `0x${string}`;
}

export function PlanCalendar({ plan, planId, tokenAddress }: PlanCalendarProps) {
  const { payDaily, isPending, isConfirming, isConfirmed, error, hash, refetchPlan } = useSavingContract();
  const [isPaying, setIsPaying] = useState(false);

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
  const totalDays = Number(plan.totalDays);
  const currentDay = Number(plan.currentDay);
  const missedDays = Number(plan.missedDays);
  const completedDays = currentDay;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const handlePayDaily = async () => {
    setIsPaying(true);
    try {
      await payDaily(planId, tokenAddress, formatUnits(plan.dailyAmount, decimals), decimals);
    } catch (err) {
      console.error("Error paying daily:", err);
      alert("Failed to pay daily. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  // Refetch plan data after successful payment
  if (isConfirmed && hash) {
    setTimeout(() => {
      refetchPlan();
    }, 2000);
  }

  const canPayToday = plan.isActive && !plan.isCompleted && !plan.isFailed;
  const daysUntilNext = plan.startTime > 0n 
    ? Math.max(0, Math.floor((Date.now() / 1000 - Number(plan.startTime)) / 86400) - currentDay + 1)
    : 0;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold text-gray-900">Your Saving Streak</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            plan.isCompleted
              ? "bg-green-100 text-green-800"
              : plan.isFailed
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}>
            {plan.isCompleted ? "Completed" : plan.isFailed ? "Failed" : "Active"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedDays}</p>
            <p className="text-xs text-gray-600">Days Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{missedDays}</p>
            <p className="text-xs text-gray-600">Missed Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalDays - completedDays}</p>
            <p className="text-xs text-gray-600">Days Remaining</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Calendar</h4>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: totalDays }).map((_, index) => {
            const dayNumber = index + 1;
            const isCompleted = dayNumber <= completedDays;
            const isMissed = dayNumber <= completedDays + missedDays && !isCompleted;
            const isToday = dayNumber === currentDay + 1 && canPayToday;

            return (
              <div
                key={index}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isMissed
                    ? "bg-red-500 text-white"
                    : isToday
                    ? "bg-blue-500 text-white ring-2 ring-blue-300"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {dayNumber}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Section */}
      {canPayToday && (
        <div className="border-t pt-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Pay today's saving: {formatUnits(plan.dailyAmount, decimals)} {tokenSymbol || "tokens"}
            </p>
            {daysUntilNext > 0 && (
              <p className="text-xs text-yellow-600">
                ⚠️ You're {daysUntilNext} day(s) behind. Pay now to keep your streak!
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">Error: {error.message}</p>
            </div>
          )}

          <Button
            onClick={handlePayDaily}
            disabled={isPending || isConfirming || isPaying}
            className="w-full"
          >
            {isPending || isConfirming || isPaying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isPending ? "Approving..." : isConfirming ? "Processing Payment..." : "Processing..."}
              </>
            ) : (
              "💵 Pay Today's Saving"
            )}
          </Button>

          {hash && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
        </div>
      )}

      {/* Completed/Failed States */}
      {plan.isCompleted && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 font-semibold mb-2">🎉 Congratulations!</p>
            <p className="text-sm text-green-700">
              You've completed your saving streak! You can now withdraw all your savings plus your stake.
            </p>
          </div>
        </div>
      )}

      {plan.isFailed && (
        <div className="border-t pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Plan Failed</p>
            <p className="text-sm text-red-700">
              You missed too many days. Your penalty stake has been slashed.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

