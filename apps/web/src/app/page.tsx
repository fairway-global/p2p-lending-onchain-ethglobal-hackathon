"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
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

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);
  
  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Saving plan state
  const [selectedLevel, setSelectedLevel] = useState<SavingLevel | null>(null);
  const [customDays, setCustomDays] = useState<string>("");
  const [customDailyAmount, setCustomDailyAmount] = useState<string>("");
  const [penaltyStake, setPenaltyStake] = useState("0");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<bigint | null>(null);
  
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
      // Set default to middle of range
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
    // Only auto-connect Farcaster if we're in a Farcaster context
    // Don't auto-connect MetaMask to avoid unwanted popups
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
    // In a real app, you'd fetch the user's plan ID from your backend or contract
    // For now, we'll check if there's a plan ID stored locally
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
        // Plan is done, allow creating a new one
        setHasActivePlan(false);
        localStorage.removeItem("savingPlanId");
      } else if (planData.isActive) {
        setHasActivePlan(true);
      }
    }
  }, [planData]);


  const handlePlanCreated = () => {
    // Use the plan ID extracted from the transaction receipt
    // The useEffect will handle setting the active plan state
    // This callback is triggered when the transaction is confirmed
    if (createdPlanId) {
      // Immediately show dashboard
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      // Refetch plan data
      refetchPlan();
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  };

  // Watch for created plan ID - immediately show dashboard after creation
  useEffect(() => {
    if (createdPlanId) {
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      // Refetch plan data immediately and then again after a delay to ensure it's loaded
      refetchPlan();
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  }, [createdPlanId, setSelectedPlanId, refetchPlan]);

  if (!isMiniAppReady) {
    return (
      <main className="flex-1 bg-celo-light-tan">
        <section className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="w-12 h-12 border-4 border-black border-t-celo-yellow mx-auto mb-4 animate-spin"></div>
            <p className="text-body-m text-celo-body-copy font-inter">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-celo-light-tan">
      <section className="flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-3xl mx-auto p-6 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-h1 font-alpina mb-4 text-black">
              Savelo
            </h1>
            <p className="text-body-l text-celo-body-copy mb-8 font-inter italic">
              Save Daily. Keep the Streak.
            </p>
          </div>

          {/* Main Content */}
          {!isConnected ? (
            <Card className="p-8 text-center border-2 border-black bg-celo-dark-tan">
              <p className="text-body-m text-celo-body-copy">Please connect your wallet to continue.</p>
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
                className="border-2 border-black"
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
                <Card className="p-8 border-2 border-black bg-celo-dark-tan">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-black border-t-celo-yellow mx-auto animate-spin"></div>
                    <p className="text-body-m text-celo-body-copy font-inter">
                      Loading your plan data...
                    </p>
                    <p className="text-body-s text-celo-body-copy font-inter">
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
                    className="border-2 border-black"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Level Selection
                  </Button>
                  
                  <Card className="p-6 border-2 border-black bg-celo-yellow">
                    <div>
                      <h3 className="text-h4 font-alpina text-black mb-1">Selected: <span className="italic">{selectedLevel.name}</span></h3>
                      <p className="text-body-s text-celo-body-copy">{selectedLevel.description}</p>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    {/* Days Input */}
                    <Card className="p-6 border-2 border-black bg-celo-dark-tan">
                      <label className="block text-eyebrow font-bold text-black mb-3 uppercase">
                        Number of Days ({selectedLevel.minDays}-{selectedLevel.maxDays} days)
                      </label>
                      <input
                        type="number"
                        min={selectedLevel.minDays}
                        max={selectedLevel.maxDays}
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className={`w-full px-4 py-3 border-2 border-black bg-white text-black text-body-m font-inter focus:outline-none focus:ring-2 ${
                          customDays && !isValidDays(customDays)
                            ? "border-celo-error focus:ring-celo-error"
                            : "focus:ring-celo-purple"
                        }`}
                        placeholder={`Enter days (${selectedLevel.minDays}-${selectedLevel.maxDays})`}
                      />
                      {customDays && !isValidDays(customDays) && (
                        <p className="mt-2 text-body-s text-celo-error font-bold">
                          Days must be between {selectedLevel.minDays} and {selectedLevel.maxDays}
                        </p>
                      )}
                    </Card>

                    {/* Daily Amount Input */}
                    <Card className="p-6 border-2 border-black bg-celo-dark-tan">
                      <label className="block text-eyebrow font-bold text-black mb-3 uppercase">
                        Daily Amount (${selectedLevel.minDailyAmount}-${selectedLevel.maxDailyAmount})
                      </label>
                      <input
                        type="number"
                        min={selectedLevel.minDailyAmount}
                        max={selectedLevel.maxDailyAmount}
                        step="0.01"
                        value={customDailyAmount}
                        onChange={(e) => setCustomDailyAmount(e.target.value)}
                        className={`w-full px-4 py-3 border-2 border-black bg-white text-black text-body-m font-inter focus:outline-none focus:ring-2 ${
                          customDailyAmount && !isValidDailyAmount(customDailyAmount)
                            ? "border-celo-error focus:ring-celo-error"
                            : "focus:ring-celo-purple"
                        }`}
                        placeholder={`Enter daily amount ($${selectedLevel.minDailyAmount}-$${selectedLevel.maxDailyAmount})`}
                      />
                      {customDailyAmount && !isValidDailyAmount(customDailyAmount) && (
                        <p className="mt-2 text-body-s text-celo-error font-bold">
                          Daily amount must be between ${selectedLevel.minDailyAmount} and ${selectedLevel.maxDailyAmount}
                        </p>
                      )}
                    </Card>

                    {/* Auto-calculated Penalty Stake */}
                    <Card className="p-6 border-2 border-black bg-celo-forest-green text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-eyebrow font-bold text-white uppercase mb-1">Penalty Stake</p>
                          <p className="text-body-s text-white">Automatically calculated as {selectedLevel.penaltyPercent}% of daily amount</p>
                        </div>
                        <div className="text-right">
                          <p className="text-h4 font-alpina text-celo-yellow">${penaltyStake}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Explanation Section */}
                    <Card className="p-6 border-2 border-black bg-celo-purple text-white">
                      <h4 className="text-h4 font-alpina text-celo-yellow mb-4">How It Works</h4>
                      
                      <div className="space-y-4">
                        <div className="border-l-4 border-celo-yellow pl-4">
                          <p className="text-body-m font-bold text-white mb-1">⏰ Grace Period (First Miss)</p>
                          <p className="text-body-s text-white">
                            If you miss your first payment, you get a <strong>2-day grace period</strong> with no penalty. 
                            Use this time to catch up and make your payment.
                          </p>
                        </div>

                        <div className="border-l-4 border-celo-error pl-4">
                          <p className="text-body-m font-bold text-white mb-1">⚠️ Penalty After Grace Period</p>
                          <p className="text-body-s text-white">
                            After the grace period, if you miss a day, <strong>{selectedLevel.penaltyPercent}% of your daily amount</strong> 
                            will be deducted from your penalty stake <strong>every missed day</strong>. 
                            All deducted penalties go to the <strong>Community Reward Pool</strong>.
                          </p>
                        </div>

                        <div className="border-l-4 border-celo-success pl-4">
                          <p className="text-body-m font-bold text-white mb-1">🏆 Completion Reward (20% Bonus)</p>
                          <p className="text-body-s text-white">
                            If you complete your saving streak, you'll receive a <strong>20% bonus</strong> on your total savings! 
                            Plus, you'll get a share of the Community Reward Pool from all penalties collected from failed plans.
                          </p>
                        </div>

                        <div className="border-l-4 border-celo-light-blue pl-4">
                          <p className="text-body-m font-bold text-white mb-1">💰 Community Reward Pool</p>
                          <p className="text-body-s text-white">
                            All penalties deducted from missed payments are pooled together and distributed to users who 
                            successfully complete their saving plans. The more you save, the more you can earn!
                          </p>
                        </div>
                      </div>
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

          {/* Add Miniapp Button */}
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
              className="text-eyebrow text-celo-purple hover:text-black underline font-bold disabled:text-celo-inactive"
            >
              {isAddingMiniApp ? "Adding..." : "Add to Farcaster"}
            </button>
            
            {addMiniAppMessage && (
              <p className="mt-3 text-body-s text-celo-body-copy">{addMiniAppMessage}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
