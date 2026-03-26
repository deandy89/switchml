import crypto from "crypto";

/**
 * Verifies the Mailgun webhook signature.
 * Mailgun signs every request with: HMAC-SHA256(timestamp + token, MAILGUN_API_KEY)
 *
 * @see https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/#webhook-security
 *
 * @returns true if signature is valid, false otherwise
 */
export function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): boolean {
  if (!signingKey || !timestamp || !token || !signature) return false;

  // Reject timestamps older than 5 minutes to prevent replay attacks
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false;

  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp + token)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
