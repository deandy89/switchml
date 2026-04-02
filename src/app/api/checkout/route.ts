import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { listing_id } = await request.json();
    if (!listing_id) {
      return Response.json({ ok: false, error: "Missing listing_id" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(); // Service role client (bypasses RLS)
    
    // 1. Get current logged in user (the buyer)
    // Actually, service role doesn't have a session. We must use the user's session token 
    // passed in headers, or use the standard auth client.
    // NEXT.JS API ROUTE PATTERN: we create a standard client to check auth, 
    // then use service_role client for DB operations.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1.5. Check User Role & KYC Status
    const { data: profile } = await supabase
      .from('users')
      .select('role, kyc_status')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'buyer') {
      return Response.json({ ok: false, error: "Hanya pembeli yang dapat melakukan transaksi." }, { status: 403 });
    }

    if (!profile?.kyc_status) {
      return Response.json({ ok: false, error: "kyc_required" }, { status: 403 });
    }

    // 2. Fetch the listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("seller_id, status")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return Response.json({ ok: false, error: "Listing tidak ditemukan" }, { status: 404 });
    }

    if (listing.status !== "available") {
      return Response.json({ ok: false, error: "Akun ini sudah tidak tersedia" }, { status: 400 });
    }

    if (listing.seller_id === user.id) {
      return Response.json({ ok: false, error: "Tidak bisa membeli dagangan sendiri" }, { status: 400 });
    }

    // 3. Generate Escrow Email
    const domain = process.env.ESCROW_DOMAIN || "swicthml.online";
    const escrowEmail = `trx-${crypto.randomUUID().slice(0, 8)}@${domain}`;

    // 4. Create Transaction & Update Listing Status
    // Using Supabase RPC or two separate queries. We'll do sequential queries here using service role.
    const { data: transaction, error: trxError } = await supabase
      .from("transactions")
      .insert({
        listing_id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        escrow_email: escrowEmail,
        status: "waiting_payment", // Step 1
      })
      .select("id")
      .single();

    if (trxError) {
      console.error("[checkout] Error creating transaction:", trxError);
      return Response.json({ ok: false, error: "Gagal membuat transaksi" }, { status: 500 });
    }

    // Update listing status
    await supabase
      .from("listings")
      .update({ status: "process" }) // 'process' as requested
      .eq("id", listing_id);

    return Response.json({ ok: true, transactionId: transaction.id });

  } catch (error) {
    console.error("[checkout] Unhandled error:", error);
    return Response.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
