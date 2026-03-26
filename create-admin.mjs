import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'admin@switchml.com';
  const password = 'password123';

  console.log(`Creating Admin Authentication for ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = authData?.user?.id;

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists, force updating password and confirmation state...');
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === email);
      if (existing) {
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
      }
    } else {
      console.error('Auth Creation Failed:', authError);
      return;
    }
  }

  console.log(`Injecting into public.users table...`);

  if (!userId) {
     console.error('Failed to resolve an ID for the user.');
     return;
  }

  const { error } = await supabase.from('users').upsert({
    id: userId,
    role: 'admin',
    kyc_status: true,
    username: 'PemilikSistem',
    whatsapp_no: '00000000',
    balance: 9999999,
    rating: 5.0
  });

  if (error) {
    console.error('Public.Users Error:', error);
  } else {
    console.log(`✅ SUCCESS! Admin created.`);
    console.log(`Email: ${email}`);
    console.log(`Pass:  ${password}`);
  }
}
main();
