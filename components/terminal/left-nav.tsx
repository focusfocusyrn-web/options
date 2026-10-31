'use client';

import React from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { LineChart, Wallet, User, Globe, Activity, MessageSquare, HelpCircle, UserPlus, Gift } from 'lucide-react';

const navItems = [
  { id: 'trading', label: 'Trading', icon: LineChart },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'market', label: 'Market', icon: Globe },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'registration', label: 'Register', icon: UserPlus },
];

export const LeftNav: React.FC = () => {
  const { sidebarTab, setSidebarTab } = useTerminalStore();

  return (
    <aside className="w-[90px] bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col items-center py-4 justify-between select-none z-10">
      <div className="flex flex-col gap-1 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSidebarTab(item.id)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-lg transition group relative ${
                isActive ? 'bg-[#2A3044] text-[#49A6D8]' : 'text-[#91A0BD] hover:bg-[#2A3044]/50 hover:text-[#F4F6FF]'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#49A6D8]' : 'text-[#91A0BD] group-hover:text-[#F4F6FF]'} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#49A6D8] rounded-r"></div>}
            </button>
          );
        })}
      </div>

      {/* Daily Bonus Widget */}
      <div className="w-[74px] bg-[#2A3044]/60 border border-[#30374B] rounded-lg p-2 text-center flex flex-col items-center cursor-pointer hover:border-[#477EB9] transition">
        <Gift size={18} className="text-[#2EAE49] mb-1" />
        <span className="text-[9px] text-[#91A0BD] leading-tight">Daily Bonus</span>
      </div>
    </aside>
  );
};