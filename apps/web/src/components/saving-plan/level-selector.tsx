"use client";

import { SavingLevel } from "@/hooks/use-saving-contract";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Trophy } from "lucide-react";

interface LevelSelectorProps {
  levels: SavingLevel[];
  selectedLevel: SavingLevel | null;
  onSelectLevel: (level: SavingLevel) => void;
}

const levelMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  Beginner: { label: "Ready to Rock It", icon: <Zap className="h-5 w-5 text-[#FBCC5C]" /> },
  Intermediate: { label: "Got Some Belts", icon: <ShieldCheck className="h-5 w-5 text-[#FBCC5C]" /> },
  Hard: { label: "Go Big or Go Home", icon: <Trophy className="h-5 w-5 text-[#FBCC5C]" /> },
};

export function LevelSelector({ levels, selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {levels.map((level, index) => {
          const isSelected = selectedLevel?.name === level.name;
          const meta = levelMeta[level.name] ?? { label: level.name, icon: null };
          const bullet = `Days: ${level.minDays}-${level.maxDays} · $${level.minDailyAmount}-$${level.maxDailyAmount} daily · Penalty ${level.penaltyPercent}%`;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all rounded-[18px] ${
                  isSelected
                    ? "bg-[#FBCC5C] shadow-neoInset"
                    : "bg-[#F5F5F7] shadow-neo hover:shadow-neoSoft"
                } border border-white/70`}
                onClick={() => onSelectLevel(level)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                        isSelected ? "bg-[#F5F5F7] shadow-neo" : "bg-white/70 shadow-neoSoft"
                      }`}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#4B5563]">{level.name}</p>
                      <h3 className="text-lg font-semibold text-[#16243D]">{meta.label}</h3>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="rounded-full bg-[#16243D] px-3 py-1 text-xs font-semibold text-[#FBCC5C] shadow-neo">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[#16243D]">{bullet}</p>
                <p className="mt-1 text-xs text-[#4B5563]">
                  Missed streaks slash your stake—keep the streak alive.
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
