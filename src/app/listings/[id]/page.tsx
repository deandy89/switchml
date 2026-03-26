import { createServerSupabaseClient } from '@/lib/supabaseServer';
import type { Listing } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/ImageGallery';
import BuyButton from '@/components/BuyButton';

const RANK_COLORS: Record<string, string> = {
  Mythic: '#ff00e5', 'Mythic Glory': '#ff00e5', Immortal: '#ff00e5',
  Legend: '#ff9900', Epic: '#9b59b6', Grandmaster: '#3498db',
};

function getColor(rank?: string | null): string {
  if (!rank) return '#00d1ff';
  for (const [key, color] of Object.entries(RANK_COLORS)) {
    if (rank.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#00d1ff';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Listing #${id.slice(-6)} — Switch ML` };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, seller:users(username)')
    .eq('id', id)
    .single();

  if (error || !listing) notFound();

  const item = listing as Listing;
  const accent = getColor(item.rank);
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(item.price);

  const stats = [
    item.rank && { icon: '🏆', label: 'Rank', value: item.rank },
    item.hero_count != null && item.hero_count > 0 && { icon: '⚔️', label: 'Heroes', value: String(item.hero_count) },
    item.skin_count != null && item.skin_count > 0 && { icon: '👗', label: 'Skins', value: String(item.skin_count) },
    item.diamonds != null && item.diamonds > 0 && { icon: '💎', label: 'Diamonds', value: String(item.diamonds) },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <main style={{
      flex: 1, minHeight: '100vh', background: '#2d004b',
      position: 'relative', overflow: 'hidden', padding: '2rem 1rem 4rem',
    }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
        top: -150, right: -100, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#505070', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: '#606080', textDecoration: 'none' }}>Marketplace</Link>
          <span>›</span>
          <span style={{ color: '#a0a0c0' }}>#{id.slice(-6)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

          {/* Left: Images + Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Gallery */}
            {item.images && item.images.length > 0 ? (
              <ImageGallery images={item.images} />
            ) : (
              <div style={{
                height: 320, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${accent}15, #2d004b)`,
                border: '1px solid rgba(255,255,255,0.08)', color: '#404060', fontSize: '4rem',
              }}>
                🎮
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div className="glass" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 600, color: '#505070', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>
                  Deskripsi
                </h3>
                <p style={{ color: '#c0c0d0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* Right: Info Card */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Title */}
            <div>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 9999, border: `1px solid ${accent}60`,
                background: `${accent}15`, color: accent,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {item.status === 'available' ? '● Tersedia' : item.status}
              </span>

              <h1 style={{
                fontSize: '1.4rem', fontWeight: 800, color: '#e0e0e0',
                lineHeight: 1.3, margin: '0.75rem 0 0.35rem',
              }}>
                {item.title}
              </h1>

              {item.seller && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#606080' }}>
                  oleh <strong style={{ color: '#a0a0c0' }}>@{item.seller.username}</strong>
                </p>
              )}
            </div>

            {/* Price */}
            <div style={{
              fontSize: '1.8rem', fontWeight: 800, color: accent,
              textShadow: `0 0 12px ${accent}60`,
            }}>
              {formattedPrice}
            </div>

            {/* Stats Grid */}
            {stats.length > 0 && (
              <div className="glass" style={{ padding: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: stats.length > 2 ? '1fr 1fr' : '1fr',
                  gap: '0.75rem',
                }}>
                  {stats.map((s) => (
                    <div key={s.label} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#505070', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e0e0e0' }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buy CTA */}
            {item.status === 'available' && (
              <BuyButton listingId={item.id} accentColor={accent} />
            )}

            {/* Meta */}
            <p style={{ fontSize: '0.7rem', color: '#404060', margin: 0, textAlign: 'center' }}>
              Listing dibuat {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
