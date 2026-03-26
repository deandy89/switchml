// ── Shared TypeScript types for Switch ML ──────────────────────

export interface Profile {
  id: string;
  role: 'buyer' | 'seller';
  username: string;
  whatsapp_no: string;
  kyc_status: boolean;
  nik: string | null;
  full_name: string | null;
  address: string | null;
  gender: string | null;
  birth_date: string | null;
  age: number | null;
  kyc_img_url: string | null;
  balance: number;
  rating: number;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  rank: string | null;
  hero_count: number | null;
  skin_count: number | null;
  diamonds: number | null;
  images: string[];
  status: "available" | "sold" | "pending" | "process";
  created_at: string;
  seller?: Pick<Profile, "username" | "rating">;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  escrow_email: string;
  status:
    | "waiting_payment"
    | "payment_confirmed"
    | "waiting_otp"
    | "otp_received"
    | "ready_for_buyer"
    | "completed"
    | "cancelled";
  otp_code: string | null;
  created_at: string;
  listing?: Pick<Listing, "title" | "price">;
}
