"use client";

import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { LevelSelector } from "@/components/saving-plan/level-selector";
import { PlanCreator } from "@/components/saving-plan/plan-creator";
import { PlanCalendar } from "@/components/saving-plan/plan-calendar";
import { PlanDashboard } from "@/components/saving-plan/plan-dashboard";
import { useSavingContract, SAVING_LEVELS, SavingLevel } from "@/hooks/use-saving-contract";
import { env } from "@/lib/env";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NeoSlider from "@/components/ui/NeoSlider";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  
  // Wallet connection hooks
  const { isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Saving plan state
  const [selectedLevel, setSelectedLevel] = useState<SavingLevel | null>(null);
  const [customDays, setCustomDays] = useState<string>("");
  const [customDailyAmount, setCustomDailyAmount] = useState<string>("");
  const [penaltyStake, setPenaltyStake] = useState("0");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<bigint | null>(null);
  const [showHowDetails, setShowHowDetails] = useState(false);
  
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
  
  const { planData, setSelectedPlanId, refetchPlan, createdPlanId } = useSavingContract();
  
  // Token address from environment
  const tokenAddress = (env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  
  // Debug: Log token address (check browser console)
  useEffect(() => {
    console.log("=== Environment Variables Debug ===");
    console.log("Token Address:", env.NEXT_PUBLIC_TOKEN_ADDRESS);
    console.log("Token Address (resolved):", tokenAddress);
    console.log("Contract Address:", env.NEXT_PUBLIC_CONTRACT_ADDRESS);
    console.log("Is token address valid?", tokenAddress !== "0x0000000000000000000000000000000000000000");
    console.log("===================================");
  }, [tokenAddress]);
  
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

  // Check for existing plan
  useEffect(() => {
    const storedPlanId = localStorage.getItem("savingPlanId");
    if (storedPlanId) {
      const planId = BigInt(storedPlanId);
      setCurrentPlanId(planId);
      setSelectedPlanId(planId);
      setHasActivePlan(true);
    }
  }, [setSelectedPlanId]);

  // Watch plan data changes
  useEffect(() => {
    if (planData) {
      if (planData.isCompleted || planData.isFailed) {
        setHasActivePlan(false);
        localStorage.removeItem("savingPlanId");
      } else if (planData.isActive) {
        setHasActivePlan(true);
      }
    }
  }, [planData]);


  const handlePlanCreated = () => {
    if (createdPlanId) {
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      refetchPlan();
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  };

  useEffect(() => {
    if (createdPlanId) {
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      refetchPlan();
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  }, [createdPlanId, setSelectedPlanId, refetchPlan]);

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
                  localStorage.removeItem("savingPlanId");
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
                    tokenAddress={tokenAddress}
                  />
                  <PlanCalendar 
                    plan={planData} 
                    planId={currentPlanId}
                    tokenAddress={tokenAddress}
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

                    <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70">
                      <label className="block text-xs font-semibold text-[#4B5563] mb-3 uppercase tracking-wide">
                        Daily Amount (${selectedLevel.minDailyAmount}-${selectedLevel.maxDailyAmount})
                      </label>
                      <NeoSlider
                        min={selectedLevel.minDailyAmount}
                        max={selectedLevel.maxDailyAmount}
                        step={0.5}
                        value={Number(customDailyAmount) || selectedLevel.minDailyAmount}
                        onChange={(val) => setCustomDailyAmount(val.toFixed(2))}
                        label="Daily amount"
                      />
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
                          <p className="text-2xl font-semibold text-[#FBCC5C]">${penaltyStake}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 rounded-neo shadow-neo bg-[#F5F5F7] border border-white/70">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-semibold text-[#16243D]">How It Works</h4>
                        <button
                          type="button"
                          onClick={() => setShowHowDetails((prev) => !prev)}
                          className="text-sm font-semibold text-[#16243D] underline"
                        >
                          {showHowDetails ? "Hide details" : "Show more details"}
                        </button>
                      </div>
                      {showHowDetails ? (
                        <div className="space-y-4 mt-3">
                          <div className="rounded-neo bg-[#F5F5F7] shadow-neoInset p-3">
                            <p className="text-sm font-semibold text-[#16243D] mb-1">⏰ Grace Period (First Miss)</p>
                            <p className="text-sm text-[#4B5563]">
                              If you miss your first payment, you get a <strong>2-day grace period</strong> with no penalty. 
                              Use this time to catch up and make your payment.
                            </p>
                          </div>

                          <div className="rounded-neo bg-[#F5F5F7] shadow-neoInset p-3">
                            <p className="text-sm font-semibold text-[#16243D] mb-1">⚠️ Penalty After Grace Period</p>
                            <p className="text-sm text-[#4B5563]">
                              After the grace period, if you miss a day, <strong>{selectedLevel.penaltyPercent}% of your daily amount</strong> 
                              will be deducted from your penalty stake <strong>every missed day</strong>. 
                              All deducted penalties go to the <strong>Community Reward Pool</strong>.
                            </p>
                          </div>

                          <div className="rounded-neo bg-[#F5F5F7] shadow-neoInset p-3">
                            <p className="text-sm font-semibold text-[#16243D] mb-1">🏆 Completion Reward (20% Bonus)</p>
                            <p className="text-sm text-[#4B5563]">
                              If you complete your saving streak, you'll receive a <strong>20% bonus</strong> on your total savings! 
                              Plus, you'll get a share of the Community Reward Pool from all penalties collected from failed plans.
                            </p>
                          </div>

                          <div className="rounded-neo bg-[#F5F5F7] shadow-neoInset p-3">
                            <p className="text-sm font-semibold text-[#16243D] mb-1">💰 Community Reward Pool</p>
                            <p className="text-sm text-[#4B5563]">
                              All penalties deducted from missed payments are pooled together and distributed to users who 
                              successfully complete their saving plans. The more you save, the more you can earn!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[#4B5563]">More details</p>
                      )}
                    </Card>

                    {canCreatePlan && (
                      <PlanCreator
                        selectedLevel={selectedLevel}
                        customDays={parseInt(customDays)}
                        customDailyAmount={customDailyAmount}
                        tokenAddress={tokenAddress}
                        penaltyStake={penaltyStake}
                        onPlanCreated={handlePlanCreated}
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
