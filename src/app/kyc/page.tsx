import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KycForm from '@/components/KycForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KYC Verification — Switch ML',
}

export default async function KycPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/kyc')
  }

  const admin = createServerSupabaseClient()
  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const kycStatus = profile?.kyc_status || false;

  // 1. KTP Sudah Lolos (Verified)
  if (kycStatus) {
    // Kalau sudah verified, arahkan ke dashboard masing-masing
    const destination = profile?.role === 'seller' ? '/seller' : (profile?.role === 'buyer' ? '/buyer' : '/');
    redirect(destination);
  }

  // 2. KTP Belum Diupload
  return (
    <main style={{
      flex: 1, minHeight: '100vh', background: '#2d004b',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '3rem 1rem',
    }}>
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #00d1ff15 0%, transparent 70%)',
        top: -150, right: -100, filter: 'blur(80px)', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <KycForm
          userId={user.id}
          username={profile?.username || ''}
          whatsappNo={profile?.whatsapp_no || ''}
        />
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" style={{
            color: '#808090', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
          }}>
            Nanti saja, kembali ke Beranda →
          </Link>
        </div>
      </div>
    </main>
  )
}
