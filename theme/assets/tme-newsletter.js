/**
 * <tme-newsletter>
 *
 * Client-side validation and a loading state for the Shopify customer form in
 * sections/tme-newsletter.liquid. The form still posts to Shopify normally —
 * this only blocks an obviously invalid submit and gives feedback while the
 * request is in flight. Server-rendered errors and the success message are
 * handled in Liquid via `form.errors` / `form.posted_successfully?`.
 */

class TmeNewsletter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.tmeReady === 'true') return;
    this.dataset.tmeReady = 'true';

    this.input = this.querySelector('[data-newsletter-input]');
    this.error = this.querySelector('[data-newsletter-error]');
    this.button = this.querySelector('[data-newsletter-submit]');
    this.label = this.querySelector('[data-newsletter-label]');
    this.form = this.closest('form');

    if (!this.input || !this.form) return;

    this.defaultLabel = this.label ? this.label.textContent : '';

    // Without this the browser's own bubble fires first and our inline error
    // never renders. checkValidity() below still enforces the same rules.
    this.form.setAttribute('novalidate', '');

    this.form.addEventListener('submit', this.#onSubmit);
    this.input.addEventListener('input', this.#onInput);
  }

  disconnectedCallback() {
    this.form?.removeEventListener('submit', this.#onSubmit);
    this.input?.removeEventListener('input', this.#onInput);
  }

  #onInput = () => {
    if (this.input.getAttribute('aria-invalid') === 'true') this.#clearError();
  };

  #onSubmit = (event) => {
    const value = this.input.value.trim();

    if (!value) {
      event.preventDefault();
      this.#showError('Please enter your email address.');
      return;
    }

    // Mirrors the browser's own type="email" check so the message is ours and
    // appears in the same place as a server-side error.
    if (!this.input.checkValidity()) {
      event.preventDefault();
      this.#showError('Please enter a valid email address.');
      return;
    }

    this.#clearError();
    this.#setLoading(true);
  };

  #showError(message) {
    if (this.error) this.error.textContent = message;
    this.input.setAttribute('aria-invalid', 'true');
    this.input.focus();
    this.#setLoading(false);
  }

  #clearError() {
    if (this.error) this.error.textContent = '';
    this.input.removeAttribute('aria-invalid');
  }

  #setLoading(isLoading) {
    if (!this.button) return;
    this.button.disabled = isLoading;
    this.button.setAttribute('aria-busy', String(isLoading));
    if (this.label) {
      this.label.textContent = isLoading ? 'Signing up…' : this.defaultLabel;
    }
  }
}

if (!customElements.get('tme-newsletter')) {
  customElements.define('tme-newsletter', TmeNewsletter);
}
