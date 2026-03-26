import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. Fetch transaction and related listing data
    const { data: transaction, error: trxError } = await supabase
      .from("transactions")
      .select("*, listing:listings(price, title), buyer_id")
      .eq("id", transactionId)
      .single();

    if (trxError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Fetch Buyer Email from auth.users (requires service role)
    const { data: { user: buyerUser }, error: buyerError } = await supabase.auth.admin.getUserById(transaction.buyer_id);

    if (buyerError || !buyerUser?.email) {
      return NextResponse.json({ error: "Buyer email not found" }, { status: 404 });
    }

    // 3. Create Xendit Invoice
    const xenditSecretKey = process.env.XENDIT_SECRET_KEY;
    if (!xenditSecretKey) {
      return NextResponse.json({ error: "Xendit Secret Key not configured" }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(xenditSecretKey + ":").toString("base64")}`;

    const invoicePayload = {
      external_id: transactionId,
      amount: transaction.listing?.price || 0,
      payer_email: buyerUser.email,
      description: `Pembayaran Escrow: ${transaction.listing?.title || "Akun Mobile Legends"}`,
      callback_url: `${new URL(req.url).origin}/api/webhook/xendit`,
      should_send_email: true,
      currency: "IDR",
    };

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    });

    const xenditData = await xenditRes.json();

    if (!xenditRes.ok) {
      console.error("[Xendit Error]", xenditData);
      return NextResponse.json({ error: xenditData.message || "Failed to create Xendit invoice" }, { status: 502 });
    }

    return NextResponse.json({ invoice_url: xenditData.invoice_url });

  } catch (error: any) {
    console.error("[Invoice Route Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
