'use client';

import React from 'react';

// Pure SVG Circular Flags for visual precision without external image assets
const FLAG_SVGS: Record<string, React.ReactNode> = {
  AUD: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#000080" />
      <path d="M0,0 L16,10 M16,0 L0,10" stroke="#FFF" strokeWidth="2" />
      <path d="M0,0 L16,10 M16,0 L0,10" stroke="#CC0000" strokeWidth="1" />
      <path d="M8,0 V10 M0,5 H16" stroke="#FFF" strokeWidth="3" />
      <path d="M8,0 V10 M0,5 H16" stroke="#CC0000" strokeWidth="1.5" />
      <circle cx="8" cy="22" r="2.5" fill="#FFF" />
      <circle cx="22" cy="8" r="1.5" fill="#FFF" />
      <circle cx="24" cy="16" r="1.5" fill="#FFF" />
      <circle cx="22" cy="24" r="1.5" fill="#FFF" />
    </svg>
  ),
  CAD: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#FF0000" />
      <rect x="9" width="14" height="32" fill="#FFF" />
      <path d="M16 8 L18 13 L21 12 L19 16 L22 18 L17 19 L18 24 L16 22 L14 24 L15 19 L10 18 L13 16 L11 12 L14 13 Z" fill="#FF0000" />
    </svg>
  ),
  USD: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#B22234" />
      <path d="M0 4h32M0 11h32M0 18h32M0 25h32" stroke="#FFF" strokeWidth="2.5" />
      <rect width="16" height="16" fill="#3C3B6E" />
      <circle cx="4" cy="4" r="0.8" fill="#FFF" />
      <circle cx="12" cy="4" r="0.8" fill="#FFF" />
      <circle cx="8" cy="8" r="0.8" fill="#FFF" />
      <circle cx="4" cy="12" r="0.8" fill="#FFF" />
      <circle cx="12" cy="12" r="0.8" fill="#FFF" />
    </svg>
  ),
  EUR: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#003399" />
      <circle cx="16" cy="16" r="10" stroke="#FFCC00" strokeWidth="1" strokeDasharray="2 3" fill="none" />
    </svg>
  ),
  GBP: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#012169" />
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#FFF" strokeWidth="4" />
      <path d="M0,0 L32,32 M32,0 L0,32" stroke="#C8102E" strokeWidth="2" />
      <path d="M16,0 V32 M0,16 H32" stroke="#FFF" strokeWidth="6" />
      <path d="M16,0 V32 M0,16 H32" stroke="#C8102E" strokeWidth="3" />
    </svg>
  ),
  JPY: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#FFF" />
      <circle cx="16" cy="16" r="9" fill="#BC002D" />
    </svg>
  ),
  // Added missing flags
  AED: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#00732F" />
      <rect width="8" height="32" fill="#FF0000" />
      <rect x="8" width="24" height="10.6" fill="#FFF" />
      <rect x="8" y="21.3" width="24" height="10.6" fill="#000" />
    </svg>
  ),
  CNY: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#DE2910" />
      <circle cx="8" cy="8" r="3" fill="#FFDE00" />
      <circle cx="14" cy="4" r="1" fill="#FFDE00" />
      <circle cx="16" cy="9" r="1" fill="#FFDE00" />
      <circle cx="14" cy="14" r="1" fill="#FFDE00" />
      <circle cx="9" cy="16" r="1" fill="#FFDE00" />
    </svg>
  ),
  BHD: (
    <svg viewBox="0 0 32 32" className="w-full h-full rounded-full">
      <rect width="32" height="32" fill="#CE1126" />
      <rect width="10" height="32" fill="#FFF" />
      <path d="M10,0 L0,10 L10,10 Z M10,32 L0,22 L10,22 Z" fill="#CE1126" />
      <path d="M0,10 L10,10 L10,22 L0,22 Z" fill="#FFF" />
    </svg>
  ),
  BTC: (
    <div className="w-full h-full rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-[11px]">
      ₿
    </div>
  ),
  GOLD: (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFE259] to-[#FFA751] flex items-center justify-center text-[#171A2B] font-bold text-[10px]">
      Au
    </div>
  ),
};

interface AssetFlagProps {
  symbol: string;
  size?: 'sm' | 'md';
}

export const AssetFlag: React.FC<AssetFlagProps> = ({ symbol, size = 'md' }) => {
  const parts = symbol.replace(' OTC', '').split('/');
  const base = parts[0] || symbol;
  const quote = parts[1];

  const dimensions = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  if (quote) {
    return (
      <div className="relative flex items-center w-8 h-6">
        <div className={`absolute left-0 z-10 ${dimensions} rounded-full border border-[#202536] overflow-hidden shadow`}>
          {FLAG_SVGS[base] || <div className="bg-[#477EB9] w-full h-full" />}
        </div>
        <div className={`absolute left-3.5 z-0 ${dimensions} rounded-full border border-[#202536] overflow-hidden shadow`}>
          {FLAG_SVGS[quote] || <div className="bg-[#2EAE49] w-full h-full" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`${dimensions} rounded-full border border-[#202536] overflow-hidden shadow`}>
      {FLAG_SVGS[base] || <div className="bg-[#477EB9] w-full h-full" />}
    </div>
  );
};