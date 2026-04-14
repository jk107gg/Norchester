/**
 * OrbitSwitch — shadcn/ui Switch ported as a vanilla-JS Custom Element.
 * Mirrors the Radix UI Switch API so it can be swapped for the React
 * version when the project migrates to React + TypeScript + shadcn.
 *
 * Usage (HTML):
 *   <orbit-switch id="mySwitch" checked></orbit-switch>
 *
 * Usage (JS):
 *   const sw = document.getElementById('mySwitch');
 *   sw.checked        // → true/false
 *   sw.checked = true // programmatic set
 *   sw.addEventListener('change', e => console.log(e.detail.checked));
 *
 * Attributes:
 *   checked   — present = on
 *   disabled  — present = disabled
 *
 * React equivalent (for future migration):
 *   import { Switch } from "@/components/ui/interfaces-switch"
 *   <Switch id="mySwitch" defaultChecked onCheckedChange={val => ...} />
 */

class OrbitSwitch extends HTMLElement {
  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  constructor() {
    super();
    this._checked  = false;
    this._disabled = false;
    this._onClick   = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    this._checked  = this.hasAttribute('checked');
    this._disabled = this.hasAttribute('disabled');

    // ARIA / focus
    this.setAttribute('role', 'switch');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this._render();
    this.addEventListener('click',   this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('click',   this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  attributeChangedCallback(name, _old, val) {
    if (!this.isConnected) return;
    if (name === 'checked')  { this._checked  = val !== null; this._sync(); }
    if (name === 'disabled') { this._disabled = val !== null; this._sync(); }
  }

  // ── Public API ───────────────────────────────────────────────────────
  get checked()  { return this._checked; }
  set checked(v) {
    this._checked = !!v;
    if (this._checked) this.setAttribute('checked', '');
    else               this.removeAttribute('checked');
    this._sync();
  }

  get disabled()  { return this._disabled; }
  set disabled(v) {
    this._disabled = !!v;
    if (this._disabled) this.setAttribute('disabled', '');
    else                this.removeAttribute('disabled');
    this._sync();
  }

  toggle() {
    if (this._disabled) return;
    this.checked = !this._checked;
    this.dispatchEvent(new CustomEvent('change', {
      detail:  { checked: this._checked },
      bubbles: true,
    }));
  }

  // ── Internal ─────────────────────────────────────────────────────────
  _render() {
    this.innerHTML =
      `<span class="orbit-switch-thumb" data-state="${this._checked ? 'checked' : 'unchecked'}"></span>`;
    this._sync();
  }

  _sync() {
    const state = this._checked ? 'checked' : 'unchecked';
    this.dataset.state = state;
    this.setAttribute('aria-checked', String(this._checked));
    this.classList.toggle('disabled', this._disabled);
    this.setAttribute('aria-disabled', String(this._disabled));
    const thumb = this.querySelector('.orbit-switch-thumb');
    if (thumb) thumb.dataset.state = state;
  }

  _onClick() { this.toggle(); }

  _onKeydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }
}

if (!customElements.get('orbit-switch')) {
  customElements.define('orbit-switch', OrbitSwitch);
}
