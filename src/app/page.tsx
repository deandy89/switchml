import ListingCard from '@/components/ListingCard';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import type { Listing } from '@/lib/types';
import type { Metadata } from 'next';

import MarketplaceFilter from '@/components/MarketplaceFilter';

export const metadata: Metadata = {
  title: 'Switch ML — Marketplace Akun Mobile Legends Terpercaya',
  description: 'Beli akun Mobile Legends dengan sistem escrow otomatis. OTP Moonton ditangkap real-time — Zero-Trust, Zero Scam.',
};

async function getListings(searchParams?: { [key: string]: string | undefined }): Promise<Listing[]> {
  try {
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('listings')
      .select('*, seller:users!inner(username, rating)')
      .eq('status', 'available');

    if (searchParams?.q) {
      query = query.ilike('title', `%${searchParams.q}%`);
    }
    if (searchParams?.seller) {
      query = query.ilike('seller.username', `%${searchParams.seller}%`);
    }
    if (searchParams?.min_price) {
      query = query.gte('price', parseInt(searchParams.min_price, 10));
    }
    if (searchParams?.max_price) {
      query = query.lte('price', parseInt(searchParams.max_price, 10));
    }
    if (searchParams?.min_rating) {
      query = query.gte('seller.rating', parseFloat(searchParams.min_rating));
    }
    if (searchParams?.min_hero) {
      query = query.gte('hero_count', parseInt(searchParams.min_hero, 10));
    }
    if (searchParams?.min_skin) {
      query = query.gte('skin_count', parseInt(searchParams.min_skin, 10));
    }
    if (searchParams?.rank) {
      query = query.ilike('rank', `%${searchParams.rank}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) {
      console.error('Fetch listings error:', error);
      return [];
    }
    return data as Listing[];
  } catch (err) {
    console.error('Fetch exception:', err);
    return [];
  }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const listings = await getListings(resolvedParams);

  return (
    <main
      style={{
        flex: 1,
        minHeight: '100vh',
        background: '#2d004b',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 600, height: 600,
        background: 'radial-gradient(circle, #00d1ff18 0%, transparent 70%)',
        top: -200, right: -100, filter: 'blur(80px)', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 400, height: 400,
        background: 'radial-gradient(circle, #ff00e512 0%, transparent 70%)',
        bottom: 0, left: -100, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block', padding: '3px 14px', borderRadius: 9999, marginBottom: '1rem',
            border: '1px solid rgba(0,209,255,0.3)', background: 'rgba(0,209,255,0.08)',
            fontSize: '0.75rem', fontWeight: 600, color: '#00d1ff', letterSpacing: '0.08em',
          }}>
            🛡️ ZERO-TRUST ESCROW SYSTEM
          </div>
          <h1 className="neon-text-blue" style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800,
            lineHeight: 1.15, margin: '0 0 0.75rem',
          }}>
            Marketplace Akun ML
          </h1>
          <p style={{ color: '#808090', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
            Beli dan jual akun Mobile Legends dengan sistem escrow otomatis.
            OTP Moonton ditangkap real-time — tanpa middleman manual.
          </p>
        </div>

        {/* Global Filter & Search Bar */}
        <MarketplaceFilter />

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '1.5rem', justifyContent: 'center',
          marginBottom: '2.5rem', flexWrap: 'wrap',
        }}>
          {[
            { label: 'Listing Aktif', value: listings.length },
            { label: 'Transaksi Aman', value: '1.2K+' },
            { label: 'Seller Terverifikasi', value: '240+' },
          ].map(({ label, value }) => (
            <div key={label} className="glass" style={{ padding: '0.6rem 1.5rem', textAlign: 'center', borderRadius: '0.75rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00d1ff' }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: '#606080', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#505070' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏪</div>
            Belum ada listing tersedia. Jadilah yang pertama berjualan!
          </div>
        )}
      </div>
    </main>
  );
}
