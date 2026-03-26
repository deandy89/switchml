import { createClient } from "@supabase/supabase-js";

// Use: node --env-file=.env.local src/app/api/webhook/xendit/test_logic.mjs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
  const external_id = '523c012b-d365-4ef0-9559-11bec5a0f3f2';
  const status = 'PAID';

  console.log(`Testing update for ${external_id} with status ${status}...`);

  const { data, error } = await supabase
    .from('transactions')
    .update({ status: 'process' })
    .eq('id', external_id)
    .select();

  if (error) {
    console.error("Update Error:", error.message);
  } else {
    console.log("Update Success:", data);
  }
}

testUpdate();
