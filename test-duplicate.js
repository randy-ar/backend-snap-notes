require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = createClient(url, key);
  
  const buffer = Buffer.from('fake image content');
  
  // Upload first time
  await client.storage.from('struk-images').upload('struk/duplicate.jpg', buffer, { upsert: false });
  
  // Upload second time (duplicate)
  const { data, error } = await client.storage.from('struk-images').upload('struk/duplicate.jpg', buffer, { upsert: false });
  
  if (error) {
    console.error("Duplicate Error:", error.message);
  } else {
    console.log("Upload Success:", data);
  }
}

test();
