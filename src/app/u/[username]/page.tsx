import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ListingCard from '@/components/ListingCard'
import type { Listing } from '@/lib/types'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `Profil @${username} — Switch ML` };
}

export default async function PublicSellerProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createServerSupabaseClient();

  // 1. Fetch user (seller) stats
  const { data: seller } = await supabase
    .from('users')
    .select('id, username, rating, created_at, kyc_status')
    .eq('username', username)
    .single();

  if (!seller) {
    return (
      <main style={{ flex: 1, minHeight: '100vh', background: '#2d004b', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '2rem' }}>Seller Tidak Ditemukan</h1>
        <p style={{ color: '#808090' }}>Username @{username} tidak terdaftar di sistem.</p>
      </main>
    );
  }

  // 2. Fetch all their available listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*, seller:users(username, rating)')
    .eq('seller_id', seller.id)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  const activeListings = (listings || []) as Listing[];
  const joinedDate = new Date(seller.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

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
      {/* Background Orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #ff00e515 0%, transparent 70%)',
        top: -100, right: -100, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        {/* Profile Header */}
        <div className="glass" style={{
          padding: '2.5rem', borderRadius: '1.25rem', marginBottom: '3rem',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
        }}>
          {/* Avatar Placeholder */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff00e5, #00d1ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', color: '#fff', fontWeight: 800,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            boxShadow: '0 0 25px rgba(0,209,255,0.3)'
          }}>
            {seller.username.charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                @{seller.username}
              </h1>
              {seller.kyc_status && (
                <span title="Terverifikasi KYC" style={{ fontSize: '1.5rem' }}>✅</span>
              )}
            </div>
            
            <p style={{ color: '#a0a0c0', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Bergabung sejak {joinedDate}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#606080', fontWeight: 600, letterSpacing: '0.05em' }}>RATING</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffcc00' }}>
                  ★ {Number(seller.rating).toFixed(1)} / 5.0
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#606080', fontWeight: 600, letterSpacing: '0.05em' }}>AKUN AKTIF</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00d1ff' }}>
                  {activeListings.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Title */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e0e0e0', marginBottom: '1.5rem' }}>
          Semua Akun dari @{seller.username}
        </h2>

        {/* Listings Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {activeListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {activeListings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#505070' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏷️</div>
            Seller ini sedang tidak menjual akun apapun saat ini.
          </div>
        )}
      </div>
    </main>
  );
}
