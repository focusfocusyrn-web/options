'use client';

import React from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { UserPlus, LogIn, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { sidebarTab, setSidebarTab } = useTerminalStore();

  // Tabs that trigger the modal overlay
  const restrictedTabs = ['profile', 'market', 'activities', 'chat', 'registration'];
  const isOpen = restrictedTabs.includes(sidebarTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#1D2232] border border-[#30374B] rounded-xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Icon Header */}
        <div className="w-12 h-12 rounded-full bg-[#2A3044] border border-[#30374B] flex items-center justify-center text-[#477EB9] mb-4 shadow">
          <Lock size={22} />
        </div>

        {/* Message Text matching reference */}
        <p className="text-sm text-[#F4F6FF] leading-relaxed mb-6 px-2">
          This section is available to registered users only. Complete account registration to start trading and earning real money.
        </p>

        {/* Action Buttons: Registration & Sign In */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          <button
            onClick={() => {
              // Placeholder for registration link/action
              alert('Registration link integration point');
            }}
            className="bg-[#2EAE49] hover:bg-[#25933c] text-white font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition active:scale-95"
          >
            <UserPlus size={16} />
            <span>Registration</span>
          </button>

          <button
            onClick={() => {
              // Placeholder for sign in link/action
              alert('Sign In link integration point');
            }}
            className="bg-[#2A3044] hover:bg-[#30374B] border border-[#30374B] text-[#F4F6FF] font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition active:scale-95"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
        </div>

        {/* Continue Demo Trading Button */}
        <button
          onClick={() => setSidebarTab('trading')}
          className="text-xs font-semibold text-[#49A6D8] hover:underline transition"
        >
          Continue demo trading
        </button>

      </div>
    </div>
  );
};