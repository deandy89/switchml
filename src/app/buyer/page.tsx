import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import EditProfileClient from './EditProfileClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buyer Dashboard — Switch ML',
}

export default async function BuyerPage() {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/buyer')
  }

  // 2. Fetch profile & transactions
  const admin = createServerSupabaseClient()

  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // ── Access Protection ──
  if (profile?.role !== 'buyer') {
    redirect('/')
  }

  if (!profile?.kyc_status) {
    redirect('/kyc')
  }

  // ── KYC Verified → Show Dashboard ──
  const { data: transactions } = await admin
    .from('transactions')
    .select('*, listing:listings(title, price)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const trxList = transactions || []

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    waiting_payment:   { label: '⏳ Menunggu Pembayaran', color: '#ff00e5' },
    payment_confirmed: { label: '✅ Pembayaran OK', color: '#00d1ff' },
    waiting_otp:       { label: '📡 Menunggu OTP', color: '#00d1ff' },
    otp_received:      { label: '🔓 OTP Diterima', color: '#00ff99' },
    completed:         { label: '🎉 Selesai', color: '#00ff99' },
  }

  return (
    <main style={{
      flex: 1, minHeight: '100vh', background: '#2d004b',
      position: 'relative', overflow: 'hidden', padding: '3rem 1.5rem',
    }}>
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #00d1ff15 0%, transparent 70%)',
        top: -150, right: -100, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#e0e0e0', margin: '0 0 0.5rem' }}>
            Buyer Dashboard
          </h1>
          <p style={{ color: '#808090', margin: 0 }}>
            Selamat datang, <strong style={{ color: '#00d1ff' }}>@{profile?.username}</strong>
          </p>
        </header>

        {/* Profile Card */}
        <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00d1ff, #ff00e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 800, color: '#2d004b',
              }}>
                {(profile?.full_name || profile?.username)?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#e0e0e0', fontSize: '1rem' }}>
                  {profile?.full_name || `@${profile?.username}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#606080' }}>{user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              {/* KYC Details */}
              {profile?.gender && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e0e0e0' }}>
                    {profile.gender === 'Laki-laki' ? '♂️' : '♀️'} {profile.age || ''}th
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#606080' }}>Gender/Umur</div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00d1ff' }}>{trxList.length}</div>
                <div style={{ fontSize: '0.6rem', color: '#606080' }}>Transaksi</div>
              </div>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px',
                borderRadius: 9999, border: '1px solid rgba(0,255,153,0.4)',
                background: 'rgba(0,255,153,0.1)', color: '#00ff99',
              }}>
                ✅ KYC Verified
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details & Edit */}
        <div style={{ marginBottom: '2rem' }}>
          <EditProfileClient profile={profile} email={user.email || ''} />
        </div>

        {/* Transactions */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e0e0e0', marginBottom: '1.25rem' }}>
          Riwayat Transaksi
        </h3>

        {trxList.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛒</div>
            <p style={{ color: '#606080', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Belum ada transaksi. Yuk cari akun impianmu di Marketplace!
            </p>
            <Link href="/" style={{
              display: 'inline-block', padding: '0.55rem 1.5rem', borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #00d1ff, #00a8cc)',
              color: '#001a26', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
            }}>
              Jelajahi Marketplace →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trxList.map((trx: {
              id: string; status: string; escrow_email: string; created_at: string;
              listing?: { title: string; price: number } | null;
            }) => {
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
