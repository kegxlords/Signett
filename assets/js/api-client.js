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
