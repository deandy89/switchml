import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import AddListingClient from './AddListingClient'
import type { Listing } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seller Dashboard — Switch ML',
}

export default async function SellerPage() {
  // 1. Auth check (cookie-aware)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller')
  }

  // 2. Fetch data using service role client (bypasses RLS)
  const admin = createServerSupabaseClient()

  const { data: listings } = await admin
    .from('listings')
    .select('*, seller:users(username, rating)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: transactions } = await admin
    .from('transactions')
    .select('*, listing:listings(title, price)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await admin
    .from('users')
    .select('username, role, kyc_status')
    .eq('id', user.id)
    .single()

  // ── Access Protection ──
  if (profile?.role !== 'seller') {
    redirect('/')
  }

  if (!profile?.kyc_status) {
    redirect('/kyc')
  }

  const myListings = (listings || []) as Listing[]
  const trxList = transactions || []

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    waiting_payment:   { label: '⏳ Menunggu Pembayaran', color: '#ff00e5' },
    payment_confirmed: { label: '✅ Pembayaran OK', color: '#00d1ff' },
    waiting_otp:       { label: '📡 Menunggu OTP', color: '#00d1ff' },
    otp_received:      { label: '🔓 OTP Diterima', color: '#00ff99' },
    ready_for_buyer:   { label: '🛡️ Ready for Buyer', color: '#00ff99' },
    completed:         { label: '🎉 Selesai', color: '#00ff99' },
  }

  return (
    <main
      style={{
        flex: 1, minHeight: '100vh', background: '#2d004b',
        position: 'relative', overflow: 'hidden', padding: '3rem 1.5rem',
      }}
    >
      {/* Ambient orb */}
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #ff00e515 0%, transparent 70%)',
        top: -150, left: -150, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e0e0e0', margin: '0 0 0.5rem' }}>
            Seller Dashboard
          </h1>
          <p style={{ color: '#808090', margin: 0 }}>
            Selamat datang, <strong style={{ color: '#ff00e5' }}>@{profile?.username || user.email?.split('@')[0]}</strong>. Kelola daganganmu di sini.
          </p>
        </header>

        {/* Add Listing Form */}
        <AddListingClient sellerId={user.id} />

        {/* My Listings */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0e0e0', marginBottom: '1.25rem' }}>
          Akun yang kamu jual ({myListings.length})
        </h3>

        {myListings.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: '#606080' }}>
            Kamu belum menjual akun apapun. Tambahkan titipan akun pertamamu di atas!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {myListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} editable={true} />
            ))}
          </div>
        )}
        {/* Incoming Transactions */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e0e0e0', marginTop: '3rem', marginBottom: '1.25rem' }}>
          Pesanan Masuk ({trxList.length})
        </h3>

        {trxList.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: '#606080' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
            Belum ada pesanan masuk.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trxList.map((trx: any) => {
              const info = STATUS_MAP[trx.status] || { label: trx.status, color: '#e0e0e0' };
              const price = trx.listing?.price
                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.listing.price)
                : null;

              return (
                <Link key={trx.id} href={`/escrow/${trx.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass" style={{
                    padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '1rem', cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem', fontWeight: 600, color: '#e0e0e0',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {trx.listing?.title || `Transaksi #${trx.id.slice(-6)}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#505070', marginTop: '0.2rem' }}>
                        {new Date(trx.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {price && <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00d1ff', flexShrink: 0 }}>{price}</div>}
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px',
                      borderRadius: 9999, border: `1px solid ${info.color}40`,
                      background: `${info.color}10`, color: info.color,
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {info.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  )
}
