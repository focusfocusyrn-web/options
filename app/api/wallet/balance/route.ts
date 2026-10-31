import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function GET() {
  try {
    // 1. Seed the initial balance if the table is completely empty
    const { count, error: countErr } = await supabase
      .from('wallet_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', 'global');

    if (countErr) throw countErr;

    if (!count || count === 0) {
      await supabase.from('wallet_transactions').insert({
        user_id: 'global',
        amount: 50000,
        type: 'initial',
        reference_id: null,
      });
    }

    // 2. Fetch all rows and calculate the SUM
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('user_id', 'global');

    if (error) throw error;

    const balance = (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return NextResponse.json({ success: true, balance: Number(balance.toFixed(2)) });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ success: false, error: error.message, balance: 0 }, { status: 500 });
  }
}