/**
 * Scroll reveal for .tme-reveal elements.
 *
 * Opt-in per element, observed once, and skipped entirely when the visitor
 * prefers reduced motion (the stylesheet also neutralises the transition, so
 * content is visible either way).
 */
(() => {
  const SELECTOR = '.tme-reveal';

  const reveal = (el) => el.classList.add('is-visible');

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll(SELECTOR).forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  const observeAll = (root = document) => {
    root.querySelectorAll(SELECTOR).forEach((el) => {
      if (el.classList.contains('is-visible')) return;
      observer.observe(el);
    });
  };

  observeAll();

  // Theme editor re-renders sections; pick up anything newly inserted.
  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof Element) observeAll(event.target);
  });
})();
