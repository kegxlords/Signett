document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) { location.href = '../auth/login.html'; return; }

  const { data: profile } = await window.supabase
    .from('profiles').select('is_active, is_admin, referral_code, full_name')
    .eq('id', session.user.id).single();

  if (profile && profile.is_active === false) {
    await window.supabase.auth.signOut();
    location.href = '../auth/login.html?banned=1';
    return;
  }
  window.CURRENT_USER = { id: session.user.id, session, profile };
  document.dispatchEvent(new CustomEvent('user:ready'));
});
