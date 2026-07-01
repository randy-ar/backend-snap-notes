require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = createClient(url, key);
  
  const { data, error } = await client.rpc('get_policies', {}).catch(() => ({error: 'rpc missing'}));
  
  const { data: buckets } = await client.storage.listBuckets();
  console.log(buckets);
}

test();
