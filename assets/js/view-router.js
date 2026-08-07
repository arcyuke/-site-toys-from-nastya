(() => {
  const STORAGE_KEY = 'nastusha-toys-view-mode';
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('view');

  function savePreference(value) {
    try { localStorage.setItem(STORAGE_KEY, value); }
    catch { /* routing still works without persistent storage */ }
  }

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch { return null; }
  }

  if (requested === 'desktop' || requested === 'mobile') {
    savePreference(requested);
  }

  const preference = requested === 'desktop' || requested === 'mobile'
    ? requested
    : readPreference();

  const path = window.location.pathname;
  const onMobileVersion = /\/mobilebasic(?:\/|$)/.test(path);
  const onAdmin = /\/admin\.html$/.test(path);

  const narrowScreen = window.matchMedia('(max-width: 820px)').matches;
  const touchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const mobileBrowser = /Android|iPhone|iPod|Mobile|IEMobile|Windows Phone|Telegram/i.test(navigator.userAgent);
  const looksLikePhone = narrowScreen && (touchDevice || mobileBrowser);

  const shouldUseMobile = preference === 'mobile' || (preference !== 'desktop' && looksLikePhone);

  function cleanSearch() {
    const next = new URLSearchParams(window.location.search);
    next.delete('view');
    const value = next.toString();
    return value ? `?${value}` : '';
  }

  function mobileTarget() {
    if (/\/product_months\.html$/.test(path)) return `mobilebasic/product.html${cleanSearch()}${window.location.hash}`;
    if (/\/bag\.html$/.test(path)) return `mobilebasic/bag.html${cleanSearch()}${window.location.hash}`;
    if (/\/about\.html$/.test(path)) return `mobilebasic/about.html${cleanSearch()}${window.location.hash}`;
    return `mobilebasic/${cleanSearch()}${window.location.hash}`;
  }

  function desktopTarget() {
    if (/\/mobilebasic\/product\.html$/.test(path)) return `../product_months.html${cleanSearch()}${window.location.hash}`;
    if (/\/mobilebasic\/bag\.html$/.test(path)) return `../bag.html${cleanSearch()}${window.location.hash}`;
    if (/\/mobilebasic\/about\.html$/.test(path)) return `../about.html${cleanSearch()}${window.location.hash}`;
    return `../index.html${cleanSearch()}${window.location.hash}`;
  }

  if (!onAdmin && !onMobileVersion && shouldUseMobile) {
    window.location.replace(mobileTarget());
    return;
  }

  if (!onAdmin && onMobileVersion && !shouldUseMobile) {
    window.location.replace(desktopTarget());
    return;
  }

  if (requested) {
    const cleanUrl = `${window.location.pathname}${cleanSearch()}${window.location.hash}`;
    window.history.replaceState(null, '', cleanUrl);
  }
})();
