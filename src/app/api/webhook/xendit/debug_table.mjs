import { createClient } from "@supabase/supabase-js";

// Use: node --env-file=.env.local src/app/api/webhook/xendit/debug_table.mjs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransactions() {
  console.log("Checking transactions table...");
  const { data, error } = await supabase.from("transactions").select("*").limit(10);
  if (error) {
    console.error("Error fetching transactions:", error.message);
  } else {
    console.log("Transactions sampled:", data.map(t => ({ id: t.id, status: t.status })));
  }
}

checkTransactions();
