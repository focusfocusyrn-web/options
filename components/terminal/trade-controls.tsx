'use client';

import React from 'react';
import { useTerminalStore, executeTrade } from '@/lib/store/terminal-store';
import { Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export const TradeControls: React.FC<{ currentPrice: number }> = ({ currentPrice }) => {
  const { durationSeconds, setDurationSeconds, investment, setInvestment, activeAsset, balance } = useTerminalStore();

  const durations = [5, 15, 30, 60, 300];
  const amounts = [5, 10, 25, 50, 100];

  const potentialProfit = Number((investment * (activeAsset.payout / 100)).toFixed(2));

  return (
    <div className="w-full lg:w-[150px] bg-[var(--panel-bg)] border-t lg:border-t-0 lg:border-r border-[var(--border-color)] flex flex-row lg:flex-col p-3 justify-between select-none shrink-0 gap-3 lg:gap-0">
      <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 flex-1">
        {/* Time */}
        <div className="flex-1 lg:flex-none">
          <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold flex items-center gap-1 mb-1">
            <Clock size={12} /> Time
          </label>
          <div className="flex items-center bg-[var(--app-bg)] border border-[var(--border-color)] rounded px-2 py-1">
            <input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Math.max(5, Number(e.target.value)))}
              className="w-full bg-transparent text-xs lg:text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            />
            <span className="text-xs text-[var(--text-secondary)]">s</span>
          </div>
          <div className="hidden lg:grid grid-cols-5 gap-1 mt-1.5">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDurationSeconds(d)}
                className={`text-[10px] py-1 rounded transition font-medium ${
                  durationSeconds === d ? 'bg-[#3B82F6] text-white' : 'bg-[#1C1F2B] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {d >= 60 ? `${d / 60}m` : `${d}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Investment */}
        <div className="flex-1 lg:flex-none">
          <label className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold flex items-center gap-1 mb-1">
            <DollarSign size={12} /> Investment
          </label>
          <div className="flex items-center bg-[var(--app-bg)] border border-[var(--border-color)] rounded px-2 py-1">
            <span className="text-xs text-[var(--text-secondary)] mr-1">$</span>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Math.max(1, Number(e.target.value)))}
              className="w-full bg-transparent text-xs lg:text-sm font-bold text-[var(--text-primary)] focus:outline-none"
            />
          </div>
          <div className="hidden lg:grid grid-cols-5 gap-1 mt-1.5">
            {amounts.map((a) => (
              <button
                key={a}
                onClick={() => setInvestment(a)}
                className={`text-[10px] py-1 rounded transition font-medium ${
                  investment === a ? 'bg-[#3B82F6] text-white' : 'bg-[#1C1F2B] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
        </div>

        {/* Payout */}
        <div className="hidden lg:block bg-[var(--app-bg)] border border-[var(--border-color)] rounded p-2 text-xs">
          <div className="flex justify-between text-[var(--text-secondary)] mb-1">
            <span>Payout:</span>
            <span className="font-bold text-[#2EAE49]">+{activeAsset.payout}%</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Profit:</span>
            <span className="font-bold text-[var(--text-primary)]">+${potentialProfit.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
        <button
          onClick={() => executeTrade('UP', currentPrice)}
          disabled={balance < investment}
          className="flex-1 lg:flex-none h-10 lg:h-12 bg-[#2EAE49] hover:bg-[#25933c] disabled:opacity-50 text-white font-bold rounded flex flex-col items-center justify-center shadow-lg transition active:scale-95"
        >
          <div className="flex items-center gap-1 text-xs lg:text-sm">
            <TrendingUp size={15} /> HIGHER
          </div>
          <span className="text-[9px] lg:text-[10px] opacity-90">+${potentialProfit.toFixed(2)}</span>
        </button>

        <button
          onClick={() => executeTrade('DOWN', currentPrice)}
          disabled={balance < investment}
          className="flex-1 lg:flex-none h-10 lg:h-12 bg-[#F3332D] hover:bg-[#d42a25] disabled:opacity-50 text-white font-bold rounded flex flex-col items-center justify-center shadow-lg transition active:scale-95"
        >
          <div className="flex items-center gap-1 text-xs lg:text-sm">
            <TrendingDown size={15} /> LOWER
          </div>
          <span className="text-[9px] lg:text-[10px] opacity-90">+${potentialProfit.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};