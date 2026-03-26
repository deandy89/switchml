'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function BuyButton({ listingId, accentColor }: { listingId: string; accentColor: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleBuy() {
    setLoading(true);
    const client = createClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session) { router.push('/login'); return; }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
      if (!res.ok || !json.ok) {
        alert('Gagal: ' + (json.error || res.statusText));
        setLoading(false);
        return;
      }
      router.push(`/escrow/${json.transactionId}`);
    } catch (err) {
      alert('Error: ' + String(err));
      setLoading(false);
    }
  }

  return (
    <button onClick={handleBuy} disabled={loading}
      style={{
        width: '100%', padding: '0.85rem', borderRadius: '0.6rem', border: 'none',
        background: loading ? 'rgba(0,209,255,0.15)' : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
        color: loading ? `${accentColor}60` : '#001a26',
        fontWeight: 700, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
        boxShadow: loading ? 'none' : `0 0 20px ${accentColor}40`,
        fontFamily: 'inherit', transition: 'all 0.2s',
      }}>
      {loading ? 'Memproses transaksi...' : '🛒 Beli Sekarang'}
    </button>
  );
}
