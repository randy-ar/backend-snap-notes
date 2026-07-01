require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = createClient(url, key);
  
  console.log("Checking buckets...");
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) {
    console.error("Bucket Error:", bucketError);
  } else {
    console.log("Buckets:", buckets.map(b => b.name));
  }
  
  console.log("Trying to upload a file...");
  const { data, error } = await client.storage.from('struk-images').upload('test.txt', 'hello world', { upsert: true });
  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}

test();
