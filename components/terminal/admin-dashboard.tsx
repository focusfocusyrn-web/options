'use client';

import React, { useState } from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Lock,
  X,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UserCheck,
} from 'lucide-react';

export const AdminDashboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    balance,
    adjustBalance,
    setBalance,
    marketControls,
    updateMarketControls,
    openedTrades,
    forceSettleTrade,
    clearTradeHistory,
    receipts,
    resetDemo,
  } = useTerminalStore();

  const [activeTab, setActiveTab] = useState<'market' | 'trades' | 'wallet' | 'receipts'>('market');
  const [customBalanceInput, setCustomBalanceInput] = useState('');
  const [balanceAdjustmentInput, setBalanceAdjustmentInput] = useState('1000');

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#121622] border border-[#2B3348] rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden text-[#F4F6FF]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B3348] bg-[#171C2B]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F3332D]/20 border border-[#F3332D]/40 rounded-xl text-[#F3332D]">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                ADMIN CONTROL CENTER
                <span className="text-[10px] bg-[#2EAE49]/20 text-[#2EAE49] px-2 py-0.5 rounded-full border border-[#2EAE49]/30">
                  LIVE OVERRIDE
                </span>
              </h2>
              <p className="text-xs text-[#68758F]">
                Market manipulation, risk parameters & user balance controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#68758F] hover:text-white hover:bg-[#202536] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex border-b border-[#2B3348] bg-[#141824] px-6 gap-2">
          {[
            { id: 'market', label: 'Market Controls', icon: Sliders },
            { id: 'trades', label: `Active Positions (${openedTrades.length})`, icon: TrendingUp },
            { id: 'wallet', label: 'Balance & Funds', icon: DollarSign },
            { id: 'receipts', label: `Receipts (${receipts.length})`, icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
                  isActive
                    ? 'border-[#477EB9] text-[#477EB9] bg-[#1E2538]/50'
                    : 'border-transparent text-[#68758F] hover:text-[#91A0BD]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: MARKET CONTROLS */}
          {activeTab === 'market' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rigging Mode */}
              <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                    Trade Rigging Mode
                  </h3>
                  <span className="text-[10px] text-[#68758F]">Forces outcome on expiry</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NEUTRAL', label: 'Neutral', color: 'bg-[#202536] text-white border-[#30374B]' },
                    { id: 'ALWAYS_WIN', label: 'Force Win', color: 'bg-[#2EAE49]/20 text-[#2EAE49] border-[#2EAE49]/50' },
                    { id: 'ALWAYS_LOSE', label: 'Force Loss', color: 'bg-[#F3332D]/20 text-[#F3332D] border-[#F3332D]/50' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateMarketControls({ rigMode: mode.id as any })}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        marketControls.rigMode === mode.id
                          ? `${mode.color} ring-2 ring-white/20 shadow-lg`
                          : 'bg-[#121622] border-[#252B3D] text-[#68758F] hover:text-white'
                      }`}
                    >
                      {mode.id === 'ALWAYS_WIN' && <TrendingUp size={16} />}
                      {mode.id === 'ALWAYS_LOSE' && <TrendingDown size={16} />}
                      {mode.id === 'NEUTRAL' && <Sliders size={16} />}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Pause & Reset */}
              <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                  Engine Status & Simulation Reset
                </h3>

                <div className="flex items-center justify-between bg-[#121622] p-3 rounded-xl border border-[#252B3D]">
                  <div className="flex items-center gap-2">
                    {marketControls.isPaused ? (
                      <Pause className="text-[#E2B93B]" size={18} />
                    ) : (
                      <Play className="text-[#2EAE49]" size={18} />
                    )}
                    <span className="text-xs font-bold">
                      {marketControls.isPaused ? 'Engine Paused' : 'Engine Running'}
                    </span>
                  </div>
                  <button
                    onClick={() => updateMarketControls({ isPaused: !marketControls.isPaused })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      marketControls.isPaused
                        ? 'bg-[#2EAE49] text-white'
                        : 'bg-[#E2B93B] text-black'
                    }`}
                  >
                    {marketControls.isPaused ? 'Resume' : 'Pause Engine'}
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={resetDemo}
                    className="flex-1 bg-[#202536] hover:bg-[#2B3348] border border-[#30374B] text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Reset Terminal Demo
                  </button>
                  <button
                    onClick={clearTradeHistory}
                    className="flex-1 bg-[#202536] hover:bg-[#2B3348] border border-[#30374B] text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-[#F3332D]"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE TRADES OVERRIDE */}
          {activeTab === 'trades' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                  Live Positions Direct Force Override
                </h3>
              </div>

              {openedTrades.length === 0 ? (
                <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl p-8 text-center text-[#68758F] text-xs font-medium">
                  No open trades available to override. Open a trade in the terminal to manipulate it here.
                </div>
              ) : (
                <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#121622] text-[#68758F] border-b border-[#2B3348]">
                        <th className="p-3">Asset</th>
                        <th className="p-3">Direction</th>
                        <th className="p-3">Stake</th>
                        <th className="p-3">Entry Price</th>
                        <th className="p-3">Expiry In</th>
                        <th className="p-3 text-right">Force Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252B3D]">
                      {openedTrades.map((t) => {
                        const secondsLeft = Math.max(0, Math.ceil((t.expiryTime - Date.now()) / 1000));
                        return (
                          <tr key={t.id} className="hover:bg-[#1E2538]/50 transition">
                            <td className="p-3 font-bold">{t.assetSymbol}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.direction === 'UP' ? 'bg-[#2EAE49]/20 text-[#2EAE49]' : 'bg-[#F3332D]/20 text-[#F3332D]'
                                }`}
                              >
                                {t.direction}
                              </span>
                            </td>
                            <td className="p-3 font-semibold">${t.stake.toFixed(2)}</td>
                            <td className="p-3 font-mono">{t.entryPrice}</td>
                            <td className="p-3 font-mono text-[#E2B93B]">{secondsLeft}s</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => forceSettleTrade(t.id, 'WON')}
                                  className="bg-[#2EAE49] hover:bg-[#25933c] text-white px-3 py-1 rounded font-bold text-[11px] transition shadow"
                                >
                                  Force WIN
                                </button>
                                <button
                                  onClick={() => forceSettleTrade(t.id, 'LOST')}
                                  className="bg-[#F3332D] hover:bg-[#d02722] text-white px-3 py-1 rounded font-bold text-[11px] transition shadow"
                                >
                                  Force LOSS
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WALLET CONTROLS */}
          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                  Current Balance
                </h3>
                <div className="bg-[#121622] border border-[#2B3348] rounded-xl p-4 flex items-center justify-between">
                  <span className="text-xs text-[#68758F]">Account Equity</span>
                  <span className="text-2xl font-black text-[#2EAE49] font-mono">
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-semibold text-[#91A0BD]">
                    Quick Adjust Amount ($)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={balanceAdjustmentInput}
                      onChange={(e) => setBalanceAdjustmentInput(e.target.value)}
                      className="flex-1 bg-[#121622] border border-[#2B3348] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#477EB9]"
                    />
                    <button
                      onClick={() => adjustBalance(Number(balanceAdjustmentInput) || 0, 'ADD')}
                      className="bg-[#2EAE49] hover:bg-[#25933c] text-white font-bold text-xs px-4 rounded-xl transition"
                    >
                      + Deposit
                    </button>
                    <button
                      onClick={() => adjustBalance(Number(balanceAdjustmentInput) || 0, 'SUBTRACT')}
                      className="bg-[#F3332D] hover:bg-[#d02722] text-white font-bold text-xs px-4 rounded-xl transition"
                    >
                      - Deduct
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                  Set Exact Balance
                </h3>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#91A0BD]">
                    Override Total Balance ($)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 100000"
                      value={customBalanceInput}
                      onChange={(e) => setCustomBalanceInput(e.target.value)}
                      className="flex-1 bg-[#121622] border border-[#2B3348] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#477EB9]"
                    />
                    <button
                      onClick={() => {
                        if (customBalanceInput) setBalance(Number(customBalanceInput));
                      }}
                      className="bg-[#477EB9] hover:bg-[#3b699a] text-white font-bold text-xs px-4 rounded-xl transition"
                    >
                      Set Balance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRADE RECEIPTS & EDITABLE INVOICE GENERATOR */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#91A0BD] uppercase tracking-wider">
                  Receipt Registry & Invoice Editor
                </h3>
                <span className="text-[10px] text-[#68758F]">
                  Admins can edit any trade receipt parameters prior to downloading or printing
                </span>
              </div>

              <div className="bg-[#181D2D] border border-[#2B3348] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#121622] text-[#68758F] border-b border-[#2B3348]">
                      <th className="p-3">Receipt ID</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3">Outcome</th>
                      <th className="p-3">Stake</th>
                      <th className="p-3">Entry/Exit</th>
                      <th className="p-3">Profit</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3D]">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-[#68758F]">
                          No completed trade receipts generated yet.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((r) => (
                        <tr key={r.receiptId} className="hover:bg-[#1E2538]/50 transition">
                          <td className="p-3 font-mono font-bold text-[#477EB9]">{r.receiptId}</td>
                          <td className="p-3 font-bold">{r.assetSymbol}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'WON'
                                  ? 'bg-[#2EAE49]/20 text-[#2EAE49]'
                                  : 'bg-[#F3332D]/20 text-[#F3332D]'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">${r.stake.toFixed(2)}</td>
                          <td className="p-3 font-mono text-[11px]">
                            {r.entryPrice} → {r.settlementPrice}
                          </td>
                          <td className={`p-3 font-bold ${r.profit >= 0 ? 'text-[#2EAE49]' : 'text-[#F3332D]'}`}>
                            {r.profit >= 0 ? `+$${r.profit.toFixed(2)}` : `-$${Math.abs(r.profit).toFixed(2)}`}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const text = `NOVA INVOICE RECEIPT\n---------------------\nReceipt ID: ${r.receiptId}\nAsset: ${r.assetSymbol}\nResult: ${r.status}\nStake: $${r.stake}\nProfit: $${r.profit}\nTx Hash: ${r.transactionHash}`;
                                  const blob = new Blob([text], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.download = `Invoice_${r.receiptId}.txt`;
                                  a.href = url;
                                  a.click();
                                }}
                                className="bg-[#202536] hover:bg-[#2B3348] border border-[#30374B] px-2.5 py-1 rounded text-[10px] font-bold text-white transition flex items-center gap-1"
                              >
                                Export PNG/TXT
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};