import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Wajib di Next.js App Router agar POST tidak di-cache
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Keamanan Ekstra Ketat (Validasi Token)
    const xenditToken = req.headers.get('x-callback-token');
    const systemToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!xenditToken || xenditToken !== systemToken) {
      console.warn('[Xendit Webhook] Unauthorized - Token mismatch or missing');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Ekstraksi Data Xendit
    const body = await req.json();
    const { external_id, status } = body;

    console.log(`[Xendit Webhook] Processing for Transaction ID: ${external_id}, Xendit Status: ${status}`);

    // 3. Update Supabase
    // Jika status dari Xendit adalah 'PAID' atau 'SETTLED'
    if (status === 'PAID' || status === 'SETTLED') {
      const supabase = createServerSupabaseClient();
      
      console.log(`[Xendit Webhook] Updating transaction ${external_id} to status 'process'...`);
      
      const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'process' })
        .eq('id', external_id)
        .select();

      if (error) {
        console.error(`[Xendit Webhook] Supabase Update Error:`, error.message);
      } else if (!data || data.length === 0) {
        console.warn(`[Xendit Webhook] No transaction found with ID: ${external_id}`);
      } else {
        console.log(`[Xendit Webhook] SUCCESS: Transaction ${external_id} updated to 'process'`);
      }
    } else {
      console.log(`[Xendit Webhook] Status ${status} ignored (not PAID/SETTLED)`);
    }

    // 4. Response Wajib
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Xendit Webhook] Internal Error:', error.message || error);
    // Mengembalikan 200 OK di akhir catch agar Xendit tidak melakukan retry terus-menerus
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
