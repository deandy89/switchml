import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { verifyMailgunSignature } from "@/lib/mailgunVerify";

// Mailgun sends multipart/form-data or application/x-www-form-urlencoded
// — Next.js `request.formData()` handles both transparently.

/** Extract the first 6-consecutive-digit sequence from email text */
function extractOtp(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/**
 * Find the transaction row in Supabase by the escrow email address
 * that Mailgun delivered to (the `recipient` field).
 */
async function resolveTransaction(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  recipient: string
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, status")
    .eq("escrow_email", recipient.toLowerCase().trim())
    .single();

  if (error || !data) return null;
  return data as { id: string; status: string };
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse multipart/form-data from Mailgun ───────────────
    const form = await request.formData();

    const timestamp = (form.get("timestamp") as string) ?? "";
    const token     = (form.get("token") as string) ?? "";
    const signature = (form.get("signature") as string) ?? "";

    // ── 2. Verify Mailgun signature ──────────────────────────────
    const signingKey = process.env.MAILGUN_API_KEY ?? "";
    const isValid = verifyMailgunSignature(signingKey, timestamp, token, signature);
    if (!isValid) {
      console.warn("[mailgun/webhook] Invalid signature — request rejected.");
      return new Response("Forbidden: invalid signature", { status: 403 });
    }

    // ── 3. Extract relevant email fields ─────────────────────────
    // Mailgun field priority: stripped-text > body-plain > body-html
    const emailBody =
      (form.get("stripped-text") as string) ||
      (form.get("body-plain") as string) ||
      (form.get("body-html") as string) ||
      "";

    const recipient = (form.get("recipient") as string) ?? "";
    const sender    = (form.get("sender") as string) ?? "";
    const subject   = (form.get("subject") as string) ?? "";

    console.log("[mailgun/webhook] Inbound email received", {
      sender,
      recipient,
      subject,
    });

    // ── 4. Security: only accept emails from Moonton ─────────────
    const ALLOWED_SENDERS = ["moonton.com", "mobilelegends.net"];
    const senderDomain = sender.split("@")[1]?.toLowerCase() ?? "";
    const isTrustedSender = ALLOWED_SENDERS.some((d) =>
      senderDomain.endsWith(d)
    );

    if (!isTrustedSender) {
      console.warn(
        `[mailgun/webhook] Untrusted sender domain "${senderDomain}" — email ignored.`
      );
      // Return 200 to prevent Mailgun from retrying
      return Response.json({ ok: false, reason: "untrusted_sender" });
    }

    // ── 5. Extract OTP using regex ───────────────────────────────
    const otp = extractOtp(emailBody);

    if (!otp) {
      console.warn("[mailgun/webhook] No 6-digit OTP found in email body.");
      return Response.json({ ok: false, reason: "no_otp_found" });
    }

    console.log(`[mailgun/webhook] OTP extracted: ${otp} for ${recipient}`);

    // ── 6. Resolve transaction by escrow email ───────────────────
    const supabase = createServerSupabaseClient();
    const transaction = await resolveTransaction(supabase, recipient);

    if (!transaction) {
      console.warn(
        `[mailgun/webhook] No transaction found for escrow email "${recipient}".`
      );
      return Response.json({ ok: false, reason: "transaction_not_found" });
    }

    // ── 7. Update transaction with OTP in Supabase ───────────────
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        otp_code: otp
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("[mailgun/webhook] Supabase update failed:", updateError);
      return new Response("Internal Server Error", { status: 500 });
    }

    console.log(
      `[mailgun/webhook] ✓ OTP ${otp} saved to transaction ${transaction.id}`
    );

    // Supabase Realtime will fire automatically after this update,
    // broadcasting to all subscribed OtpListener clients.
    return Response.json({ ok: true, transactionId: transaction.id });
  } catch (error) {
    console.error("[mailgun/webhook] Unhandled error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
