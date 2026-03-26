'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hide Navbar for any /admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const client = createClient();

    // Get initial session
    client.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await client.from('users').select('role').eq('id', data.user.id).single();
        if (profile) setRole(profile.role);
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const client = createClient();
    await client.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        background: 'rgba(45, 0, 75, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 30, height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00d1ff, #ff00e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, color: '#2d004b',
              flexShrink: 0,
            }}
          >
            SW
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e0e0e0', letterSpacing: '-0.02em' }}>
            Switch ML
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <NavLink href="/">Marketplace</NavLink>

          {loading ? null : user ? (
            <>
              <NavLink href={role === 'seller' ? '/profile' : '/buyer'}>Profile</NavLink>
              {role === 'seller' && <NavLink href="/seller">Seller Dashboard</NavLink>}
              <button
                id="logout-btn"
                onClick={handleLogout}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.35rem 0.9rem',
                  borderRadius: 9999,
                  border: '1px solid rgba(255,0,229,0.4)',
                  background: 'rgba(255,0,229,0.08)',
                  color: '#ff00e5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <Link
                href="/register"
                style={{
                  marginLeft: '0.25rem',
                  padding: '0.35rem 0.9rem',
                  borderRadius: 9999,
                  border: '1px solid rgba(0,209,255,0.5)',
                  background: 'rgba(0,209,255,0.10)',
                  color: '#00d1ff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 0 10px rgba(0,209,255,0.2)',
                  transition: 'all 0.15s',
                }}
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '0.35rem 0.75rem',
        borderRadius: 6,
        color: '#a0a0c0',
        fontSize: '0.85rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
    >
      {children}
    </Link>
  );
}
