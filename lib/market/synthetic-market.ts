import { POCKET_ASSETS } from '@/components/terminal/asset-selector';

export interface PricePoint {
  timestamp: number;
  price: number;
}

class SyntheticMarketEngine {
  private prices: Map<string, number> = new Map();
  private histories: Map<string, PricePoint[]> = new Map();
  private listeners: Map<string, ((price: number, history: PricePoint[]) => void)[]> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    const now = Date.now();
    POCKET_ASSETS.forEach((asset) => {
      this.prices.set(asset.symbol, asset.basePrice);
      
      const history: PricePoint[] = [];
      let currentP = asset.basePrice;
      for (let i = 150; i >= 0; i--) {
        const time = now - i * 1000;
        const volatility = asset.symbol.includes('JPY') ? 0.04 : asset.symbol.includes('BHD') ? 0.005 : asset.symbol.includes('BTC') ? 25.0 : 0.00015;
        const delta = (Math.random() - 0.49) * (currentP * 0.0003);
        currentP = Number((currentP + delta).toFixed(asset.decimals));
        history.push({ timestamp: time, price: currentP });
      }
      this.histories.set(asset.symbol, history);
      this.prices.set(asset.symbol, currentP);
    });

    this.start();
  }

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      const now = Date.now();
      this.histories.forEach((history, symbol) => {
        const currentPrice = this.prices.get(symbol) || 100;
        const volatility = symbol.includes('JPY') ? 0.04 : symbol.includes('BTC') ? 25.0 : 0.00015;
        const delta = (Math.random() - 0.492) * (currentPrice * 0.0002);
        const newPrice = Number((currentPrice + delta).toFixed(symbol.includes('JPY') ? 3 : symbol.includes('BHD') ? 4 : symbol.includes('BTC') ? 2 : 5));

        this.prices.set(symbol, newPrice);
        history.push({ timestamp: now, price: newPrice });

        if (history.length > 300) {
          history.shift();
        }

        const symbolListeners = this.listeners.get(symbol);
        if (symbolListeners) {
          symbolListeners.forEach((cb) => cb(newPrice, history));
        }
      });
    }, 200);
  }

  public getPrice(symbol: string): number {
    return this.prices.get(symbol) || 1.08450;
  }

  public getAllPrices(): Record<string, number> {
    const obj: Record<string, number> = {};
    this.prices.forEach((v, k) => { obj[k] = v; });
    return obj;
  }

  public getHistory(symbol: string): PricePoint[] {
    return this.histories.get(symbol) || [];
  }

  public subscribe(symbol: string, callback: (price: number, history: PricePoint[]) => void) {
    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, []);
    }
    this.listeners.get(symbol)!.push(callback);
    return () => {
      const list = this.listeners.get(symbol);
      if (list) {
        this.listeners.set(symbol, list.filter((cb) => cb !== callback));
      }
    };
  }
}

export const syntheticMarket = new SyntheticMarketEngine();