'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const client = createClient();

    const { error: authError, data } = await client.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fetch user profile to check KYC status and role
    if (data.user) {
      const { data: profile } = await client
        .from('users')
        .select('role, kyc_status')
        .eq('id', data.user.id)
        .single();
      
      const kycStatus = profile?.kyc_status || false;
      const role = profile?.role || 'buyer';

      if (role === 'admin') {
        await client.auth.signOut();
        setError('Silakan gunakan portal admin untuk login.');
        setLoading(false);
        return;
      }

      if (!kycStatus) {
        router.push('/kyc');
      } else {
        const nextUrl = searchParams.get('next') || (role === 'seller' ? '/seller' : '/');
        router.push(nextUrl);
      }
    } else {
      router.push('/');
    }
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Card */}
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
            Selamat Datang
          </h1>
          <p style={{ color: '#606080', fontSize: '0.9rem', margin: 0 }}>
            Login ke akun Switch ML kamu
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField
            id="email" label="Email" type="email"
            value={email} onChange={setEmail}
            placeholder="gamer@email.com"
          />
          <FormField
            id="password" label="Password" type="password"
            value={password} onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <div style={{
              padding: '0.6rem 0.9rem', borderRadius: '0.5rem',
              background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)',
              color: '#ff8080', fontSize: '0.82rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <motion.button
            id="login-submit"
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            style={{
              marginTop: '0.5rem',
              padding: '0.8rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: loading
                ? 'rgba(0,209,255,0.15)'
                : 'linear-gradient(135deg, #00d1ff, #00a8cc)',
              color: loading ? '#00d1ff80' : '#001a26',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 20px rgba(0,209,255,0.35)',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Masuk...' : 'Masuk →'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#606080', fontSize: '0.85rem' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: '#00d1ff', textDecoration: 'none', fontWeight: 600 }}>
            Daftar sekarang
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: '#00d1ff' }}>Memuat...</div>}>
      <LoginForm />
    </Suspense>
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
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          padding: '0.7rem 0.9rem',
          borderRadius: '0.6rem',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          color: '#e0e0e0',
          fontSize: '0.9rem',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#00d1ff60')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
      />
    </div>
  );
}
