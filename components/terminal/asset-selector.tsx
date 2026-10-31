'use client';

import React, { useState } from 'react';
import { Asset, useTerminalStore } from '@/lib/store/terminal-store';
import { AssetFlag } from './asset-flag';
import { Search, Star, DollarSign, Bitcoin, Droplet, BarChart3, PieChart, Calendar, Info } from 'lucide-react';

export const POCKET_ASSETS: (Asset & { isOtc?: boolean })[] = [
  { symbol: 'AUD/CAD OTC', name: 'AUD/CAD OTC', category: 'Forex', payout: 92, basePrice: 1.01600, decimals: 5, isOtc: true },
  { symbol: 'AED/CNY OTC', name: 'AED/CNY OTC', category: 'Forex', payout: 92, basePrice: 1.91200, decimals: 5, isOtc: true },
  { symbol: 'BHD/CNY OTC', name: 'BHD/CNY OTC', category: 'Forex', payout: 92, basePrice: 18.6500, decimals: 4, isOtc: true },
  { symbol: 'CAD/CHF', name: 'CAD/CHF', category: 'Forex', payout: 92, basePrice: 0.64320, decimals: 5 },
  { symbol: 'CAD/CHF OTC', name: 'CAD/CHF OTC', category: 'Forex', payout: 92, basePrice: 0.64320, decimals: 5, isOtc: true },
  { symbol: 'CAD/JPY OTC', name: 'CAD/JPY OTC', category: 'Forex', payout: 92, basePrice: 111.450, decimals: 3, isOtc: true },
  { symbol: 'EUR/CHF OTC', name: 'EUR/CHF OTC', category: 'Forex', payout: 92, basePrice: 0.95620, decimals: 5, isOtc: true },
  { symbol: 'EUR/GBP OTC', name: 'EUR/GBP OTC', category: 'Forex', payout: 92, basePrice: 0.85410, decimals: 5, isOtc: true },
  { symbol: 'EUR/USD OTC', name: 'EUR/USD OTC', category: 'Forex', payout: 92, basePrice: 1.08450, decimals: 5, isOtc: true },
  { symbol: 'BTC/USD', name: 'BTC/USD', category: 'Crypto', payout: 85, basePrice: 64250.00, decimals: 2 },
  { symbol: 'GOLD OTC', name: 'GOLD OTC', category: 'Commodities', payout: 91, basePrice: 2335.20, decimals: 2, isOtc: true },
];

const categories = [
  { id: 'Forex', label: 'Currencies', icon: DollarSign },
  { id: 'Crypto', label: 'Cryptocurrencies', icon: Bitcoin },
  { id: 'Commodities', label: 'Commodities', icon: Droplet },
  { id: 'Stocks', label: 'Stocks', icon: BarChart3 },
  { id: 'Indices', label: 'Indices', icon: PieChart },
  { id: 'Favorites', label: 'Favorites', icon: Star },
  { id: 'Schedule', label: 'Schedule', icon: Calendar },
];

interface AssetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({ isOpen, onClose }) => {
  const { activeAsset, setActiveAsset } = useTerminalStore();
  const [selectedCat, setSelectedCat] = useState('Forex');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['AUD/CAD OTC']);

  if (!isOpen) return null;

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const filteredAssets = POCKET_ASSETS.filter((asset) => {
    const matchesSearch = asset.symbol.toLowerCase().includes(search.toLowerCase());
    if (selectedCat === 'Favorites') return favorites.includes(asset.symbol) && matchesSearch;
    if (selectedCat === 'Schedule') return matchesSearch;
    return asset.category === selectedCat && matchesSearch;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1D2232] border border-[#30374B] rounded-xl w-[580px] h-[480px] flex overflow-hidden shadow-2xl relative"
      >
        {/* Left Sub-Navigation Rail */}
        <div className="w-[180px] bg-[#171A2B] border-r border-[#30374B] flex flex-col p-2 justify-between select-none">
          <div className="flex flex-col gap-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#2A3044] text-[#477EB9] border border-[#3D6C9D]/40'
                      : 'text-[#91A0BD] hover:bg-[#202536] hover:text-[#F4F6FF]'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-[#477EB9]' : 'text-[#68758F]'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Info Widget */}
          <div className="bg-[#1D2030] border border-[#2A3044] rounded-lg p-2 text-[10px] text-[#68758F] flex items-start gap-1.5 leading-tight">
            <Info size={14} className="text-[#477EB9] shrink-0 mt-0.5" />
            <span>OTC quotes are provided directly by market makers.</span>
          </div>
        </div>

        {/* Right Asset List Area */}
        <div className="flex-1 flex flex-col bg-[#1D2232]">
          {/* Top Search Input */}
          <div className="p-3 border-b border-[#30374B]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#171A2B] border border-[#30374B] rounded-lg pl-3 pr-8 py-1.5 text-xs text-[#F4F6FF] placeholder-[#68758F] focus:outline-none focus:border-[#477EB9]"
              />
              <Search size={14} className="absolute right-3 top-2 text-[#68758F]" />
            </div>
          </div>

          {/* Table Header */}
          <div className="flex justify-between px-4 py-2 border-b border-[#30374B] text-[11px] font-semibold text-[#68758F]">
            <span>Asset</span>
            <span>Payout ▼</span>
          </div>

          {/* Assets Scroll View */}
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {filteredAssets.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#68758F]">No assets found</div>
            ) : (
              filteredAssets.map((asset) => {
                const isFav = favorites.includes(asset.symbol);
                const isActive = activeAsset.symbol === asset.symbol;
                return (
                  <div
                    key={asset.symbol}
                    onClick={() => {
                      setActiveAsset(asset);
                      onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition text-xs ${
                      isActive
                        ? 'bg-[#2A3044] text-white border-l-2 border-[#477EB9]'
                        : 'hover:bg-[#202536] text-[#F4F6FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => toggleFavorite(e, asset.symbol)}
                        className="text-[#68758F] hover:text-[#FFC107] transition"
                      >
                        <Star size={14} fill={isFav ? '#FFC107' : 'none'} className={isFav ? 'text-[#FFC107]' : ''} />
                      </button>
                      <AssetFlag symbol={asset.symbol} />
                      <span className="font-semibold tracking-wide ml-1">{asset.symbol}</span>
                    </div>
                    <span className="font-bold text-[#2EAE49] text-xs">+{asset.payout}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};