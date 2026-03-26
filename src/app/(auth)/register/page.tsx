'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

export default function RegisterPage() {
  const [username, setUsername]   = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'buyer' | 'seller'>('buyer');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const client = createClient();

    const { data, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Tahap 2: Sinkronisasi data ke tabel public.users
    if (data.user) {
      const { error: insertError } = await client
        .from('users')
        .insert([
          {
            id: data.user.id,
            username: username,
            whatsapp_no: whatsappNo,
            role: role,
            kyc_status: false
          },
        ]);

      if (insertError) {
        console.error('Gagal sinkronisasi profil user:', insertError);
        // Supabase might have RLS preventing this if email confirmation is required,
        // or a trigger might already do it. But we follow the explicit instruction.
      }
    }

    // Supabase may require email confirmation
    if (data.user && !data.session) {
      setSuccess('✅ Akun dibuat! Cek email kamu untuk konfirmasi sebelum login.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass" style={{ padding: '2.5rem 2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #00d1ff, #ff00e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: '#2d004b',
            margin: '0 auto 1rem',
          }}>SW</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e0e0e0', margin: '0 0 0.25rem' }}>
            Buat Akun
          </h1>
          <p style={{ color: '#606080', fontSize: '0.9rem', margin: 0 }}>
            Bergabung dengan Switch ML Marketplace
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Role Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a0a0c0', letterSpacing: '0.05em' }}>
              MENDAFTAR SEBAGAI
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{
                cursor: 'pointer', padding: '0.8rem', borderRadius: '0.6rem', textAlign: 'center',
                border: `1px solid ${role === 'buyer' ? '#00d1ff' : 'rgba(255,255,255,0.12)'}`,
                background: role === 'buyer' ? 'rgba(0,209,255,0.1)' : 'rgba(255,255,255,0.02)',
                color: role === 'buyer' ? '#00d1ff' : '#808090', fontWeight: 600, fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}>
                <input type="radio" name="role" value="buyer" checked={role === 'buyer'}
                  onChange={() => setRole('buyer')} style={{ display: 'none' }} />
                🛍️ Pembeli
              </label>
              <label style={{
                cursor: 'pointer', padding: '0.8rem', borderRadius: '0.6rem', textAlign: 'center',
                border: `1px solid ${role === 'seller' ? '#ff00e5' : 'rgba(255,255,255,0.12)'}`,
                background: role === 'seller' ? 'rgba(255,0,229,0.1)' : 'rgba(255,255,255,0.02)',
                color: role === 'seller' ? '#ff00e5' : '#808090', fontWeight: 600, fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}>
                <input type="radio" name="role" value="seller" checked={role === 'seller'}
                  onChange={() => setRole('seller')} style={{ display: 'none' }} />
                🏪 Penjual
              </label>
            </div>
          </div>

          <FormField id="username" label="Username" type="text"
            value={username} onChange={setUsername} placeholder="GamerKeren88" />
          <FormField id="whatsapp_no" label="Nomor WhatsApp" type="tel"
            value={whatsappNo} onChange={setWhatsappNo} placeholder="08123456789" />
          <FormField id="email" label="Email" type="email"
            value={email} onChange={setEmail} placeholder="gamer@email.com" />
          <FormField id="password" label="Password" type="password"
            value={password} onChange={setPassword} placeholder="Min. 6 karakter" />

          {error && (
            <div style={{
              padding: '0.6rem 0.9rem', borderRadius: '0.5rem',
              background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)',
              color: '#ff8080', fontSize: '0.82rem',
            }}>⚠️ {error}</div>
          )}
          {success && (
            <div style={{
              padding: '0.6rem 0.9rem', borderRadius: '0.5rem',
              background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.3)',
              color: '#00d1ff', fontSize: '0.82rem',
            }}>{success}</div>
          )}

          <motion.button
            id="register-submit"
            type="submit"
            disabled={loading || !!success}
            whileHover={{ scale: (loading || !!success) ? 1 : 1.02 }}
            whileTap={{ scale: (loading || !!success) ? 1 : 0.97 }}
            style={{
              marginTop: '0.5rem',
              padding: '0.8rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: (loading || !!success)
                ? 'rgba(255,0,229,0.15)'
                : 'linear-gradient(135deg, #ff00e5, #cc00b8)',
              color: (loading || !!success) ? '#ff00e580' : '#fff',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: (loading || !!success) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || !!success) ? 'none' : '0 0 20px rgba(255,0,229,0.3)',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Mendaftar...' : '🚀 Daftar Sekarang'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#606080', fontSize: '0.85rem' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: '#00d1ff', textDecoration: 'none', fontWeight: 600 }}>
            Login di sini
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

function FormField({
  id, label, type, value, onChange, placeholder,
}: {
  id: string; label: string; type: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label htmlFor={id} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a0a0c0', letterSpacing: '0.05em' }}>
        {label.toUpperCase()}
      </label>
      <input
        id={id} type={type} value={value} required
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '0.7rem 0.9rem', borderRadius: '0.6rem',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          color: '#e0e0e0', fontSize: '0.9rem',
          outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#ff00e560')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
      />
    </div>
  );
}
