"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { LevelSelector } from "@/components/saving-plan/level-selector";
import { PlanCreator } from "@/components/saving-plan/plan-creator";
import { PlanCalendar } from "@/components/saving-plan/plan-calendar";
import { useSavingContract, SAVING_LEVELS, SavingLevel } from "@/hooks/use-saving-contract";
import { env } from "@/lib/env";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnector } from "@/components/wallet-connector";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);
  
  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Saving plan state
  const [selectedLevel, setSelectedLevel] = useState<SavingLevel | null>(null);
  const [penaltyStake, setPenaltyStake] = useState("2");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<bigint | null>(null);
  
  const { planData, setSelectedPlanId, refetchPlan, createdPlanId } = useSavingContract();
  
  // Token address from environment
  const tokenAddress = (env.NEXT_PUBLIC_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  
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

  // Extract user data from context
  const user = context?.user;
  const walletAddress = address || user?.custody || user?.verifications?.[0] || "0x1e4B...605B";
  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username || "@user";
  const pfpUrl = user?.pfpUrl;
  
  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePlanCreated = () => {
    // Use the plan ID extracted from the transaction receipt
    if (createdPlanId) {
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      // Refetch plan data after a short delay
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  };

  // Watch for created plan ID
  useEffect(() => {
    if (createdPlanId && !hasActivePlan) {
      setHasActivePlan(true);
      setCurrentPlanId(createdPlanId);
      setSelectedPlanId(createdPlanId);
      localStorage.setItem("savingPlanId", createdPlanId.toString());
      setSelectedLevel(null);
      setTimeout(() => {
        refetchPlan();
      }, 2000);
    }
  }, [createdPlanId, hasActivePlan, setSelectedPlanId, refetchPlan]);

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
            
            {/* User Profile */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {pfpUrl && (
                <div className="border-2 border-black">
                  <img 
                    src={pfpUrl} 
                    alt="Profile" 
                    className="w-16 h-16 object-cover"
                  />
                </div>
              )}
              <div className="text-left border-l-2 border-black pl-4">
                <p className="text-body-m font-bold text-black">{displayName}</p>
                <p className="text-body-s text-celo-body-copy font-inter">{formatAddress(walletAddress)}</p>
              </div>
            </div>

            {/* Wallet Connector */}
            <div className="flex justify-center mb-8">
              <WalletConnector />
            </div>
          </div>

          {/* Main Content */}
          {!isConnected ? (
            <Card className="p-8 text-center border-2 border-black bg-celo-dark-tan">
              <p className="text-body-m text-celo-body-copy">Please connect your wallet to continue.</p>
            </Card>
          ) : hasActivePlan && planData && currentPlanId ? (
            <PlanCalendar 
              plan={planData} 
              planId={currentPlanId}
              tokenAddress={tokenAddress}
            />
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
                  <Card className="p-6 border-2 border-black bg-celo-yellow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-h4 font-alpina text-black mb-1">Selected: <span className="italic">{selectedLevel.name}</span></h3>
                        <p className="text-body-s text-celo-body-copy">{selectedLevel.description}</p>
                      </div>
                      <Button
                        onClick={() => setSelectedLevel(null)}
                        variant="outline"
                        size="sm"
                      >
                        Change
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-6">
                    <Card className="p-6 border-2 border-black bg-celo-dark-tan">
                      <label className="block text-eyebrow font-bold text-black mb-3 uppercase">
                        Penalty Stake Amount (tokens)
                      </label>
                      <input
                        type="text"
                        value={penaltyStake}
                        onChange={(e) => setPenaltyStake(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-black bg-white text-black text-body-m font-inter focus:outline-none focus:ring-2 focus:ring-celo-purple"
                        placeholder="Enter stake amount"
                      />
                      <p className="mt-3 text-body-s text-celo-body-copy">
                        This amount will be slashed if you miss too many days
                      </p>
                    </Card>

                    <PlanCreator
                      selectedLevel={selectedLevel}
                      tokenAddress={tokenAddress}
                      penaltyStake={penaltyStake}
                      onPlanCreated={handlePlanCreated}
                    />
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
                  if (result.added) {
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
