require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function testUpload() {
  console.log('Testing upload to struk-images bucket...');
  const { data, error } = await supabase.storage.from('struk-images').upload('test-upload.txt', 'hello world', {
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
