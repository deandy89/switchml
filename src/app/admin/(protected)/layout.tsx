import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0002', color: '#ffe0e0', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', background: 'rgba(255,0,0,0.1)', borderBottom: '1px solid rgba(255,50,50,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 35, height: 35, background: 'linear-gradient(135deg, #ff003c, #990000)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>SW</div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#ff4d4d', letterSpacing: '0.1em' }}>ADMIN OPERATIONS</h1>
        </div>
        <form action="/auth/signout" method="POST">
          <button type="submit" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
            System Logout
          </button>
        </form>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
