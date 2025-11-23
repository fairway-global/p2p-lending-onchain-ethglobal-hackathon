'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlarmClock, Camera, Fan, Flashlight, Music2, Sparkles, Wallet } from 'lucide-react';
import IconTile from '@/components/ui/IconTile';
import MiniMetricsBars from '@/components/ui/MiniMetricsBars';
import NeoButton from '@/components/ui/NeoButton';
import NeoButtonGroup from '@/components/ui/NeoButtonGroup';
import NeoSlider from '@/components/ui/NeoSlider';
import NeomorphicCard from '@/components/ui/NeomorphicCard';
import SavingsChestProgress from '@/components/ui/SavingsChestProgress';
import SavingsGoalCard from '@/components/ui/SavingsGoalCard';
import SavingsSlashed from '@/components/ui/SavingsSlashed';
import SavingsSuccess from '@/components/ui/SavingsSuccess';
import StreakStars from '@/components/ui/StreakStars';

const containerAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function SavingsUIDemoPage() {
  const [contribution, setContribution] = useState(260);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [rangeValue, setRangeValue] = useState('week');
  const [soloSlider, setSoloSlider] = useState(55);

  const now = useMemo(() => new Date(), []);
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex min-h-screen justify-center bg-[#F5F5F7] px-4 py-10">
      <div className="w-full max-w-5xl space-y-5">
        <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
          <motion.div {...containerAnimation}>
            <NeomorphicCard className="flex flex-col gap-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-semibold text-[#16243D]">{timeString}</div>
                  <div className="text-sm text-[#4B5563]">{dateString}</div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm text-[#4B5563]">
                  <span>Auto-save</span>
                  <NeoButton size="sm" variant="secondary" iconLeft={<Wallet className="h-4 w-4" />}>
                    Deposit
                  </NeoButton>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5F7] shadow-neoInset">
                <div className="h-full w-3/4 rounded-full bg-[#FBCC5C]" />
              </div>
              <div className="flex justify-between text-xs text-[#4B5563]">
                <span>Smart streak</span>
                <span className="font-semibold text-[#16243D]">12 days</span>
              </div>
            </NeomorphicCard>
          </motion.div>

          <motion.div {...containerAnimation}>
            <NeomorphicCard className="rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#16243D]">Quick actions</span>
                <Sparkles className="h-4 w-4 text-[#FBCC5C]" />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <IconTile icon={<AlarmClock className="h-5 w-5" />} label="Reminder" />
                <IconTile icon={<Flashlight className="h-5 w-5" />} label="Boost" />
                <IconTile icon={<Camera className="h-5 w-5" />} label="Proof" />
                <IconTile icon={<Fan className="h-5 w-5" />} label="Breeze" />
              </div>
            </NeomorphicCard>
          </motion.div>
        </div>

        <motion.div {...containerAnimation}>
          <SavingsGoalCard
            title="Travel savings"
            currentAmount={contribution}
            goalAmount={1200}
            onAmountChange={setContribution}
            periodValue={period}
            onPeriodChange={(value) => setPeriod(value as typeof period)}
          />
        </motion.div>

        <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
          <motion.div {...containerAnimation}>
            <SavingsChestProgress progress={0.58} savedAmount={520} goalAmount={900} />
          </motion.div>
          <motion.div {...containerAnimation}>
            <NeomorphicCard className="flex h-full flex-col gap-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#16243D]">Payout rhythm</span>
                <NeoButtonGroup
                  value={rangeValue}
                  onChange={setRangeValue}
                  options={[
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'Week' },
                    { value: 'month', label: 'Month' },
                    { value: 'year', label: 'Year' },
                  ]}
                />
              </div>
              <NeoSlider
                min={0}
                max={100}
                step={1}
                value={soloSlider}
                onChange={setSoloSlider}
                label="Energy"
              />
              <div className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-[#4B5563] shadow-neoSoft">
                <span className="font-semibold text-[#16243D]">{soloSlider}%</span> engagement for{' '}
                {rangeValue}.
              </div>
            </NeomorphicCard>
          </motion.div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
          <motion.div {...containerAnimation}>
            <MiniMetricsBars
              items={[
                { label: 'Today', value: 82 },
                { label: 'Week', value: 64 },
                { label: 'Month', value: 92 },
                { label: 'Year', value: 76 },
              ]}
            />
          </motion.div>
          <motion.div {...containerAnimation}>
            <StreakStars
              totalDays={8}
              streakMap={[true, true, false, true, true, true, false, true]}
              className="rounded-2xl"
            />
          </motion.div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
          <motion.div {...containerAnimation}>
            <SavingsSlashed amountSlashed={45} message="Missed Tuesday autopay." />
          </motion.div>
          <motion.div {...containerAnimation}>
            <SavingsSuccess rewardAmount={125} />
          </motion.div>
        </div>

        <motion.div {...containerAnimation}>
          <NeomorphicCard className="flex flex-wrap items-center justify-between gap-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F5F7] text-[#16243D] shadow-neo">
                <Music2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#16243D]">Chill playlist</div>
                <div className="text-xs text-[#4B5563]">Ambient tunes while you save</div>
              </div>
            </div>
            <NeoButton variant="secondary">Listen</NeoButton>
          </NeomorphicCard>
        </motion.div>
      </div>
    </div>
  );
}

export default SavingsUIDemoPage;
