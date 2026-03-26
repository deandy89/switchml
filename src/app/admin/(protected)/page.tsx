import { createClient } from '@/utils/supabase/server';
import AdminDashboardClient from '@/app/admin/AdminDashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Workspace — Switch ML' };

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch all users
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch all transactions with relations
  const { data: allTx } = await supabase
    .from('transactions')
    .select('*, seller:users!seller_id(username), buyer:users!buyer_id(username)')
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ color: '#ff4d4d', letterSpacing: '0.05em', marginBottom: '2rem' }}>DASHBOARD OVERVIEW</h2>
      <AdminDashboardClient initialUsers={allUsers || []} initialTransactions={allTx || []} />
    </div>
  );
}
