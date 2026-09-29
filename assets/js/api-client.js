/* ============ SIGNETT — SUPABASE CLIENT + API HELPER ============ */
(function () {
  // 👇 PASTE YOUR OWN VALUES HERE
  const SUPABASE_URL = 'https://qscqxqxxcuujmegiaxjh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY3F4cXh4Y3V1am1lZ2lheGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTA5NzIsImV4cCI6MjEwNjI2Njk3Mn0.k14wYq0O4oZVajqRdcXNdN2meoggD8G7PSEoPfGoTJI';

  // The CDN script puts the LIBRARY on window.supabase.
  // We convert it into a live CLIENT so .auth / .from work everywhere.
  const lib = window.supabase;
  if (lib && typeof lib.createClient === 'function') {
    window.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
})();

async function callApi(path, body = {}) {
  const { data: { session } } = await window.supabase.auth.getSession();
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error. Please try again.' };
  }
}
