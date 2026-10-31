'use client';

import React from 'react';
import Image from 'next/image';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { RotateCcw, User, Star, Gift, Wallet } from 'lucide-react';

export const Header: React.FC = () => {
  const { balance, resetDemo } = useTerminalStore();

  return (
    <header className="h-[var(--header-height)] bg-[#1D2030] border-b border-[#30374B] flex items-center justify-between px-4 z-20 select-none">
      {/* Brand Logo & Favorite Star */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Logo image (file lives at public/nova-logo.png) */}
<Image
  src="/icon.png"
  alt="NOVA"
  width={140}
  height={120}
  className="w-[140px] h-auto object-contain"
  priority
/>
          
        </div>
        <button title="Favorite Platform" className="text-[#68758F] hover:text-[#FFC107] transition ml-1">
          <Star size={16} />
        </button>
      </div>

      {/* Center Promotional Widget */}
      <div className="hidden lg:flex items-center gap-3 bg-[#202536] border border-[#30374B] rounded-lg px-3 py-1.5 text-xs shadow-inner">
        <div className="w-6 h-6 rounded bg-[#477EB9]/20 flex items-center justify-center text-[#477EB9]">
          <Gift size={15} />
        </div>
        <div className="leading-tight">
          <span className="font-bold text-[#F4F6FF] text-[11px] block">GET 50% BONUS</span>
          <span className="text-[9px] text-[#91A0BD]">Educational Trading Simulator</span>
        </div>
      </div>

      {/* Right Balance, Top Up & Profile */}
      <div className="flex items-center gap-3">
        {/* Account Selector */}
        <div className="bg-[#202536] border border-[#30374B] rounded-lg px-3 py-1 flex items-center gap-3">
          <div>
            <span className="text-[9px] text-[#91A0BD] uppercase font-bold block leading-none">
              QT DEMO • USD
            </span>
            <span className="text-sm font-extrabold text-[#F4F6FF] tracking-wide">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset demo balance to $50,000.00?')) {
                resetDemo();
              }
            }}
            title="Reset Demo Balance"
            className="p-1 bg-[#2A3044] hover:bg-[#30374B] text-[#91A0BD] hover:text-white rounded transition"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Top Up Button */}
        <button className="bg-[#2EAE49] hover:bg-[#25933c] text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition active:scale-95">
          <Wallet size={14} />
          <span>TOP UP</span>
        </button>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#2A3044] border border-[#30374B] flex items-center justify-center text-[#F4F6FF] cursor-pointer hover:border-[#477EB9] transition">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};