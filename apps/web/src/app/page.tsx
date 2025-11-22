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
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Savelo
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Save Daily. Keep the Streak.
            </p>
            
            {/* User Profile */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {pfpUrl && (
                <img 
                  src={pfpUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="text-left">
                <p className="font-semibold text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">{formatAddress(walletAddress)}</p>
              </div>
            </div>

            {/* Wallet Connector */}
            <div className="flex justify-center">
              <WalletConnector />
            </div>
          </div>

          {/* Main Content */}
          {!isConnected ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">Please connect your wallet to continue.</p>
            </Card>
          ) : hasActivePlan && planData && currentPlanId ? (
            <PlanCalendar 
              plan={planData} 
              planId={currentPlanId}
              tokenAddress={tokenAddress}
            />
          ) : (
            <div className="space-y-6">
              {!selectedLevel ? (
                <LevelSelector
                  levels={SAVING_LEVELS}
                  selectedLevel={selectedLevel}
                  onSelectLevel={setSelectedLevel}
                />
              ) : (
                <>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Selected: {selectedLevel.name}</h3>
                        <p className="text-sm text-gray-600">{selectedLevel.description}</p>
                      </div>
                      <Button
                        onClick={() => setSelectedLevel(null)}
                        className="text-sm"
                      >
                        Change
                      </Button>
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <Card className="p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Penalty Stake Amount (tokens)
                      </label>
                      <input
                        type="text"
                        value={penaltyStake}
                        onChange={(e) => setPenaltyStake(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter stake amount"
                      />
                      <p className="mt-2 text-xs text-gray-500">
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
          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                if (isAddingMiniApp) return;
                
                setIsAddingMiniApp(true);
                setAddMiniAppMessage(null);
                
                try {
                  const result = await sdk.actions.addMiniApp();
                  if (result.added) {
                    setAddMiniAppMessage("✅ Miniapp added successfully!");
                  } else {
                    setAddMiniAppMessage("ℹ️ Miniapp was not added (user declined or already exists)");
                  }
                } catch (error: any) {
                  console.error('Add miniapp error:', error);
                  if (error?.message?.includes('domain')) {
                    setAddMiniAppMessage("⚠️ This miniapp can only be added from its official domain");
                  } else {
                    setAddMiniAppMessage("❌ Failed to add miniapp. Please try again.");
                  }
                } finally {
                  setIsAddingMiniApp(false);
                }
              }}
              disabled={isAddingMiniApp}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-blue-400"
            >
              {isAddingMiniApp ? "Adding..." : "📱 Add to Farcaster"}
            </button>
            
            {addMiniAppMessage && (
              <p className="mt-2 text-xs text-gray-600">{addMiniAppMessage}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
