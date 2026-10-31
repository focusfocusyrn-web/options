'use client';

import { useEffect, useRef, useState } from 'react';

// Real exchange feeds (crypto only)
const PAIRS: Record<string, { binance: string; coinbase: string }> = {
  'BTC/USD': { binance: 'btcusdt', coinbase: 'BTC-USD' },
  'ETH/USD': { binance: 'ethusdt', coinbase: 'ETH-USD' },
  'SOL/USD': { binance: 'solusdt', coinbase: 'SOL-USD' },
};

// Starting prices for simulated markets (forex / OTC)
const BASES: Record<string, number> = {
  'AUD/USD': 0.64862,
  'EUR/USD': 1.08383,
  'GBP/USD': 1.2645,
  'USD/JPY': 154.661,
};

function baseFor(symbol: string, fallback: number): number {
  if (fallback > 0) return fallback;
  const clean = symbol.replace(/\s*OTC$/i, '').trim();
  if (BASES[clean]) return BASES[clean];
  // Stable pseudo-random base for unknown symbols (e.g. BHD/CNY OTC)
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  return 0.5 + (h % 1500) / 1000; // 0.5 to 2.0
}

/**
 * Returns a live price for any symbol.
 * - Crypto in PAIRS: real WebSocket feed (Binance, then Coinbase fallback)
 * - Everything else (forex, OTC): simulated random walk around a base price
 * Returns 0 only for the first instant before a price exists.
 */
export function useLivePrice(symbol: string, fallbackPrice = 0): number {
  const [price, setPrice] = useState(0);
  const latest = useRef(0);
  const fallbackRef = useRef(fallbackPrice);
  fallbackRef.current = fallbackPrice;

  useEffect(() => {
    latest.current = 0;
    setPrice(0);

    const pair = PAIRS[symbol];
    let closed = false;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let simTimer: ReturnType<typeof setInterval> | undefined;

    if (pair) {
      // ---------- Real feed ----------
      let useBinance = true;
      let failures = 0;

      const connect = () => {
        if (closed) return;

        if (useBinance) {
          ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.binance}@trade`);
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.p) {
              latest.current = parseFloat(msg.p);
              failures = 0;
            }
          };
        } else {
          ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
          ws.onopen = () =>
            ws?.send(
              JSON.stringify({ type: 'subscribe', product_ids: [pair.coinbase], channels: ['ticker'] })
            );
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'ticker' && msg.price) {
              latest.current = parseFloat(msg.price);
              failures = 0;
            }
          };
        }

        ws.onerror = () => ws?.close();
        ws.onclose = () => {
          if (closed) return;
          failures += 1;
          if (failures >= 2) {
            useBinance = !useBinance;
            failures = 0;
          }
          retryTimer = setTimeout(connect, 1500);
        };
      };

      connect();
    } else {
      // ---------- Simulated market ----------
      const base = baseFor(symbol, fallbackRef.current);
      let p = base;
      latest.current = p;

      simTimer = setInterval(() => {
        const drift = (base - p) * 0.002; // gentle pull back toward the base
        const shock = (Math.random() - 0.5) * 0.0006; // about +/-0.03% per tick
        p = p + drift + p * shock;
        latest.current = p;
      }, 250);
    }

    // Push to React state a few times per second
    const flush = setInterval(() => {
      setPrice((prev) => (latest.current && latest.current !== prev ? latest.current : prev));
    }, 250);

    // Show the first price immediately
    if (latest.current) setPrice(latest.current);

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(simTimer);
      clearInterval(flush);
      ws?.close();
    };
  }, [symbol]);

  return price;
}