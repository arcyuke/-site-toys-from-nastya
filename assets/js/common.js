const IS_MOBILE_BASIC = /\/mobilebasic(?:\/|$)/.test(window.location.pathname);
const SITE_ROOT = IS_MOBILE_BASIC ? '../' : '';
const VERSION_STORAGE_KEY = 'nastusha-toys-view-mode';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.classList.add('has-live-motion');

function pageForVersion(targetVersion) {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  params.delete('view');
  params.set('view', targetVersion);
  const search = `?${params.toString()}`;

  if (targetVersion === 'desktop') {
    if (/\/mobilebasic\/product\.html$/.test(path)) return `../product_months.html${search}`;
    if (/\/mobilebasic\/bag\.html$/.test(path)) return `../bag.html${search}`;
    if (/\/mobilebasic\/about\.html$/.test(path)) return `../about.html${search}`;
    return `../index.html${search}`;
  }

  if (/\/product_months\.html$/.test(path)) return `mobilebasic/product.html${search}`;
  if (/\/bag\.html$/.test(path)) return `mobilebasic/bag.html${search}`;
  if (/\/about\.html$/.test(path)) return `mobilebasic/about.html${search}`;
  return `mobilebasic/${search}`;
}

function footerMarkup() {
  const aboutHref = 'about.html';
  const adminHref = `${SITE_ROOT}admin.html`;
  const switchMode = IS_MOBILE_BASIC ? 'desktop' : 'mobile';
  const switchLabel = IS_MOBILE_BASIC ? 'полная версия' : 'мобильная версия';
  const switchHref = pageForVersion(switchMode);

  return `
<footer class="main-footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3>настюшины игрушки</h3>
      <p>маленькие друзья для больших объятий</p>
      <p>бережная упаковка и помощь с выбором</p>
    </div>
    <div class="footer-section">
      <h3>заказы</h3>
      <p><a href="https://t.me/SKIANORAK" target="_blank" rel="noreferrer">написать в telegram</a></p>
      <p>доставка рассчитывается отдельно</p>
    </div>
    <div class="footer-section">
      <h3>информация</h3>
      <p><a href="${aboutHref}">о магазине</a></p>
      <p><a href="${switchHref}" data-view-switch="${switchMode}">${switchLabel}</a></p>
      <p><a href="${adminHref}" class="admin-entry">админка</a></p>
    </div>
  </div>
  <div class="footer-bottom">© <span data-current-year></span> настюшины игрушки ♡</div>
</footer>`;
}

function mountFooter() {
  document.querySelectorAll('[data-site-footer]').forEach((node) => {
    node.innerHTML = footerMarkup();
  });

  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll('[data-view-switch]').forEach((link) => {
    link.addEventListener('click', () => {
      try { localStorage.setItem(VERSION_STORAGE_KEY, link.dataset.viewSwitch); }
      catch { /* the query parameter still switches the version */ }
    });
  });
}

function getSharedCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart_guest')) || [];
    return cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0);
  } catch {
    return 0;
  }
}

function mountMobileCartDock() {
  if (!IS_MOBILE_BASIC || /\/mobilebasic\/bag\.html$/.test(window.location.pathname)) return;

  const dock = document.createElement('a');
  dock.className = 'mobile-cart-dock';
  dock.href = 'bag.html';
  dock.setAttribute('aria-label', 'открыть корзинку');
  dock.innerHTML = '<span class="mobile-cart-label">корзинка</span><span class="mobile-cart-count" id="cart-count">0</span>';
  document.body.append(dock);

  const countNode = dock.querySelector('.mobile-cart-count');
  const update = () => {
    const next = String(getSharedCartCount());
    if (countNode.textContent === next) return;
    countNode.textContent = next;
    dock.classList.remove('is-pulsing');
    void dock.offsetWidth;
    dock.classList.add('is-pulsing');
  };

  update();
  window.addEventListener('storage', update);
  window.addEventListener('focus', update);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });

  const observer = new MutationObserver(() => {
    dock.classList.remove('is-pulsing');
    void dock.offsetWidth;
    dock.classList.add('is-pulsing');
  });
  observer.observe(countNode, { childList: true, characterData: true, subtree: true });
}

function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 18);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initReveal() {
  const nodes = document.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;
  nodes.forEach((node, index) => node.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`));

  if (!('IntersectionObserver' in window) || REDUCED_MOTION) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  nodes.forEach((node) => observer.observe(node));
}

function initHeroVideo() {
  const video = document.querySelector('.hero-media video');
  if (!video) return;
  const ready = () => video.classList.add('is-ready');
  if (video.readyState >= 2) ready();
  else video.addEventListener('loadeddata', ready, { once: true });
}

function initHeroMotion() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  hero.classList.add('is-entering');
  if (REDUCED_MOTION) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(hero.offsetHeight, 1)));
    hero.style.setProperty('--hero-media-y', `${progress * 34}px`);
    hero.style.setProperty('--hero-media-scale', String(1.055 + progress * 0.035));
    hero.style.setProperty('--hero-content-y', `${progress * -18}px`);
    hero.style.setProperty('--hero-content-opacity', String(1 - progress * 0.72));
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

function initScrollProgress() {
  if (REDUCED_MOTION) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);

  let frame = 0;
  const update = () => {
    frame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
  };
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

function initCatalogNavigation() {
  const catalog = document.getElementById('catalog');
  if (!catalog) return;

  document.querySelectorAll('a[href="#catalog"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      catalog.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => {
        catalog.classList.remove('catalog-focus');
        void catalog.offsetWidth;
        catalog.classList.add('catalog-focus');
      }, REDUCED_MOTION ? 0 : 520);
    });
  });
}

function initTapEffects() {
  if (REDUCED_MOTION) return;
  const selector = '.button,.primary-action,.checkout-button,.size-option,.mobile-cart-dock,.product-link';

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.35;
    ripple.className = 'tap-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
}

function mountToyFloaties() {
  if (REDUCED_MOTION) return;
  const layer = document.createElement('div');
  layer.className = 'toy-float-layer';
  layer.setAttribute('aria-hidden', 'true');
  const types = ['heart', 'star', 'kitty', 'heart', 'paw'];
  for (let index = 0; index < 14; index += 1) {
    const item = document.createElement('span');
    item.className = `toy-float toy-float--${types[index % types.length]}`;
    item.style.setProperty('--float-left', `${3 + ((index * 19) % 93)}%`);
    item.style.setProperty('--float-time', `${16 + (index % 5) * 3}s`);
    item.style.setProperty('--float-delay', `${-index * 2.4}s`);
    item.textContent = types[index % types.length] === 'star' ? '✦' : types[index % types.length] === 'paw' ? '♡' : '';
    layer.append(item);
  }
  document.body.append(layer);
}

document.addEventListener('DOMContentLoaded', () => {
  mountFooter();
  mountMobileCartDock();
  initHeader();
  initReveal();
  initHeroVideo();
  initHeroMotion();
  initScrollProgress();
  initCatalogNavigation();
  initTapEffects();
  mountToyFloaties();
});
