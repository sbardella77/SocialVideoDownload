import { useEffect } from "react";
import { SITE_URL, OG_IMAGE, pages, buildJsonLd } from "@/seo/siteData.mjs";

/**
 * Updates (or creates) a <meta> tag by name or property.
 */
const setMetaTag = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Updates (or creates) the canonical <link> tag.
 */
const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Inject (or replace) a JSON-LD script tag identified by id.
 */
const setJsonLd = (id, data) => {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
};

const removeJsonLd = (id) => {
  const el = document.getElementById(id);
  if (el) el.remove();
};

/**
 * Keeps <head> in sync with the current route during client-side
 * navigation. The first paint already has the same tags, written into
 * each route's HTML at build time by scripts/prerender.mjs.
 */
export const SEO = ({ page: key, noindex = false, title: customTitle }) => {
  useEffect(() => {
    const page = pages[key];
    const title = page ? page.title : customTitle;
    const url = page ? `${SITE_URL}${page.path}` : null;

    if (title) document.title = title;
    setMetaTag("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
    setCanonical(url);
    if (!page) return undefined;

    setMetaTag("name", "description", page.description);
    setMetaTag("property", "og:title", page.title);
    setMetaTag("property", "og:description", page.description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:image", OG_IMAGE);
    setMetaTag("name", "twitter:title", page.title);
    setMetaTag("name", "twitter:description", page.description);
    setMetaTag("name", "twitter:image", OG_IMAGE);

    const blocks = buildJsonLd(key);
    blocks.forEach(({ id, data }) => setJsonLd(id, data));
    return () => blocks.forEach(({ id }) => removeJsonLd(id));
  }, [key, noindex, customTitle]);

  return null;
};

export default SEO;
