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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Challenge Level</h2>
      <div className="grid gap-4">
        {levels.map((level, index) => (
          <Card
            key={index}
            className={`p-6 cursor-pointer transition-all ${
              selectedLevel?.name === level.name
                ? "ring-2 ring-blue-600 bg-blue-50"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectLevel(level)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{level.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-700">
                    <strong>Daily:</strong> {level.dailyAmount} tokens
                  </span>
                  <span className="text-gray-700">
                    <strong>Duration:</strong> {level.totalDays} days
                  </span>
                </div>
              </div>
              {selectedLevel?.name === level.name && (
                <div className="text-blue-600 text-2xl">✓</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

