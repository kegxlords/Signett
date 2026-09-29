document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) { location.href = '../auth/login.html'; return; }
  const { data: profile } = await window.supabase.from('profiles').select('is_admin, is_active').eq('id', session.user.id).single();
  if (!profile || !profile.is_admin) { location.href = '../app/home.html'; return; }
  window.CURRENT_ADMIN = { id: session.user.id, session };
  document.dispatchEvent(new CustomEvent('admin:ready'));
});
