/* ============ SIGNETT SHARED COMPONENTS ============ */
window.SIGNETT = window.SIGNETT || {};

SIGNETT.money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

SIGNETT.renderNav = function () {
  const page = (location.pathname.split('/').pop() || 'home.html');
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <a href="home.html" class="bn-item ${page === 'home.html' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg><span>Home</span></a>
    <a href="product.html" class="bn-item ${page === 'product.html' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3v16h18V8zm-2 10H5V6h10v2h5v10z"/></svg><span>Product</span></a>
    <a href="advance-sale.html" class="bn-item bn-center ${page === 'advance-sale.html' ? 'active' : ''}">
      <div class="bn-icon"><svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68A2.99 2.99 0 0 0 9 2a3 3 0 0 0-3 3c0 .35.07.69.18 1H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg></div>
      <span>Advance sale</span></a>
    <a href="community.html" class="bn-item ${page === 'community.html' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><span>Community</span></a>
    <a href="me.html" class="bn-item ${page === 'me.html' ? 'active' : ''}">
      <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Me</span></a>`;
  document.body.appendChild(nav);
};

SIGNETT.renderHeader = function (title, rightHtml = '') {
  const h = document.createElement('header');
  h.className = 'app-header';
  h.innerHTML = `<div class="side"></div><div class="title">${title}</div><div class="side right">${rightHtml}</div>`;
  document.body.prepend(h);
  return h;
};

SIGNETT.renderSubHeader = function (title, backHref) {
  const h = document.createElement('header');
  h.className = 'sub-header';
  const href = backHref || 'javascript:history.back()';
  h.innerHTML = `<a class="back" href="${backHref || '#'}" ${backHref ? '' : 'onclick="history.back();return false;"'}>‹ Back</a><div class="title">${title}</div>`;
  document.body.prepend(h);
  return h;
};

SIGNETT.loadMarquee = async function (elId) {
  const el = document.getElementById(elId);
  if (!el || !window.supabase) return;
  const { data } = await window.supabase.from('announcements').select('message').eq('is_active', true).order('created_at', { ascending: false }).limit(5);
  if (data && data.length) {
    const msgs = data.map(d => '📢 ' + d.message).join('  •  ');
    el.innerHTML = `<div class="marquee-track">${msgs}</div>`;
  } else el.style.display = 'none';
};
