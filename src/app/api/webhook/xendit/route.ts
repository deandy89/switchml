import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    // Cara baca header yang benar di Next.js App Router
    const xenditToken = req.headers.get('x-callback-token');
    const envToken = process.env.XENDIT_WEBHOOK_TOKEN;

    // --- JURUS DEBUG: Print ke Vercel Logs ---
    console.log("=== BONGKAR ISI TOKEN XENDIT ===");
    console.log("1. Token yang dikirim Xendit :", xenditToken);
    console.log("2. Token yang ada di Vercel  :", envToken);
    console.log("3. Apakah statusnya sama?    :", xenditToken === envToken);
    console.log("==================================");

    // Validasi Token
    if (xenditToken !== envToken) {
      console.warn("[Xendit Webhook] Unauthorized - Token mismatch");
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 403 });
    }

    // Ambil body request
    const body = await req.json();
    console.log("4. Data dari Xendit:", body);
    const { external_id, status } = body;

    // --- Logika Update Supabase ---
    if (status === 'PAID' || status === 'SETTLED') {
      const supabase = createServerSupabaseClient();
      
      console.log(`[Xendit Webhook] Attempting DB update for ${external_id}...`);
      const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'process' })
        .eq('id', external_id)
        .select();

      if (error) {
        console.error("Error updating Supabase:", error.message);
      } else if (!data || data.length === 0) {
        console.warn(`[Xendit Webhook] No transaction found with ID: ${external_id}`);
      } else {
        console.log("Update Success:", data);
      }
    } else {
      console.log(`[Xendit Webhook] Status ${status} ignored (not PAID/SETTLED)`);
    }
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Error Webhook:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
