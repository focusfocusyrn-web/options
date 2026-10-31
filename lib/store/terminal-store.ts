import { create } from 'zustand';

export interface Asset {
  symbol: string;
  name: string;
  category: 'Forex' | 'Crypto' | 'Commodities' | 'Stocks';
  payout: number;
  basePrice: number;
  decimals: number;
}

export interface TradeReceipt {
  receiptId: string;
  tradeId: string;
  timestamp: number;
  assetSymbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  settlementPrice: number;
  profit: number;
  payoutRate: number;
  status: 'WON' | 'LOST' | 'TIE';
  clientIp?: string;
  transactionHash: string;
}

export interface TradePosition {
  id: string;
  assetSymbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: number;
  expiryTime: number;
  payoutRate: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'TIE';
  settlementPrice?: number;
  profit?: number;
  receipt?: TradeReceipt;
}

export interface MarketControlSettings {
  rigMode: 'NEUTRAL' | 'ALWAYS_WIN' | 'ALWAYS_LOSE';
  priceBiasPercent: number;
  volatilityMultiplier: number;
  isPaused: boolean;
}

export const AVAILABLE_ASSETS: Asset[] = [
  { symbol: 'AUD/USD', name: 'AUD/USD', category: 'Forex', payout: 92, basePrice: 0.64976, decimals: 5 },
  { symbol: 'EUR/USD', name: 'EUR/USD', category: 'Forex', payout: 92, basePrice: 1.08450, decimals: 5 },
  { symbol: 'GBP/USD', name: 'GBP/USD', category: 'Forex', payout: 89, basePrice: 1.26520, decimals: 5 },
  { symbol: 'USD/JPY', name: 'USD/JPY', category: 'Forex', payout: 90, basePrice: 154.800, decimals: 3 },
  { symbol: 'BTC/USD', name: 'BTC/USD', category: 'Crypto', payout: 85, basePrice: 64250.00, decimals: 2 },
];

interface TerminalState {
  balance: number;
  activeAsset: Asset;
  durationSeconds: number;
  investment: number;
  activeTab: 'opened' | 'closed';
  sidebarTab: string;
  utilityTab: string;
  openedTrades: TradePosition[];
  closedTrades: TradePosition[];
  latestClosedTrade: TradePosition | null;
  receipts: TradeReceipt[];
  marketControls: MarketControlSettings;

  setBalance: (balance: number) => void;
  adjustBalance: (amount: number, type: 'ADD' | 'SUBTRACT') => void;
  setActiveAsset: (asset: Asset) => void;
  setDurationSeconds: (seconds: number) => void;
  setInvestment: (amount: number) => void;
  setActiveTab: (tab: 'opened' | 'closed') => void;
  setSidebarTab: (tab: string) => void;
  setUtilityTab: (tab: string) => void;
  clearLatestClosedTrade: () => void;
  updateMarketControls: (settings: Partial<MarketControlSettings>) => void;
  forceSettleTrade: (tradeId: string, outcome: 'WON' | 'LOST') => void;
  clearTradeHistory: () => void;
  settleTrades: (currentPrices: Record<string, number>, forcedTrend?: string) => void;
  resetDemo: () => void;
}

// ⬅️ CHANGED: append-only ledger. Never writes a snapshot.
//    amount is SIGNED: +topup / -stake / +payout / +refund
const appendLedger = async (
  amount: number,
  type: string,
  referenceId?: string
) => {
  if (!amount) return;
  try {
    await fetch('/api/wallet/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, type, referenceId }),
    });
  } catch (err) {
    console.error('Ledger append failed:', err);
  }
};

const createReceiptForTrade = (trade: TradePosition, settlementPrice: number, profit: number, status: 'WON' | 'LOST' | 'TIE'): TradeReceipt => {
  const hashString = `${trade.id}-${trade.entryTime}-${trade.stake}-${settlementPrice}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    hash = (hash << 5) - hash + hashString.charCodeAt(i);
    hash |= 0;
  }

  return {
    receiptId: `RCT-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    tradeId: trade.id,
    timestamp: Date.now(),
    assetSymbol: trade.assetSymbol,
    direction: trade.direction,
    stake: trade.stake,
    entryPrice: trade.entryPrice,
    settlementPrice,
    profit,
    payoutRate: trade.payoutRate,
    status,
    transactionHash: `0x${Math.abs(hash).toString(16).padStart(16, '0')}${Math.random().toString(16).substring(2, 10)}`,
  };
};

const saveInvoiceToCloud = async (receipt: TradeReceipt) => {
  try {
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receipt),
    });
  } catch (err) {
    console.error('Failed to sync invoice to cloud:', err);
  }
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  balance: 50000.00,
  activeAsset: AVAILABLE_ASSETS[0],
  durationSeconds: 30,
  investment: 100.00,
  activeTab: 'opened',
  sidebarTab: 'trading',
  utilityTab: 'trades',
  openedTrades: [],
  closedTrades: [],
  latestClosedTrade: null,
  receipts: [],

  marketControls: {
    rigMode: 'NEUTRAL',
    priceBiasPercent: 0,
    volatilityMultiplier: 1.0,
    isPaused: false,
  },

  // ⬅️ CHANGED: "set absolute" becomes "append a correcting delta".
  //    The server's SUM() is the source of truth; this just records the move.
  setBalance: (target) => {
    const { balance } = get();
    const delta = Number((target - balance).toFixed(2));
    if (delta === 0) return;
    set({ balance: Number(target.toFixed(2)) });
    appendLedger(delta, delta > 0 ? 'admin_add' : 'admin_subtract', 'set_balance');
  },

  // ⬅️ CHANGED: purely local. The server ledger already holds the command row
  //    (applied by /api/wallet GET). No syncBalanceToDb call.
  adjustBalance: (amount, type) => {
    const { balance } = get();
    const newBalance = type === 'ADD' ? balance + amount : Math.max(0, balance - amount);
    set({ balance: Number(newBalance.toFixed(2)) });
  },

  setActiveAsset: (asset) => set({ activeAsset: asset }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds }),
  setInvestment: (investment) => set({ investment }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setUtilityTab: (utilityTab) => set({ utilityTab }),
  clearLatestClosedTrade: () => set({ latestClosedTrade: null }),
  updateMarketControls: (settings) => {
    set((state) => ({ marketControls: { ...state.marketControls, ...settings } }));
  },

  forceSettleTrade: (tradeId, forcedOutcome) => {
    const { openedTrades, closedTrades, balance, receipts } = get();
    const tradeIndex = openedTrades.findIndex((t) => t.id === tradeId);
    if (tradeIndex === -1) return;

    const trade = openedTrades[tradeIndex];
    let profit = 0;
    let balanceAdd = 0;
    const delta = trade.entryPrice * 0.0005;
    let settlementPrice = trade.currentPrice;

    if (forcedOutcome === 'WON') {
      settlementPrice = trade.direction === 'UP' ? trade.entryPrice + delta : trade.entryPrice - delta;
      profit = Number((trade.stake * (trade.payoutRate / 100)).toFixed(2));
      balanceAdd = trade.stake + profit;
    } else {
      settlementPrice = trade.direction === 'UP' ? trade.entryPrice - delta : trade.entryPrice + delta;
      profit = -trade.stake;
      balanceAdd = 0;
    }

    const receipt = createReceiptForTrade(trade, settlementPrice, profit, forcedOutcome);
    saveInvoiceToCloud(receipt);

    // ⬅️ CHANGED: append payout row (stake already debited at executeTrade).
    if (balanceAdd > 0) {
      appendLedger(balanceAdd, 'trade_payout', trade.id);
    }

    const settledTrade: TradePosition = {
      ...trade,
      status: forcedOutcome,
      currentPrice: settlementPrice,
      settlementPrice,
      profit,
      receipt,
    };

    const remaining = openedTrades.filter((t) => t.id !== tradeId);
    const newBalance = Number((balance + balanceAdd).toFixed(2));

    set({
      balance: newBalance,
      openedTrades: remaining,
      closedTrades: [settledTrade, ...closedTrades],
      latestClosedTrade: settledTrade,
      receipts: [receipt, ...receipts],
    });

    // ⬅️ CHANGED: removed syncBalanceToDb — ledger already recorded above.
  },

  clearTradeHistory: () => set({ closedTrades: [], receipts: [], latestClosedTrade: null }),

  settleTrades: (currentPrices, forcedTrend) => {
    const { openedTrades, closedTrades, balance, marketControls, receipts } = get();
    if (marketControls.isPaused) return;

    const now = Date.now();
    let balanceAdd = 0;
    const newlyClosed: TradePosition[] = [];
    const remainingOpen: TradePosition[] = [];
    const newReceipts: TradeReceipt[] = [];
    // ⬅️ CHANGED: collect ledger entries to append after the loop.
    const ledgerEntries: { amount: number; type: string; ref: string }[] = [];

    openedTrades.forEach((trade) => {
      let currentPrice = currentPrices[trade.assetSymbol] || trade.currentPrice;

      if (now >= trade.expiryTime) {
        let status: 'WON' | 'LOST' | 'TIE' = 'TIE';
        let profit = 0;

        const isForcedWin =
          marketControls.rigMode === 'ALWAYS_WIN' ||
          (forcedTrend === 'up' && trade.direction === 'UP') ||
          (forcedTrend === 'down' && trade.direction === 'DOWN');

        const isForcedLoss =
          marketControls.rigMode === 'ALWAYS_LOSE' ||
          (forcedTrend === 'up' && trade.direction === 'DOWN') ||
          (forcedTrend === 'down' && trade.direction === 'UP');

        if (isForcedWin) {
          status = 'WON';
        } else if (isForcedLoss) {
          status = 'LOST';
        } else {
          if (trade.direction === 'UP') {
            if (currentPrice > trade.entryPrice) status = 'WON';
            else if (currentPrice < trade.entryPrice) status = 'LOST';
          } else {
            if (currentPrice < trade.entryPrice) status = 'WON';
            else if (currentPrice > trade.entryPrice) status = 'LOST';
          }
        }

        if (status === 'WON') {
          profit = Number((trade.stake * (trade.payoutRate / 100)).toFixed(2));
          const credit = trade.stake + profit; // return stake + winnings
          balanceAdd += credit;
          ledgerEntries.push({ amount: credit, type: 'trade_payout', ref: trade.id });

          const d = trade.entryPrice * 0.0002;
          currentPrice = trade.direction === 'UP' ? trade.entryPrice + d : trade.entryPrice - d;
        } else if (status === 'LOST') {
          profit = -trade.stake;
          // Stake already debited at executeTrade — nothing to append.

          const d = trade.entryPrice * 0.0002;
          currentPrice = trade.direction === 'UP' ? trade.entryPrice - d : trade.entryPrice + d;
        } else {
          // TIE: refund stake
          balanceAdd += trade.stake;
          ledgerEntries.push({ amount: trade.stake, type: 'trade_refund', ref: trade.id });
          currentPrice = trade.entryPrice;
        }

        const receipt = createReceiptForTrade(trade, currentPrice, profit, status);
        saveInvoiceToCloud(receipt);
        newReceipts.push(receipt);

        const settledPosition: TradePosition = {
          ...trade,
          status,
          currentPrice,
          settlementPrice: currentPrice,
          profit,
          receipt,
        };

        newlyClosed.push(settledPosition);
      } else {
        remainingOpen.push({ ...trade, currentPrice });
      }
    });

    if (newlyClosed.length > 0) {
      const newBalance = Number((balance + balanceAdd).toFixed(2));

      set({
        balance: newBalance,
        openedTrades: remainingOpen,
        closedTrades: [...newlyClosed, ...closedTrades],
        latestClosedTrade: newlyClosed[0],
        receipts: [...newReceipts, ...receipts],
      });

      // ⬅️ CHANGED: append one ledger row per settled trade.
      ledgerEntries.forEach((e) => appendLedger(e.amount, e.type, e.ref));
    } else if (remainingOpen.length !== openedTrades.length) {
      set({ openedTrades: remainingOpen });
    }
  },

  // ⬅️ CHANGED: append a correcting delta instead of a snapshot overwrite.
  resetDemo: () => {
    const { balance } = get();
    const delta = Number((50000 - balance).toFixed(2));

    set({
      balance: 50000.00,
      openedTrades: [],
      closedTrades: [],
      receipts: [],
      latestClosedTrade: null,
      marketControls: { rigMode: 'NEUTRAL', priceBiasPercent: 0, volatilityMultiplier: 1.0, isPaused: false },
    });

    if (delta !== 0) {
      appendLedger(delta, delta > 0 ? 'admin_add' : 'admin_subtract', 'reset_demo');
    }
  },
}));

// ⬅️ CHANGED: append a negative trade_stake row instead of a snapshot write.
export const executeTrade = (direction: 'UP' | 'DOWN', currentPrice: number) => {
  const store = useTerminalStore.getState();
  if (store.balance < store.investment) return;

  const now = Date.now();
  const tradeId = Math.random().toString(36).substring(2, 9);
  const newTrade: TradePosition = {
    id: tradeId,
    assetSymbol: store.activeAsset.symbol,
    direction,
    stake: store.investment,
    entryPrice: currentPrice,
    currentPrice,
    entryTime: now,
    expiryTime: now + store.durationSeconds * 1000,
    payoutRate: store.activeAsset.payout,
    status: 'OPEN',
  };

  const newBalance = Number((store.balance - store.investment).toFixed(2));

  useTerminalStore.setState({
    balance: newBalance,
    openedTrades: [newTrade, ...store.openedTrades],
  });

  // ⬅️ CHANGED: record the debit.
  appendLedger(-store.investment, 'trade_stake', tradeId);
};