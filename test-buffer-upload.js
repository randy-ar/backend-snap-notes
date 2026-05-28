require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function testUpload() {
  const buffer = Buffer.from('this is a buffer test');
  console.log('Testing Buffer upload to struk-images bucket...');
  const { data, error } = await supabase.storage.from('struk-images').upload('test-buffer.txt', buffer, {
    contentType: 'text/plain',
    upsert: true
  });
  
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}
testUpload();
