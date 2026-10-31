import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function GET() {
  try {
    // Fetch the AUD/USD row (we'll use it as the global controller for now)
    const { data, error } = await supabase
      .from('market_state')
      .select('*')
      .eq('id', 'AUD/USD')
      .single();
      
    if (error) throw error;
    return NextResponse.json({ success: true, market: data });
  } catch (error: any) {
    console.error("Market Fetch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('market_state')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', 'AUD/USD')
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ success: true, market: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}