import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EditListingClient from './EditListingClient'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Edit Listing — Switch ML' }

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/seller');

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (!listing) redirect('/seller');
  // Security check: Must own the listing
  if (listing.seller_id !== user.id) redirect('/seller');

  return (
    <main style={{ minHeight: '100vh', background: '#2d004b', padding: '3rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orb */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, #00d1ff15 0%, transparent 70%)',
        top: -150, left: -200, filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/seller" style={{ color: '#00d1ff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Kembali ke Dashboard
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e0e0e0', margin: '1rem 0 0' }}>
            Edit Titipan Akun
          </h1>
        </div>

        <EditListingClient listing={listing} />
      </div>
    </main>
  );
}
