'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type NeoButtonGroupProps = {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function NeoButtonGroup({ options, value, onChange, className }: NeoButtonGroupProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1 shadow-neoInset',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <motion.button
            key={option.value}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              active
                ? 'text-[#16243D]'
                : 'text-[#4B5563] hover:text-[#16243D] focus-visible:outline-none',
            )}
          >
            {active && (
              <motion.span
                layoutId="neo-button-group"
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute inset-0 z-[-1] rounded-full bg-[#FBCC5C] shadow-neo"
              />
            )}
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export { NeoButtonGroup };
export default NeoButtonGroup;
