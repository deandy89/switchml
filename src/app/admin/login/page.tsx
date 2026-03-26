'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

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

    if (data.user) {
      const { data: profile } = await client
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'admin') {
        await client.auth.signOut();
        setError('Akses Ditolak: Kredensial Admin Tidak Valid.');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.7rem 0.9rem', borderRadius: '0.6rem',
    border: '1px solid rgba(255,80,80,0.3)', background: 'rgba(255,20,20,0.05)',
    color: '#ffe0e0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s', width: '100%',
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0005', position: 'relative', overflow: 'hidden' }}>
      {/* Glitchy red ambient */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,0,50,0.15) 0%, transparent 60%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '1rem' }}
      >
        <div style={{
          background: 'rgba(20,0,5,0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,50,50,0.2)', borderRadius: '1.25rem',
          padding: '2.5rem 2rem', boxShadow: '0 20px 40px rgba(255,0,0,0.15)'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12, margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #ff003c, #990000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: '#fff', boxShadow: '0 0 20px rgba(255,0,50,0.4)',
              border: '1px solid rgba(255,100,100,0.5)'
            }}>🔒</div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#ff4d4d', fontWeight: 800, letterSpacing: '0.05em' }}>
              ADMIN CONSOLE
            </h1>
            <p style={{ margin: '0.2rem 0 0', color: '#ffaaaa', fontSize: '0.8rem' }}>
              Restricted Area. Authorized Personnel Only.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ff6666', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                ADMIN EMAIL
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@switchml.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ff6666', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                ACCESS KEY
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem',
                background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)', color: '#ff8080'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: '0.5rem', padding: '0.8rem', borderRadius: '0.6rem', border: 'none',
              background: loading ? 'rgba(255,50,50,0.2)' : 'linear-gradient(135deg, #e60000, #990000)',
              color: loading ? '#ffaaaa' : '#fff', fontWeight: 800, fontSize: '0.95rem',
              cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.05em',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(255,0,0,0.3)',
              transition: 'all 0.2s'
            }}>
              {loading ? 'AUTHENTICATING...' : 'AUTHORIZE LOGIN SYSTEM'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/" style={{ color: '#ff8080', fontSize: '0.8rem', textDecoration: 'none', borderBottom: '1px solid rgba(255,128,128,0.3)' }}>
              Return to Public Marketplace
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
