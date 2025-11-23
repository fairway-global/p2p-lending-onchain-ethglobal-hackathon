'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type NeoSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValueBubble?: boolean;
  className?: string;
};

function NeoSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValueBubble = true,
  className,
}: NeoSliderProps) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-2 flex items-center justify-between text-xs text-[#4B5563]">
          <span>{label}</span>
          <span className="font-semibold text-[#16243D]">{clampedValue.toLocaleString()}</span>
        </div>
      )}
      <div className="relative h-10 w-full">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#F5F5F7] shadow-neoInset" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#FBCC5C]"
          style={{ width: `${percentage}%` }}
        />
        {showValueBubble && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="absolute -top-4 rounded-full bg-[#FBCC5C] px-2 py-1 text-[11px] font-semibold text-[#16243D] shadow-neo"
            style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
          >
            {clampedValue}
          </motion.div>
        )}
        <motion.div
          className="absolute top-1/2 flex h-8 w-8 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#FBCC5C] shadow-neo"
          style={{ left: `${percentage}%` }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="sr-only">Slider thumb</span>
        </motion.div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[#9CA3AF]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export { NeoSlider };
export default NeoSlider;
