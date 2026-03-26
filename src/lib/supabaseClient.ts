import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy singleton — returns null when env vars are absent so the UI renders gracefully
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production")
      console.warn("[supabase] Missing env vars — Realtime disabled.");
    return null;
  }
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _client;
}

// Convenience default export kept for backward-compat (may be null)
export const supabase = getSupabaseClient();

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          escrow_email: string;
          status: string;
          otp_code: string | null;
          created_at: string;
        };
      };
    };
  };
};
