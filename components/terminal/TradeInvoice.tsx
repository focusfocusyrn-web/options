// components/terminal/TradeInvoice.tsx
"use client";

import React, { useRef } from "react";
import {
  Trophy,
  X,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  History,
  Clock,
  Download,
  FileText,
} from "lucide-react";
import html2canvas from "html2canvas";

function formatMoney(value: number) {
  return `$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const FLAGS: Record<string, [string, string]> = {
  EUR: ["#0B3FA8", "#FFCC00"],
  GBP: ["#012169", "#C8102E"],
  AUD: ["#012169", "#FFCC00"],
  USD: ["#3C3B6E", "#B22234"],
  JPY: ["#F4F6FB", "#BC002D"],
  XAU: ["#F2C94C", "#B8860B"],
};

function FlagIcon({ code, size = 20 }: { code: string; size?: number }) {
  const [top, bottom] = FLAGS[code] ?? ["#1B3A66", "#0A1B33"];
  return (
    <span
      className="ti-flag"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${top} 0 55%, ${bottom} 55% 100%)`,
        fontSize: Math.max(6, size * 0.36),
      }}
      aria-hidden
    >
      {code === "XAU" ? "" : code}
    </span>
  );
}

function SuccessHeader({ onClose, status }: { onClose: () => void, status: string }) {
  const isWin = status === 'WON';
  const isTie = status === 'TIE';
  
  return (
    <div className="ti-success-header">
      <button className="ti-close" type="button" onClick={onClose} aria-label="Close">
        <X size={18} />
      </button>

      <div className={`ti-emblem ${isTie ? 'tie' : !isWin ? 'loss' : ''}`}>
        <div className="ti-emblem-core">
          {isWin ? <Trophy size={36} strokeWidth={2} /> : isTie ? <Clock size={36} strokeWidth={2} /> : <X size={36} strokeWidth={2} />}
        </div>
      </div>

      <h2 className="ti-title">Trade Closed</h2>
      <p className="ti-sub">
        {isWin ? "Your trade was successful!" : isTie ? "Your trade resulted in a tie." : "Trade closed with loss!"}
      </p>
    </div>
  );
}

export default function TradeInvoice({
  asset = "AUD/USD",
  base = "AUD",
  amount = 100,
  profit = 92,
  direction = "UP",
  duration = 60,
  entryPrice = "0.64976",
  exitPrice = "0.65032",
  status = "WON",
  onClose = () => {},
  onNewTrade = () => {},
  onViewTrades = () => {},
}: {
  asset?: string;
  base?: string;
  amount?: number;
  profit?: number;
  direction?: "UP" | "DOWN";
  duration?: number;
  entryPrice?: string;
  exitPrice?: string;
  status?: "WON" | "LOST" | "TIE";
  onClose?: () => void;
  onNewTrade?: () => void;
  onViewTrades?: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const isWin = status === "WON";
  const isTie = status === "TIE";
  
  const themeColor = isWin ? "#00e59b" : isTie ? "#E2B93B" : "#ff3d57";
  const themeBg = isWin ? "rgba(0, 229, 155, 0.15)" : isTie ? "rgba(226, 185, 59, 0.15)" : "rgba(255, 61, 87, 0.15)";
  const themeBorder = isWin ? "rgba(0, 229, 155, 0.3)" : isTie ? "rgba(226, 185, 59, 0.3)" : "rgba(255, 61, 87, 0.3)";

  // Download PNG Function
  const handleDownloadPNG = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#040812", // Solid background for the download so it's not transparent
        scale: 3, // Higher scale = sharper image
        useCORS: true, 
        allowTaint: true,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${asset.replace('/', '_')}_${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  return (
    <>
      <style>{`
        /* Overlay: Blurred background behind the modal */
        .ti-overlay { 
          position: fixed; inset: 0; z-index: 100; 
          background: rgba(4, 8, 18, 0.7); 
          backdrop-filter: blur(12px); 
          -webkit-backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center; 
          padding: 20px; 
        }

        /* The Receipt Card: Translucent and glassy */
        .ti-receipt { 
          position: relative; width: 420px; max-width: 100%; 
          display: flex; flex-direction: column; border-radius: 20px; overflow: hidden; 
          
          /* Glassmorphism */
          background: rgba(13, 21, 38, 0.85); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 40px ${themeBg}; 
          
          margin: auto; color: #f3f6ff; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          -webkit-font-smoothing: antialiased;
        }

        /* Subtle glow inside the card */
        .ti-receipt::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 150px;
          background: radial-gradient(ellipse at top, ${themeBg}, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .ti-body { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; padding: 30px; }
        
        /* Logo */
        .ti-logo { position: absolute; top: 24px; left: 24px; height: 24px; width: auto; opacity: 0.9; }

        /* Success Header */
        .ti-success-header { position: relative; text-align: center; padding-top: 10px; }
        .ti-close { position: absolute; top: 0; right: 0; width: 32px; height: 32px; display: grid; place-items: center; border: none; border-radius: 50%; background: rgba(255,255,255,0.05); color: #8ea8cc; cursor: pointer; transition: 0.2s; }
        .ti-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        
        .ti-emblem { position: relative; width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle, ${themeBg}, transparent 70%); }
        .ti-emblem-core { position: relative; width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; color: ${themeColor}; background: rgba(13, 21, 38, 0.8); border: 2px solid ${themeColor}; box-shadow: 0 0 20px ${themeBg}; }
        
        .ti-title { margin: 16px 0 4px; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .ti-sub { margin: 0; font-size: 14px; color: #8ea8cc; }
        
        /* Asset Details Card */
        .ti-card { border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.3); padding: 18px 20px; }
        .ti-pair-row { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; }
        .ti-pair-left { display: flex; align-items: center; gap: 12px; }
        .ti-pair-name { font-size: 16px; font-weight: 700; color: #fff; }
        .ti-pair-dir { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; margin-top: 2px; }
        .ti-pair-dir.up { color: #00e59b; } .ti-pair-dir.down { color: #f6465d; }
        .ti-amount { font-size: 16px; font-weight: 700; color: #fff; }
        .ti-amount-label { font-size: 11px; color: #8ea8cc; }
        
        .ti-card-divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 0 -20px; }
        .ti-details-row { display: grid; grid-template-columns: 1fr 1px 1fr; align-items: stretch; }
        .ti-detail-divider { background: rgba(255, 255, 255, 0.08); }
        .ti-detail-cell { display: flex; flex-direction: column; gap: 4px; padding: 16px 0; }
        .ti-detail-cell:first-child { padding-right: 20px; } .ti-detail-cell:last-child { padding-left: 20px; }
        .ti-detail-label { font-size: 11px; color: #8ea8cc; }
        .ti-detail-value { font-size: 15px; font-weight: 600; color: #fff; font-family: monospace; }
        .ti-result { color: ${themeColor}; font-weight: 700; font-family: inherit; }
        
        /* Profit Banner */
        .ti-profit-banner { position: relative; display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 16px; overflow: hidden; border: 1px solid ${themeBorder}; background: ${themeBg}; }
        .ti-profit-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: ${themeColor}; background: rgba(255,255,255,0.1); }
        .ti-profit-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${themeColor}; opacity: 0.9; }
        .ti-profit-value { font-size: 28px; font-weight: 800; color: ${themeColor}; line-height: 1; }
        
        /* Buttons */
        .ti-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ti-btn { height: 48px; border-radius: 12px; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; border: none; }
        .ti-btn-primary { background: linear-gradient(180deg, #2e8bff, #006bff); color: #fff; box-shadow: 0 4px 15px rgba(0, 107, 255, 0.4); }
        .ti-btn-primary:hover { filter: brightness(1.1); }
        .ti-btn-ghost { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; }
        .ti-btn-ghost:hover { background: rgba(255, 255, 255, 0.1); }
        
        .ti-export-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
        .ti-btn-export { height: 36px; border-radius: 10px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #8ea8cc; transition: 0.2s; }
        .ti-btn-export:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }

        /* Footer */
        .ti-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.2); font-size: 12px; color: #8ea8cc; }
        .ti-footer-side { display: flex; align-items: center; gap: 6px; }
        
        .ti-flag { border-radius: 50%; display: inline-grid; place-items: center; color: #fff; font-weight: 800; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); }
      `}</style>

      <div className="ti-overlay" role="dialog" aria-modal="true">
        <div className="ti-receipt" ref={receiptRef}>
          
          {/* Top Left Logo */}
          <img src="/icon.png" alt="Logo" className="ti-logo" />

          <div className="ti-body">
            <SuccessHeader onClose={onClose} status={status} />
            
            <div className="ti-card">
              <div className="ti-pair-row">
                <div className="ti-pair-left">
                  <FlagIcon code={base} size={28} />
                  <div className="ti-pair-text">
                    <span className="ti-pair-name">{asset}</span>
                    <span className={`ti-pair-dir ${direction === "UP" ? "up" : "down"}`}>
                      {direction === "UP" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{direction}
                    </span>
                  </div>
                </div>
                <div className="ti-pair-right text-right">
                  <span className="ti-amount">{formatMoney(amount)}</span>
                  <span className="ti-amount-label block">Investment</span>
                </div>
              </div>

              <div className="ti-card-divider" />

              <div className="ti-details-row">
                <div className="ti-detail-cell">
                  <span className="ti-detail-label">Entry Price</span>
                  <span className="ti-detail-value">{entryPrice}</span>
                </div>
                <div className="ti-detail-divider" />
                <div className="ti-detail-cell">
                  <span className="ti-detail-label">Exit Price</span>
                  <span className="ti-detail-value">{exitPrice}</span>
                </div>
              </div>

              <div className="ti-card-divider" />

              <div className="ti-details-row">
                <div className="ti-detail-cell">
                  <span className="ti-detail-label">Time</span>
                  <span className="ti-detail-value">{duration}s</span>
                </div>
                <div className="ti-detail-divider" />
                <div className="ti-detail-cell">
                  <span className="ti-detail-label">Result</span>
                  <span className={`ti-detail-value ti-result`}>
                    {profit > 0 ? '+' : ''}{formatMoney(profit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="ti-profit-banner">
              <div className="ti-profit-icon">
                {isWin ? <TrendingUp size={24} /> : isTie ? <Clock size={24} /> : <TrendingDown size={24} />}
              </div>
              <div className="ti-profit-text">
                <span className="ti-profit-label">{isWin ? 'PROFIT' : isTie ? 'REFUND' : 'LOSS'}</span>
                <span className="ti-profit-value">{profit > 0 ? '+' : ''}{formatMoney(profit)}</span>
              </div>
            </div>

            <div className="ti-actions">
              <button className="ti-btn ti-btn-primary" type="button" onClick={onNewTrade}>New Trade</button>
              <button className="ti-btn ti-btn-ghost" type="button" onClick={onViewTrades}>View Trades</button>
            </div>

            <div className="ti-export-row">
              <button className="ti-btn-export" onClick={handleDownloadPNG}>
                <Download size={14} /> Save Image
              </button>
              <button className="ti-btn-export" onClick={() => window.print()}>
                <FileText size={14} /> Save PDF
              </button>
            </div>

          </div>

          <div className="ti-footer">
            <div className="ti-footer-side"><History size={14} /><span>{new Date().toLocaleTimeString()}</span></div>
            <div className="ti-footer-side"><Clock size={14} /><span>Expires {new Date().toLocaleTimeString()}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}