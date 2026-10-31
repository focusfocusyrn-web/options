'use client';

import React, { useEffect, useRef, useState } from 'react';
import { priceToY, timestampToX } from '@/lib/chart/chart-coordinates';
import { Asset, TradePosition } from '@/lib/store/terminal-store';
import { AssetFlag } from './asset-flag';
import { Settings, BarChart2, Layers, Clock, ChevronDown } from 'lucide-react';

interface LivePriceChartProps {
  asset: Asset;
  openedTrades: TradePosition[];
  durationSeconds: number;
  onOpenAssetSelector: () => void;
  currentPrice: number;
}

type PricePoint = { price: number; timestamp: number };

export const LivePriceChart: React.FC<LivePriceChartProps> = ({
  asset,
  openedTrades,
  durationSeconds,
  onOpenAssetSelector,
  currentPrice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const historyRef = useRef<{ symbol: string; points: PricePoint[] }>({
    symbol: asset.symbol,
    points: [],
  });

  const [isMounted, setIsMounted] = useState(false);

  const latestPriceRef = useRef(currentPrice);
  const latestAssetRef = useRef(asset);

  latestPriceRef.current = currentPrice;
  latestAssetRef.current = asset;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof currentPrice !== 'number' || isNaN(currentPrice) || currentPrice === 0) return;

    const now = Date.now();

    if (historyRef.current.symbol !== asset.symbol) {
      historyRef.current = { symbol: asset.symbol, points: [] };
    } else {
      // Ensure timestamps are always sequential and never go backwards
      const lastPoint = historyRef.current.points[historyRef.current.points.length - 1];
      const safeTimestamp = lastPoint ? Math.max(now, lastPoint.timestamp + 10) : now;

      historyRef.current.points.push({ price: currentPrice, timestamp: safeTimestamp });

      if (historyRef.current.points.length > 1200) {
        historyRef.current.points = historyRef.current.points.slice(-1200);
      }
    }
  }, [currentPrice, asset.symbol, isMounted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const activePrice = latestPriceRef.current;
      const activeAsset = latestAssetRef.current;

      if (typeof activePrice !== 'number' || isNaN(activePrice) || activePrice === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      const dpr = window.devicePixelRatio || 1;

      const targetWidth = Math.floor(width * dpr);
      const targetHeight = Math.floor(height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const paddingRight = 65;
      const paddingBottom = 30;
      const plotWidth = width - paddingRight;
      const plotHeight = height - paddingBottom;

      ctx.fillStyle = '#13151D';
      ctx.fillRect(0, 0, width, height);

      let points = historyRef.current.points;

      if (points.length === 0) {
        const now = Date.now();
        const seed: PricePoint[] = [];
        let tempPrice = activePrice;
        
        for (let i = 100; i >= 0; i--) {
          const jitter = (Math.random() - 0.5) * (activePrice * 0.0001);
          tempPrice = tempPrice + jitter;
          seed.push({
            price: Number(tempPrice.toFixed(activeAsset.decimals)),
            timestamp: now - i * 500,
          });
        }
        seed[seed.length - 1] = { price: activePrice, timestamp: now };
        historyRef.current.points = seed;
        points = seed;
      }

      if (points.length < 2) {
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const now = Date.now();
      const visibleWindowMs = 40 * 1000;
      // Push endTime slightly in the future to give a gap on the right side
      const endTime = now + 2000; 
      const startTime = endTime - visibleWindowMs;

      // Only show history that fits in the window
      const visibleHistory = points.filter(pt => pt.timestamp >= startTime && pt.timestamp <= endTime + 1000);

      if (visibleHistory.length === 0) {
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      visibleHistory.forEach(pt => {
        if (pt.price < minPrice) minPrice = pt.price;
        if (pt.price > maxPrice) maxPrice = pt.price;
      });

      if (activePrice < minPrice) minPrice = activePrice;
      if (activePrice > maxPrice) maxPrice = activePrice;

      if (minPrice === maxPrice) {
        minPrice -= activePrice * 0.001;
        maxPrice += activePrice * 0.001;
      }

      const padding = (maxPrice - minPrice) * 0.2 || activePrice * 0.0001;
      minPrice -= padding;
      maxPrice += padding;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; 
      ctx.lineWidth = 1;
      const priceSteps = 7;
      for (let i = 0; i <= priceSteps; i++) {
        const y = (plotHeight / priceSteps) * i;
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(y) + 0.5);
        ctx.lineTo(plotWidth, Math.floor(y) + 0.5);
        ctx.stroke();
      }

      const timeSteps = 8;
      for (let i = 0; i <= timeSteps; i++) {
        const x = (plotWidth / timeSteps) * i;
        ctx.beginPath();
        ctx.moveTo(Math.floor(x) + 0.5, 0);
        ctx.lineTo(Math.floor(x) + 0.5, plotHeight);
        ctx.stroke();
      }

      ctx.beginPath();
      let lastX = 0;
      let lastY = 0;
      let firstX = 0;

      // THE FIX: Clamp X and Y coordinates so the canvas can never draw outside the box
      visibleHistory.forEach((pt, index) => {
        const rawX = timestampToX(pt.timestamp, startTime, endTime, plotWidth);
        const rawY = priceToY(pt.price, minPrice, maxPrice, plotHeight);
        
        // Clamp to screen bounds
        const x = Math.max(0, Math.min(plotWidth, rawX));
        const y = Math.max(0, Math.min(plotHeight, rawY));

        if (index === 0) {
          ctx.moveTo(x, y);
          firstX = x;
        } else {
          ctx.lineTo(x, y);
        }
        if (index === visibleHistory.length - 1) {
          lastX = x;
          lastY = y;
        }
      });

      ctx.save();
      ctx.lineTo(lastX, plotHeight);
      ctx.lineTo(firstX, plotHeight);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, plotHeight);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      visibleHistory.forEach((pt, index) => {
        const rawX = timestampToX(pt.timestamp, startTime, endTime, plotWidth);
        const rawY = priceToY(pt.price, minPrice, maxPrice, plotHeight);
        const x = Math.max(0, Math.min(plotWidth, rawX));
        const y = Math.max(0, Math.min(plotHeight, rawY));

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#3B82F6'; 
      ctx.lineWidth = 1.5; 
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      if (lastX && lastY) {
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#3B82F6';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(plotWidth, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#161822';
      ctx.fillRect(plotWidth, 0, paddingRight, height);
      ctx.strokeStyle = '#252836';
      ctx.beginPath();
      ctx.moveTo(plotWidth, 0);
      ctx.lineTo(plotWidth, height);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      for (let i = 0; i <= priceSteps; i++) {
        const y = (plotHeight / priceSteps) * i;
        const priceVal = maxPrice - (i / priceSteps) * (maxPrice - minPrice);
        ctx.fillText(priceVal.toFixed(activeAsset.decimals), plotWidth + 6, y + 3);
      }

      ctx.fillStyle = '#161822'; 
      ctx.fillRect(plotWidth, lastY - 10, paddingRight, 20);
      
      ctx.fillStyle = '#3B82F6'; 
      ctx.font = 'bold 10px monospace';
      const safeDecimals = typeof activeAsset.decimals === 'number' ? activeAsset.decimals : 5;
      ctx.fillText(activePrice.toFixed(safeDecimals), plotWidth + 6, lastY + 3);

      ctx.fillStyle = '#161822';
      ctx.fillRect(0, plotHeight, width, paddingBottom);
      ctx.strokeStyle = '#252836';
      ctx.beginPath();
      ctx.moveTo(0, plotHeight);
      ctx.lineTo(width, plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px monospace';
      for (let i = 0; i <= timeSteps; i++) {
        const x = (plotWidth / timeSteps) * i;
        const tVal = new Date(startTime + (i / timeSteps) * visibleWindowMs);
        ctx.fillText(tVal.toTimeString().substring(0, 8), x - 18, plotHeight + 18);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 h-full w-full min-w-0 bg-[#13151D] select-none overflow-hidden rounded-none">
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#1C1F2B]/90 border border-[#252836] rounded-lg px-2.5 py-1.5 shadow-sm">
        <button onClick={onOpenAssetSelector} className="flex items-center gap-2 text-xs font-bold text-[#E2E8F0] hover:opacity-80 transition">
          <AssetFlag symbol={asset.symbol} size="sm" />
          <span>{asset.symbol}</span>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </button>
        <div className="h-4 w-[1px] bg-[#252836]"></div>
        <button className="p-1 text-[#94A3B8] hover:text-white"><BarChart2 size={15} /></button>
        <button className="p-1 text-[#94A3B8] hover:text-white"><Layers size={15} /></button>
        <button className="p-1 text-[#94A3B8] hover:text-white"><Settings size={15} /></button>
      </div>

      <div className="absolute bottom-10 left-3 z-10 bg-[#1C1F2B] border border-[#252836] text-[11px] font-bold text-[#94A3B8] px-2 py-1 rounded cursor-pointer hover:text-white transition">
        S30
      </div>

      <div className="absolute top-3 right-[80px] z-10 bg-[#1C1F2B]/90 text-[10px] text-[#94A3B8] px-2 py-1 rounded border border-[#252836] flex items-center gap-1">
        <Clock size={12} className="text-[#F3332D]" />
        <span>Expiration time: {durationSeconds}s</span>
      </div>
    </div>
  );
};