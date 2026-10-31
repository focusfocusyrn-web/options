"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sliders, Receipt, ArrowLeft, Trash2, Play, Pause, 
  TrendingUp, TrendingDown, LogOut, Edit3, X, Save, Wallet, DollarSign
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"market" | "trades" | "wallet" | "invoices">("market");
  
  // Data State
  const [market, setMarket] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null); // ⬅️ NEW
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [customPrice, setCustomPrice] = useState("");

  // Wallet State
  const [adjustAmount, setAdjustAmount] = useState("100");
  const [setBalanceTarget, setSetBalanceTarget] = useState(""); // ⬅️ NEW

  const loadData = async () => {
    try {
      const [mRes, iRes, tRes, bRes] = await Promise.all([ // ⬅️ added bRes
        fetch("/api/market", { cache: "no-store" }),
        fetch("/api/invoices", { cache: "no-store" }),
        fetch("/api/active-trades", { cache: "no-store" }).catch(() => ({ json: () => ({ success: true, trades: [] }) })),
        fetch("/api/wallet/balance", { cache: "no-store" }).catch(() => ({ json: () => ({ success: false }) })), // ⬅️ NEW
      ]);
      
      const mData = await mRes.json();
      const iData = await iRes.json();
      const tData = await tRes.json();
      const bData = await bRes.json(); // ⬅️ NEW
      
      if (mData.success) {
        setMarket(mData.market);
        if (!customPrice) setCustomPrice(String(mData.market.price || 0.64976));
      }
      if (iData.success) setInvoices(iData.invoices || []);
      if (tData.success) setActiveTrades(tData.trades || []);
      if (bData.success && typeof bData.balance === "number") setBalance(bData.balance); // ⬅️ NEW
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateMarket = async (changes: any) => {
    setSaving(true);
    await fetch("/api/market", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    await loadData();
    setSaving(false);
  };

  const deleteAllInvoices = async () => {
    if (!confirm("Permanently delete ALL trade history? This will wipe the user's Closed tab immediately.")) return;
    
    try {
      const res = await fetch("/api/invoices", { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Cleared ${data.deleted ?? 'all'} trade records.`);
        setInvoices([]);
        await loadData();
      } else {
        alert("❌ Failed to clear: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  const saveEditedInvoice = async () => {
    if (!editingInvoice) return;
    setSaving(true);
    await fetch("/api/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingInvoice),
    });
    setEditingInvoice(null);
    await loadData();
    setSaving(false);
  };

  // ADD / SUBTRACT — unchanged: queues a wallet_command the terminal picks up.
  const sendWalletCommand = async (action: 'ADD' | 'SUBTRACT') => {
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) return alert("Enter a valid amount");
    
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Sent $${amount} ${action === 'ADD' ? 'top-up' : 'deduction'} to terminal!`);
        await loadData();
      } else {
        alert("❌ Failed: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  // ⬅️ NEW: set absolute balance by appending a correcting ledger row.
  //     Used when you want a specific value (e.g. reset to 50,000).
  const setExactBalance = async () => {
    const target = Number(setBalanceTarget);
    if (!Number.isFinite(target) || target < 0) return alert("Enter a valid target balance");
    if (balance === null) return alert("Balance not loaded yet");

    const delta = Number((target - balance).toFixed(2));
    if (delta === 0) {
      alert("Balance already equals target");
      return;
    }

    try {
      const res = await fetch('/api/wallet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: delta,
          type: delta > 0 ? 'admin_add' : 'admin_subtract',
          referenceId: 'set_balance',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Balance set to $${target.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Δ ${delta > 0 ? '+' : ''}${delta})`);
        setSetBalanceTarget("");
        await loadData();
      } else {
        alert("❌ Failed: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  if (loading) return <div className="min-h-screen bg-[#090d12] text-white p-10 flex items-center justify-center">Loading Admin Controls...</div>;

  if (!market) return (
    <div className="min-h-screen bg-[#090d12] text-white p-10">
      <h1 className="text-xl font-bold mb-4">Error Loading Dashboard</h1>
      <p className="text-gray-400 mb-6">Could not load market settings. Ensure the `market_state` table exists in Supabase and has a row with `id = 'AUD/USD'`.</p>
      <button onClick={() => window.location.reload()} className="bg-emerald-500 text-black px-6 py-2 rounded-xl font-bold">Retry</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#090d12] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <header className="border-b border-white/10 pb-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Master Control</p>
            <h1 className="mt-3 text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/en/cabinet/deposit-step-1')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              <ArrowLeft size={16} /> Terminal
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab("market")} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition ${activeTab === "market" ? "bg-emerald-500 text-black" : "bg-[#0d141e] text-gray-400 hover:bg-white/5"}`}>
            <Sliders size={18} /> Market Controls
          </button>
          <button onClick={() => setActiveTab("trades")} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition ${activeTab === "trades" ? "bg-emerald-500 text-black" : "bg-[#0d141e] text-gray-400 hover:bg-white/5"}`}>
            <Wallet size={18} /> Active Trades ({activeTrades.length})
          </button>
          <button onClick={() => setActiveTab("wallet")} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition ${activeTab === "wallet" ? "bg-emerald-500 text-black" : "bg-[#0d141e] text-gray-400 hover:bg-white/5"}`}>
            <DollarSign size={18} /> User Wallet
          </button>
          <button onClick={() => setActiveTab("invoices")} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap transition ${activeTab === "invoices" ? "bg-emerald-500 text-black" : "bg-[#0d141e] text-gray-400 hover:bg-white/5"}`}>
            <Receipt size={18} /> Invoice History
          </button>
        </div>

        {/* 1. MARKET CONTROLS */}
        {activeTab === "market" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0d141e] p-6">
              <h2 className="text-xl font-bold mb-4">Market Trend</h2>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button onClick={() => updateMarket({ movement_mode: 'auto' })} className={`py-3 rounded-xl font-bold flex flex-col items-center gap-2 border transition ${market.movement_mode === 'auto' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-gray-500 hover:bg-white/5'}`}>
                  <Sliders size={18} /> Auto
                </button>
                <button onClick={() => updateMarket({ movement_mode: 'up' })} className={`py-3 rounded-xl font-bold flex flex-col items-center gap-2 border transition ${market.movement_mode === 'up' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-transparent text-gray-500 hover:bg-white/5'}`}>
                  <TrendingUp size={18} /> Force Up
                </button>
                <button onClick={() => updateMarket({ movement_mode: 'down' })} className={`py-3 rounded-xl font-bold flex flex-col items-center gap-2 border transition ${market.movement_mode === 'down' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'border-transparent text-gray-500 hover:bg-white/5'}`}>
                  <TrendingDown size={18} /> Force Down
                </button>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-sm text-gray-400 block mb-2">Override Global Price</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    step="0.00001"
                    value={customPrice} 
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-mono outline-none focus:border-emerald-500" 
                  />
                  <button 
                    onClick={() => updateMarket({ price: Number(customPrice) })}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition"
                  >
                    Set Price
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d141e] p-6">
              <h2 className="text-xl font-bold mb-4">Engine Status</h2>
              <button onClick={() => updateMarket({ is_paused: !market.is_paused })} className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition ${market.is_paused ? "bg-amber-500 text-black" : "bg-emerald-500 text-black"}`}>
                {market.is_paused ? <><Play size={20}/> Resume Market</> : <><Pause size={20}/> Pause Market</>}
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTIVE TRADES */}
        {activeTab === "trades" && (
          <div className="rounded-2xl border border-white/10 bg-[#0d141e] p-6">
            <h2 className="text-xl font-bold mb-4">Active Positions</h2>
            {activeTrades.length === 0 ? (
              <p className="text-gray-500 text-sm">No open trades right now. Place a trade on the terminal to see it here.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Dir</th>
                    <th className="py-3 px-4">Stake</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrades.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-semibold">{t.assetSymbol}</td>
                      <td className="py-4 px-4 font-bold text-emerald-400">{t.direction}</td>
                      <td className="py-4 px-4">${t.stake}</td>
                      <td className="py-4 px-4 flex gap-2">
                        <button className="bg-emerald-500 text-black px-3 py-1 rounded font-bold text-xs">Force WIN</button>
                        <button className="bg-rose-500 text-white px-3 py-1 rounded font-bold text-xs">Force LOSS</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. WALLET CONTROLS */}
        {activeTab === "wallet" && (
          <div className="rounded-2xl border border-white/10 bg-[#0d141e] p-6 max-w-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">User Wallet Controls</h2>
              <p className="text-sm text-gray-400 mb-6">Top up or deduct funds from the user's demo balance. The terminal will sync automatically.</p>

              {/* ⬅️ NEW: live balance readout */}
              <div className="bg-[#090d12] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">Current Balance</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {balance !== null
                    ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>
            </div>

            {/* ADD / SUBTRACT */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Quick Adjust ($)</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  value={adjustAmount} 
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="flex-1 bg-[#090d12] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" 
                />
                <button 
                  onClick={() => sendWalletCommand('ADD')}
                  className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition"
                >
                  + Top Up
                </button>
                <button 
                  onClick={() => sendWalletCommand('SUBTRACT')}
                  className="bg-rose-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-rose-400 transition"
                >
                  - Deduct
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Queues a command the terminal applies within ~2s.</p>
            </div>

            {/* ⬅️ NEW: set exact balance */}
            <div className="border-t border-white/10 pt-6">
              <label className="text-sm text-gray-400 block mb-2">Set Exact Balance ($)</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="e.g. 50000"
                  value={setBalanceTarget} 
                  onChange={(e) => setSetBalanceTarget(e.target.value)}
                  className="flex-1 bg-[#090d12] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono" 
                />
                <button 
                  onClick={setExactBalance}
                  className="bg-[#477EB9] hover:bg-[#3b699a] text-white font-bold px-6 py-3 rounded-xl transition"
                >
                  Set Balance
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Appends a correcting ledger row immediately — does not queue a command.
              </p>
            </div>
          </div>
        )}

        {/* 4. INVOICE HISTORY */}
        {activeTab === "invoices" && (
          <div className="rounded-2xl border border-white/10 bg-[#0d141e] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Invoice History ({invoices.length})</h2>
              <button onClick={deleteAllInvoices} className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-4 py-2 rounded-lg hover:bg-rose-500/20 text-sm font-semibold transition">
                <Trash2 size={16} /> Clear All History
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-3 px-4">Receipt ID</th>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Stake</th>
                    <th className="py-3 px-4">P/L</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-mono text-xs text-emerald-400">{inv.receipt_id}</td>
                      <td className="py-4 px-4 font-semibold">{inv.asset_symbol}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{inv.status}</span>
                      </td>
                      <td className="py-4 px-4">${inv.stake}</td>
                      <td className={`py-4 px-4 font-bold ${inv.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {inv.profit >= 0 ? '+' : ''}{inv.profit}
                      </td>
                      <td className="py-4 px-4">
                        <button onClick={() => setEditingInvoice(inv)} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs font-bold">
                          <Edit3 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">No invoices found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT INVOICE MODAL */}
        {editingInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0d141e] border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Invoice</h3>
                <button onClick={() => setEditingInvoice(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-gray-400 block mb-1">Receipt ID</label>
                  <input disabled value={editingInvoice.receipt_id} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 block mb-1">Stake ($)</label>
                    <input type="number" value={editingInvoice.stake} onChange={(e) => setEditingInvoice({...editingInvoice, stake: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Profit ($)</label>
                    <input type="number" value={editingInvoice.profit} onChange={(e) => setEditingInvoice({...editingInvoice, profit: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Status</label>
                  <select value={editingInvoice.status} onChange={(e) => setEditingInvoice({...editingInvoice, status: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
                <button onClick={saveEditedInvoice} disabled={saving} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl mt-2 flex items-center justify-center gap-2">
                  {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}