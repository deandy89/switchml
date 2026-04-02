import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

// Required by Next.js for routes that read request body at runtime
export const dynamic = "force-dynamic";

/** Extract the first 6-consecutive-digit sequence from a string */
function extractOtp(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/**
 * Find the transaction row in Supabase by the escrow email address.
 * Pipedream will forward the "To" field which is the escrow email we generated.
 */
async function resolveTransaction(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  escrowEmail: string
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, status")
    .eq("escrow_email", escrowEmail.toLowerCase().trim())
    .single();

  if (error || !data) return null;
  return data as { id: string; status: string };
}

export async function POST(req: Request) {
  try {
    // ── 1. Parse JSON payload from Pipedream ──────────────────────
    const body = await req.json();

    // 🔍 LOG FULL PAYLOAD — for analysing the Moonton OTP email structure
    console.log("[pipedream/webhook] ===== INCOMING PAYLOAD =====");
    console.log(JSON.stringify(body, null, 2));
    console.log("[pipedream/webhook] ============================");

    // ── 2. Extract relevant fields from Pipedream payload ─────────
    // Pipedream's Email (Trigger) typically exposes these fields.
    // Field names may vary — adjust after inspecting logs above.
    const emailBody: string =
      body?.body?.text ||        // plain-text body
      body?.body?.html ||        // HTML fallback
      body?.text ||              // alternative flat structure
      body?.html ||
      "";

    const recipient: string =
      body?.headers?.to ||
      body?.to ||
      body?.recipient ||
      "";

    const sender: string =
      body?.headers?.from ||
      body?.from ||
      body?.sender ||
      "";

    const subject: string =
      body?.headers?.subject ||
      body?.subject ||
      "";

    console.log("[pipedream/webhook] Parsed fields →", {
      sender,
      recipient,
      subject,
      bodySnippet: emailBody.slice(0, 200),
    });

    // ── 3. Extract OTP ────────────────────────────────────────────
    const otp = extractOtp(emailBody);

    if (!otp) {
      console.warn("[pipedream/webhook] No 6-digit OTP found in email body.");
      // Return 200 so Pipedream marks delivery as success
      return NextResponse.json(
        { status: "ok", reason: "no_otp_found" },
        { status: 200 }
      );
    }

    console.log(`[pipedream/webhook] OTP extracted: ${otp} → recipient: ${recipient}`);

    // ── 4. Resolve transaction by escrow email ────────────────────
    const supabase = createServerSupabaseClient();
    const transaction = await resolveTransaction(supabase, recipient);

    if (!transaction) {
      console.warn(
        `[pipedream/webhook] No transaction found for escrow email "${recipient}".`
      );
      return NextResponse.json(
        { status: "ok", reason: "transaction_not_found" },
        { status: 200 }
      );
    }

    // ── 5. Update transaction with OTP in Supabase ───────────────
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ otp_code: otp })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("[pipedream/webhook] Supabase update failed:", updateError);
      return NextResponse.json(
        { status: "error", reason: "db_update_failed" },
        { status: 500 }
      );
    }

    console.log(
      `[pipedream/webhook] ✓ OTP ${otp} saved to transaction ${transaction.id}`
    );

    // Supabase Realtime will broadcast the update to all OtpListener subscribers.
    return NextResponse.json({ status: "ok" }, { status: 200 });

  } catch (error) {
    console.error("[pipedream/webhook] Unhandled error:", error);
    // Still return 200 — Pipedream will not retry on 5xx by default,
    // but keeping 200 avoids noisy error logs on the Pipedream side.
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
