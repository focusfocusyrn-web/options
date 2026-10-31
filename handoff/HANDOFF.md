# NOVA Trading Terminal — Project Handoff

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- Zustand 5 (state), Supabase 2 (DB), html2canvas (receipts), lucide-react

## Env keys (in .env.local — server-only, never expose to browser)
- SUPABASE_URL
- SUPABASE_SECRET_KEY
- ADMIN_USERNAME / ADMIN_PASSWORD / AUTH_SECRET

## Supabase Tables
- market_state(id, price, movement_mode, is_paused, updated_at)
- trade_invoices(id, receipt_id, asset_symbol, direction, status, stake, entry_price, settlement_price, profit, transaction_hash, issued_at)
- wallet_transactions(id, user_id, amount, type, created_at)
- wallet_commands(id, user_id, action, amount, processed, created_at)

## Where we left off
- Terminal balance + history persist across refresh via Supabase
- Admin dashboard (login-protected) controls market, wallet, invoices, active trades
- Force Up / Force Down controls trade outcomes
- Chart uses random walk at 100ms ticks

## Open issue (immediate priority)
Wallet funding/deduction end-to-end test: admin clicks + Top Up → wallet_commands row → terminal polls → balance updates → wallet_transactions saved → survives refresh.

## Ground rules
- NEVER expose SUPABASE_SECRET_KEY to the client
- Ignore nova-gemini subfolder (duplicate)
- Round money to 2 decimals
