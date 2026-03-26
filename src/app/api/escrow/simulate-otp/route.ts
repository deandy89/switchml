import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/** Extract the first 6-consecutive-digit sequence from text */
function extractOtp(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  try {
    const { escrow_email, email_body } = await req.json();

    if (!escrow_email || !email_body) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    console.log(`[simulate-otp] Simulating for ${escrow_email}`);

    const otp = extractOtp(email_body);
    if (!otp) {
      return NextResponse.json({ ok: false, reason: 'no_otp_found' });
    }

    const supabase = createServerSupabaseClient();
    
    // Resolve transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('escrow_email', escrow_email.toLowerCase().trim())
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ ok: false, reason: 'transaction_not_found' });
    }

    // Update with OTP
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ otp_code: otp })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('[simulate-otp] Update failed:', updateError.message);
      return NextResponse.json({ ok: false, error: 'Database update failed' }, { status: 500 });
    }

    console.log(`[simulate-otp] ✓ Simulated OTP ${otp} saved to ${transaction.id}`);
    return NextResponse.json({ ok: true, transactionId: transaction.id });

  } catch (error: any) {
    console.error('[simulate-otp] Error:', error.message);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
