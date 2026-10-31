import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// POST: Save a new invoice
export async function POST(req: Request) {
  try {
    const invoice = await req.json();

    const { data, error } = await supabase
      .from('trade_invoices')
      .insert({
        receipt_id: invoice.receiptId,
        asset_symbol: invoice.assetSymbol,
        direction: invoice.direction,
        status: invoice.status,
        stake: invoice.stake,
        entry_price: invoice.entryPrice,
        settlement_price: invoice.settlementPrice,
        profit: invoice.profit,
        transaction_hash: invoice.transactionHash,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Invoice save error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Fetch all invoices
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trade_invoices')
      .select('*')
      .order('issued_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, invoices: data });
  } catch (error: any) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Clear all invoices (called from Admin)
export async function DELETE() {
  try {
    // First: try to delete all rows using the neq trick
    const { error, count } = await supabase
      .from('trade_invoices')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn('First delete failed, trying fallback:', error.message);
      
      // Fallback: clear all rows one by one using a different filter
      const { error: fallbackError } = await supabase
        .from('trade_invoices')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (fallbackError) throw fallbackError;
    }

    return NextResponse.json({ success: true, deleted: count });
  } catch (error: any) {
    console.error('Invoice delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Edit an existing invoice
export async function PUT(req: Request) {
  try {
    const invoice = await req.json();
    const { data, error } = await supabase
      .from('trade_invoices')
      .update({
        stake: invoice.stake,
        profit: invoice.profit,
        status: invoice.status,
      })
      .eq('id', invoice.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}