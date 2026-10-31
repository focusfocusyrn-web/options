'use client';

import React from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { BarChart3, Radio, Users, Zap, Clock, Keyboard } from 'lucide-react';

const utilityItems = [
  { id: 'trades', label: 'Trades', icon: BarChart3 },
  { id: 'signals', label: 'Signals', icon: Radio },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'express', label: 'Express', icon: Zap },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
];

export const RightUtility: React.FC = () => {
  const { utilityTab, setUtilityTab } = useTerminalStore();

  return (
    <aside className="w-[90px] bg-[var(--sidebar-bg)] border-l border-[var(--border-color)] flex flex-col items-center py-4 select-none z-10">
      <div className="flex flex-col gap-1 w-full px-2">
        {utilityItems.map((item) => {
          const Icon = item.icon;
          const isActive = utilityTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setUtilityTab(item.id)}
              className={`flex flex-col items-center justify-center py-3 rounded-lg transition group relative ${
                isActive ? 'bg-[#2A3044] text-[#49A6D8]' : 'text-[#91A0BD] hover:bg-[#2A3044]/50 hover:text-[#F4F6FF]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && <div className="absolute right-0 top-2 bottom-2 w-1 bg-[#49A6D8] rounded-l"></div>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};