'use server';

import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  // 1. Get real user session from cookies
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  // 2. Check role (can use service role for this to bypass RLS if needed, or stick to client)
  const { data: profile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Unauthorized');
  
  // 3. Return SERVICE ROLE client for the actual CRUD operation
  return createServerSupabaseClient();
}

export async function deleteUserAction(userId: string) {
  try {
    const supabase = await checkAdmin();
    // Warning: Deleting from public.users cascades to their listings etc depending on foreign keys constraint setup.
    // Full auth cascade should be handled by a DB trigger or RPC.
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTransactionAction(txId: string) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTransactionStatusAction(txId: string, status: string) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('transactions').update({ status }).eq('id', txId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createUserAction(userData: any) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('users').insert([userData]);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateUserAction(userId: string, userData: any) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('users').update(userData).eq('id', userId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createTransactionAction(txData: any) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('transactions').insert([txData]);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTransactionAction(txId: string, txData: any) {
  try {
    const supabase = await checkAdmin();
    const { error } = await supabase.from('transactions').update(txData).eq('id', txId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
