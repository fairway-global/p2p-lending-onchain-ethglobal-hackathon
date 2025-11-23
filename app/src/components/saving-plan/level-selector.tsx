"use client";

import { SavingLevel } from "@/hooks/use-saving-contract";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LevelSelectorProps {
  levels: SavingLevel[];
  selectedLevel: SavingLevel | null;
  onSelectLevel: (level: SavingLevel) => void;
}

export function LevelSelector({ levels, selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-h2 font-alpina text-black mb-6">Choose Your Challenge Level</h2>
      <div className="grid gap-4">
        {levels.map((level, index) => {
          const isSelected = selectedLevel?.name === level.name;
          const bgColor = isSelected ? "bg-celo-yellow" : "bg-celo-dark-tan";
          const borderColor = isSelected ? "border-celo-purple" : "border-black";
          
          return (
            <Card
              key={index}
              className={`p-6 cursor-pointer transition-all border-2 ${bgColor} ${borderColor} hover:border-celo-purple`}
              onClick={() => onSelectLevel(level)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-h4 font-alpina text-black mb-2">{level.name}</h3>
                  <p className="text-body-s text-celo-body-copy mb-3">{level.description}</p>
                  <div className="flex flex-wrap gap-4 text-body-s">
                    <span className="text-black font-bold">
                      Days: {level.minDays}-{level.maxDays}
                    </span>
                    <span className="text-black font-bold">
                      Daily: ${level.minDailyAmount}-${level.maxDailyAmount}
                    </span>
                    <span className="text-celo-error font-bold">
                      Penalty: {level.penaltyPercent}% of daily
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-8 h-8 border-2 border-black bg-celo-purple text-white flex items-center justify-center font-bold text-body-m">
                    ✓
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
