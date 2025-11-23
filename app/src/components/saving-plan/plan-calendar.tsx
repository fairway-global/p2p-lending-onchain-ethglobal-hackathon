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
  const { payDaily, withdraw, isPending, isConfirming, isConfirmed, error, hash, refetchPlan } = useSavingContract();
  const [isPaying, setIsPaying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "symbol",
  }) as { data: string | undefined };

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "decimals",
  }) as { data: number | undefined };

  const decimals: number = tokenDecimals || 18;
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

  const statusBg = plan.isCompleted
    ? "bg-celo-success"
    : plan.isFailed
    ? "bg-celo-error"
    : "bg-celo-yellow";
  const statusText = plan.isCompleted
    ? "text-black"
    : plan.isFailed
    ? "text-white"
    : "text-black";

  return (
    <Card className="p-8 border-2 border-black bg-celo-dark-tan">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h3 font-alpina text-black">Your Saving Streak</h3>
          <div className={`px-4 py-2 border-2 border-black ${statusBg} ${statusText} text-eyebrow font-bold uppercase`}>
            {plan.isCompleted ? "Completed" : plan.isFailed ? "Failed" : "Active"}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white border-2 border-black h-6 mb-6">
          <div
            className={`h-full ${plan.isCompleted ? "bg-celo-success" : "bg-celo-yellow"} transition-all duration-300`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border-2 border-black bg-white p-4">
            <p className="text-h4 font-alpina text-black">{completedDays}</p>
            <p className="text-eyebrow text-celo-body-copy uppercase font-bold">Days Completed</p>
          </div>
          <div className="border-2 border-black bg-white p-4">
            <p className="text-h4 font-alpina text-black">{missedDays}</p>
            <p className="text-eyebrow text-celo-body-copy uppercase font-bold">Missed Days</p>
          </div>
          <div className="border-2 border-black bg-white p-4">
            <p className="text-h4 font-alpina text-black">{totalDays - completedDays}</p>
            <p className="text-eyebrow text-celo-body-copy uppercase font-bold">Days Remaining</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-8">
        <h4 className="text-eyebrow font-bold text-black mb-4 uppercase">Progress Calendar</h4>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: totalDays }).map((_, index) => {
            const dayNumber = index + 1;
            const isCompleted = dayNumber <= completedDays;
            const isMissed = dayNumber <= completedDays + missedDays && !isCompleted;
            const isToday = dayNumber === currentDay + 1 && canPayToday;

            let bgColor = "bg-white";
            let textColor = "text-celo-body-copy";
            let borderColor = "border-black";

            if (isCompleted) {
              bgColor = "bg-celo-success";
              textColor = "text-black";
            } else if (isMissed) {
              bgColor = "bg-celo-error";
              textColor = "text-white";
            } else if (isToday) {
              bgColor = "bg-celo-yellow";
              textColor = "text-black";
              borderColor = "border-celo-purple";
            }

            return (
              <div
                key={index}
                className={`aspect-square border-2 ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-body-s font-bold`}
              >
                {dayNumber}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Section */}
      {canPayToday && (
        <div className="border-t-4 border-black pt-6">
          <div className="mb-6">
            <p className="text-body-m text-black mb-3 font-bold">
              Pay today&apos;s saving: {formatUnits(plan.dailyAmount, decimals)}{" "}
              {tokenSymbol || "tokens"}
            </p>
            {daysUntilNext > 0 && (
              <div className="border-2 border-black bg-celo-orange p-3 mb-4">
                <p className="text-body-s text-black font-bold">
                  ⚠️ You&apos;re {daysUntilNext} day(s) behind. Pay now to keep your streak!
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 border-2 border-celo-error bg-black">
              <p className="text-body-s text-celo-error font-bold">Error: {error.message}</p>
            </div>
          )}

          <Button
            onClick={handlePayDaily}
            disabled={isPending || isConfirming || isPaying}
            className="w-full"
            variant="default"
          >
            {isPending || isConfirming || isPaying ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin mr-2"></div>
                {isPending ? "Approving..." : isConfirming ? "Processing Payment..." : "Processing..."}
              </>
            ) : (
              "Pay Today's Saving"
            )}
          </Button>

          {hash && (
            <p className="mt-4 text-body-s text-celo-light-blue text-center font-inter">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
        </div>
      )}

      {/* Completed/Failed States */}
      {plan.isCompleted && (
        <div className="border-t-4 border-black pt-6 space-y-4">
          <div className="border-2 border-black bg-celo-success p-6">
            <p className="text-body-l text-black font-bold mb-2">🎉 Congratulations!</p>
            <p className="text-body-m text-black mb-3">
              You&apos;ve completed your saving streak! You can now withdraw:
            </p>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between border-t-2 border-black pt-2">
                <span className="text-body-m text-black font-bold">Your Savings:</span>
                <span className="text-body-m text-black font-bold">
                  {formatUnits(plan.dailyAmount * plan.currentDay, decimals)} {tokenSymbol || "tokens"}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-black pt-2">
                <span className="text-body-m text-black font-bold">Penalty Stake (Returned):</span>
                <span className="text-body-m text-black font-bold">
                  {formatUnits(plan.penaltyStake, decimals)} {tokenSymbol || "tokens"}
                </span>
              </div>
              <div className="flex justify-between border-t-4 border-celo-yellow pt-2 bg-celo-yellow px-3 py-2">
                <span className="text-body-l text-black font-bold">20% Completion Bonus:</span>
                <span className="text-body-l text-black font-bold">
                  {formatUnits((plan.dailyAmount * plan.currentDay * BigInt(20)) / BigInt(100), decimals)} {tokenSymbol || "tokens"}
                </span>
              </div>
              <div className="flex justify-between border-t-4 border-black pt-2 bg-celo-light-blue px-3 py-2">
                <span className="text-body-l text-black font-bold">Reward Pool Share:</span>
                <span className="text-body-l text-black font-bold">
                  + Share from community pool
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={async () => {
              setIsWithdrawing(true);
              try {
                await withdraw(planId);
              } catch (err) {
                console.error("Error withdrawing:", err);
                alert("Failed to withdraw. Please try again.");
              } finally {
                setIsWithdrawing(false);
              }
            }}
            disabled={isPending || isConfirming || isWithdrawing}
            className="w-full"
            variant="default"
          >
            {isPending || isConfirming || isWithdrawing ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin mr-2"></div>
                Withdrawing...
              </>
            ) : (
              "💰 Withdraw All Rewards"
            )}
          </Button>
        </div>
      )}

      {plan.isFailed && (
        <div className="border-t-4 border-black pt-6">
          <div className="border-2 border-black bg-celo-error p-6">
            <p className="text-body-l text-white font-bold mb-2">Plan Failed</p>
            <p className="text-body-m text-white">
              You missed too many days. Your penalty stake has been slashed.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
