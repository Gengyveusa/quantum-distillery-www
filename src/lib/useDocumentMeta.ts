import { useEffect } from 'react';

/**
 * Per-route <head> management for a Vite SPA.
 *
 * A Vite build has exactly one index.html, so every route would otherwise ship
 * the same title, description and canonical. That is fine while the site is one
 * page and fatal once it isn't: twelve concept URLs all claiming to be "The
 * Quantum Distillery — From the Quantum to the Clinical" are twelve duplicate
 * pages as far as a search engine is concerned.
 *
 * These effects run in the browser, which is also what scripts/prerender.mjs
 * drives — so whatever this sets ends up baked into each route's prerendered
 * HTML. Crawlers get the right head without any server-side rendering.
 */

const SITE = 'https://thequantumdistillery.com';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export type DocumentMeta = {
  title: string;
  description: string;
  /** Path only, e.g. '/concepts/epoch-4'. Resolved against the canonical host. */
  path: string;
  /** Emitted as <script type="application/ld+json"> and replaced on each route. */
  jsonLd?: unknown;
  /** Set true for routes that should never be indexed (dashboards, tools). */
  noindex?: boolean;
};

export function useDocumentMeta({ title, description, path, jsonLd, noindex }: DocumentMeta) {
  useEffect(() => {
    const url = `${SITE}${path}`;

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setLink('canonical', url);

    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // Route-specific structured data lives in its own tag so it can be swapped
    // wholesale without disturbing the site-wide graph in index.html.
    const ROUTE_LD_ID = 'route-jsonld';
    document.getElementById(ROUTE_LD_ID)?.remove();
    if (jsonLd) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = ROUTE_LD_ID;
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, path, noindex, jsonLd]);
}
