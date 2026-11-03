/**
 * Full cart page enhancements (sections/tme-cart.liquid).
 *
 * The page works with JavaScript disabled: the +/- controls are real links to
 * /cart/change and the quantity inputs post through the form's "update" button
 * inside <noscript>. This only removes the extra click by submitting the form
 * when a quantity input changes, and guards against a negative quantity.
 */
(() => {
  const form = document.querySelector('form.tme-cart');
  if (!form) return;

  let submitting = false;

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-cart-qty')) return;

    const value = parseInt(input.value, 10);
    if (Number.isNaN(value) || value < 0) {
      input.value = '0';
    }

    if (submitting) return;
    submitting = true;

    // Mirrors the <noscript> "Update bag" button so Shopify applies updates[].
    const update = document.createElement('input');
    update.type = 'hidden';
    update.name = 'update';
    update.value = '';
    form.appendChild(update);
    form.submit();
  });
})();
