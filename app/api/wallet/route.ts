import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { action, amount } = await req.json();
    if (action !== 'ADD' && action !== 'SUBTRACT') {
      return NextResponse.json({ success: false, error: 'action must be ADD or SUBTRACT' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'amount must be > 0' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wallet_commands')
      .insert({ user_id: 'global', action, amount, processed: false })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, command: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: pending, error } = await supabase
      .from('wallet_commands')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Apply pending commands to the ledger
    for (const cmd of pending ?? []) {
      const signed = cmd.action === 'ADD' ? Number(cmd.amount) : -Number(cmd.amount);

      const { error: ledgerErr } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: 'global',
          amount: signed,
          type: cmd.action === 'ADD' ? 'admin_add' : 'admin_subtract',
          reference_id: cmd.id,
        });

      if (ledgerErr) {
        console.error('Failed to append ledger for command', cmd.id, ledgerErr);
        continue; 
      }

      await supabase
        .from('wallet_commands')
        .update({ processed: true })
        .eq('id', cmd.id);
    }

    // Return the fresh balance immediately
    const { data: rows } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', 'global');

    const balance = (rows ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

    return NextResponse.json({
      success: true,
      balance: Number(balance.toFixed(2)),
      applied: (pending ?? []).length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ success: true, note: 'commands are applied server-side' });
}