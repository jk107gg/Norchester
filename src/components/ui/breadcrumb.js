// ─── Breadcrumb Web Components ───────────────────────────────────────────────
// Vanilla JS equivalent of shadcn/ui breadcrumb.tsx
// Mirrors: Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
//          BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis

const _CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>`;
const _MORE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`;

// ── <orbit-breadcrumb> → <nav aria-label="breadcrumb"> ───────────────────────
class OrbitBreadcrumb extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'navigation');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'breadcrumb');
    this.dataset.slot = 'breadcrumb';
  }
}

// ── <orbit-breadcrumb-list> → <ol> ───────────────────────────────────────────
class OrbitBreadcrumbList extends HTMLElement {
  connectedCallback() {
    this.dataset.slot = 'breadcrumb-list';
  }
}

// ── <orbit-breadcrumb-item> → <li> ───────────────────────────────────────────
class OrbitBreadcrumbItem extends HTMLElement {
  connectedCallback() {
    this.dataset.slot = 'breadcrumb-item';
  }
}

// ── <orbit-breadcrumb-link href="…"> → renders inner <a> ────────────────────
class OrbitBreadcrumbLink extends HTMLElement {
  static get observedAttributes() { return ['href']; }

  connectedCallback() {
    this.dataset.slot = 'breadcrumb-link';
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    if (this._init) return; // only render once — children handle their own content
    this._init = true;
    const href = this.getAttribute('href') || '#';
    const label = this.textContent.trim();
    this.innerHTML = `<a href="${href}">${label}</a>`;
  }
}

// ── <orbit-breadcrumb-page> → <span aria-current="page"> ────────────────────
class OrbitBreadcrumbPage extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('aria-current')) this.setAttribute('aria-current', 'page');
    this.dataset.slot = 'breadcrumb-page';
  }
}

// ── <orbit-breadcrumb-separator> → <li role="presentation"> + ChevronRight ──
class OrbitBreadcrumbSeparator extends HTMLElement {
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('role', 'presentation');
    this.dataset.slot = 'breadcrumb-separator';
    // Only inject default icon if no children provided
    if (!this.children.length) {
      this.innerHTML = _CHEVRON;
    }
  }
}

// ── <orbit-breadcrumb-ellipsis> → <span role="presentation"> + MoreHorizontal
class OrbitBreadcrumbEllipsis extends HTMLElement {
  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.setAttribute('role', 'presentation');
    this.dataset.slot = 'breadcrumb-ellipsis';
    if (!this._init) {
      this._init = true;
      this.innerHTML = `${_MORE}<span class="orbit-sr-only">More</span>`;
    }
  }
}

// ── Register all components ───────────────────────────────────────────────────
customElements.define('orbit-breadcrumb',           OrbitBreadcrumb);
customElements.define('orbit-breadcrumb-list',      OrbitBreadcrumbList);
customElements.define('orbit-breadcrumb-item',      OrbitBreadcrumbItem);
customElements.define('orbit-breadcrumb-link',      OrbitBreadcrumbLink);
customElements.define('orbit-breadcrumb-page',      OrbitBreadcrumbPage);
customElements.define('orbit-breadcrumb-separator', OrbitBreadcrumbSeparator);
customElements.define('orbit-breadcrumb-ellipsis',  OrbitBreadcrumbEllipsis);
