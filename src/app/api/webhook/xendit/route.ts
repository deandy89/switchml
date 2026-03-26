import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    // 1. Keamanan (Validasi Token)
    const callbackToken = req.headers.get('x-callback-token');
    const systemToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!callbackToken || callbackToken !== systemToken) {
      console.warn('[Xendit Webhook] Unauthorized - Token mismatch or missing');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Ekstraksi Data
    const body = await req.json();
    const { external_id, status } = body;

    console.log(`[Xendit Webhook] Processing for Transaction ID: ${external_id}, Xendit Status: ${status}`);

    // 3. Update Database (Supabase)
    // Jika nilai status dari Xendit adalah 'PAID' atau 'SETTLED'
    if (status === 'PAID' || status === 'SETTLED') {
      const supabase = createServerSupabaseClient();
      
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'process' })
        .eq('id', external_id);

      if (error) {
        console.error(`[Xendit Webhook] Supabase Update Error for ${external_id}:`, error.message);
        // Kita tetap lanjut ke return 200 sesuai instruksi user untuk menghentikan retry
      } else {
        console.log(`[Xendit Webhook] Transaction ${external_id} successfully updated to 'process'`);
      }
    }

    // 4. Response 200 OK (Wajib)
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Xendit Webhook Critical Error]', error.message);
    // Mengembalikan 200 OK di akhir catch agar Xendit tidak melakukan retry terus-menerus
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
