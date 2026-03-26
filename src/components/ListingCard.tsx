'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Listing } from '@/lib/types';

interface ListingCardProps {
  listing: Listing;
  editable?: boolean;
}

const RANK_COLORS: Record<string, string> = {
  Mythic: '#ff00e5', 'Mythic Glory': '#ff00e5', Immortal: '#ff00e5',
  Legend: '#ff9900',
  Epic: '#9b59b6',
  Grandmaster: '#3498db',
  default: '#00d1ff',
};

function getRankColor(listing: Listing): string {
  if (listing.rank) {
    for (const [rank, color] of Object.entries(RANK_COLORS)) {
      if (listing.rank.toLowerCase().includes(rank.toLowerCase())) return color;
    }
  }
  for (const [rank, color] of Object.entries(RANK_COLORS)) {
    if (listing.title.toLowerCase().includes(rank.toLowerCase())) return color;
  }
  return RANK_COLORS.default;
}

export default function ListingCard({ listing, editable }: ListingCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const accentColor = getRankColor(listing);
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(listing.price);

  const thumbnail = listing.images?.[0] || null;

  async function handleBuy(e: React.MouseEvent) {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (listing.status !== 'available') return;
    setLoading(true);

    const client = createClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session) { router.push('/login'); return; }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ listing_id: listing.id }),
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Network error' }));
      if (!res.ok || !json.ok) {
        if (json.error === 'kyc_required') {
          alert('Selesaikan verifikasi KTP (KYC) kamu terlebih dahulu untuk membeli akun.');
          router.push('/kyc');
        } else {
          alert('Gagal: ' + (json.error || res.statusText));
        }
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
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="glass"
        style={{
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transition: 'box-shadow 0.25s, transform 0.2s', cursor: 'pointer',
          opacity: listing.status === 'available' ? 1 : 0.6,
          height: '100%',
        }}
        onMouseEnter={(e) => {
          if (listing.status !== 'available') return;
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${accentColor}30, 0 0 60px ${accentColor}10`;
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
          (e.currentTarget as HTMLDivElement).style.transform = '';
        }}
      >
        {/* Thumbnail */}
        <div style={{
          height: 160, background: thumbnail ? `url(${thumbnail}) center/cover` : `linear-gradient(135deg, ${accentColor}15, #2d004b)`,
          position: 'relative',
        }}>
          {!thumbnail && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#404060', fontSize: '2.5rem' }}>
              🎮
            </div>
          )}
          {/* Status Badge */}
          <span style={{
            position: 'absolute', top: 10, left: 10,
            fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
            borderRadius: 9999, border: `1px solid ${accentColor}60`,
            background: `rgba(45,0,75,0.85)`, color: accentColor,
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {listing.status === 'available' ? '● Tersedia' : listing.status}
          </span>
          {/* Image count badge */}
          {listing.images && listing.images.length > 1 && (
            <span style={{
              position: 'absolute', top: 10, right: 10, fontSize: '0.6rem', fontWeight: 600,
              padding: '2px 6px', borderRadius: 9999,
              background: 'rgba(0,0,0,0.6)', color: '#e0e0e0',
              backdropFilter: 'blur(8px)',
            }}>
              📷 {listing.images.length}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Title */}
          <h2 style={{
            margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e0e0e0',
            lineHeight: 1.35, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.title}
          </h2>

          {/* Stats row */}
          {(listing.rank || listing.hero_count || listing.skin_count || listing.diamonds) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {listing.rank && (
                <StatBadge label={listing.rank} color={accentColor} />
              )}
              {listing.hero_count != null && listing.hero_count > 0 && (
                <StatBadge label={`${listing.hero_count} Hero`} color="#00d1ff" />
              )}
              {listing.skin_count != null && listing.skin_count > 0 && (
                <StatBadge label={`${listing.skin_count} Skin`} color="#ff9900" />
              )}
              {listing.diamonds != null && listing.diamonds > 0 && (
                <StatBadge label={`💎 ${listing.diamonds}`} color="#9b59b6" />
              )}
            </div>
          )}

          {/* Seller */}
          {listing.seller && (
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#505070' }}>oleh @{listing.seller.username}</p>
          )}

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <span style={{
              fontSize: '1.1rem', fontWeight: 800, color: accentColor,
              textShadow: `0 0 8px ${accentColor}80`,
            }}>
              {formattedPrice}
            </span>

            {editable ? (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/seller/edit/${listing.id}`); }}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '0.5rem',
                  border: `1px solid ${accentColor}60`,
                  background: `${accentColor}15`,
                  color: accentColor,
                  fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                ✏️ Edit Listing
              </button>
            ) : listing.status === 'available' ? (
              <button id={`buy-${listing.id}`} onClick={handleBuy} disabled={loading}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '0.5rem',
                  border: `1px solid ${loading ? '#a0a0c060' : accentColor + '60'}`,
                  background: loading ? '#a0a0c015' : `${accentColor}15`,
                  color: loading ? '#a0a0c0' : accentColor,
                  fontSize: '0.75rem', fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                {loading ? 'Proses...' : 'Beli →'}
              </button>
            ) : (
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#606080' }}>Tidak Tersedia</div>
            )}
          </div>
          {/* Seller Info */}
          <div
            onClick={(e) => {
              if (!listing.seller?.username) return;
              e.preventDefault();
              e.stopPropagation();
              router.push(`/u/${listing.seller.username}`);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem',
              cursor: 'pointer', padding: '0.2rem 0.4rem', marginLeft: '-0.4rem', borderRadius: '0.3rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e0e0e0' }}>
              👤 {listing.seller?.username || 'Anonim'}
            </span>
            {listing.seller?.rating !== undefined && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffcc00', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>★</span>
                {Number(listing.seller.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 600, padding: '1px 6px',
      borderRadius: 9999, border: `1px solid ${color}40`,
      background: `${color}10`, color: color,
    }}>
      {label}
    </span>
  );
}
