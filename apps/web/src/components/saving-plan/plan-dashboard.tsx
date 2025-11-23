"use client";

import { Plan } from "@/hooks/use-saving-contract";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";
import { useSavingContract } from "@/hooks/use-saving-contract";
import { useState, useEffect, useRef, useCallback } from "react";
import { useReadContract } from "wagmi";
import ERC20ABI from "@/lib/abi/ERC20.json";

interface PlanDashboardProps {
  plan: Plan;
  planId: bigint;
  tokenAddress: `0x${string}`;
}

export function PlanDashboard({ plan, planId, tokenAddress }: PlanDashboardProps) {
  const { payDaily, isPending, isConfirming, isConfirmed, error, hash, refetchPlan } = useSavingContract();
  const [isPaying, setIsPaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [lastPaymentDay, setLastPaymentDay] = useState<number>(0);
  const [hasPaidToday, setHasPaidToday] = useState(false);
  const [streakCount, setStreakCount] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const decimals = tokenDecimals || 18;
  const currentDay = Number(plan.currentDay);
  const totalDays = Number(plan.totalDays);
  const missedDays = Number(plan.missedDays);
  const startTime = Number(plan.startTime);
  
  // Calculate current balance
  const currentBalance = plan.dailyAmount * BigInt(currentDay);

  // Calculate next payment deadline
  // Each day starts at startTime + (dayNumber * 86400)
  // Deadline is end of current day (start of next day)
  const calculateNextDeadline = () => {
    if (startTime === 0) return null;
    const now = Math.floor(Date.now() / 1000);
    const daysSinceStart = Math.floor((now - startTime) / 86400);
    // Deadline is end of current day (start of next day)
    const nextDayStart = startTime + (daysSinceStart + 1) * 86400;
    return nextDayStart;
  };

  const handleMissedPayment = useCallback(() => {
    // Reset streak to zero
    setStreakCount(0);
    setLastPaymentDay(0);
    setHasPaidToday(false);
    // The contract will handle the penalty automatically
    // Refetch plan to get updated data (missedDays will increase)
    refetchPlan();
    // Restart timer for next day
    setTimeout(() => {
      setIsTimerActive(true);
    }, 1000);
  }, [refetchPlan]);

  // Monitor for missed payments and update timer
  useEffect(() => {
    if (!plan.isActive || startTime === 0) return;
    
    const checkMissedPayment = () => {
      const now = Math.floor(Date.now() / 1000);
      const daysSinceStart = Math.floor((now - startTime) / 86400);
      
      // If we're behind on payments (currentDay < daysSinceStart), payment was missed
      if (currentDay < daysSinceStart && !hasPaidToday && missedDays === 0) {
        // Only trigger if we haven't already detected the missed payment
        handleMissedPayment();
      }
    };

    // Check every minute for missed payments
    const missedPaymentInterval = setInterval(checkMissedPayment, 60000);
    
    return () => {
      clearInterval(missedPaymentInterval);
    };
  }, [plan.isActive, startTime, currentDay, hasPaidToday, missedDays, handleMissedPayment]);

  // Update timer
  useEffect(() => {
    const updateTimer = () => {
      const deadline = calculateNextDeadline();
      if (!deadline) {
        setTimeRemaining(null);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const remaining = deadline - now;

      if (remaining <= 0) {
        // Deadline passed
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        // Timer will restart for next day if payment wasn't made
        if (!hasPaidToday) {
          // Restart timer for next day after a short delay
          setTimeout(() => {
            setIsTimerActive(true);
          }, 1000);
        }
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining({ hours, minutes, seconds });
    };

    if (isTimerActive && !hasPaidToday && plan.isActive && !plan.isCompleted && !plan.isFailed) {
      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerActive, hasPaidToday, startTime, plan.isActive, plan.isCompleted, plan.isFailed]);

  // Initialize streak and payment tracking
  useEffect(() => {
    if (plan.isActive && startTime > 0) {
      const now = Math.floor(Date.now() / 1000);
      const daysSinceStart = Math.floor((now - startTime) / 86400);
      
      // Streak is currentDay (consecutive successful days)
      // If missedDays > 0, streak should be reset
      if (missedDays > 0) {
        setStreakCount(0);
      } else {
        setStreakCount(currentDay);
      }
      
      // Check if payment was made for today
      // If currentDay > daysSinceStart, payment was made ahead
      // If currentDay === daysSinceStart, payment was made today
      // If currentDay < daysSinceStart, payment is behind
      if (currentDay > daysSinceStart) {
        // Payment made ahead of schedule
        setHasPaidToday(true);
        setIsTimerActive(false);
        setLastPaymentDay(currentDay);
      } else if (currentDay === daysSinceStart && currentDay > 0) {
        // Payment made today
        setHasPaidToday(true);
        setIsTimerActive(false);
        setLastPaymentDay(currentDay);
      } else {
        // No payment yet today or payment is behind
        setHasPaidToday(false);
        setIsTimerActive(true);
        // If we're behind, streak should be 0
        if (currentDay < daysSinceStart) {
          setStreakCount(0);
        }
      }
    } else {
      setStreakCount(0);
      setHasPaidToday(false);
      setIsTimerActive(true);
      setLastPaymentDay(0);
    }
  }, [plan.isActive, currentDay, startTime, missedDays]);

  const handlePayDaily = async () => {
    setIsPaying(true);
    try {
      await payDaily(planId, tokenAddress, formatUnits(plan.dailyAmount, decimals), decimals);
      // Payment successful - update state immediately for better UX
      setHasPaidToday(true);
      setIsTimerActive(false);
      // Streak will be updated when plan data is refetched
    } catch (err) {
      console.error("Error paying daily:", err);
      alert("Failed to pay daily. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  // Refetch plan data after successful payment
  useEffect(() => {
    if (isConfirmed && hash) {
      setTimeout(() => {
        refetchPlan();
        // Payment successful - update streak and stop timer for today
        // Timer will restart tomorrow automatically
      }, 2000);
    }
  }, [isConfirmed, hash, refetchPlan]);

  const canPayToday = plan.isActive && !plan.isCompleted && !plan.isFailed && !hasPaidToday;
  const streakColor = hasPaidToday ? "bg-celo-success" : streakCount > 0 ? "bg-celo-yellow" : "bg-celo-inactive";
  const streakTextColor = hasPaidToday ? "text-black" : streakCount > 0 ? "text-black" : "text-celo-body-copy";

  return (
    <div className="space-y-6">
      <h2 className="text-h2 font-alpina text-black mb-4">Your Saving Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <Card className="p-6 border-2 border-black bg-celo-light-blue">
          <div className="text-center">
            <p className="text-eyebrow font-bold text-black uppercase mb-2">Current Balance</p>
            <p className="text-h3 font-alpina text-black">
              {formatUnits(currentBalance, decimals)}
            </p>
            <p className="text-body-s text-celo-body-copy mt-1">
              {tokenSymbol || "tokens"}
            </p>
          </div>
        </Card>

        {/* Streak Count */}
        <Card className={`p-6 border-2 border-black ${streakColor} transition-all duration-500`}>
          <div className="text-center">
            <p className="text-eyebrow font-bold uppercase mb-2" style={{ color: hasPaidToday ? "#000" : streakCount > 0 ? "#000" : "#6B7280" }}>
              Streak Count
            </p>
            <p className={`text-h3 font-alpina ${streakTextColor} transition-all duration-500`}>
              {streakCount}
            </p>
            <p className={`text-body-s mt-1 ${streakTextColor} transition-all duration-500`}>
              {hasPaidToday ? "✅ Paid Today!" : streakCount > 0 ? "Keep it up!" : "Start your streak"}
            </p>
          </div>
        </Card>

        {/* Countdown Timer */}
        <Card className={`p-6 border-2 border-black ${
          timeRemaining && timeRemaining.hours < 6 && !hasPaidToday
            ? "bg-celo-error"
            : hasPaidToday
            ? "bg-celo-success"
            : "bg-celo-yellow"
        } transition-all duration-300`}>
          <div className="text-center">
            <p className="text-eyebrow font-bold uppercase mb-2" style={{ color: hasPaidToday ? "#000" : timeRemaining && timeRemaining.hours < 6 ? "#fff" : "#000" }}>
              {hasPaidToday ? "Payment Complete" : "Time Remaining"}
            </p>
            {hasPaidToday ? (
              <div className="space-y-2">
                <p className="text-h4 font-alpina text-black">✅</p>
                <p className="text-body-s text-black">Timer paused for today</p>
              </div>
            ) : timeRemaining ? (
              <div>
                <div className="flex justify-center gap-2 text-h4 font-alpina" style={{ color: timeRemaining.hours < 6 ? "#fff" : "#000" }}>
                  <span>{String(timeRemaining.hours).padStart(2, "0")}</span>
                  <span>:</span>
                  <span>{String(timeRemaining.minutes).padStart(2, "0")}</span>
                  <span>:</span>
                  <span>{String(timeRemaining.seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-body-s mt-2" style={{ color: timeRemaining.hours < 6 ? "#fff" : "#6B7280" }}>
                  {timeRemaining.hours < 6 ? "⚠️ Hurry up!" : "Until next payment"}
                </p>
              </div>
            ) : (
              <p className="text-body-m" style={{ color: "#000" }}>Calculating...</p>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Button */}
      {canPayToday && (
        <Card className="p-6 border-2 border-black bg-celo-dark-tan">
          <div className="text-center space-y-4">
            <div>
              <p className="text-body-l font-bold text-black mb-2">
                Pay Today's Saving
              </p>
              <p className="text-body-m text-celo-body-copy">
                Amount: {formatUnits(plan.dailyAmount, decimals)} {tokenSymbol || "tokens"}
              </p>
            </div>
            <Button
              onClick={handlePayDaily}
              disabled={isPending || isConfirming || isPaying}
              className="w-full md:w-auto px-8"
              variant="default"
            >
              {isPending || isConfirming || isPaying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin mr-2"></div>
                  {isPending ? "Approving..." : isConfirming ? "Processing Payment..." : "Processing..."}
                </>
              ) : (
                "💳 Pay Now"
              )}
            </Button>
            {error && (
              <p className="text-body-s text-celo-error font-bold mt-2">
                {error.message || "Payment failed"}
              </p>
            )}
            {hash && (
              <p className="text-body-s text-celo-light-blue text-center font-inter mt-2">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Progress Bar */}
      <Card className="p-6 border-2 border-black bg-celo-dark-tan">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-body-m font-bold text-black">Progress</p>
            <p className="text-body-m font-bold text-black">
              {currentDay} / {totalDays} days
            </p>
          </div>
          <div className="w-full h-6 border-2 border-black bg-white overflow-hidden">
            <div
              className="h-full bg-celo-success transition-all duration-500"
              style={{ width: `${(currentDay / totalDays) * 100}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

