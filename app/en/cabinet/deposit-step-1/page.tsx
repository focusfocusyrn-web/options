'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTerminalStore } from '@/lib/store/terminal-store';
import { Header } from '@/components/terminal/header';
import { LeftNav } from '@/components/terminal/left-nav';
import { RightUtility } from '@/components/terminal/right-utility';
import { TradeControls } from '@/components/terminal/trade-controls';
import { TradesPanel } from '@/components/terminal/trades-panel';
import { LivePriceChart } from '@/components/terminal/live-price-chart';
import { AssetSelector } from '@/components/terminal/asset-selector';
import { TradeClosedModal } from '@/components/terminal/trade-closed-modal';
import { AuthModal } from '@/components/terminal/auth-modal';
import { Activity } from 'lucide-react';

export default function DepositStep1TerminalPage() {
  const { activeAsset, durationSeconds, openedTrades, settleTrades } = useTerminalStore();
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

  const getBasePrice = (symbol: string): number => {
    const fixed: Record<string, number> = {
      'AUD/USD': 0.64976, 'EUR/USD': 1.08450, 'GBP/USD': 1.26520,
      'USD/JPY': 154.800, 'BTC/USD': 64250.00, 'CAD/CHF': 0.64320,
      'BHD/CNY OTC': 18.65, 'CAD/JPY OTC': 111.450, 'AED/CNY OTC': 1.9428,
    };
    if (fixed[symbol]) return fixed[symbol];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash << 5) - hash + symbol.charCodeAt(i);
    }
    return Math.abs(hash % 10000) / 1000 + 0.5;
  };

  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number }>>({});
  const forcedTrendRef = useRef<string>('auto');
  const currentPricesRef = useRef<Record<string, number>>({});
  const [activePrice, setActivePrice] = useState<number>(0);

  const settleTradesRef = useRef(settleTrades);
  useEffect(() => { settleTradesRef.current = settleTrades; }, [settleTrades]);

  useEffect(() => {
    const symbols = [
      'AUD/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD',
      'CAD/CHF', 'BHD/CNY OTC', 'CAD/JPY OTC', 'AED/CNY OTC',
      'AUD/CAD OTC', 'EUR/CHF OTC', 'EUR/GBP OTC', 'EUR/USD OTC', 'GOLD OTC'
    ];
    const initial: Record<string, { price: number; change: number }> = {};
    const basePrices: Record<string, number> = {};

    symbols.forEach((sym) => {
      const base = getBasePrice(sym);
      basePrices[sym] = base;
      initial[sym] = { price: base, change: 0 };
    });

    setLivePrices(initial);
    currentPricesRef.current = basePrices;
    setActivePrice(initial[activeAsset.symbol]?.price || 0);
  }, []);

  useEffect(() => {
    const currentBase = currentPricesRef.current[activeAsset.symbol];
    if (currentBase) {
      setActivePrice(currentBase);
    }
  }, [activeAsset.symbol]);

  useEffect(() => {
    let lastMarketFetch = 0;
    let cachedMarket: any = null;
    let tickerUpdateCounter = 0;
    
    // We only update the active chart price every 500ms for smooth movement
    let chartTickCounter = 0; 

    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        if (!cachedMarket || now - lastMarketFetch > 1000) {
          const res = await fetch('/api/market', { cache: 'no-store' });
          const data = await res.json();
          if (data.market) {
            cachedMarket = data.market;
            lastMarketFetch = now;
          }
        }

        const market = cachedMarket;
        if (!market || market.is_paused) return;

        forcedTrendRef.current = market.movement_mode || 'auto';
        let trendBias = 0;
        if (market.movement_mode === 'up') trendBias = 0.00001;
        if (market.movement_mode === 'down') trendBias = -0.00001;

        const mockPrices: Record<string, number> = {};

        Object.keys(currentPricesRef.current).forEach((symbol) => {
          const prev = currentPricesRef.current[symbol];
          const base = getBasePrice(symbol);

          // VERY LOW NOISE: prevents jagged peaks
          let noiseFactor = base * 0.00001;
          let decimals = 5;

          if (symbol.includes('JPY')) { noiseFactor = 0.005; decimals = 3; }
          if (symbol.includes('BTC')) { noiseFactor = 1.0; decimals = 2; }
          if (symbol.includes('BHD')) { noiseFactor = 0.0005; decimals = 5; }

          const jitter = (Math.random() - 0.5) * 2 * noiseFactor;
          const adminMove = prev * trendBias;
          const springBack = (base - prev) * 0.05;

          let nextPrice = prev + jitter + adminMove + springBack;
          if (nextPrice <= 0) nextPrice = base * 0.9;

          currentPricesRef.current[symbol] = Number(nextPrice.toFixed(decimals));
          mockPrices[symbol] = currentPricesRef.current[symbol];
        });

        // Feed active price to chart ONLY every 5th tick (500ms)
        chartTickCounter++;
        if (chartTickCounter >= 5) {
          chartTickCounter = 0;
          const newActive = mockPrices[activeAsset.symbol] || currentPricesRef.current[activeAsset.symbol];
          setActivePrice(newActive);
        }

        if (settleTradesRef.current) {
          settleTradesRef.current(mockPrices, forcedTrendRef.current);
        }

        tickerUpdateCounter++;
        if (tickerUpdateCounter >= 10) {
          tickerUpdateCounter = 0;
          setLivePrices((prev) => {
            const next = { ...prev };
            Object.keys(mockPrices).forEach((symbol) => {
              const oldPrice = next[symbol]?.price || mockPrices[symbol];
              const newPrice = mockPrices[symbol];
              const change = Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2));
              next[symbol] = { price: newPrice, change };
            });
            return next;
          });
        }

      } catch (err) {
        console.error('Market sync error', err);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeAsset.symbol]);

  useEffect(() => {
    const syncWallet = async () => {
      try {
        const res = await fetch('/api/wallet', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && typeof data.balance === 'number') {
          useTerminalStore.setState({ balance: data.balance });
        }
      } catch (err) {
        console.error('Wallet sync error', err);
      }
    };

    syncWallet();
    const interval = setInterval(syncWallet, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadReceipts = async () => {
      try {
        const res = await fetch('/api/invoices', { cache: 'no-store' });
        const { success, invoices } = await res.json();
        if (!success || !invoices) return;

        const mappedReceipts: any[] = invoices.map((inv: any) => ({
          receiptId: inv.receipt_id,
          tradeId: inv.id,
          timestamp: new Date(inv.issued_at).getTime(),
          assetSymbol: inv.asset_symbol,
          direction: inv.direction,
          stake: Number(inv.stake),
          entryPrice: Number(inv.entry_price),
          settlementPrice: Number(inv.settlement_price),
          profit: Number(inv.profit),
          payoutRate: 92,
          status: inv.status,
          transactionHash: inv.transaction_hash,
        }));

        useTerminalStore.setState((state) => {
          const byId = new Map<string, any>();
          mappedReceipts.forEach((r: any) => byId.set(r.receiptId, r));
          state.receipts.forEach((r) => {
            if (!byId.has(r.receiptId)) byId.set(r.receiptId, r);
          });
          const merged = Array.from(byId.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
          return { receipts: merged };
        });
      } catch (err) {
        console.error('Failed to load receipts', err);
      }
    };

    loadReceipts();
    const receiptsInterval = setInterval(loadReceipts, 5000);
    return () => clearInterval(receiptsInterval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen max-w-[100vw] overflow-hidden bg-[var(--app-bg)] relative">
      <Header />
      
      {/* <div className="bg-[#161822] border-b border-[#252836] px-4 py-2 flex items-center justify-between text-[11px] text-[#94A3B8] overflow-x-auto gap-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-6 shrink-0 font-mono">
          <span className="text-[10px] text-[#64748B] uppercase font-sans font-bold flex items-center gap-1.5">
            <Activity size={12} className="text-[#2EAE49]" /> Live Market
          </span>
          {Object.entries(livePrices).map(([sym, item]) => (
            <div key={sym} className="flex items-center gap-2">
              <span className="font-bold text-[#E2E8F0] font-sans">{sym}</span>
              <span className="text-white">
  {item.price.toFixed(sym.includes('JPY') ? 3 : sym.includes('BTC') ? 2 : 5)}
</span>
              <span className={`text-[10px] font-bold ${item.change >= 0 ? 'text-[#2EAE49]' : 'text-[#F3332D]'}`}>
                {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change)}%
              </span>
            </div>
          ))}
        </div>
      </div> */}

      <div className="flex flex-1 w-full overflow-hidden h-[calc(100vh-var(--header-height))] relative">
        <div className="hidden sm:flex shrink-0"><LeftNav /></div>
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full min-w-0">
          
          <div className="flex-1 flex h-[55%] lg:h-full overflow-hidden min-h-[250px] -mt-[1px]">
            <LivePriceChart
              asset={activeAsset}
              openedTrades={openedTrades}
              durationSeconds={durationSeconds}
              onOpenAssetSelector={() => setIsAssetSelectorOpen(true)}
              currentPrice={activePrice}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row lg:flex-row h-[45%] lg:h-full shrink-0 overflow-y-auto lg:overflow-visible">
            <TradeControls currentPrice={activePrice} />
            <TradesPanel />
          </div>
        </div>
        
        <div className="hidden xl:flex shrink-0"><RightUtility /></div>
      </div>

      <AssetSelector isOpen={isAssetSelectorOpen} onClose={() => setIsAssetSelectorOpen(false)} />
      <TradeClosedModal />
      <AuthModal />
    </div>
  );
}