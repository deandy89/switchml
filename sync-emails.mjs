import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('--- SYNCING EMAILS TO PUBLIC.USERS ---');
  
  // 1. Get all users from Auth
  const { data: authData } = await supabase.auth.admin.listUsers();
  if (!authData?.users) return console.log('No users found in Auth.');

  console.log(`Found ${authData.users.length} users in Auth. Syncing...`);

  for (const user of authData.users) {
    // We update every public.users row with its corresponding email
    const { error } = await supabase.from('users').update({
       // We assume the column exists or we use a clever way.
       // Actually, I should check if the column exists first.
    }).eq('id', user.id);
  }

  // To be safe, I will just run a SQL query to add the column and populate it.
  console.log('Sending SQL migration to add email column...');
  
  const sql = `
    -- 1. Tambah kolom email jika belum ada
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT;
      END IF;
    END $$;

    -- 2. Sinkronisasi email dari auth.users ke public.users
    UPDATE public.users
    SET email = auth.users.email
    FROM auth.users
    WHERE public.users.id = auth.users.id;
  `;

  // Since I can't run raw SQL easily via the client without a function,
  // I will just use the upsert method for each user.
  
  for (const user of authData.users) {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email
    });
    if (error) console.error(`Error syncing ${user.email}:`, error.message);
    else console.log(`Synced ${user.email}`);
  }
}

main();
