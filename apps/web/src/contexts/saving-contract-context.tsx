"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSavingContract as useSavingContractHook, Plan, SavingLevel, SAVING_LEVELS } from "@/hooks/use-saving-contract";

interface SavingContractContextType {
  createPlan: (dailyAmount: string, totalDays: number, penaltyStake: string, penaltyPercent: number) => Promise<`0x${string}`>;
  payDaily: (planId: bigint, dailyAmount: string) => Promise<`0x${string}`>;
  checkAndDeductPenalty: (planId: bigint) => Promise<`0x${string}`>;
  markFailed: (planId: bigint) => Promise<`0x${string}`>;
  withdraw: (planId: bigint) => Promise<`0x${string}`>;
  planData: Plan | undefined;
  refetchPlan: () => void;
  selectedPlanId: bigint | null;
  setSelectedPlanId: (planId: bigint | null) => void;
  createdPlanId: bigint | null;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
  isConnected: boolean;
  address: `0x${string}` | undefined;
}

const SavingContractContext = createContext<SavingContractContextType | undefined>(undefined);

export function SavingContractProvider({ children }: { children: ReactNode }) {
  const contractData = useSavingContractHook();

  return (
    <SavingContractContext.Provider value={contractData}>
      {children}
    </SavingContractContext.Provider>
  );
}

export function useSavingContract() {
  const context = useContext(SavingContractContext);
  if (context === undefined) {
    throw new Error("useSavingContract must be used within a SavingContractProvider");
  }
  return context;
}

// Re-export types and constants
export type { Plan, SavingLevel };
export { SAVING_LEVELS };

