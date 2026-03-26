import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check the current user before signing out (optional but good for referer check)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Sign out
  await supabase.auth.signOut();

  const referer = req.headers.get('referer') || '';
  const isAdmin = referer.includes('/admin');

  // Redirect to appropriate login page
  const redirectUrl = isAdmin ? new URL('/admin/login', req.url) : new URL('/login', req.url);
  
  return NextResponse.redirect(redirectUrl, {
    status: 302,
  });
}
