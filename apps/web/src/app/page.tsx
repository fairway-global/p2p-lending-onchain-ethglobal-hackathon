"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { LevelSelector } from "@/components/saving-plan/level-selector";
import { PlanCreator } from "@/components/saving-plan/plan-creator";
import { PlanCalendar } from "@/components/saving-plan/plan-calendar";
import { PlanDashboard } from "@/components/saving-plan/plan-dashboard";
import { useSavingContract, SAVING_LEVELS, SavingLevel } from "@/contexts/saving-contract-context";
import { env } from "@/lib/env";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NeoSlider from "@/components/ui/NeoSlider";
import { formatUsdWithCelo, celoToUsd } from "@/lib/celo-conversion";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  
  // Wallet connection hooks
  const { isConnected, isConnecting, address } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Saving plan state
  const [selectedLevel, setSelectedLevel] = useState<SavingLevel | null>(null);
  const [customDays, setCustomDays] = useState<string>("");
  const [customDailyAmount, setCustomDailyAmount] = useState<string>("");
  const [penaltyStake, setPenaltyStake] = useState("0");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<bigint | null>(null);
  const [showHowDetails, setShowHowDetails] = useState(false);
  const handledPlanIdRef = useRef<string | null>(null);

  const getWalletPlans = (addr: string): bigint[] => {
    const walletPlansKey = `walletPlans_${addr}`;
    const raw = localStorage.getItem(walletPlansKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((id) => {
            try {
              return BigInt(id);
            } catch {
              return null;
            }
          })
          .filter((id): id is bigint => id !== null);
      }
      return [BigInt(raw)];
    } catch {
      try {
        return [BigInt(raw)];
      } catch {
        return [];
      }
    }
  };

  const saveWalletPlans = (addr: string, plans: bigint[]) => {
    const walletPlansKey = `walletPlans_${addr}`;
    const unique = Array.from(new Set(plans.map((p) => p.toString()))).map((p) => BigInt(p));
    localStorage.setItem(walletPlansKey, JSON.stringify(unique.map((p) => p.toString())));
  };

  const addPlanIdForWallet = (addr: string, planId: bigint) => {
    const plans = getWalletPlans(addr);
    const reordered = [planId, ...plans.filter((p) => p.toString() !== planId.toString())];
    saveWalletPlans(addr, reordered);
    localStorage.setItem("savingPlanId", planId.toString());
  };

  const removePlanIdForWallet = (addr: string, planId: bigint) => {
    const plans = getWalletPlans(addr).filter((p) => p.toString() !== planId.toString());
    if (plans.length) {
      saveWalletPlans(addr, plans);
      localStorage.setItem("savingPlanId", plans[0].toString());
    } else {
      const walletPlansKey = `walletPlans_${addr}`;
      localStorage.removeItem(walletPlansKey);
      localStorage.removeItem("savingPlanId");
    }
    return plans;
  };

  // Calculate penalty stake based on level percentage
  useEffect(() => {
    if (customDailyAmount && selectedLevel) {
      const daily = parseFloat(customDailyAmount);
      const percent = selectedLevel.penaltyPercent / 100;
      if (!isNaN(daily) && daily > 0) {
        const penalty = (daily * percent).toFixed(2);
        setPenaltyStake(penalty);
      } else {
        setPenaltyStake("0");
      }
    } else {
      setPenaltyStake("0");
    }
  }, [customDailyAmount, selectedLevel]);
  
  // Set default values when level is selected
  useEffect(() => {
    if (selectedLevel) {
      const defaultDays = Math.floor((selectedLevel.minDays + selectedLevel.maxDays) / 2);
      const defaultAmount = Math.floor((selectedLevel.minDailyAmount + selectedLevel.maxDailyAmount) / 2);
      setCustomDays(defaultDays.toString());
      setCustomDailyAmount(defaultAmount.toString());
    } else {
      setCustomDays("");
      setCustomDailyAmount("");
      setPenaltyStake("0");
    }
  }, [selectedLevel]);
  
  // Validation helpers
  const isValidDays = (days: string): boolean => {
    if (!selectedLevel) return false;
    const numDays = parseInt(days);
    return !isNaN(numDays) && numDays >= selectedLevel.minDays && numDays <= selectedLevel.maxDays;
  };
  
  const isValidDailyAmount = (amount: string): boolean => {
    if (!selectedLevel) return false;
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount >= selectedLevel.minDailyAmount && numAmount <= selectedLevel.maxDailyAmount;
  };
  
  const canCreatePlan = selectedLevel && isValidDays(customDays) && isValidDailyAmount(customDailyAmount);
  
  const { planData, setSelectedPlanId, selectedPlanId, refetchPlan, createdPlanId } = useSavingContract();
  
  // Debug: Log when createdPlanId changes
  useEffect(() => {
    console.log("🔄 createdPlanId changed in page.tsx:", createdPlanId?.toString() || "null", "value:", createdPlanId);
  }, [createdPlanId]);
  
  // Debug: Log on every render to see if component is re-rendering
  console.log("🖼️ page.tsx render, createdPlanId:", createdPlanId?.toString() || "null");
  
  // Auto-connect wallet when miniapp is ready (only in Farcaster context)
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(
        c => c.id === 'farcaster' || c.id === 'frameWallet'
      );
      if (farcasterConnector && context?.client) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect, context]);

  // Check for existing plan when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log("🔍 Checking for saved plan for wallet:", address);
      const walletKey = address.toLowerCase();
      const walletPlans = getWalletPlans(walletKey);
      let planIdToUse: bigint | null = walletPlans.length ? walletPlans[0] : null;

      if (!planIdToUse) {
        const legacyPlanId = localStorage.getItem("savingPlanId");
        if (legacyPlanId) {
          try {
            planIdToUse = BigInt(legacyPlanId);
            addPlanIdForWallet(walletKey, planIdToUse);
            console.log("📦 Migrated legacy plan to wallet storage", legacyPlanId);
          } catch {
            planIdToUse = null;
          }
        }
      }

      if (planIdToUse) {
        console.log("✅ Using latest saved plan for wallet:", planIdToUse.toString());
        setCurrentPlanId(planIdToUse);
        setSelectedPlanId(planIdToUse);
        setHasActivePlan(true);
        setShowPlanner(true);
        setTimeout(() => {
          refetchPlan();
        }, 500);
      }
    } else if (!isConnected) {
      // Wallet disconnected - clear active plan state (but keep saved plan for when they reconnect)
      setHasActivePlan(false);
      setCurrentPlanId(null);
      setSelectedPlanId(null);
    }
  // Note: refetchPlan/setSelectedPlanId are stable enough to omit from deps to avoid
  // effect thrashing on re-renders caused by refetch reference changes.
  }, [isConnected, address]);

  // Watch plan data changes and verify plan ownership
  useEffect(() => {
    if (planData && address) {
      // Verify the plan belongs to the connected wallet
      const planOwner = planData.user?.toLowerCase();
      const connectedAddress = address.toLowerCase();
      
      if (planOwner && planOwner !== connectedAddress) {
        console.warn("⚠️ Plan does not belong to connected wallet. Clearing plan state.");
        setHasActivePlan(false);
        setCurrentPlanId(null);
        setSelectedPlanId(null);
        // Remove incorrect plan storage and try previous plan for this wallet
        const incorrectPlanId = currentPlanId || selectedPlanId;
        if (incorrectPlanId) {
          const remaining = removePlanIdForWallet(connectedAddress, incorrectPlanId);
          if (remaining.length) {
            const latest = remaining[0];
            console.log("➡️ Loading previous plan for wallet:", latest.toString());
            setCurrentPlanId(latest);
            setSelectedPlanId(latest);
            setHasActivePlan(true);
            setShowPlanner(true);
            return;
          }
        }
        return;
      }
      
      if (planData.isCompleted || planData.isFailed) {
        setHasActivePlan(false);
        // Remove wallet-specific plan storage
        const remaining = removePlanIdForWallet(address.toLowerCase(), currentPlanId || BigInt(0));
        console.log("🗑️ Removed completed/failed plan for wallet:", address);
        if (remaining.length) {
          const latest = remaining[0];
          setCurrentPlanId(latest);
          setSelectedPlanId(latest);
          setHasActivePlan(true);
          setShowPlanner(true);
        }
      } else if (planData.isActive) {
        setHasActivePlan(true);
      }
    }
  }, [planData, address]);

  // Ensure planner view is shown whenever we have an active/current plan
  useEffect(() => {
    if (hasActivePlan && currentPlanId) {
      setShowPlanner(true);
    }
  }, [hasActivePlan, currentPlanId]);



  useEffect(() => {
    const planIdValue = createdPlanId;
    const planIdStr = planIdValue?.toString();
    console.log(
      "🔔 useEffect triggered, createdPlanId:",
      planIdStr || "null",
      "type:",
      typeof planIdValue,
      "isTruthy:",
      !!planIdValue
    );
    
    // Only react to new, valid plan ids once to avoid render loops
    if (
      planIdValue !== null &&
      planIdValue !== undefined &&
      planIdValue !== BigInt(0) &&
      planIdStr &&
      handledPlanIdRef.current !== planIdStr
    ) {
      handledPlanIdRef.current = planIdStr;
      console.log("🚀 Plan created! Plan ID:", planIdStr);
      console.log("📊 Navigating to dashboard...");
      
      setShowPlanner(true);
      setHasActivePlan(true);
      setCurrentPlanId(planIdValue);
      setSelectedPlanId(planIdValue);
      if (address) {
        addPlanIdForWallet(address.toLowerCase(), planIdValue);
      }
      
      if (address) {
        console.log("💾 Saved plan for wallet:", address, "planId:", planIdStr);
      }
      
      setSelectedLevel(null);
      setCustomDays("");
      setCustomDailyAmount("");
      setPenaltyStake("0");
      refetchPlan();
      setTimeout(() => {
        refetchPlan();
      }, 1000);
      setTimeout(() => {
        refetchPlan();
      }, 3000);
    } else {
      console.log("⏸️ No valid planId yet, waiting...");
    }
  }, [createdPlanId, address, refetchPlan, setSelectedPlanId]);

  const slides = [
    {
      title: "Commit daily for 7 days",
      subtitle: "Tiny amounts, big habit energy.",
      icon: (
        <svg viewBox="0 0 120 90" className="h-36 w-full text-[#FBCC5C]">
          <rect x="18" y="30" width="84" height="46" rx="12" fill="currentColor" opacity="0.18" />
          <rect x="30" y="22" width="60" height="50" rx="12" fill="currentColor" />
          <circle cx="40" cy="47" r="10" fill="#16243D" />
          <circle cx="78" cy="47" r="10" fill="#16243D" opacity="0.8" />
        </svg>
      ),
    },
    {
      title: "Stake gets slashed if you miss",
      subtitle: "Miss a day and part of your stake is deducted.",
      icon: (
        <svg viewBox="0 0 120 90" className="h-36 w-full text-[#D65A5A]">
          <rect x="25" y="18" width="70" height="50" rx="14" fill="currentColor" opacity="0.14" />
          <rect x="20" y="30" width="80" height="40" rx="12" fill="#F5F5F7" className="shadow-neoInset" />
          <line x1="26" y1="34" x2="94" y2="70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="44" cy="50" r="10" fill="#FBCC5C" />
          <circle cx="76" cy="50" r="10" fill="#FBCC5C" opacity="0.75" />
        </svg>
      ),
    },
    {
      title: "Finish to unlock rewards",
      subtitle: "Keep the streak and celebrate completion.",
      icon: (
        <svg viewBox="0 0 120 90" className="h-36 w-full text-[#FBCC5C]">
          <circle cx="60" cy="45" r="26" fill="currentColor" opacity="0.2" />
          <path d="M38 50c8 10 36 10 44 0" stroke="#16243D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="38" r="5" fill="#16243D" />
          <circle cx="70" cy="38" r="5" fill="#16243D" />
          <path d="M45 62h30" stroke="#16243D" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveSlide(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const pageShellClass =
    'bg-[#F5F5F7] text-[#16243D] min-h-screen flex items-center justify-center px-4 py-10';
  const panelClass =
    'w-full max-w-md rounded-[24px] shadow-neo bg-[#F5F5F7] p-5 md:p-6 border border-white/60';

  if (!isMiniAppReady) {
    return (
      <main className={pageShellClass}>
        <section className="w-full max-w-md rounded-neo bg-[#F5F5F7] p-8 text-center shadow-neo border border-white/70">
          <div className="w-14 h-14 border-4 border-[#FBCC5C] border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-base text-[#4B5563] font-inter">Loading...</p>
        </section>
      </main>
    );
  }

  const Landing = () => (
    <section className={panelClass}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F5F5F7] shadow-neo text-3xl">
          🌱
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#4B5563]">Struggling to commit?</p>
        <h1 className="text-3xl font-semibold text-[#16243D]">
          Build saving habits by daily commitment in 7 days or less.
        </h1>
        <p className="text-sm text-[#4B5563]">
          Swipe through to see how Savelo works in a few steps.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 flex snap-x snap-mandatory overflow-x-auto gap-4 pb-2 no-scrollbar"
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.title}
            className="min-w-full snap-center rounded-[20px] bg-[#F5F5F7] shadow-neo border border-white/70 p-5 flex flex-col items-center text-center gap-4"
          >
            <div className="w-full flex justify-center">{slide.icon}</div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#16243D]">{slide.title}</h3>
              <p className="text-sm text-[#4B5563]">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full transition-all ${activeSlide === idx ? "w-6 bg-[#FBCC5C]" : "bg-[#D1D5DB]"}`}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button
          onClick={() => setShowPlanner(true)}
          className="w-full rounded-full bg-[#FBCC5C] text-[#16243D] shadow-neo hover:shadow-neoSoft px-6 py-3 text-base"
        >
          Agree and start a saving plan
        </Button>
      </div>
    </section>
  );

  return (
    <main className={pageShellClass}>
      {!showPlanner ? (
        <Landing />
      ) : (
        <section className={panelClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F5F7] shadow-neo">
              <img src="/logo.png" alt="Savelo logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#16243D] leading-tight">Savelo</h1>
              <p className="text-xs text-[#4B5563]">Build daily habits with micro-saving streaks.</p>
            </div>
          </div>

          {!isConnected ? (
            <Card className="p-8 text-center bg-[#F5F5F7] shadow-neo rounded-neo border border-white/70">
              <p className="text-base text-[#4B5563]">Please connect your wallet to continue.</p>
            </Card>
          ) : hasActivePlan && currentPlanId ? (
            <div className="space-y-6">
              <Button
                onClick={() => {
                  setHasActivePlan(false);
                  setCurrentPlanId(null);
                  setSelectedPlanId(null);
                  setSelectedLevel(null);
                  // Don't remove saved plan - user might want to come back
                  // Only remove if they explicitly want to start a new plan
                  console.log("👈 User navigated back to plan selection (plan still saved)");
                }}
                variant="outline"
                className="border-none bg-[#F5F5F7] shadow-neo rounded-full px-4 py-2 text-sm text-[#16243D] hover:shadow-neoSoft"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
              {planData ? (
                <>
                  <PlanDashboard 
                    plan={planData} 
                    planId={currentPlanId}
                    tokenAddress={env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`}
                  />
                  <PlanCalendar 
                    plan={planData} 
                    planId={currentPlanId}
                    tokenAddress={env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`}
                  />
                </>
              ) : (
                <Card className="p-8 bg-[#F5F5F7] shadow-neo rounded-neo border border-white/70">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#FBCC5C] border-t-transparent rounded-full mx-auto animate-spin"></div>
                    <p className="text-base text-[#4B5563] font-inter">
                      Loading your plan data...
                    </p>
                    <p className="text-sm text-[#4B5563] font-inter">
                      Plan ID: {currentPlanId.toString()}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {!selectedLevel ? (
                <LevelSelector
                  levels={SAVING_LEVELS}
                  selectedLevel={selectedLevel}
                  onSelectLevel={setSelectedLevel}
                />
              ) : (
                <>
                  <Button
                    onClick={() => setSelectedLevel(null)}
                    variant="outline"
                    className="border-none bg-[#F5F5F7] shadow-neo rounded-full px-4 py-2 text-sm text-[#16243D] hover:shadow-neoSoft"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Level Selection
                  </Button>
                  
                  <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70">
                    <div>
                      <h3 className="text-xl font-semibold text-[#16243D] mb-1">
                        Selected: <span className="text-[#FBCC5C]">{selectedLevel.name}</span>
                      </h3>
                      <p className="text-sm text-[#4B5563]">{selectedLevel.description}</p>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70">
                      <label className="block text-xs font-semibold text-[#4B5563] mb-3 uppercase tracking-wide">
                        Number of Days ({selectedLevel.minDays}-{selectedLevel.maxDays} days)
                      </label>
                      <NeoSlider
                        min={selectedLevel.minDays}
                        max={selectedLevel.maxDays}
                        step={1}
                        value={Number(customDays) || selectedLevel.minDays}
                        onChange={(val) => setCustomDays(String(Math.round(val)))}
                        label="Days"
                      />
                    </Card>

                    {/* Daily Amount Input */}
                    <Card className="p-6 border-2 border-black bg-celo-dark-tan">
                      <label className="block text-eyebrow font-bold text-black mb-3 uppercase">
                        Daily Amount in USD
                      </label>
                      <div className="mb-2 p-3 border-2 border-celo-purple bg-celo-light-blue">
                        <p className="text-body-s text-black font-bold mb-1">
                          💵 Enter amount in US Dollars (${selectedLevel.minDailyAmount}-${selectedLevel.maxDailyAmount})
                        </p>
                        <p className="text-body-xs text-celo-body-copy">
                          We&apos;ll convert it to CELO automatically (1 CELO = $0.16)
                        </p>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-body-l font-bold text-black">$</span>
                        <input
                          type="number"
                          min={selectedLevel.minDailyAmount}
                          max={selectedLevel.maxDailyAmount}
                          step="0.01"
                          value={customDailyAmount}
                          onChange={(e) => setCustomDailyAmount(e.target.value)}
                          className={`w-full pl-8 pr-4 py-3 border-2 border-black bg-white text-black text-body-m font-inter focus:outline-none focus:ring-2 ${
                            customDailyAmount && !isValidDailyAmount(customDailyAmount)
                              ? "border-celo-error focus:ring-celo-error"
                              : "focus:ring-celo-purple"
                          }`}
                          placeholder={`${selectedLevel.minDailyAmount}.00`}
                        />
                      </div>
                      {customDailyAmount && isValidDailyAmount(customDailyAmount) && (
                        <div className="mt-3 p-3 border-2 border-celo-yellow bg-celo-yellow">
                          <p className="text-body-m text-black font-bold">
                            💰 Equivalent: {formatUsdWithCelo(customDailyAmount)}
                          </p>
                          <p className="text-body-xs text-celo-body-copy mt-1">
                            Amount shown in USD with CELO equivalent in parentheses
                          </p>
                        </div>
                      )}
                      {customDailyAmount && !isValidDailyAmount(customDailyAmount) && (
                        <p className="mt-2 text-body-s text-celo-error font-bold">
                          Daily amount must be between ${selectedLevel.minDailyAmount} and ${selectedLevel.maxDailyAmount} USD
                        </p>
                      )}
                    </Card>

                    <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-semibold text-[#4B5563] uppercase mb-1">Penalty Stake</p>
                          <p className="text-sm text-[#4B5563]">
                            Automatically calculated as {selectedLevel.penaltyPercent}% of daily amount
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-alpina text-celo">{formatUsdWithCelo(penaltyStake)}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Explanation Section */}
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowHowDetails((prev) => !prev)}
                          aria-expanded={showHowDetails}
                          className="text-[11px] font-semibold uppercase tracking-wide text-[#16243D] bg-white/80 border border-white/70 rounded-full px-3 py-1 shadow-neo transition hover:-translate-y-[1px]"
                        >
                          {showHowDetails ? "Hide How It Works" : "Click to see details"}
                        </button>
                      </div>

                      {showHowDetails && (
                        <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70 text-[#16243D]">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-[#16243D]">How It Works</h4>
                            <span className="text-xs uppercase tracking-wide text-[#6B7280]">Rules & rewards</span>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-neo bg-white/80 shadow-neoInset border border-white/60 p-3">
                              <p className="text-sm font-semibold text-[#16243D] flex items-center gap-2">
                                <span>⏰</span> Grace Period (First Miss)
                              </p>
                              <p className="text-sm text-[#4B5563] mt-1">
                                If you miss your first payment, you get a <strong>2-day grace period</strong> with no penalty. Use this time to catch up.
                              </p>
                            </div>

                            <div className="rounded-neo bg-white/80 shadow-neoInset border border-white/60 p-3">
                              <p className="text-sm font-semibold text-[#16243D] flex items-center gap-2">
                                <span>⚠️</span> Penalty After Grace Period
                              </p>
                              <p className="text-sm text-[#4B5563] mt-1">
                                After the grace period, if you miss a day, <strong>{selectedLevel.penaltyPercent}% of your daily amount</strong> is deducted from your penalty stake every missed day.
                              </p>
                            </div>

                            <div className="rounded-neo bg-white/80 shadow-neoInset border border-white/60 p-3">
                              <p className="text-sm font-semibold text-[#16243D] flex items-center gap-2">
                                <span>🏆</span> Completion Reward (20% Bonus)
                              </p>
                              <p className="text-sm text-[#4B5563] mt-1">
                                Complete your saving streak and you&apos;ll receive a <strong>20% bonus</strong> on your total savings, plus a share of the Community Reward Pool.
                              </p>
                            </div>

                            <div className="rounded-neo bg-white/80 shadow-neoInset border border-white/60 p-3">
                              <p className="text-sm font-semibold text-[#16243D] flex items-center gap-2">
                                <span>💰</span> Community Reward Pool
                              </p>
                              <p className="text-sm text-[#4B5563] mt-1">
                                Penalties from missed plans are pooled together and distributed to savers who finish successfully.
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>

                    {canCreatePlan && (
                      <PlanCreator
                        selectedLevel={selectedLevel}
                        customDays={parseInt(customDays)}
                        customDailyAmount={customDailyAmount}
                        penaltyStake={penaltyStake}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={async () => {
                if (isAddingMiniApp) return;
                
                setIsAddingMiniApp(true);
                setAddMiniAppMessage(null);
                
                try {
                  const result = await sdk.actions.addMiniApp();
                  if (result) {
                    setAddMiniAppMessage("Miniapp added successfully!");
                  } else {
                    setAddMiniAppMessage("Miniapp was not added (user declined or already exists)");
                  }
                } catch (error: any) {
                  console.error('Add miniapp error:', error);
                  if (error?.message?.includes('domain')) {
                    setAddMiniAppMessage("This miniapp can only be added from its official domain");
                  } else {
                    setAddMiniAppMessage("Failed to add miniapp. Please try again.");
                  }
                } finally {
                  setIsAddingMiniApp(false);
                }
              }}
              disabled={isAddingMiniApp}
              className="text-sm text-[#4B5563] hover:text-[#16243D] underline font-semibold disabled:opacity-60"
            >
              {isAddingMiniApp ? "Adding..." : "Add to Farcaster"}
            </button>
            
            {addMiniAppMessage && (
              <p className="mt-3 text-sm text-[#4B5563]">{addMiniAppMessage}</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
