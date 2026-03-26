import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cookie-aware Supabase client for Server Components & Server Actions.
 * This client can read the user's auth session from cookies set by the browser client.
 * Use this when you need to verify who the logged-in user is on the server side.
 *
 * For admin/service-role operations (bypassing RLS), use createServerSupabaseClient() instead.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from Server Components where cookies
            // can't be set — this is expected and safe to ignore.
          }
        },
      },
    }
  );
}
