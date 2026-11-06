// QUBO++ User Portal — referrer-based branding.
//
// Visitors who arrive from a partner site see that partner's product name in
// place of "QUBO++" throughout the page. Everything here is cosmetic: the page
// is public and the referrer is trivially forged, so this must never gate
// features, licenses, or content.
//
// Loaded before app.js so window.QBPP_BRAND is set by the time the SPA builds
// any string of its own.
(function () {
  "use strict";

  // The name written in index.html, and the fallback when no partner matched.
  const PRODUCT = "QUBO++";

  // Referrer host -> product name. A host also matches "www." and subdomains.
  //   slug  : value of <html data-brand="..."> that style.css keys its theme on
  //   fonts : Google Fonts stylesheet the theme needs (same one the partner
  //           site loads, so the type matches exactly); loaded only for that
  //           brand, so ordinary visitors never contact a third party
  //   icons : favicon set, as copies hosted next to this file -- the page's
  //           CSP allows images from 'self' only, and it keeps the portal
  //           independent of the partner site's uploads directory
  const BRANDS = [
    {
      host: "hi-qubo.com",
      name: "Hi-QUBO",
      slug: "hi-qubo",
      fonts: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+JP:wght@400;500;600&family=Poppins:wght@500;600&display=swap",
      icons: [
        { rel: "icon", href: "hi-qubo-icon-32.png", sizes: "32x32" },
        { rel: "icon", href: "hi-qubo-icon-192.png", sizes: "192x192" },
        { rel: "apple-touch-icon", href: "hi-qubo-icon-180.png" },
      ],
    },
  ];

  // document.referrer is only populated on the first page load of a visit --
  // it is empty after a reload, after following the e-mail verification link,
  // and across the SPA's own hash navigation. Remember the choice so the brand
  // does not flip back mid-signup. localStorage (not sessionStorage) so it also
  // survives opening the verification link in a new tab. It is cleared again
  // when the visitor arrives from our own documentation site (see below).
  const STORAGE_KEY = "qbpp_portal_brand";

  function knownBrand(name) {
    return BRANDS.some((b) => b.name === name) ? name : null;
  }

  function referrerHost() {
    if (!document.referrer) return null;
    try {
      return new URL(document.referrer).hostname.toLowerCase();
    } catch (e) {
      return null;
    }
  }

  function brandForHost(host) {
    const hit = BRANDS.find((b) =>
      host === b.host || host === "www." + b.host || host.endsWith("." + b.host));
    return hit ? hit.name : null;
  }

  function remembered() {
    try {
      // Validated against BRANDS: a stored value ends up as page text, and
      // site data is user-writable.
      return knownBrand(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;   // storage disabled (private mode, blocked cookies)
    }
  }

  function remember(name) {
    try {
      if (name) localStorage.setItem(STORAGE_KEY, name);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* not fatal: branding just won't survive the reload */ }
  }

  const refHost = referrerHost();
  let brand = refHost ? brandForHost(refHost) : null;
  if (brand) {
    remember(brand);
  } else if (refHost && refHost === location.hostname.toLowerCase()) {
    // Came from our own documentation site: that is the QUBO++ front door,
    // so drop any partner branding remembered from an earlier visit.
    remember(null);
  } else {
    // No referrer (reload, bookmark, e-mail link) or an unrelated site: keep
    // whatever this visitor last saw.
    brand = remembered();
  }

  // Attributes whose value is shown to the user.
  const TEXT_ATTRS = ["placeholder", "title", "aria-label", "alt"];

  // Rewrite every occurrence of PRODUCT under `root`. Idempotent, so it is safe
  // to call again after injecting markup.
  function applyBrand(root) {
    if (!brand) return;
    const scope = root || document.body;
    if (!scope) return;

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null, false);
    const hits = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      if (n.nodeValue.indexOf(PRODUCT) !== -1) hits.push(n);
    }
    hits.forEach((n) => { n.nodeValue = n.nodeValue.split(PRODUCT).join(brand); });

    scope.querySelectorAll("[" + TEXT_ATTRS.join("],[") + "]").forEach((el) => {
      TEXT_ATTRS.forEach((a) => {
        const v = el.getAttribute(a);
        if (v && v.indexOf(PRODUCT) !== -1) el.setAttribute(a, v.split(PRODUCT).join(brand));
      });
    });

    if (document.title.indexOf(PRODUCT) !== -1) {
      document.title = document.title.split(PRODUCT).join(brand);
    }
  }

  // Switch the page to the partner's look: style.css scopes a whole theme
  // (fonts, colours, square corners, header) under [data-brand="<slug>"], and
  // the web fonts it relies on are linked in here.
  function applyTheme() {
    const entry = BRANDS.find((b) => b.name === brand);
    if (!entry) return;
    document.documentElement.dataset.brand = entry.slug;
    if (entry.fonts && !document.getElementById("brand-fonts")) {
      ["https://fonts.googleapis.com", "https://fonts.gstatic.com"].forEach((origin) => {
        const l = document.createElement("link");
        l.rel = "preconnect";
        l.href = origin;
        if (origin.indexOf("gstatic") !== -1) l.crossOrigin = "anonymous";
        document.head.appendChild(l);
      });
      const css = document.createElement("link");
      css.id = "brand-fonts";
      css.rel = "stylesheet";
      css.href = entry.fonts;
      document.head.appendChild(css);
    }
    if (entry.icons && !document.querySelector("link[data-brand-icon]")) {
      // Without any <link rel=icon> the browser falls back to the site's
      // /favicon.ico (the QUBO++ one); explicit links take precedence over it.
      // Drop any icon links already present so the partner's set is the only
      // candidate, then add ours.
      document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
        .forEach((l) => l.remove());
      entry.icons.forEach((ic) => {
        const l = document.createElement("link");
        l.rel = ic.rel;
        l.href = ic.href;
        l.type = "image/png";
        if (ic.sizes) l.setAttribute("sizes", ic.sizes);
        l.dataset.brandIcon = "1";
        document.head.appendChild(l);
      });
    }
  }

  // Product name for strings the SPA builds itself.
  window.QBPP_BRAND = brand || PRODUCT;
  window.applyBrand = applyBrand;

  applyTheme();
  applyBrand(document.body);
  document.addEventListener("DOMContentLoaded", () => applyBrand(document.body));
})();
