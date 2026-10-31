'use client';

import React from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const TradesPanel: React.FC = () => {
  const { activeTab, setActiveTab, openedTrades, receipts } = useTerminalStore();

  return (
    <div className="w-full lg:w-[280px] bg-[var(--panel-bg)] border-r border-[var(--border-color)] flex flex-col select-none shrink-0 h-48 lg:h-auto">
      {/* Title */}
      <div className="hidden lg:block py-3 px-4 border-b border-[var(--border-color)] text-center font-bold text-sm text-[var(--text-primary)]">
        Trades
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-[var(--border-color)] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('opened')}
          className={`py-2 text-center transition relative ${
            activeTab === 'opened' ? 'text-[#3B82F6]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Opened ({openedTrades.length})
          {activeTab === 'opened' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]"></div>}
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`py-2 text-center transition relative ${
            activeTab === 'closed' ? 'text-[#3B82F6]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Closed ({receipts.length})
          {activeTab === 'closed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]"></div>}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-3 flex flex-col gap-2">
        {activeTab === 'opened' ? (
          openedTrades.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] py-6 lg:py-12">
              <Clock size={28} className="mb-1.5 opacity-40" />
              <p className="text-xs lg:text-sm font-medium">No opened trades</p>
            </div>
          ) : (
            openedTrades.map((trade) => {
              const timeLeft = Math.max(0, Math.ceil((trade.expiryTime - Date.now()) / 1000));
              return (
                <div key={trade.id} className="bg-[var(--app-bg)] border border-[var(--border-color)] rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">{trade.assetSymbol}</span>
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        trade.direction === 'UP' ? 'text-[#2EAE49]' : 'text-[#F3332D]'
                      }`}
                    >
                      {trade.direction === 'UP' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {trade.direction}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--text-secondary)]">
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] block">Stake</span>
                      <span className="font-bold text-[var(--text-primary)]">${trade.stake.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] block">Entry</span>
                      <span className="font-bold text-[var(--text-primary)]">{trade.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] block">Exp</span>
                      <span className="font-bold text-[#3B82F6]">{timeLeft}s</span>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : receipts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] py-6 lg:py-12">
            <p className="text-xs lg:text-sm font-medium">No closed trades</p>
          </div>
        ) : (
          receipts.map((receipt) => {
            const isWon = receipt.status === 'WON';
            const isTie = receipt.status === 'TIE';
            const tradeDate = new Date(receipt.timestamp).toLocaleTimeString();
            return (
              <div key={receipt.receiptId} className="bg-[var(--app-bg)] border border-[var(--border-color)] rounded-lg p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)]">{receipt.assetSymbol}</span>
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isWon ? 'text-[#2EAE49]' : isTie ? 'text-[var(--text-secondary)]' : 'text-[#F3332D]'
                    }`}
                  >
                    {isWon ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {receipt.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--text-secondary)]">
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] block">Stake</span>
                    <span className="font-bold text-[var(--text-primary)]">${receipt.stake.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] block">Result</span>
                    <span className={`font-bold ${isWon ? 'text-[#2EAE49]' : isTie ? 'text-[var(--text-secondary)]' : 'text-[#F3332D]'}`}>
                      {isWon ? `+$${receipt.profit.toFixed(2)}` : isTie ? `$${receipt.stake.toFixed(2)}` : `-$${receipt.stake.toFixed(2)}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] block">Time</span>
                    <span className="font-bold text-[var(--text-primary)]">{tradeDate}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                  <div>
                    <span>Entry: </span>
                    <span className="text-[var(--text-secondary)]">{receipt.entryPrice}</span>
                  </div>
                  <div>
                    <span>Settle: </span>
                    <span className="text-[var(--text-secondary)]">{receipt.settlementPrice}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};