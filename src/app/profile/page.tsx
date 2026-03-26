import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import EditProfileClient from '@/app/buyer/EditProfileClient'

export const metadata: Metadata = {
  title: 'Profile — Switch ML',
}

export default async function ProfilePage() {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  // 2. Fetch profile
  const admin = createServerSupabaseClient()
  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Route protection - Must be KYC verified
  if (!profile?.kyc_status) {
    redirect('/kyc')
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
            My Profile
          </h1>
          <p style={{ color: '#808090', margin: 0 }}>
            Informasi lengkap akun <strong style={{ color: '#00d1ff' }}>@{profile?.username}</strong>
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

      </div>
    </main>
  )
}
