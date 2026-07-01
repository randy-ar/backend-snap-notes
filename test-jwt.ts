import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const key = envConfig.SUPABASE_SERVICE_ROLE_KEY;
if (key) {
  const base64Url = key.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  console.log(JSON.parse(jsonPayload));
}
