// ─── LimelightNav Web Component ───────────────────────────────────────────────
// Vanilla JS equivalent of limelight-nav.tsx
// An adaptive-width nav bar with an animated limelight indicator on the active tab.
//
// Usage:
//   const nav = document.getElementById('myNav');
//   nav.items = [
//     { id: 'home', icon: OrbitLimelightIcons.home, label: 'Home', onClick: () => {} },
//   ];
//
// Events:
//   'tab-change'  →  detail: { index, item }

// ── Lucide-style SVG icons ────────────────────────────────────────────────────
const _OLN_ICONS = {
  home:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  compass:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>`,
  bell:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  chat:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  dm:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9h8M8 13h6"/><path d="M5 3h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3l-4 4-4-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  ai:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>`,
  globe:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  star:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`,
};

const _OLN_DEFAULT_ITEMS = [
  { id: 'home',    icon: _OLN_ICONS.home,    label: 'Home'    },
  { id: 'explore', icon: _OLN_ICONS.compass, label: 'Explore' },
  { id: 'alerts',  icon: _OLN_ICONS.bell,    label: 'Alerts'  },
];

// ── Component ─────────────────────────────────────────────────────────────────
class OrbitLimelightNav extends HTMLElement {
  constructor() {
    super();
    this._items       = [];
    this._activeIndex = 0;
    this._ready       = false;
    this._ro          = null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────
  connectedCallback() {
    if (!this._items.length) this._items = _OLN_DEFAULT_ITEMS.slice();
    const ai = parseInt(this.getAttribute('active-index'), 10);
    if (!isNaN(ai)) this._activeIndex = ai;
    this._render();
    this._ro = new ResizeObserver(() => this._positionLimelight(false));
    this._ro.observe(this);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
  }

  // ── Public API ─────────────────────────────────────────────────────
  set items(val) {
    this._items = Array.isArray(val) ? val : [];
    this._activeIndex = Math.min(this._activeIndex, Math.max(0, this._items.length - 1));
    this._render();
  }

  get items() { return this._items; }

  set activeIndex(val) {
    const idx = Math.max(0, Math.min(val, this._items.length - 1));
    if (idx === this._activeIndex) return;
    this._activeIndex = idx;
    this._updateActive();
    this._positionLimelight(true);
  }

  get activeIndex() { return this._activeIndex; }

  /** Call after the nav becomes visible to recalculate limelight position. */
  refreshPosition() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this._positionLimelight(false);
      setTimeout(() => { this._ready = true; }, 60);
    }));
  }

  // ── Render ─────────────────────────────────────────────────────────
  _render() {
    const items = this._items;
    if (!items.length) { this.innerHTML = ''; return; }

    this.innerHTML = `
      <div class="oln-limelight" aria-hidden="true">
        <div class="oln-limelight-beam"></div>
      </div>
      ${items.map((item, i) => `
        <button
          class="oln-item${i === this._activeIndex ? ' active' : ''}"
          data-index="${i}"
          aria-label="${item.label || `Tab ${i + 1}`}"
          type="button">
          <span class="oln-icon">${item.icon || ''}</span>
          ${item.label ? `<span class="oln-label">${item.label}</span>` : ''}
        </button>
      `).join('')}
    `;

    this.querySelectorAll('.oln-item').forEach(el => {
      el.addEventListener('click', () => this._handleClick(parseInt(el.dataset.index, 10)));
    });

    // Double rAF ensures layout is painted before measuring offsets
    this._ready = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this._positionLimelight(false);
      setTimeout(() => { this._ready = true; }, 60);
    }));
  }

  _handleClick(index) {
    this._activeIndex = index;
    this._updateActive();
    this._positionLimelight(true);
    this._items[index]?.onClick?.();
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { index, item: this._items[index] },
      bubbles: true,
    }));
  }

  _updateActive() {
    this.querySelectorAll('.oln-item').forEach((el, i) => {
      el.classList.toggle('active', i === this._activeIndex);
    });
  }

  _positionLimelight(animated) {
    const limelight = this.querySelector('.oln-limelight');
    const activeEl  = this.querySelectorAll('.oln-item')[this._activeIndex];
    if (!limelight || !activeEl) return;

    const newLeft = activeEl.offsetLeft + activeEl.offsetWidth / 2 - limelight.offsetWidth / 2;
    limelight.style.transition = (animated && this._ready)
      ? 'left 0.35s cubic-bezier(0.23,1,0.32,1)'
      : 'none';
    limelight.style.left = `${newLeft}px`;
  }
}

customElements.define('orbit-limelight-nav', OrbitLimelightNav);

// Expose icon set globally so main.js can reference them when building item lists
window.OrbitLimelightIcons = _OLN_ICONS;
