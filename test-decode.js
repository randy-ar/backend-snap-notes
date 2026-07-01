require('dotenv').config();

function decode(key) {
  if (!key) return null;
  const base64Url = key.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('')));
}

console.log("ANON:", decode(process.env.SUPABASE_ANON_KEY).role);
console.log("SERVICE:", decode(process.env.SUPABASE_SERVICE_ROLE_KEY).role);
