require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = createClient(url, key);
  
  const buffer = Buffer.from('');
  
  console.log("Trying to upload an empty buffer...");
  const { data, error } = await client.storage.from('struk-images').upload('struk/test-empty.jpg', buffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}

test();
