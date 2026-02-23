// ── Mobile menu toggle ──
const mobileToggle = document.getElementById('mobileMenuToggle');
const mobileNav = document.getElementById('mobileNav');

if (mobileToggle && mobileNav) {
  mobileToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('active');
    const menuIcon = mobileToggle.querySelector('.menu-icon');
    const closeIcon = mobileToggle.querySelector('.close-icon');
    if (menuIcon) menuIcon.style.display = isOpen ? 'none' : 'block';
    if (closeIcon) closeIcon.style.display = isOpen ? 'block' : 'none';
  });
}

// ── Dropdown toggle for touch devices ──
document.querySelectorAll('.nav-dropdown-toggle').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.nav-dropdown-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
});

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-dropdown')) {
    document.querySelectorAll('.nav-dropdown-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
});

// ── Smooth scroll for TOC links ──
document.querySelectorAll('.toc-list a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.getElementById(href.substring(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      }
    }
  });
});

// ── Reading progress bar (optional enhancement) ──
const article = document.querySelector('.post-content');
if (article) {
  const progressBar = document.createElement('div');
  progressBar.style.cssText = 'position:fixed;top:64px;left:0;height:3px;background:linear-gradient(90deg,#0369a1,#f59e0b);z-index:99;transition:width 50ms;width:0';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const rect = article.getBoundingClientRect();
    const scrolled = Math.max(0, -rect.top);
    const total = rect.height - window.innerHeight;
    const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
    progressBar.style.width = pct + '%';
  }, { passive: true });
}
