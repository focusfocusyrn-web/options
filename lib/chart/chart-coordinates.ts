import { PricePoint } from '../market/synthetic-market';

export interface ChartBounds {
  width: number;
  height: number;
  paddingRight: number;
  paddingBottom: number;
}

export function calculatePriceRange(history: PricePoint[]): { minPrice: number; maxPrice: number } {
  if (history.length === 0) return { minPrice: 0, maxPrice: 100 };
  let min = history[0].price;
  let max = history[0].price;

  for (let i = 0; i < history.length; i++) {
    if (history[i].price < min) min = history[i].price;
    if (history[i].price > max) max = history[i].price;
  }

  const margin = (max - min) * 0.15 || 0.001;
  return {
    minPrice: min - margin,
    maxPrice: max + margin,
  };
}

export function priceToY(price: number, minPrice: number, maxPrice: number, chartHeight: number): number {
  if (maxPrice === minPrice) return chartHeight / 2;
  const range = maxPrice - minPrice;
  return chartHeight - ((price - minPrice) / range) * chartHeight;
}

export function yToPrice(y: number, minPrice: number, maxPrice: number, chartHeight: number): number {
  const range = maxPrice - minPrice;
  return maxPrice - (y / chartHeight) * range;
}

export function timestampToX(timestamp: number, startTime: number, endTime: number, chartWidth: number): number {
  const timeRange = endTime - startTime;
  if (timeRange <= 0) return 0;
  return ((timestamp - startTime) / timeRange) * chartWidth;
}