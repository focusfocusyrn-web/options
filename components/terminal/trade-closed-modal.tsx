'use client';

import React from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import TradeInvoice from './TradeInvoice';

export const TradeClosedModal: React.FC = () => {
  const { latestClosedTrade, clearLatestClosedTrade, setActiveTab } = useTerminalStore();

  // If no trade has closed, hide the modal
  if (!latestClosedTrade) return null;

  const trade = latestClosedTrade;
  
  const isWin = trade.status === 'WON';
  const profitAmount =
    trade.profit !== undefined
      ? trade.profit
      : isWin
      ? Number((trade.stake * (trade.payoutRate / 100)).toFixed(2))
      : -trade.stake;

  const durationSec = Math.max(1, Math.round((trade.expiryTime - trade.entryTime) / 1000));
  const baseCurrency = trade.assetSymbol.split('/')[0] || 'USD';

  return (
    <TradeInvoice
      asset={trade.assetSymbol}
      base={baseCurrency}
      amount={trade.stake}
      profit={profitAmount}
      direction={trade.direction}
      duration={durationSec}
      entryPrice={trade.entryPrice.toString()}
      exitPrice={(trade.settlementPrice || trade.currentPrice).toString()}
      status={trade.status}
      onClose={clearLatestClosedTrade}
      onNewTrade={clearLatestClosedTrade}
      onViewTrades={() => {
        clearLatestClosedTrade();
        setActiveTab('closed'); // Jumps to the closed trades tab in the panel
      }}
    />
  );
};

export default TradeClosedModal;