import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { external_id, status } = body;

    // 1. Validate Webhook Token (Optional but recommended)
    const xenditWebhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    const callbackToken = req.headers.get('x-callback-token');

    if (xenditWebhookToken && callbackToken !== xenditWebhookToken) {
      console.warn('[Xendit Webhook] Unauthorized - Invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Xendit Webhook] Received for ${external_id} with status ${status}`);

    // status 'PAID' or 'SETTLED' indicates completion
    if (status === 'PAID' || status === 'SETTLED') {
      const supabase = createServerSupabaseClient();
      
      // Update transaction status to transition to the next stage (Seller Bind)
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'waiting_otp' })
        .eq('id', external_id);

      if (error) {
        console.error(`[Xendit Webhook] Error updating transaction ${external_id}:`, error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
      
      console.log(`[Xendit Webhook] Transaction ${external_id} marked as PAID`);
    }

    return NextResponse.json({ message: 'Webhook received' });

  } catch (error: any) {
    console.error('[Xendit Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
