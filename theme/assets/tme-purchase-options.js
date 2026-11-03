/**
 * <tme-purchase-options>
 *
 * Drives the one-time / subscribe choice rendered by
 * blocks/tme-subscription-plans.liquid.
 *
 * The plan radios are named `selling_plan` and bound to Horizon's product form
 * through the HTML `form` attribute, so the cart request already carries the
 * right value. This element only has to:
 *   1. disable the plan radios while "one-time" is selected, which drops
 *      `selling_plan` from the submitted FormData;
 *   2. show/hide the frequency panel and keep the selected states in sync;
 *   3. mirror the chosen plan's price into the subscribe row summary;
 *   4. restore the shopper's choice when Horizon re-renders the section after a
 *      variant change.
 *
 * No price is computed here — every figure comes from Liquid, which reads it
 * from the variant's selling plan allocations.
 */

const STATE = new Map();

class TmePurchaseOptions extends HTMLElement {
  connectedCallback() {
    if (this.dataset.tmeReady === 'true') return;
    this.dataset.tmeReady = 'true';

    this.productId = this.dataset.productId || 'default';
    this.modeInputs = Array.from(this.querySelectorAll('[data-mode-input]'));
    this.planInputs = Array.from(this.querySelectorAll('[data-plan-input]'));
    this.panel = this.querySelector('[data-plan-panel]');
    this.subscribePrice = this.querySelector('[data-subscribe-price]');

    if (!this.modeInputs.length) return;

    this.#restore();

    this.addEventListener('change', this.#onChange);

    this.#syncMode();
    this.#syncPlanPrice();
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.#onChange);
  }

  #onChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.hasAttribute('data-mode-input')) {
      this.#syncMode();
      this.#persist();
      return;
    }

    if (target.hasAttribute('data-plan-input')) {
      this.#syncPlanPrice();
      this.#persist();
    }
  };

  get #mode() {
    const checked = this.modeInputs.find((input) => input.checked);
    return checked ? checked.value : this.dataset.defaultMode || 'onetime';
  }

  /** Reflects the current mode into the DOM and into form participation. */
  #syncMode() {
    const mode = this.#mode;
    const subscribing = mode === 'subscribe';

    for (const option of this.querySelectorAll('[data-mode-option]')) {
      option.dataset.selected = String(option.dataset.modeOption === mode);
    }

    if (this.panel) this.panel.hidden = !subscribing;

    // A disabled control is omitted from FormData, which is exactly how
    // `selling_plan` is kept out of a one-time add-to-cart request.
    for (const input of this.planInputs) {
      input.disabled = !subscribing;
    }

    if (subscribing && !this.planInputs.some((input) => input.checked)) {
      const first = this.planInputs[0];
      if (first) first.checked = true;
    }

    this.#syncPlanPrice();
  }

  #syncPlanPrice() {
    if (!this.subscribePrice) return;
    const checked = this.planInputs.find((input) => input.checked);
    this.subscribePrice.textContent = checked
      ? checked.dataset.planPriceFormatted || ''
      : '';
  }

  #persist() {
    const checked = this.planInputs.find((input) => input.checked);
    STATE.set(this.productId, {
      mode: this.#mode,
      planId: checked ? checked.value : null,
    });
  }

  /**
   * Horizon replaces the product details markup on variant change, which would
   * otherwise reset the shopper's choice back to the Liquid default.
   */
  #restore() {
    const saved = STATE.get(this.productId);
    if (!saved) return;

    if (saved.planId) {
      const match = this.planInputs.find((input) => input.value === saved.planId);
      if (match) {
        for (const input of this.planInputs) input.checked = false;
        match.checked = true;
      }
    }

    const modeInput = this.modeInputs.find((input) => input.value === saved.mode);
    if (modeInput) {
      for (const input of this.modeInputs) input.checked = false;
      modeInput.checked = true;
    }
  }
}

if (!customElements.get('tme-purchase-options')) {
  customElements.define('tme-purchase-options', TmePurchaseOptions);
}
