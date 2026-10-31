import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { amount, type, referenceId } = await req.json();

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ success: false, error: 'amount must be a non-zero number' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: 'global',
        amount, // Signed: +500 or -100
        type: type ?? 'adjustment',
        reference_id: referenceId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (error: any) {
    console.error('Ledger append error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}