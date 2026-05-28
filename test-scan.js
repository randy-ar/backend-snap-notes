require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testScan() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Create a dummy user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'testscan@example.com',
      password: 'password123',
      email_confirm: true
    });
    
    const userId = authData?.user?.id;
    if (!userId) {
       console.log('Failed to create user or user already exists');
    }

    // sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'testscan@example.com',
      password: 'password123',
    });
    
    if (signInError) {
      console.log('SignIn error:', signInError);
      return;
    }
    const token = signInData.session.access_token;

    // Send request
    const form = new FormData();
    form.append('gambar', Buffer.from('fake image data'), 'test.jpg');
    form.append('ocrData', JSON.stringify({
      rawText: "Indomaret",
      imageSize: { width: 100, height: 200 },
      lines: []
    }));

    console.log('Sending request to API...');
    // We install axios locally
    const axiosClient = require('axios');
    const res = await axiosClient.post('http://localhost:3000/api/struk/scan', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true,
    });
    
    console.log('Status:', res.status);
    console.log('Response:', res.data);
    
  } catch (err) {
    console.error('Test script error:', err.message);
  }
}
testScan();
