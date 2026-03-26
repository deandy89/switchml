import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: userData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const targetEmails = ['deandy@swicthml.online', 'deandysyahrial89@gmail.com'];
  
  for (const email of targetEmails) {
    const admin = userData?.users?.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (admin) {
      console.log('Upgrading', email, 'to admin...');
      await supabase.from('users').upsert({
        id: admin.id,
        role: 'admin',
        kyc_status: true,
        username: email.split('@')[0],
        whatsapp_no: '000',
        balance: 10000000,
        rating: 5.0
      });
      console.log('Success for', email);
    }
  }
  console.log('Finished mass upgrade.');
}
main();
